-- ============================================================================
-- UNYVON — PHASE 2G : Paiements + Encaissements + Créances
-- Table : payments
-- RPC : create_payment (atomique avec protection concurrence)
-- Fonctions dérivées : get_sale_payment_status, get_customer_balance
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Enum : méthodes de paiement
-- ---------------------------------------------------------------------------
create type public.payment_method as enum (
  'cash',
  'mobile_money',
  'bank_transfer',
  'other'
);

-- ---------------------------------------------------------------------------
-- 2. Table : payments
-- ---------------------------------------------------------------------------
create table public.payments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sale_id         uuid not null references public.sales(id) on delete cascade,
  amount          numeric(14,2) not null check (amount > 0),
  payment_method  public.payment_method not null,
  payment_date    date not null default current_date,
  reference       text,
  notes           text,
  created_by      uuid not null references auth.users(id),
  created_at      timestamptz not null default now()
);
create index payments_org_idx on public.payments(organization_id);
create index payments_sale_idx on public.payments(sale_id);
create index payments_date_idx on public.payments(payment_date);

-- ---------------------------------------------------------------------------
-- 3. Trigger : valider que la vente appartient à la même organisation
-- ---------------------------------------------------------------------------
create or replace function public.validate_payment_sale()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale_org uuid;
begin
  select organization_id into v_sale_org
  from public.sales where id = NEW.sale_id;

  if v_sale_org is null then
    raise exception 'Vente % non trouvée.', NEW.sale_id;
  end if;

  if v_sale_org != NEW.organization_id then
    raise exception 'La vente % n''appartient pas à l''organisation %.', NEW.sale_id, NEW.organization_id;
  end if;

  return NEW;
end;
$$;

create trigger trg_validate_payment_sale
  before insert or update on public.payments
  for each row
  execute function public.validate_payment_sale();

-- ---------------------------------------------------------------------------
-- 4. RPC : créer un paiement (ATOMIQUE, protection concurrence)
--    - Vérifie que la vente est confirmée
--    - Vérifie que le total paiements + nouveau montant <= total vente
--    - Insère le paiement
--    - Retourne le solde restant
-- ---------------------------------------------------------------------------
create or replace function public.create_payment(
  p_sale_id        uuid,
  p_amount         numeric(14,2),
  p_payment_method public.payment_method,
  p_reference      text default null,
  p_notes          text default null
)
returns numeric(14,2)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sale         record;
  v_total_paid   numeric(14,2);
  v_remaining    numeric(14,2);
  v_sale_org     uuid;
begin
  -- Lock la vente
  select id, organization_id, total_amount, status
  into v_sale
  from public.sales
  where id = p_sale_id
  for update;

  if v_sale is null then
    raise exception 'Vente non trouvée: %', p_sale_id;
  end if;

  if v_sale.status != 'confirmed' then
    raise exception 'Seules les ventes confirmées peuvent recevoir des paiements. Statut actuel: %', v_sale.status;
  end if;

  if p_amount <= 0 then
    raise exception 'Le montant du paiement doit être supérieur à zéro.';
  end if;

  -- Calculer le total déjà payé (verrou implicite via la vente lockée)
  select coalesce(sum(amount), 0) into v_total_paid
  from public.payments
  where sale_id = p_sale_id;

  v_remaining := v_sale.total_amount - v_total_paid;

  if p_amount > v_remaining then
    raise exception 'Le paiement (%) dépasse le solde restant (%). Total: %, Déjà payé: %.',
      p_amount, v_remaining, v_sale.total_amount, v_total_paid;
  end if;

  -- Insérer le paiement
  insert into public.payments (
    organization_id, sale_id, amount, payment_method,
    payment_date, reference, notes, created_by
  ) values (
    v_sale.organization_id, p_sale_id, p_amount, p_payment_method,
    current_date, p_reference, p_notes, auth.uid()
  );

  -- Retourner le nouveau solde restant
  return v_sale.total_amount - v_total_paid - p_amount;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. RPC : obtenir le statut de paiement d'une vente
--    Retourne : total_amount, total_paid, remaining, payment_status
-- ---------------------------------------------------------------------------
create or replace function public.get_sale_payment_status(p_sale_id uuid)
returns table (
  total_amount   numeric(14,2),
  total_paid     numeric(14,2),
  remaining      numeric(14,2),
  payment_status text
)
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  v_total  numeric(14,2);
  v_paid   numeric(14,2);
begin
  select s.total_amount into v_total
  from public.sales s where s.id = p_sale_id;

  if v_total is null then
    raise exception 'Vente non trouvée: %', p_sale_id;
  end if;

  select coalesce(sum(p.amount), 0) into v_paid
  from public.payments p where p.sale_id = p_sale_id;

  return query
  select
    v_total,
    v_paid,
    v_total - v_paid,
    case
      when v_paid <= 0 then 'unpaid'
      when v_paid >= v_total then 'paid'
      else 'partially_paid'
    end;
end;
$$;

-- ---------------------------------------------------------------------------
-- 6. Vue : balance des clients (dérivée des ventes + paiements)
--    Utilisable via une requête directe ou une RPC
-- ---------------------------------------------------------------------------
create or replace function public.get_customer_balance(p_customer_id uuid)
returns table (
  total_purchases   numeric(14,2),
  total_paid        numeric(14,2),
  outstanding       numeric(14,2)
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(sum(s.total_amount), 0)::numeric(14,2) as total_purchases,
    coalesce((
      select sum(p.amount)
      from public.payments p
      join public.sales s2 on s2.id = p.sale_id
      where s2.customer_id = p_customer_id
        and s2.status = 'confirmed'
    ), 0)::numeric(14,2) as total_paid,
    coalesce(sum(s.total_amount), 0)
      - coalesce((
        select sum(p.amount)
        from public.payments p
        join public.sales s2 on s2.id = p.sale_id
        where s2.customer_id = p_customer_id
          and s2.status = 'confirmed'
      ), 0)::numeric(14,2) as outstanding
  from public.sales s
  where s.customer_id = p_customer_id
    and s.status = 'confirmed';
$$;

-- ---------------------------------------------------------------------------
-- 7. RLS : activation + politiques
-- ---------------------------------------------------------------------------
alter table public.payments enable row level security;

-- Lecture : membre de l'org
create policy "payments_select_member"
  on public.payments for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Création : owner, manager, ou seller
create policy "payments_insert_owner_manager_seller"
  on public.payments for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager', 'seller')
  );

-- Pas de update/delete : les paiements sont immuables
-- (corrections via opérations compensatoires)

-- Aucun update autorisé
create policy "payments_no_update"
  on public.payments for update
  to authenticated
  using (false);

-- Aucun delete autorisé
create policy "payments_no_delete"
  on public.payments for delete
  to authenticated
  using (false);

commit;
