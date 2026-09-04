-- ============================================================================
-- UNYVON — PHASE 2H : Seed Dépenses AgroDistrib Cotonou
-- ============================================================================

-- Récupérer l'org AgroDistrib (supposée exister depuis les seeds précédents)
DO $$
DECLARE
  v_org_id uuid;
  v_user_id uuid;
BEGIN
  SELECT id INTO v_org_id FROM public.organizations WHERE name = 'AgroDistrib Cotonou' LIMIT 1;
  SELECT created_by INTO v_user_id FROM public.organizations WHERE id = v_org_id;

  IF v_org_id IS NULL THEN
    RAISE NOTICE 'AgroDistrib Cotonou non trouvée — seed dépenses ignoré';
    RETURN;
  END IF;

  -- Loyer septembre
  INSERT INTO public.expenses (organization_id, category, description, amount, expense_date, payment_method, reference, created_by)
  VALUES (v_org_id, 'rent', 'Loyer entrepôt septembre', 150000, '2026-09-01', 'cash', 'RECU-2026-09-001', v_user_id);

  -- Transport
  INSERT INTO public.expenses (organization_id, category, description, amount, expense_date, payment_method, reference, created_by)
  VALUES (v_org_id, 'transport', 'Livraison clients Zone Nord', 35000, '2026-09-02', 'mobile_money', null, v_user_id);

  -- Personnel
  INSERT INTO public.expenses (organization_id, category, description, amount, expense_date, payment_method, reference, created_by)
  VALUES (v_org_id, 'personnel', 'Salaires septembre', 280000, '2026-09-05', 'bank_transfer', 'VIR-2026-09-SAL', v_user_id);

  -- Électricité
  INSERT INTO public.expenses (organization_id, category, description, amount, expense_date, payment_method, reference, created_by)
  VALUES (v_org_id, 'electricity', 'Facture CEB septembre', 45000, '2026-09-08', 'cash', 'CEB-2026-09-4421', v_user_id);

  -- Communication
  INSERT INTO public.expenses (organization_id, category, description, amount, expense_date, payment_method, reference, created_by)
  VALUES (v_org_id, 'communication', 'Crédit téléphone bureau', 20000, '2026-09-10', 'mobile_money', null, v_user_id);

  -- Fournitures
  INSERT INTO public.expenses (organization_id, category, description, amount, expense_date, payment_method, reference, created_by)
  VALUES (v_org_id, 'supplies', 'Papeterie et fournitures bureau', 12000, '2026-09-12', 'cash', null, v_user_id);

  -- Maintenance
  INSERT INTO public.expenses (organization_id, category, description, amount, expense_date, payment_method, reference, created_by)
  VALUES (v_org_id, 'maintenance', 'Entretien entrepôt', 18000, '2026-09-15', 'cash', null, v_user_id);

  RAISE NOTICE 'Seed dépenses AgroDistrib: 7 dépenses insérées (560 000 FCFA)';
END $$;
