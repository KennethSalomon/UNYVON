-- ============================================================================
-- UNYVON — PHASE 2C : Seed development data
-- AgroDistrib Cotonou — clients + fournisseurs de démo
--
-- À exécuter APRÈS 0001_foundation.sql, 0002_products.sql et 0003_customers_suppliers.sql
-- et APRÈS avoir créé un compte + onboarding (pour avoir une organization).
--
-- Remplacer <ORG_ID> par l'UUID de l'organisation AgroDistrib Cotonou.
-- ============================================================================

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

  -- Clients
  INSERT INTO public.customers (organization_id, name, phone, address, notes) VALUES
    (v_org_id, 'Épicerie Sainte-Rita', '+229 97 00 00 01', 'Quartier Zongo, Cotonou', 'Client fidèle depuis 2024'),
    (v_org_id, 'Marché Zongo', '+229 97 00 00 02', 'Marché Dantokpa, Cotonou', ''),
    (v_org_id, 'Restaurant Chez Maman', '+229 97 00 00 03', 'Haie-Vive, Cotonou', 'Commande régulière'),
    (v_org_id, 'Boutique Y', '+229 97 00 00 04', 'Tokpa-Ahito, Cotonou', '');

  -- Fournisseurs
  INSERT INTO public.suppliers (organization_id, name, phone, address, notes) VALUES
    (v_org_id, 'Fournisseur A — Riz', '+229 96 00 00 01', '', 'Fournisseur principal céréales'),
    (v_org_id, 'Fournisseur B — Huiles', '+229 96 00 00 02', '', ''),
    (v_org_id, 'Fournisseur C — Bétail', '+229 96 00 00 03', '', 'Alimentation bétail');

  RAISE NOTICE 'Seed terminé: 4 clients, 3 fournisseurs';
END $$;
