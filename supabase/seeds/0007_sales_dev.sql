-- ============================================================================
-- UNYVON — PHASE 2F SEED : Données de développement ventes
-- AgroDistrib Cotonou
-- ============================================================================

-- Récupérer l'org de dev (première org créée)
DO $$
DECLARE
  v_org_id uuid;
  v_cust1  uuid;
  v_cust2  uuid;
  v_prod1  uuid;
  v_prod2  uuid;
  v_prod3  uuid;
  v_prod4  uuid;
  v_prod5  uuid;
  v_user   uuid;
  v_sale1  uuid;
  v_sale2  uuid;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations ORDER BY created_at LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Aucune organisation trouvée — seed ventes ignoré.';
    RETURN;
  END IF;

  SELECT id INTO v_user FROM public.auth.users LIMIT 1;

  -- ── Clients ───────────────────────────────────────────────────────────
  INSERT INTO public.customers (organization_id, name, phone, address)
  VALUES
    (v_org_id, 'Épicerie Sainte-Rita', '+229 96 00 01 02', 'Quartier Zongo, Cotonou'),
    (v_org_id, ' Boutique Kossi', '+229 97 11 22 33', 'Marché Dantokpa, Cotonou')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cust1;

  -- Deuxième client
  INSERT INTO public.customers (organization_id, name, phone, address)
  VALUES (v_org_id, 'Restaurant Le Bon Coin', '+229 98 44 55 66', 'Quartier Haie-Vive, Cotonou')
  ON CONFLICT DO NOTHING
  RETURNING id INTO v_cust2;

  -- Si les clients existent déjà, les récupérer
  SELECT id INTO v_cust1 FROM public.customers WHERE organization_id = v_org_id AND name = 'Épicerie Sainte-Rita' LIMIT 1;
  SELECT id INTO v_cust2 FROM public.customers WHERE organization_id = v_org_id AND name = 'Restaurant Le Bon Coin' LIMIT 1;

  -- ── Produits ──────────────────────────────────────────────────────────
  SELECT id INTO v_prod1 FROM public.products WHERE organization_id = v_org_id AND name = 'Riz 25kg' LIMIT 1;
  SELECT id INTO v_prod2 FROM public.products WHERE organization_id = v_org_id AND name = 'Huile 5L' LIMIT 1;
  SELECT id INTO v_prod3 FROM public.products WHERE organization_id = v_org_id AND name = 'Maïs 50kg' LIMIT 1;
  SELECT id INTO v_prod4 FROM public.products WHERE organization_id = v_org_id AND name = 'Soja 50kg' LIMIT 1;
  SELECT id INTO v_prod5 FROM public.products WHERE organization_id = v_org_id AND name = 'Aliment bétail 50kg' LIMIT 1;

  -- Si les produits n'existent pas, les créer
  IF v_prod1 IS NULL THEN
    INSERT INTO public.products (organization_id, name, unit, cost_price, sale_price, min_stock_threshold)
    VALUES (v_org_id, 'Riz 25kg', 'sac', 18000, 22000, 50)
    RETURNING id INTO v_prod1;
  END IF;
  IF v_prod2 IS NULL THEN
    INSERT INTO public.products (organization_id, name, unit, cost_price, sale_price, min_stock_threshold)
    VALUES (v_org_id, 'Huile 5L', 'bidon', 12000, 15500, 30)
    RETURNING id INTO v_prod2;
  END IF;
  IF v_prod3 IS NULL THEN
    INSERT INTO public.products (organization_id, name, unit, cost_price, sale_price, min_stock_threshold)
    VALUES (v_org_id, 'Maïs 50kg', 'sac', 22000, 28000, 40)
    RETURNING id INTO v_prod3;
  END IF;
  IF v_prod4 IS NULL THEN
    INSERT INTO public.products (organization_id, name, unit, cost_price, sale_price, min_stock_threshold)
    VALUES (v_org_id, 'Soja 50kg', 'sac', 20000, 26000, 30)
    RETURNING id INTO v_prod4;
  END IF;
  IF v_prod5 IS NULL THEN
    INSERT INTO public.products (organization_id, name, unit, cost_price, sale_price, min_stock_threshold)
    VALUES (v_org_id, 'Aliment bétail 50kg', 'sac', 15000, 19500, 25)
    RETURNING id INTO v_prod5;
  END IF;

  -- ── Stock initial (si pas de mouvements) ──────────────────────────────
  IF NOT EXISTS (
    SELECT 1 FROM public.inventory_movements
    WHERE organization_id = v_org_id AND product_id = v_prod1 AND movement_type = 'opening'
  ) THEN
    INSERT INTO public.inventory_movements
      (organization_id, product_id, movement_type, quantity, unit_cost, reason, created_by)
    VALUES
      (v_org_id, v_prod1, 'opening', 200, 18000, 'Stock initial', v_user),
      (v_org_id, v_prod2, 'opening', 150, 12000, 'Stock initial', v_user),
      (v_org_id, v_prod3, 'opening', 100, 22000, 'Stock initial', v_user),
      (v_org_id, v_prod4, 'opening', 80, 20000, 'Stock initial', v_user),
      (v_org_id, v_prod5, 'opening', 60, 15000, 'Stock initial', v_user);
  END IF;

  -- ── Ventes ────────────────────────────────────────────────────────────
  -- Vente 1 : vente comptant (brouillon)
  IF NOT EXISTS (
    SELECT 1 FROM public.sales WHERE organization_id = v_org_id AND reference = 'VNT-SEED-001'
  ) THEN
    INSERT INTO public.sales (organization_id, customer_id, reference, status, sale_date, created_by)
    VALUES (v_org_id, v_cust1, 'VNT-SEED-001', 'draft', CURRENT_DATE, v_user)
    RETURNING id INTO v_sale1;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, unit_cost_snapshot)
    VALUES
      (v_sale1, v_prod1, 10, 22000, 18000),
      (v_sale1, v_prod2, 5, 15500, 12000);
  END IF;

  -- Vente 2 : vente avec client (confirmée)
  SELECT id INTO v_sale2 FROM public.sales WHERE organization_id = v_org_id AND reference = 'VNT-SEED-002' LIMIT 1;
  IF v_sale2 IS NULL THEN
    INSERT INTO public.sales (organization_id, customer_id, reference, status, sale_date, created_by)
    VALUES (v_org_id, v_cust2, 'VNT-SEED-002', 'draft', CURRENT_DATE, v_user)
    RETURNING id INTO v_sale2;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, unit_cost_snapshot)
    VALUES
      (v_sale2, v_prod1, 20, 22000, 18000),
      (v_sale2, v_prod3, 8, 28000, 22000),
      (v_sale2, v_prod5, 5, 19500, 15000);

    -- Confirmer via RPC
    PERFORM public.confirm_sale(v_sale2);
  END IF;

END $$;
