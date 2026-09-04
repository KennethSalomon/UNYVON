-- 0010_intelligence.sql
-- NOVA Intelligence: intelligence_insights table for caching signals + RLS

-- 1. Table
create table public.intelligence_insights (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations(id) on delete cascade,
  signal_type         text not null,
  signal_title        text not null,
  signal_severity     text not null check (signal_severity in ('high', 'medium', 'low')),
  signal_category     text not null check (signal_category in ('stock', 'margin', 'receivable', 'activity', 'opportunity')),
  response_explanation text not null,
  response_recommendation text not null,
  created_at          timestamptz not null default now()
);

create index intelligence_insights_org_idx on public.intelligence_insights(organization_id);
create index intelligence_insights_severity_idx on public.intelligence_insights(signal_severity);
create index intelligence_insights_created_idx on public.intelligence_insights(created_at desc);

-- 2. RLS
alter table public.intelligence_insights enable row level security;

create policy "intelligence_insights_select_member"
  on public.intelligence_insights for select
  to authenticated
  using (public.is_org_member(organization_id));

create policy "intelligence_insights_insert_member"
  on public.intelligence_insights for insert
  to authenticated
  with check (public.is_org_member(organization_id));

create policy "intelligence_insights_delete_member"
  on public.intelligence_insights for delete
  to authenticated
  using (public.is_org_member(organization_id));

-- No UPDATE policy: signals are immutable once written
