-- ============================================================================
-- UNYVON — PHASE 2D FIXES : Triggers manquants
-- 1. Recalcul automatique de total_amount sur purchase_items
-- 2. Validation cross-org : supplier doit appartenir à la même org
-- 3. Validation cross-org : product doit appartenir à la même org
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. Trigger : recalculer total_amount après INSERT/UPDATE/DELETE sur purchase_items
-- ---------------------------------------------------------------------------
create or replace function public.trg_recalc_purchase_total()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  p_id uuid;
begin
  p_id := coalesce(new.purchase_id, old.purchase_id);
  perform public.recalc_purchase_total(p_id);
  return null;
end;
$$;

create trigger purchase_items_recalc_total
  after insert or update or delete on public.purchase_items
  for each row execute function public.trg_recalc_purchase_total();

-- ---------------------------------------------------------------------------
-- 2. Validation : supplier doit appartenir à la même organisation que le purchase
-- ---------------------------------------------------------------------------
create or replace function public.trg_validate_purchase_supplier()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_supplier_org uuid;
begin
  select organization_id into v_supplier_org
  from public.suppliers
  where id = new.supplier_id;

  if v_supplier_org is null then
    raise exception 'Fournisseur non trouvé: %', new.supplier_id;
  end if;

  if v_supplier_org != new.organization_id then
    raise exception 'Le fournisseur % n''appartient pas à l''organisation %', new.supplier_id, new.organization_id;
  end if;

  return new;
end;
$$;

create trigger purchases_validate_supplier
  before insert or update on public.purchases
  for each row execute function public.trg_validate_purchase_supplier();

-- ---------------------------------------------------------------------------
-- 3. Validation : product doit appartenir à la même organisation que le purchase parent
-- ---------------------------------------------------------------------------
create or replace function public.trg_validate_purchase_item_product()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_purchase_org uuid;
  v_product_org uuid;
begin
  select organization_id into v_purchase_org
  from public.purchases
  where id = new.purchase_id;

  select organization_id into v_product_org
  from public.products
  where id = new.product_id;

  if v_product_org is null then
    raise exception 'Produit non trouvé: %', new.product_id;
  end if;

  if v_product_org != v_purchase_org then
    raise exception 'Le produit % n''appartient pas à l''organisation %', new.product_id, v_purchase_org;
  end if;

  return new;
end;
$$;

create trigger purchase_items_validate_product
  before insert or update on public.purchase_items
  for each row execute function public.trg_validate_purchase_item_product();

commit;
