-- ============================================================================
-- UNYVON — PHASE 2E : Seed development data
-- AgroDistrib Cotonou — mouvements de stock réalistes
--
-- À exécuter APRÈS 0006_inventory.sql
-- et APRÈS avoir exécuté 0002_products_dev.sql (pour avoir les produits).
--
-- Remplace <ORG_ID> et <USER_ID> ou les détecte automatiquement.
-- ============================================================================

DO $$
DECLARE
  v_org_id   uuid;
  v_user_id  uuid;
  v_riz      uuid;
  v_huile    uuid;
  v_mais     uuid;
  v_soja     uuid;
  v_betail   uuid;
BEGIN
  -- Trouver l'org
  SELECT id INTO v_org_id
    FROM public.organizations
   WHERE name ILIKE '%agrodistrib%'
      OR name ILIKE '%agro%distrib%'
   LIMIT 1;

  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id
      FROM public.organizations
     ORDER BY created_at LIMIT 1;
  END IF;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Aucune organisation trouvée. Créez d''abord un compte.';
  END IF;

  -- Trouver le premier user de l'org
  SELECT user_id INTO v_user_id
    FROM public.organization_users
   WHERE organization_id = v_org_id
   LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Aucun membre trouvé pour l''organisation.';
  END IF;

  -- Trouver les produits par nom
  SELECT id INTO v_riz    FROM public.products WHERE organization_id = v_org_id AND name ILIKE '%riz%'    LIMIT 1;
  SELECT id INTO v_huile  FROM public.products WHERE organization_id = v_org_id AND name ILIKE '%huile%'  LIMIT 1;
  SELECT id INTO v_mais   FROM public.products WHERE organization_id = v_org_id AND name ILIKE '%ma%s%'   LIMIT 1;
  SELECT id INTO v_soja   FROM public.products WHERE organization_id = v_org_id AND name ILIKE '%soja%'   LIMIT 1;
  SELECT id INTO v_betail FROM public.products WHERE organization_id = v_org_id AND name ILIKE '%bétail%' OR name ILIKE '%betail%' LIMIT 1;

  -- Vérifier que tous les produits existent
  IF v_riz IS NULL OR v_huile IS NULL OR v_mais IS NULL OR v_soja IS NULL OR v_betail IS NULL THEN
    RAISE EXCEPTION 'Tous les produits AgroDistrib doivent exécuter 0002_products_dev.sql en premier.';
  END IF;

  -- Supprimer les mouvements existants (seed idempotent)
  DELETE FROM public.inventory_movements WHERE organization_id = v_org_id;
  DELETE FROM public.inventory_counts WHERE organization_id = v_org_id;

  -- ========================================================================
  -- STOCK INITIAL (opening movements)
  -- ========================================================================
  INSERT INTO public.inventory_movements (organization_id, product_id, movement_type, quantity, unit_cost, reason, created_by)
  VALUES
    (v_org_id, v_riz,    'opening', 340, 18000, 'Stock initial AgroDistrib', v_user_id),
    (v_org_id, v_huile,  'opening',  85, 12000, 'Stock initial AgroDistrib', v_user_id),
    (v_org_id, v_mais,   'opening', 120, 22000, 'Stock initial AgroDistrib', v_user_id),
    (v_org_id, v_soja,   'opening',  15, 25000, 'Stock initial AgroDistrib', v_user_id),
    (v_org_id, v_betail, 'opening',  60, 19000, 'Stock initial AgroDistrib', v_user_id);

  -- ========================================================================
  -- RÉCEPTIONS D'ACHATS (purchase_receipt)
  -- ========================================================================
  -- Quelques réceptions réalistes pour simuler l'activité
  INSERT INTO public.inventory_movements (organization_id, product_id, movement_type, quantity, unit_cost, reference_type, reason, created_by)
  VALUES
    -- Réception riz : +100 sacs
    (v_org_id, v_riz, 'purchase_receipt', 100, 17500, 'purchase', 'Réception fournisseur riz', v_user_id),
    -- Réception huile : +30 bidons
    (v_org_id, v_huile, 'purchase_receipt', 30, 11500, 'purchase', 'Réception fournisseur huile', v_user_id),
    -- Réception maïs : +50 sacs
    (v_org_id, v_mais, 'purchase_receipt', 50, 21000, 'purchase', 'Réception fournisseur maïs', v_user_id);

  -- ========================================================================
  -- AJUSTEMENTS (adjustment_in / adjustment_out)
  -- ========================================================================
  -- Petit ajustement positif sur soja (erreur de comptage trouvée)
  INSERT INTO public.inventory_movements (organization_id, product_id, movement_type, quantity, reason, created_by)
  VALUES
    (v_org_id, v_soja, 'adjustment_in', 5, 'Erreur de comptage initiale', v_user_id),
    -- Ajustement négatif sur bétail (casse)
    (v_org_id, v_betail, 'adjustment_out', 3, 'Casse pendant manutention', v_user_id);

  RAISE NOTICE 'Seed Phase 2E appliqué avec succès pour %', v_org_id;
END $$;
