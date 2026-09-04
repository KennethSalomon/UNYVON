-- ============================================================================
-- UNYVON — PHASE 2B : Seed development data
-- AgroDistrib Cotonou — catégories + produits de démo
--
-- À exécuter APRÈS 0001_foundation.sql et 0002_products.sql
-- et APRÈS avoir créé un compte + onboarding (pour avoir une organization).
--
-- Remplacer <ORG_ID> par l'UUID de l'organisation AgroDistrib Cotonou.
-- ============================================================================

-- Récupérer l'org AgroDistrib Cotonou (ou la première org du user)
DO $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT id INTO v_org_id
    FROM public.organizations
   WHERE name ILIKE '%agrodistrib%'
      OR name ILIKE '%agro%distrib%'
   LIMIT 1;

  IF v_org_id IS NULL THEN
    SELECT id INTO v_org_id
      FROM public.organizations
     ORDER BY created_at
     LIMIT 1;
  END IF;

  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Aucune organisation trouvée. Créez d''abord un compte via l''onboarding.';
  END IF;

  RAISE NOTICE 'Organisation trouvée: %', v_org_id;

  -- Categories
  INSERT INTO public.categories (organization_id, name) VALUES
    (v_org_id, 'Céréales'),
    (v_org_id, 'Huiles'),
    (v_org_id, 'Aliments bétail')
  ON CONFLICT (organization_id, name) DO NOTHING;

  -- Produits
  INSERT INTO public.products (organization_id, category_id, name, unit, cost_price, sale_price, min_stock_threshold) VALUES
    (v_org_id,
     (SELECT id FROM public.categories WHERE organization_id = v_org_id AND name = 'Céréales' LIMIT 1),
     'Riz 25kg', 'sac', 18000, 22000, 100),
    (v_org_id,
     (SELECT id FROM public.categories WHERE organization_id = v_org_id AND name = 'Huiles' LIMIT 1),
     'Huile 5L', 'bidon', 12000, 15500, 40),
    (v_org_id,
     (SELECT id FROM public.categories WHERE organization_id = v_org_id AND name = 'Céréales' LIMIT 1),
     'Maïs 50kg', 'sac', 22000, 28000, 50),
    (v_org_id,
     (SELECT id FROM public.categories WHERE organization_id = v_org_id AND name = 'Céréales' LIMIT 1),
     'Soja 50kg', 'sac', 25000, 32000, 30),
    (v_org_id,
     (SELECT id FROM public.categories WHERE organization_id = v_org_id AND name = 'Aliments bétail' LIMIT 1),
     'Aliment bétail 50kg', 'sac', 19000, 24000, 25);

  RAISE NOTICE 'Seed terminé: 3 catégories, 5 produits';
END $$;
