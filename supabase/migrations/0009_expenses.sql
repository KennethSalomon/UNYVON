-- ============================================================================
-- UNYVON — PHASE 2H : Dépenses + Trésorerie Opérationnelle
-- Table : expenses
-- Enums : expense_category, payment_method
-- RPC : get_expenses_summary, get_cashflow_summary
-- RLS : owner (CRUD), manager (CRUD), seller (read), stockkeeper (read)
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
create type public.expense_category as enum (
  'rent',
  'transport',
  'personnel',
  'electricity',
  'communication',
  'supplies',
  'maintenance',
  'other'
);

-- payment_method est déjà créé en 0008_payments.sql
-- On le réutilise tel quel : cash, mobile_money, bank_transfer, other

-- ---------------------------------------------------------------------------
-- 2. Table : expenses
-- ---------------------------------------------------------------------------
create table public.expenses (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  category        public.expense_category not null,
  description     text not null,
  amount          numeric(14,2) not null check (amount > 0),
  expense_date    date not null default current_date,
  payment_method  public.payment_method not null,
  reference       text,
  notes           text,
  created_by      uuid not null references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index expenses_org_idx on public.expenses(organization_id);
create index expenses_date_idx on public.expenses(expense_date);
create index expenses_category_idx on public.expenses(category);

-- ---------------------------------------------------------------------------
-- 3. Trigger : updated_at
-- ---------------------------------------------------------------------------
create trigger set_expenses_updated_at
  before update on public.expenses
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. RPC : résumé des dépenses par catégorie
-- ---------------------------------------------------------------------------
create or replace function public.get_expenses_summary(
  p_org_id uuid,
  p_from   date default null,
  p_to     date default null
)
returns table (
  total          numeric(14,2),
  expense_count  bigint,
  category       public.expense_category,
  category_total numeric(14,2)
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce(sum(e.amount), 0)::numeric(14,2) as total,
    count(*) as expense_count,
    e.category,
    coalesce(sum(e.amount), 0)::numeric(14,2) as category_total
  from public.expenses e
  where e.organization_id = p_org_id
    and (p_from is null or e.expense_date >= p_from)
    and (p_to is null or e.expense_date <= p_to)
  group by e.category;
$$;

-- ---------------------------------------------------------------------------
-- 5. RPC : trésorerie opérationnelle
--    encaissements (SUM payments) - dépenses (SUM expenses)
-- ---------------------------------------------------------------------------
create or replace function public.get_cashflow_summary(
  p_org_id uuid,
  p_from   date default null,
  p_to     date default null
)
returns table (
  total_receipts   numeric(14,2),
  total_expenses   numeric(14,2),
  net_cashflow     numeric(14,2)
)
language sql
security definer
set search_path = public
stable
as $$
  select
    coalesce((
      select sum(p.amount)
      from public.payments p
      join public.sales s on s.id = p.sale_id
      where s.organization_id = p_org_id
        and s.status = 'confirmed'
        and (p_from is null or p.payment_date >= p_from)
        and (p_to is null or p.payment_date <= p_to)
    ), 0)::numeric(14,2) as total_receipts,

    coalesce((
      select sum(e.amount)
      from public.expenses e
      where e.organization_id = p_org_id
        and (p_from is null or e.expense_date >= p_from)
        and (p_to is null or e.expense_date <= p_to)
    ), 0)::numeric(14,2) as total_expenses,

    coalesce((
      select sum(p.amount)
      from public.payments p
      join public.sales s on s.id = p.sale_id
      where s.organization_id = p_org_id
        and s.status = 'confirmed'
        and (p_from is null or p.payment_date >= p_from)
        and (p_to is null or p.payment_date <= p_to)
    ), 0)
    - coalesce((
      select sum(e.amount)
      from public.expenses e
      where e.organization_id = p_org_id
        and (p_from is null or e.expense_date >= p_from)
        and (p_to is null or e.expense_date <= p_to)
    ), 0)::numeric(14,2) as net_cashflow;
$$;

-- ---------------------------------------------------------------------------
-- 6. RLS : activation + politiques
-- ---------------------------------------------------------------------------
alter table public.expenses enable row level security;

-- Lecture : membre de l'org
create policy "expenses_select_member"
  on public.expenses for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Création : owner, manager
create policy "expenses_insert_owner_manager"
  on public.expenses for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

-- Modification : owner, manager
create policy "expenses_update_owner_manager"
  on public.expenses for update
  to authenticated
  using (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

-- Suppression : owner uniquement
create policy "expenses_delete_owner"
  on public.expenses for delete
  to authenticated
  using (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) = 'owner'
  );

commit;
