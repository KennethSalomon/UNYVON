-- ============================================================================
-- UNYVON — PHASE 2D : Achats + Réceptions fournisseur
-- Tables : purchases, purchase_items
-- + RLS (isolation multi-tenant) + permissions par rôle
-- + RPC receive_purchase (transactionnel)
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Enum
-- ---------------------------------------------------------------------------
create type public.purchase_status as enum ('draft', 'received', 'cancelled');

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

-- Achats (bon de commande fournisseur)
create table public.purchases (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  supplier_id     uuid not null references public.suppliers(id) on delete restrict,
  reference       text,
  status          public.purchase_status not null default 'draft',
  total_amount    numeric(14, 2) not null default 0,
  purchase_date   date not null default current_date,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index purchases_org_idx on public.purchases(organization_id);
create index purchases_org_status_idx on public.purchases(organization_id, status);
create index purchases_supplier_idx on public.purchases(supplier_id);

-- Lignes d'achat
create table public.purchase_items (
  id              uuid primary key default gen_random_uuid(),
  purchase_id     uuid not null references public.purchases(id) on delete cascade,
  product_id      uuid not null references public.products(id) on delete restrict,
  quantity        integer not null check (quantity > 0),
  unit_cost       numeric(12, 2) not null check (unit_cost >= 0),
  total           numeric(14, 2) not null generated always as (quantity::numeric * unit_cost) stored,
  created_at      timestamptz not null default now()
);
create index purchase_items_purchase_idx on public.purchase_items(purchase_id);
create index purchase_items_product_idx on public.purchase_items(product_id);

-- ---------------------------------------------------------------------------
-- 3. updated_at automatisé
-- ---------------------------------------------------------------------------
create trigger purchases_set_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Fonction : recalculer le total d'un achat depuis ses lignes
-- ---------------------------------------------------------------------------
create or replace function public.recalc_purchase_total(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.purchases
  set total_amount = coalesce((
    select sum(pi.quantity::numeric * pi.unit_cost)
    from public.purchase_items pi
    where pi.purchase_id = p_id
  ), 0)
  where id = p_id;
$$;

-- ---------------------------------------------------------------------------
-- 5. Fonction : réception atomique d'un achat
--    - Vérifie que l'achat est en status 'draft'
--    - Passe le statut à 'received'
--    - Ne gère PAS le stock (phase Stock séparée)
-- ---------------------------------------------------------------------------
create or replace function public.receive_purchase(p_id uuid)
returns public.purchase_status
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status public.purchase_status;
begin
  select status into v_status
  from public.purchases
  where id = p_id
  for update;

  if v_status is null then
    raise exception 'Achat non trouvé: %', p_id;
  end if;

  if v_status != 'draft' then
    raise exception 'Seul un achat en brouillon peut être réçu. Statut actuel: %', v_status;
  end if;

  update public.purchases
  set status = 'received'
  where id = p_id;

  return 'received';
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. RLS : activation + politiques
-- ---------------------------------------------------------------------------
alter table public.purchases       enable row level security;
alter table public.purchase_items  enable row level security;

-- ---- purchases ----
-- Lecture : membre de l'org
create policy "purchases_select_member"
  on public.purchases for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Création : owner, manager, ou stockkeeper
create policy "purchases_insert_owner_manager_stockkeeper"
  on public.purchases for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager', 'stockkeeper')
  );

-- Modification : owner ou manager
create policy "purchases_update_owner_manager"
  on public.purchases for update
  to authenticated
  using (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

-- Suppression (annulation physique) : owner uniquement
create policy "purchases_delete_owner"
  on public.purchases for delete
  to authenticated
  using (
    public.current_org_role(organization_id) = 'owner'
  );

-- ---- purchase_items ----
-- Lecture : membre de l'org (via purchase → organization_id)
create policy "purchase_items_select_member"
  on public.purchase_items for select
  to authenticated
  using (
    exists (
      select 1 from public.purchases p
      where p.id = purchase_id
        and public.is_org_member(p.organization_id)
    )
  );

-- Création : owner, manager, ou stockkeeper (si le purchase leur appartient)
create policy "purchase_items_insert_owner_manager_stockkeeper"
  on public.purchase_items for insert
  to authenticated
  with check (
    exists (
      select 1 from public.purchases p
      where p.id = purchase_id
        and public.is_org_member(p.organization_id)
        and public.current_org_role(p.organization_id) in ('owner', 'manager', 'stockkeeper')
    )
  );

-- Modification : owner ou manager
create policy "purchase_items_update_owner_manager"
  on public.purchase_items for update
  to authenticated
  using (
    exists (
      select 1 from public.purchases p
      where p.id = purchase_id
        and public.is_org_member(p.organization_id)
        and public.current_org_role(p.organization_id) in ('owner', 'manager')
    )
  );

-- Suppression : owner ou manager
create policy "purchase_items_delete_owner_manager"
  on public.purchase_items for delete
  to authenticated
  using (
    exists (
      select 1 from public.purchases p
      where p.id = purchase_id
        and public.is_org_member(p.organization_id)
        and public.current_org_role(p.organization_id) in ('owner', 'manager')
    )
  );

commit;
