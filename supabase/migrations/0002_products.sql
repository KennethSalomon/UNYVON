-- ============================================================================
-- UNYVON — PHASE 2B : Produits + Catégories
-- Tables : categories, products
-- + RLS (isolation multi-tenant) + permissions par rôle
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Tables
-- ---------------------------------------------------------------------------

-- Catégories de produits
create table public.categories (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint categories_org_name_unique unique (organization_id, name)
);
create index categories_org_idx on public.categories(organization_id);

-- Produits
create table public.products (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  category_id         uuid references public.categories(id) on delete set null,
  name                text not null check (length(trim(name)) > 0),
  unit                text not null default 'unité',
  cost_price          numeric(12, 2) not null default 0 check (cost_price >= 0),
  sale_price          numeric(12, 2) not null default 0 check (sale_price >= 0),
  min_stock_threshold integer not null default 0 check (min_stock_threshold >= 0),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index products_org_idx on public.products(organization_id);
create index products_category_idx on public.products(category_id);
create index products_org_active_idx on public.products(organization_id, is_active);

-- ---------------------------------------------------------------------------
-- 2. updated_at automatisé
-- ---------------------------------------------------------------------------
create trigger categories_set_updated_at
  before update on public.categories
  for each row execute function public.set_updated_at();

create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 3. RLS : activation + politiques
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.products  enable row level security;

-- ---- categories ----
-- Lecture : membre de l'org
create policy "categories_select_member"
  on public.categories for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Création : owner ou manager
create policy "categories_insert_owner_manager"
  on public.categories for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

-- Modification : owner ou manager
create policy "categories_update_owner_manager"
  on public.categories for update
  to authenticated
  using (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

-- Suppression : owner ou manager
create policy "categories_delete_owner_manager"
  on public.categories for delete
  to authenticated
  using (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

-- ---- products ----
-- Lecture : tout membre de l'org
create policy "products_select_member"
  on public.products for select
  to authenticated
  using (public.is_org_member(organization_id));

-- Création : owner ou manager
create policy "products_insert_owner_manager"
  on public.products for insert
  to authenticated
  with check (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

-- Modification : owner, manager, ou stockkeeper (champs limités gérés côté app)
create policy "products_update_owner_manager_stockkeeper"
  on public.products for update
  to authenticated
  using (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager', 'stockkeeper')
  );

-- Suppression (archivage) : owner ou manager
create policy "products_delete_owner_manager"
  on public.products for delete
  to authenticated
  using (
    public.is_org_member(organization_id)
    and public.current_org_role(organization_id) in ('owner', 'manager')
  );

commit;
