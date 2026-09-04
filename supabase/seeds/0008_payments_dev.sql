-- ============================================================================
-- UNYVON — PHASE 2G SEED : Données de développement paiements
-- AgroDistrib Cotonou
-- ============================================================================

DO $$
DECLARE
  v_org_id uuid;
  v_cust1  uuid;
  v_cust2  uuid;
  v_cust3  uuid;
  v_sale1  uuid;
  v_sale2  uuid;
  v_sale3  uuid;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations ORDER BY created_at LIMIT 1;
  IF v_org_id IS NULL THEN
    RAISE NOTICE 'Aucune organisation trouvée — seed paiements ignoré.';
    RETURN;
  END IF;

  -- Récupérer les clients
  SELECT id INTO v_cust1 FROM public.customers WHERE organization_id = v_org_id AND name = 'Épicerie Sainte-Rita' LIMIT 1;
  SELECT id INTO v_cust2 FROM public.customers WHERE organization_id = v_org_id AND name = 'Boutique Kossi' LIMIT 1;
  SELECT id INTO v_cust3 FROM public.customers WHERE organization_id = v_org_id AND name = 'Restaurant Le Bon Coin' LIMIT 1;

  -- Créer les clients s'ils n'existent pas
  IF v_cust1 IS NULL THEN
    INSERT INTO public.customers (organization_id, name, phone, address)
    VALUES (v_org_id, 'Épicerie Sainte-Rita', '+229 96 00 01 02', 'Quartier Zongo, Cotonou')
    RETURNING id INTO v_cust1;
  END IF;
  IF v_cust2 IS NULL THEN
    INSERT INTO public.customers (organization_id, name, phone, address)
    VALUES (v_org_id, 'Boutique Kossi', '+229 97 11 22 33', 'Marché Dantokpa, Cotonou')
    RETURNING id INTO v_cust2;
  END IF;
  IF v_cust3 IS NULL THEN
    INSERT INTO public.customers (organization_id, name, phone, address)
    VALUES (v_org_id, 'Restaurant Le Bon Coin', '+229 98 44 55 66', 'Quartier Haie-Vive, Cotonou')
    RETURNING id INTO v_cust3;
  END IF;

  -- Récupérer les produits
  -- (les produits doivent déjà exister depuis le seed 0007)

  -- ── Ventes de test pour les paiements ──────────────────────────────────

  -- Vente A : 280 000 — sera entièrement payée
  IF NOT EXISTS (SELECT 1 FROM public.sales WHERE organization_id = v_org_id AND reference = 'VNT-PAY-A') THEN
    INSERT INTO public.sales (organization_id, customer_id, reference, status, sale_date, created_by)
    SELECT v_org_id, v_cust1, 'VNT-PAY-A', 'confirmed', current_date, (SELECT id FROM auth.users LIMIT 1)
    RETURNING id INTO v_sale1;

    -- Ajouter des items (on utilise un produit existant)
    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, unit_cost_snapshot)
    SELECT v_sale1, p.id, 14, p.sale_price, p.cost_price
    FROM public.products p
    WHERE p.organization_id = v_org_id
    LIMIT 1;

    -- Paiement total
    INSERT INTO public.payments (organization_id, sale_id, amount, payment_method, payment_date, created_by)
    VALUES (v_org_id, v_sale1, 280000, 'cash', current_date, (SELECT id FROM auth.users LIMIT 1));
  END IF;

  -- Vente B : 350 000 — payée partiellement (200 000)
  IF NOT EXISTS (SELECT 1 FROM public.sales WHERE organization_id = v_org_id AND reference = 'VNT-PAY-B') THEN
    INSERT INTO public.sales (organization_id, customer_id, reference, status, sale_date, created_by)
    SELECT v_org_id, v_cust2, 'VNT-PAY-B', 'confirmed', current_date, (SELECT id FROM auth.users LIMIT 1)
    RETURNING id INTO v_sale2;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, unit_cost_snapshot)
    SELECT v_sale2, p.id, 17, p.sale_price, p.cost_price
    FROM public.products p
    WHERE p.organization_id = v_org_id
    LIMIT 1;

    -- Paiement partiel
    INSERT INTO public.payments (organization_id, sale_id, amount, payment_method, payment_date, reference, created_by)
    VALUES (v_org_id, v_sale2, 200000, 'mobile_money', current_date, 'MTN-REF-12345', (SELECT id FROM auth.users LIMIT 1));
  END IF;

  -- Vente C : 125 000 — non payée (unpaid)
  IF NOT EXISTS (SELECT 1 FROM public.sales WHERE organization_id = v_org_id AND reference = 'VNT-PAY-C') THEN
    INSERT INTO public.sales (organization_id, customer_id, reference, status, sale_date, created_by)
    SELECT v_org_id, v_cust3, 'VNT-PAY-C', 'confirmed', current_date, (SELECT id FROM auth.users LIMIT 1)
    RETURNING id INTO v_sale3;

    INSERT INTO public.sale_items (sale_id, product_id, quantity, unit_price, unit_cost_snapshot)
    SELECT v_sale3, p.id, 5, p.sale_price, p.cost_price
    FROM public.products p
    WHERE p.organization_id = v_org_id
    LIMIT 1;
  END IF;

END $$;
