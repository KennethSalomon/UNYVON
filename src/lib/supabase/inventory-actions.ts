"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import type {
  InventoryMovement,
  InventoryCount,
  ProductStock,
  DatabaseInventoryMovement,
  DatabaseInventoryCount,
  CreateInventoryCountInput,
  MovementType,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toMovement(row: DatabaseInventoryMovement, productName: string): InventoryMovement {
  return {
    id: row.id,
    organizationId: row.organization_id,
    productId: row.product_id,
    productName,
    movementType: row.movement_type,
    quantity: row.quantity,
    unitCost: row.unit_cost != null ? Number(row.unit_cost) : null,
    referenceType: row.reference_type,
    referenceId: row.reference_id,
    reason: row.reason,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

function toCount(row: DatabaseInventoryCount, productName: string): InventoryCount {
  return {
    id: row.id,
    organizationId: row.organization_id,
    productId: row.product_id,
    productName,
    theoreticalQty: row.theoretical_qty,
    physicalQty: row.physical_qty,
    gap: row.gap,
    reason: row.reason,
    notes: row.notes,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

// ---------------------------------------------------------------------------
// Reads
// ---------------------------------------------------------------------------

export async function getProductStock(productId: string): Promise<{ theoreticalStock: number; lastMovementAt: string | null }> {
  const supabase = await createServerSupabase();

  const { data: movements, error } = await supabase
    .from("inventory_movements")
    .select("movement_type, quantity, created_at")
    .eq("product_id", productId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erreur calcul stock: ${error.message}`);
  if (!movements?.length) return { theoreticalStock: 0, lastMovementAt: null };

  let stock = 0;
  for (const m of movements) {
    const mt = m.movement_type as MovementType;
    if (mt === "opening" || mt === "purchase_receipt" || mt === "adjustment_in") {
      stock += m.quantity;
    } else {
      stock -= m.quantity;
    }
  }

  return { theoreticalStock: stock, lastMovementAt: movements[0].created_at };
}

export async function getOrgStocks(): Promise<ProductStock[]> {
  const supabase = await createServerSupabase();

  // Get all active products
  const { data: products, error: pErr } = await supabase
    .from("products")
    .select("id, name, unit, min_stock_threshold")
    .eq("is_active", true)
    .order("name");

  if (pErr) throw new Error(`Erreur chargement produits: ${pErr.message}`);
  if (!products?.length) return [];

  // Get all movements for this org
  const { data: movements, error: mErr } = await supabase
    .from("inventory_movements")
    .select("product_id, movement_type, quantity");

  if (mErr) throw new Error(`Erreur chargement mouvements: ${mErr.message}`);

  // Calculate stock per product
  const stockMap = new Map<string, number>();
  for (const m of movements ?? []) {
    const mt = m.movement_type as MovementType;
    const current = stockMap.get(m.product_id) ?? 0;
    if (mt === "opening" || mt === "purchase_receipt" || mt === "adjustment_in") {
      stockMap.set(m.product_id, current + m.quantity);
    } else {
      stockMap.set(m.product_id, current - m.quantity);
    }
  }

  return products.map((p) => {
    const stock = stockMap.get(p.id) ?? 0;
    const threshold = p.min_stock_threshold;
    const ratio = threshold > 0 ? stock / threshold : 999;
    return {
      productId: p.id,
      productName: p.name,
      unit: p.unit,
      stock,
      minStockThreshold: threshold,
      status: ratio <= 0.5 ? "critical" : ratio <= 1 ? "warning" : "normal",
    };
  });
}

export async function getInventoryMovements(productId?: string): Promise<InventoryMovement[]> {
  const supabase = await createServerSupabase();

  let query = supabase
    .from("inventory_movements")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(200);

  if (productId) {
    query = query.eq("product_id", productId);
  }

  const { data: movements, error } = await query;
  if (error) throw new Error(`Erreur chargement mouvements: ${error.message}`);
  if (!movements?.length) return [];

  // Fetch product names
  const prodIds = [...new Set(movements.map((m) => m.product_id))];
  const { data: prods } = await supabase
    .from("products")
    .select("id,name")
    .in("id", prodIds);
  const prodMap = new Map((prods ?? []).map((p) => [p.id, p.name]));

  return movements.map((m) => toMovement(m as DatabaseInventoryMovement, prodMap.get(m.product_id) ?? ""));
}

export async function getInventoryHistory(): Promise<InventoryCount[]> {
  const supabase = await createServerSupabase();

  const { data: counts, error } = await supabase
    .from("inventory_counts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) throw new Error(`Erreur chargement inventaires: ${error.message}`);
  if (!counts?.length) return [];

  const prodIds = [...new Set(counts.map((c) => c.product_id))];
  const { data: prods } = await supabase
    .from("products")
    .select("id,name")
    .in("id", prodIds);
  const prodMap = new Map((prods ?? []).map((p) => [p.id, p.name]));

  return counts.map((c) => toCount(c as DatabaseInventoryCount, prodMap.get(c.product_id) ?? ""));
}

// ---------------------------------------------------------------------------
// Writes
// ---------------------------------------------------------------------------

export async function createOpeningStock(
  productId: string,
  quantity: number,
  unitCost?: number
): Promise<InventoryMovement> {
  const supabase = await createServerSupabase();

  if (quantity <= 0) throw new Error("La quantité doit être positive.");

  // Check no opening already exists for this product
  const { data: existing } = await supabase
    .from("inventory_movements")
    .select("id")
    .eq("product_id", productId)
    .eq("movement_type", "opening")
    .limit(1);

  if (existing?.length) {
    throw new Error("Un stock initial existe déjà pour ce produit. Utilisez un ajustement.");
  }

  const { data, error } = await supabase
    .from("inventory_movements")
    .insert({
      product_id: productId,
      movement_type: "opening",
      quantity,
      unit_cost: unitCost ?? null,
      reference_type: null,
      reference_id: null,
      reason: "Stock initial",
    })
    .select("*")
    .single();

  if (error) throw new Error(`Erreur stock initial: ${error.message}`);
  return toMovement(data as DatabaseInventoryMovement, "");
}

export async function createAdjustment(
  productId: string,
  quantity: number,
  reason: string,
): Promise<InventoryMovement> {
  const supabase = await createServerSupabase();

  const movementType: MovementType = quantity > 0 ? "adjustment_in" : "adjustment_out";
  const absQty = Math.abs(quantity);

  if (absQty === 0) throw new Error("La quantité ne peut pas être zéro.");

  const { data, error } = await supabase
    .from("inventory_movements")
    .insert({
      product_id: productId,
      movement_type: movementType,
      quantity: absQty,
      unit_cost: null,
      reference_type: null,
      reference_id: null,
      reason,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Erreur ajustement: ${error.message}`);
  return toMovement(data as DatabaseInventoryMovement, "");
}

export async function createInventory(
  input: CreateInventoryCountInput
): Promise<InventoryCount> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.rpc("create_inventory_and_adjust", {
    p_product_id: input.productId,
    p_physical_qty: input.physicalQty,
    p_reason: input.reason,
    p_notes: input.notes || null,
  });

  if (error) throw new Error(`Erreur inventaire: ${error.message}`);

  // Fetch product name
  const { data: prod } = await supabase
    .from("products")
    .select("name")
    .eq("id", input.productId)
    .single();

  return toCount(data as DatabaseInventoryCount, prod?.name ?? "");
}

export async function getStockSummary(): Promise<{
  outOfStock: number;
  lowStock: number;
  normalStock: number;
}> {
  const stocks = await getOrgStocks();
  return {
    outOfStock: stocks.filter((s) => s.status === "critical").length,
    lowStock: stocks.filter((s) => s.status === "warning").length,
    normalStock: stocks.filter((s) => s.status === "normal").length,
  };
}
