-- ============================================================================
-- UNYVON — PHASE BACKEND 1 : Fondations multi-tenant
-- Tables : organizations, organization_users (membership), plans, subscriptions
-- + RLS (isolation Organization A / B) + trigger création auto
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Enums
-- ---------------------------------------------------------------------------
create type public.org_role as enum ('owner', 'manager', 'seller', 'stockkeeper');
create type public.subscription_status as enum ('trialing', 'active', 'canceled', 'expired');

-- ---------------------------------------------------------------------------
-- 2. Tables
-- ---------------------------------------------------------------------------

-- Organizations (entreprises)
create table public.organizations (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  sector     text not null default '',
  currency   text not null default 'FCFA',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Membership (OrganizationUser) : un user dans plusieurs orgs, rôle par org
create table public.organization_users (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            public.org_role not null default 'seller',
  created_at      timestamptz not null default now(),
  constraint organization_users_org_user_unique unique (organization_id, user_id)
);
create index organization_users_org_idx  on public.organization_users(organization_id);
create index organization_users_user_idx on public.organization_users(user_id);

-- Plans (catalogue SaaS)
create table public.plans (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  name          text not null,
  price_monthly numeric(10, 2) not null default 0,
  features      jsonb not null default '[]'::jsonb,
  created_at    timestamptz not null default now()
);

-- Subscriptions : un abonnement par organisation (structure uniquement, pas de paiement)
create table public.subscriptions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id         uuid references public.plans(id) on delete set null,
  status          public.subscription_status not null default 'trialing',
  trial_start     timestamptz not null default now(),
  trial_end       timestamptz not null default (now() + interval '14 days'),
  renewal_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint subscriptions_org_unique unique (organization_id)
);
create index subscriptions_org_idx on public.subscriptions(organization_id);

-- ---------------------------------------------------------------------------
-- 3. updated_at automatisé
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Trigger : à la création d'une org, créer le membership owner + le trial
-- (exécuté en SECURITY DEFINER pour bypasser la RLS subscriptions)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_org()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into public.organization_users (organization_id, user_id, role)
    values (new.id, new.created_by, 'owner');
  end if;

  insert into public.subscriptions (organization_id, status, trial_start, trial_end)
  values (new.id, 'trialing', now(), now() + interval '14 days');

  return new;
end;
$$;

create trigger on_organization_created
  after insert on public.organizations
  for each row execute function public.handle_new_org();

-- ---------------------------------------------------------------------------
-- 5. Helpers RLS (SECURITY DEFINER pour éviter la récursion, scoping sur auth.uid())
-- ---------------------------------------------------------------------------
create or replace function public.is_org_member(org_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.organization_users
    where organization_id = org_id and user_id = auth.uid()
  );
$$;

create or replace function public.current_org_role(org_id uuid)
returns public.org_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.organization_users
  where organization_id = org_id and user_id = auth.uid()
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- 6. RLS : activation + politiques
-- ---------------------------------------------------------------------------
alter table public.organizations      enable row level security;
alter table public.organization_users enable row level security;
alter table public.plans              enable row level security;
alter table public.subscriptions      enable row level security;

-- ---- organizations ----
create policy "org_select_member_or_creator"
  on public.organizations for select
  to authenticated
  using (public.is_org_member(id) or created_by = auth.uid());

create policy "org_insert_creator"
  on public.organizations for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "org_update_owner_manager"
  on public.organizations for update
  to authenticated
  using (public.is_org_member(id) and public.current_org_role(id) in ('owner', 'manager'));

create policy "org_delete_owner"
  on public.organizations for delete
  to authenticated
  using (public.current_org_role(id) = 'owner');

-- ---- organization_users ----
create policy "membership_select_member"
  on public.organization_users for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "membership_insert_self_or_admin"
  on public.organization_users for insert
  to authenticated
  with check (
    user_id = auth.uid()
    or public.current_org_role(organization_id) in ('owner', 'manager')
  );

create policy "membership_update_owner"
  on public.organization_users for update
  to authenticated
  using (public.current_org_role(organization_id) = 'owner');

create policy "membership_delete_owner_or_self"
  on public.organization_users for delete
  to authenticated
  using (
    public.current_org_role(organization_id) = 'owner'
    or user_id = auth.uid()
  );

-- ---- plans (lecture uniquement ; pas de politique write => refus pour tous) ----
create policy "plans_select"
  on public.plans for select
  to authenticated
  using (true);

-- ---- subscriptions (lecture membre uniquement ; PAS de politique insert/update/delete
--      : la création se fait via le trigger DB, jamais via l'API client) ----
create policy "subs_select_member"
  on public.subscriptions for select
  to authenticated
  using (public.is_org_member(organization_id));

-- ---------------------------------------------------------------------------
-- 7. Seed des plans (aucun paiement : structure uniquement)
-- ---------------------------------------------------------------------------
insert into public.plans (code, name, price_monthly, features) values
  ('trial',      'Essai',      0,      '["Accès complet pendant l''essai"]'),
  ('pro',        'Pro',        29000,  '["Ventes illimitées", "Stock & inventaire", "NOVA insights", "Équipe jusqu''à 5"]'),
  ('enterprise', 'Enterprise', 99000,  '["Ventes illimitées", "Stock & inventaire", "NOVA avancé", "Équipe illimitée", "API & intégrations"]')
on conflict (code) do nothing;

commit;
