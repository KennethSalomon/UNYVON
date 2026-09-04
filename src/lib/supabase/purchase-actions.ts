"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import type {
  Purchase,
  PurchaseItem,
  CreatePurchaseInput,
  UpdatePurchaseInput,
  DatabasePurchase,
  DatabasePurchaseItem,
  PurchaseStatus,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toPurchase(
  row: DatabasePurchase,
  items: PurchaseItem[],
  supplierName: string
): Purchase {
  return {
    id: row.id,
    organizationId: row.organization_id,
    supplierId: row.supplier_id,
    supplierName,
    reference: row.reference ?? "",
    status: row.status,
    totalAmount: Number(row.total_amount),
    purchaseDate: row.purchase_date,
    notes: row.notes ?? "",
    items,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toPurchaseItem(row: DatabasePurchaseItem, productName: string): PurchaseItem {
  return {
    id: row.id,
    purchaseId: row.purchase_id,
    productId: row.product_id,
    productName,
    quantity: row.quantity,
    unitCost: Number(row.unit_cost),
    total: Number(row.total),
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getPurchases(): Promise<Purchase[]> {
  const supabase = await createServerSupabase();

  const { data: purchases, error: pErr } = await supabase
    .from("purchases")
    .select("*")
    .order("purchase_date", { ascending: false });

  if (pErr) throw new Error(`Erreur chargement achats: ${pErr.message}`);
  if (!purchases?.length) return [];

  // Fetch all items for these purchases
  const pIds = purchases.map((p) => p.id);
  const { data: allItems } = await supabase
    .from("purchase_items")
    .select("*")
    .in("purchase_id", pIds);

  // Fetch supplier names
  const supIds = [...new Set(purchases.map((p) => p.supplier_id))];
  const { data: supps } = await supabase
    .from("suppliers")
    .select("id,name")
    .in("id", supIds);
  const supMap = new Map((supps ?? []).map((s) => [s.id, s.name]));

  // Fetch product names
  const prodIds = [...new Set((allItems ?? []).map((i) => i.product_id))];
  const { data: prods } = await supabase
    .from("products")
    .select("id,name")
    .in("id", prodIds);
  const prodMap = new Map((prods ?? []).map((p) => [p.id, p.name]));

  // Group items by purchase_id
  const itemsByPurchase = new Map<string, DatabasePurchaseItem[]>();
  for (const item of allItems ?? []) {
    const list = itemsByPurchase.get(item.purchase_id) ?? [];
    list.push(item);
    itemsByPurchase.set(item.purchase_id, list);
  }

  return purchases.map((p) => {
    const items = (itemsByPurchase.get(p.id) ?? []).map((i) =>
      toPurchaseItem(i, prodMap.get(i.product_id) ?? "")
    );
    return toPurchase(p as DatabasePurchase, items, supMap.get(p.supplier_id) ?? "");
  });
}

export async function getPurchase(id: string): Promise<Purchase | null> {
  const supabase = await createServerSupabase();

  const { data: p, error } = await supabase
    .from("purchases")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Erreur chargement achat: ${error.message}`);
  }

  const { data: items } = await supabase
    .from("purchase_items")
    .select("*")
    .eq("purchase_id", id);

  const { data: sup } = await supabase
    .from("suppliers")
    .select("name")
    .eq("id", p.supplier_id)
    .single();

  const prodIds = [...new Set((items ?? []).map((i) => i.product_id))];
  const { data: prods } = await supabase
    .from("products")
    .select("id,name")
    .in("id", prodIds);
  const prodMap = new Map((prods ?? []).map((pp) => [pp.id, pp.name]));

  return toPurchase(
    p as DatabasePurchase,
    (items ?? []).map((i) => toPurchaseItem(i, prodMap.get(i.product_id) ?? "")),
    sup?.name ?? ""
  );
}

// ---------------------------------------------------------------------------
// Create
// ---------------------------------------------------------------------------

export async function createPurchase(input: CreatePurchaseInput): Promise<Purchase> {
  const supabase = await createServerSupabase();

  if (!input.supplierId) throw new Error("Le fournisseur est requis.");
  if (!input.items?.length) throw new Error("Au moins une ligne d'achat est requise.");

  // Validate supplier belongs to same org
  const { data: supplier, error: sErr } = await supabase
    .from("suppliers")
    .select("id,organization_id,name")
    .eq("id", input.supplierId)
    .single();

  if (sErr || !supplier) throw new Error("Fournisseur introuvable.");

  // Validate products and compute totals server-side
  const prodIds = input.items.map((i) => i.productId);
  const { data: products } = await supabase
    .from("products")
    .select("id,name,is_active")
    .in("id", prodIds);

  const prodMap = new Map((products ?? []).map((p) => [p.id, p]));

  for (const item of input.items) {
    if (item.quantity <= 0) throw new Error(`Quantité invalide pour le produit ${item.productId}.`);
    if (item.unitCost < 0) throw new Error(`Coût unitaire invalide pour le produit ${item.productId}.`);
    const prod = prodMap.get(item.productId);
    if (!prod) throw new Error(`Produit ${item.productId} introuvable.`);
    if (!prod.is_active) throw new Error(`Produit ${prod.name} est inactif.`);
  }

  // Compute total server-side
  const totalAmount = input.items.reduce(
    (sum, i) => sum + i.quantity * i.unitCost,
    0
  );

  // Insert purchase
  const { data: purchase, error: pErr } = await supabase
    .from("purchases")
    .insert({
      supplier_id: input.supplierId,
      reference: input.reference.trim() || null,
      purchase_date: input.purchaseDate || new Date().toISOString().slice(0, 10),
      notes: input.notes.trim() || null,
      total_amount: totalAmount,
    })
    .select("*")
    .single();

  if (pErr) throw new Error(`Erreur création achat: ${pErr.message}`);

  // Insert items
  const itemsToInsert = input.items.map((i) => ({
    purchase_id: purchase.id,
    product_id: i.productId,
    quantity: i.quantity,
    unit_cost: i.unitCost,
  }));

  const { error: iErr } = await supabase.from("purchase_items").insert(itemsToInsert);
  if (iErr) throw new Error(`Erreur création lignes: ${iErr.message}`);

  // Fetch items back for complete data
  const { data: savedItems } = await supabase
    .from("purchase_items")
    .select("*")
    .eq("purchase_id", purchase.id);

  return toPurchase(
    purchase as DatabasePurchase,
    (savedItems ?? []).map((i) => toPurchaseItem(i, prodMap.get(i.product_id)?.name ?? "")),
    supplier.name
  );
}

// ---------------------------------------------------------------------------
// Update (draft only)
// ---------------------------------------------------------------------------

export async function updatePurchase(input: UpdatePurchaseInput): Promise<Purchase> {
  const supabase = await createServerSupabase();

  // Check status
  const { data: existing, error: exErr } = await supabase
    .from("purchases")
    .select("status")
    .eq("id", input.id)
    .single();

  if (exErr || !existing) throw new Error("Achat introuvable.");
  if (existing.status !== "draft") throw new Error("Seul un achat en brouillon peut être modifié.");

  const updates: Record<string, unknown> = {};
  if (input.reference !== undefined) updates.reference = input.reference.trim() || null;
  if (input.purchaseDate !== undefined) updates.purchase_date = input.purchaseDate;
  if (input.notes !== undefined) updates.notes = input.notes.trim() || null;

  if (Object.keys(updates).length === 0) {
    throw new Error("Aucun champ à modifier.");
  }

  const { error: uErr } = await supabase
    .from("purchases")
    .update(updates)
    .eq("id", input.id);

  if (uErr) throw new Error(`Erreur mise à jour: ${uErr.message}`);

  const updated = await getPurchase(input.id);
  if (!updated) throw new Error("Achat introuvable après mise à jour.");
  return updated;
}

// ---------------------------------------------------------------------------
// Receive (RPC transactionnel)
// ---------------------------------------------------------------------------

export async function receivePurchase(id: string): Promise<Purchase> {
  const supabase = await createServerSupabase();

  const { error } = await supabase.rpc("receive_purchase", { p_id: id });
  if (error) throw new Error(`Erreur réception: ${error.message}`);

  const updated = await getPurchase(id);
  if (!updated) throw new Error("Achat introuvable après réception.");
  return updated;
}

// ---------------------------------------------------------------------------
// Cancel (draft → cancelled)
// ---------------------------------------------------------------------------

export async function cancelPurchase(id: string): Promise<Purchase> {
  const supabase = await createServerSupabase();

  const { data: existing, error: exErr } = await supabase
    .from("purchases")
    .select("status")
    .eq("id", id)
    .single();

  if (exErr || !existing) throw new Error("Achat introuvable.");
  if (existing.status !== "draft") throw new Error("Seul un achat en brouillon peut être annulé.");

  const { error } = await supabase
    .from("purchases")
    .update({ status: "cancelled" as PurchaseStatus })
    .eq("id", id);

  if (error) throw new Error(`Erreur annulation: ${error.message}`);

  const updated = await getPurchase(id);
  if (!updated) throw new Error("Achat introuvable après annulation.");
  return updated;
}

// ---------------------------------------------------------------------------
// Delete (physical — owner only, for draft/cancelled only)
// ---------------------------------------------------------------------------

export async function deletePurchase(id: string): Promise<void> {
  const supabase = await createServerSupabase();

  const { data: existing, error: exErr } = await supabase
    .from("purchases")
    .select("status")
    .eq("id", id)
    .single();

  if (exErr || !existing) throw new Error("Achat introuvable.");
  if (existing.status === "received") {
    throw new Error("Un achat réceptionné ne peut pas être supprimé.");
  }

  // Delete items first (cascade should handle it, but explicit is safer)
  await supabase.from("purchase_items").delete().eq("purchase_id", id);

  const { error } = await supabase.from("purchases").delete().eq("id", id);
  if (error) throw new Error(`Erreur suppression: ${error.message}`);
}
