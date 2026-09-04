-- ============================================================================
-- UNYVON — PHASE 2C : Clients + Fournisseurs
-- Tables : customers, suppliers
-- + RLS (isolation multi-tenant) + permissions par rôle
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

-- Clients (acheteurs B2B)
create table public.customers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null check (length(trim(name)) > 0),
  phone           text,
  email           text,
  address         text,
  notes           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index customers_org_idx on public.customers(organization_id);
create index customers_org_active_idx on public.customers(organization_id, is_active);

-- Fournisseurs (fournisseurs de matières premières / produits)
create table public.suppliers (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null check (length(trim(name)) > 0),
  phone           text,
  email           text,
  address         text,
  notes           text,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index suppliers_org_idx on public.suppliers(organization_id);
create index suppliers_org_active_idx on public.suppliers(organization_id, is_active);

-- ---------------------------------------------------------------------------
-- 2. updated_at automatisé
-- ---------------------------------------------------------------------------
create trigger customers_set_updated_at
  before update on public.customers
  for each row execute function public.set_updated_at();

create trigger suppliers_set_updated_at
  before update on public.suppliers
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. RLS : activation + politiques
-- ---------------------------------------------------------------------------
alter table public.customers enable row level security;
alter table public.suppliers  enable row level security;

-- ---- customers ----
-- Lecture : membre de l'org
create policy "customers_select_member"
  on public.customers for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Création : owner ou manager
create policy "customers_insert_owner_manager"
  on public.customers for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

-- Modification : owner ou manager
create policy "customers_update_owner_manager"
  on public.customers for update
  to authenticated
  using (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

-- Suppression : owner ou manager
create policy "customers_delete_owner_manager"
  on public.customers for delete
  to authenticated
  using (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

-- ---- suppliers ----
-- Lecture : membre de l'org
create policy "suppliers_select_member"
  on public.suppliers for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Création : owner ou manager
create policy "suppliers_insert_owner_manager"
  on public.suppliers for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

-- Modification : owner ou manager
create policy "suppliers_update_owner_manager"
  on public.suppliers for update
  to authenticated
  using (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

-- Suppression : owner ou manager
create policy "suppliers_delete_owner_manager"
  on public.suppliers for delete
  to authenticated
  using (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

commit;
