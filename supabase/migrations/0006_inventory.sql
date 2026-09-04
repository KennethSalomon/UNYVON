-- ============================================================================
-- UNYVON — PHASE 2E : Moteur de stock réel
-- Tables : inventory_movements, inventory_counts, inventory_adjustments
-- + RLS (isolation multi-tenant) + permissions par rôle
-- + receive_purchase() modifié pour créer les mouvements atomiquement
-- + Fonctions de calcul de stock
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Enum : types de mouvements
-- ---------------------------------------------------------------------------
create type public.movement_type as enum (
  'opening',              -- stock initial
  'purchase_receipt',     -- réception d'achat
  'sale',                 -- sortie vente (futur)
  'adjustment_in',        -- ajustement positif
  'adjustment_out'        -- ajustement négatif
);

create type public.adjustment_reason as enum (
  'loss',                 -- perte
  'damage',               -- casse / avarie
  'counting_error',       -- erreur de comptage
  'data_entry_error',     -- erreur de saisie
  'other'                 -- autre
);

-- ---------------------------------------------------------------------------
-- 2. Table : inventory_movements (SOURCE DE VÉRITÉ)
--    Chaque ligne = un mouvement de stock signé par son type.
--    La quantité est TOUJOURS positive ; le signe est déduit du type.
--    Stock théorique = SUM(qty pour opening/purchase_receipt/adjustment_in)
--                      - SUM(qty pour sale/adjustment_out)
-- ---------------------------------------------------------------------------
create table public.inventory_movements (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete restrict,
  movement_type   public.movement_type not null,
  quantity        integer not null check (quantity > 0),
  unit_cost       numeric(12, 2) check (unit_cost >= 0),
  reference_type  text,                -- 'purchase', 'inventory_count', null
  reference_id    uuid,                -- id du purchase ou inventory_count
  reason          text,                -- libre (pour ajustements)
  created_by      uuid not null references auth.users(id),
  created_at      timestamptz not null default now()
);
create index inventory_movements_org_idx on public.inventory_movements(organization_id);
create index inventory_movements_product_idx on public.inventory_movements(product_id);
create index inventory_movements_org_product_idx on public.inventory_movements(organization_id, product_id);
create index inventory_movements_type_idx on public.inventory_movements(movement_type);
create index inventory_movements_ref_idx on public.inventory_movements(reference_type, reference_id);

-- ---------------------------------------------------------------------------
-- 3. Table : inventory_counts (inventaires physiques)
-- ---------------------------------------------------------------------------
create table public.inventory_counts (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete restrict,
  theoretical_qty integer not null,
  physical_qty    integer not null check (physical_qty >= 0),
  gap             integer not null,  -- physical_qty - theoretical_qty
  reason          public.adjustment_reason,
  notes           text,
  created_by      uuid not null references auth.users(id),
  created_at      timestamptz not null default now()
);
create index inventory_counts_org_idx on public.inventory_counts(organization_id);
create index inventory_counts_product_idx on public.inventory_counts(product_id);

-- ---------------------------------------------------------------------------
-- 4. Fonction : calculer le stock théorique d'un produit
-- ---------------------------------------------------------------------------
create or replace function public.get_product_stock(p_org_id uuid, p_product_id uuid)
returns integer
language sql
security definer
set search_path = public
stable
as $$
  select coalesce(sum(
    case
      when movement_type in ('opening', 'purchase_receipt', 'adjustment_in') then quantity
      when movement_type in ('sale', 'adjustment_out') then -quantity
      else 0
    end
  ), 0)::integer
  from public.inventory_movements
  where organization_id = p_org_id
    and product_id = p_product_id;
$$;

-- ---------------------------------------------------------------------------
-- 5. Fonction : stock théorique pour tous les produits d'une org
--    Retourne (product_id, stock)
-- ---------------------------------------------------------------------------
create or replace function public.get_org_stocks(p_org_id uuid)
returns table(product_id uuid, stock integer)
language sql
security definer
set search_path = public
stable
as $$
  select
    im.product_id,
    coalesce(sum(
      case
        when im.movement_type in ('opening', 'purchase_receipt', 'adjustment_in') then im.quantity
        when im.movement_type in ('sale', 'adjustment_out') then -im.quantity
        else 0
      end
    ), 0)::integer as stock
  from public.inventory_movements im
  where im.organization_id = p_org_id
  group by im.product_id;
$$;

-- ---------------------------------------------------------------------------
-- 6. receive_purchase() MODIFIÉ — crée les mouvements atomiquement
--    draft → received + INSERT inventory_movements (purchase_receipt)
--    Utilise une transaction explicite pour garantir l'atomicité.
--    Idempotent : vérifie les mouvements existants avant d'en créer.
-- ---------------------------------------------------------------------------
create or replace function public.receive_purchase(p_id uuid)
returns public.purchase_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status   public.purchase_status;
  v_org_id   uuid;
  v_already  integer;
begin
  -- Lock + read
  select status, organization_id into v_status, v_org_id
  from public.purchases
  where id = p_id
  for update;

  if v_status is null then
    raise exception 'Achat non trouvé: %', p_id;
  end if;

  if v_status != 'draft' then
    raise exception 'Seul un achat en brouillon peut être reçu. Statut actuel: %', v_status;
  end if;

  -- Vérifier l'idempotence : des mouvements existent déjà pour cet achat ?
  select count(*) into v_already
  from public.inventory_movements
  where reference_type = 'purchase' and reference_id = p_id;

  if v_already > 0 then
    raise exception 'Les mouvements de stock pour cet achat existent déjà (% lignes).', v_already;
  end if;

  -- Créer les mouvements de stock (un par ligne d'achat)
  insert into public.inventory_movements
    (organization_id, product_id, movement_type, quantity, unit_cost, reference_type, reference_id, created_by)
  select
    v_org_id,
    pi.product_id,
    'purchase_receipt'::public.movement_type,
    pi.quantity,
    pi.unit_cost,
    'purchase',
    p_id,
    auth.uid()
  from public.purchase_items pi
  where pi.purchase_id = p_id;

  -- Mettre à jour le statut
  update public.purchases
  set status = 'received'
  where id = p_id;

  return 'received';
end;
$$;

-- ---------------------------------------------------------------------------
-- 7. Fonction : créer un inventaire physique + ajuster le stock
--    Atomique : INSERT inventory_count + INSERT inventory_movement si écart
-- ---------------------------------------------------------------------------
create or replace function public.create_inventory_and_adjust(
  p_org_id       uuid,
  p_product_id   uuid,
  p_physical_qty integer,
  p_reason       public.adjustment_reason,
  p_notes        text
)
returns public.inventory_counts
language plpgsql
security definer
set search_path = public
as $$
declare
  v_theoretical integer;
  v_gap         integer;
  v_count       public.inventory_counts;
  v_role        text;
begin
  -- Vérifier les permissions (owner, manager, stockkeeper uniquement)
  v_role := public.current_org_role(p_org_id);
  if v_role is null or v_role not in ('owner', 'manager', 'stockkeeper') then
    raise exception 'Accès refusé : rôle "%" non autorisé pour les inventaires.', v_role;
  end if;

  -- Vérifier que le produit appartient à l'organisation
  if not exists (
    select 1 from public.products
    where id = p_product_id and organization_id = p_org_id
  ) then
    raise exception 'Le produit % n''appartient pas à l''organisation %.', p_product_id, p_org_id;
  end if;

  -- Calculer le stock théorique
  v_theoretical := public.get_product_stock(p_org_id, p_product_id);
  v_gap := p_physical_qty - v_theoretical;

  -- Enregistrer l'inventaire
  insert into public.inventory_counts
    (organization_id, product_id, theoretical_qty, physical_qty, gap, reason, notes, created_by)
  values
    (p_org_id, p_product_id, v_theoretical, p_physical_qty, v_gap, p_reason, p_notes, auth.uid())
  returning * into v_count;

  -- Créer le mouvement d'ajustement si écart ≠ 0
  if v_gap != 0 then
    if v_gap > 0 then
      -- Écart positif → adjustment_in
      insert into public.inventory_movements
        (organization_id, product_id, movement_type, quantity, reference_type, reference_id, reason, created_by)
      values
        (p_org_id, p_product_id, 'adjustment_in'::public.movement_type, v_gap, 'inventory_count', v_count.id, p_reason::text, auth.uid());
    else
      -- Écart négatif → adjustment_out (quantité positive)
      insert into public.inventory_movements
        (organization_id, product_id, movement_type, quantity, reference_type, reference_id, reason, created_by)
      values
        (p_org_id, p_product_id, 'adjustment_out'::public.movement_type, abs(v_gap), 'inventory_count', v_count.id, p_reason::text, auth.uid());
    end if;
  end if;

  return v_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- 8. RLS : activation + politiques
-- ---------------------------------------------------------------------------
alter table public.inventory_movements enable row level security;
alter table public.inventory_counts    enable row level security;

-- ---- inventory_movements ----
-- Lecture : membre de l'org
create policy "inventory_movements_select_member"
  on public.inventory_movements for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Création : owner, manager, ou stockkeeper
create policy "inventory_movements_insert_owner_manager_stockkeeper"
  on public.inventory_movements for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager', 'stockkeeper')
  );

-- Pas de update/delete : l'historique est immuable
-- (les ajustements se font par ajout de nouveaux mouvements)

-- ---- inventory_counts ----
-- Lecture : membre de l'org
create policy "inventory_counts_select_member"
  on public.inventory_counts for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Création : owner, manager, ou stockkeeper
create policy "inventory_counts_insert_owner_manager_stockkeeper"
  on public.inventory_counts for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager', 'stockkeeper')
  );

-- Pas de update/delete : les counts sont immuables

commit;

-- ---------------------------------------------------------------------------
-- 9. Trigger : valider que le produit appartient à l'organisation
-- ---------------------------------------------------------------------------
begin;

create or replace function public.validate_inventory_org_product()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.products
    where id = NEW.product_id and organization_id = NEW.organization_id
  ) then
    raise exception 'Le produit % n''appartient pas à l''organisation %.', NEW.product_id, NEW.organization_id;
  end if;
  return NEW;
end;
$$;

create trigger trg_validate_inventory_org_product
  before insert on public.inventory_movements
  for each row
  execute function public.validate_inventory_org_product();

commit;
