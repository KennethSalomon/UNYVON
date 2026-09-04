-- ============================================================================
-- UNYVON — PHASE 2D : Seed development data — Achats
-- AgroDistrib Cotonou — achats de démo réalistes
--
-- À exécuter APRÈS 0001, 0002, 0003, 0004 ET les seeds 0002/0003.
-- Nécessite que les produits, fournisseurs et catégories existent déjà.
-- ============================================================================

DO $$
DECLARE
  v_org_id uuid;
  v_sup_a  uuid;
  v_sup_b  uuid;
  v_sup_c  uuid;
  v_prod_riz     uuid;
  v_prod_huile   uuid;
  v_prod_mais    uuid;
  v_prod_soja    uuid;
  v_prod_betail  uuid;
  v_pur1 uuid;
  v_pur2 uuid;
  v_pur3 uuid;
BEGIN
  -- Résoudre l'org AgroDistrib (la plus ancienne)
  SELECT id INTO v_org_id
    FROM public.organizations
   WHERE name ILIKE '%agrodistrib%'
   ORDER BY created_at
   LIMIT 1;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Aucune organisation AgroDistrib trouvée. Exécutez d''abord le seed 0003.';
  END IF;

  RAISE NOTICE 'Org: %', v_org_id;

  -- Résoudre les fournisseurs
  SELECT id INTO v_sup_a FROM public.suppliers WHERE organization_id = v_org_id AND name ILIKE '%riz%' LIMIT 1;
  SELECT id INTO v_sup_b FROM public.suppliers WHERE organization_id = v_org_id AND name ILIKE '%huile%' LIMIT 1;
  SELECT id INTO v_sup_c FROM public.suppliers WHERE organization_id = v_org_id AND name ILIKE '%bétail%' OR name ILIKE '%betail%' LIMIT 1;

  IF v_sup_a IS NULL OR v_sup_b IS NULL OR v_sup_c IS NULL THEN
    RAISE EXCEPTION 'Fournisseurs manquants. Exécutez le seed 0003.';
  END IF;

  -- Résoudre les produits
  SELECT id INTO v_prod_riz    FROM public.products WHERE organization_id = v_org_id AND name ILIKE '%riz%' LIMIT 1;
  SELECT id INTO v_prod_huile  FROM public.products WHERE organization_id = v_org_id AND name ILIKE '%huile%' LIMIT 1;
  SELECT id INTO v_prod_mais   FROM public.products WHERE organization_id = v_org_id AND name ILIKE '%maïs%' OR name ILIKE '%mais%' LIMIT 1;
  SELECT id INTO v_prod_soja   FROM public.products WHERE organization_id = v_org_id AND name ILIKE '%soja%' LIMIT 1;
  SELECT id INTO v_prod_betail FROM public.products WHERE organization_id = v_org_id AND name ILIKE '%bétail%' OR name ILIKE '%betail%' LIMIT 1;

  IF v_prod_riz IS NULL OR v_prod_huile IS NULL OR v_prod_mais IS NULL OR v_prod_betail IS NULL THEN
    RAISE EXCEPTION 'Produits manquants. Exécutez le seed 0002.';
  END IF;

  -- ========================================================================
  -- ACHAT 1 : Fournisseur A — Riz (reçu)
  -- ========================================================================
  INSERT INTO public.purchases (id, organization_id, supplier_id, reference, status, total_amount, purchase_date, notes)
  VALUES (gen_random_uuid(), v_org_id, v_sup_a, 'BCA-2026-001', 'received', 1340000, '2026-08-28', 'Commande riz et maïs août')
  RETURNING id INTO v_pur1;

  INSERT INTO public.purchase_items (purchase_id, product_id, quantity, unit_cost) VALUES
    (v_pur1, v_prod_riz, 50, 18000),
    (v_pur1, v_prod_mais, 20, 22000);

  -- ========================================================================
  -- ACHAT 2 : Fournisseur B — Huiles (reçu)
  -- ========================================================================
  INSERT INTO public.purchases (id, organization_id, supplier_id, reference, status, total_amount, purchase_date, notes)
  VALUES (gen_random_uuid(), v_org_id, v_sup_b, 'BCA-2026-002', 'received', 360000, '2026-08-27', 'Réapprovisionnement huile')
  RETURNING id INTO v_pur2;

  INSERT INTO public.purchase_items (purchase_id, product_id, quantity, unit_cost) VALUES
    (v_pur2, v_prod_huile, 30, 12000);

  -- ========================================================================
  -- ACHAT 3 : Fournisseur C — Bétail (brouillon — pas encore reçu)
  -- ========================================================================
  INSERT INTO public.purchases (id, organization_id, supplier_id, reference, status, total_amount, purchase_date, notes)
  VALUES (gen_random_uuid(), v_org_id, v_sup_c, 'BCA-2026-003', 'draft', 580000, '2026-09-03', 'Commande en attente de livraison')
  RETURNING id INTO v_pur3;

  INSERT INTO public.purchase_items (purchase_id, product_id, quantity, unit_cost) VALUES
    (v_pur3, v_prod_betail, 20, 19000),
    (v_pur3, v_prod_soja, 10, 25000);

  RAISE NOTICE 'Seed achats terminé: 3 achats (2 reçus, 1 brouillon)';
END $$;
