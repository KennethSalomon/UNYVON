"use server";

import { createServerSupabase } from "./server";
import type {
  DatabaseSale,
  DatabaseSaleItem,
  SaleWithItems,
  CreateSaleInput,
  UpdateSaleInput,
  SaleStatus,
} from "@/types";

interface SaleRow extends DatabaseSale {
  customers: { name: string } | null;
}

interface SaleItemRow extends DatabaseSaleItem {
  products: { name: string; unit: string } | null;
}

function toSaleWithItems(
  sale: SaleRow,
  items: SaleItemRow[]
): SaleWithItems {
  return {
    ...sale,
    customerName: sale.customers?.name ?? null,
    items: items.map((si) => ({
      ...si,
      productName: si.products?.name ?? "Produit inconnu",
      productUnit: si.products?.unit ?? "unité",
    })),
  };
}

export async function getSales(): Promise<SaleWithItems[]> {
  const supabase = await createServerSupabase();

  const { data: sales, error } = await supabase
    .from("sales")
    .select("*, customers(name)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erreur ventes: ${error.message}`);
  if (!sales?.length) return [];

  const saleIds = sales.map((s) => s.id);

  const { data: items } = await supabase
    .from("sale_items")
    .select("*, products(name, unit)")
    .in("sale_id", saleIds);

  const itemsBySale = new Map<string, SaleItemRow[]>();
  for (const item of items ?? []) {
    const list = itemsBySale.get(item.sale_id) ?? [];
    list.push(item as SaleItemRow);
    itemsBySale.set(item.sale_id, list);
  }

  return sales.map((sale) =>
    toSaleWithItems(sale as SaleRow, itemsBySale.get(sale.id) ?? [])
  );
}

export async function getSale(id: string): Promise<SaleWithItems | null> {
  const supabase = await createServerSupabase();

  const { data: sale, error } = await supabase
    .from("sales")
    .select("*, customers(name)")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Erreur vente: ${error.message}`);
  }

  const { data: items } = await supabase
    .from("sale_items")
    .select("*, products(name, unit)")
    .eq("sale_id", id);

  return toSaleWithItems(sale as SaleRow, (items as SaleItemRow[]) ?? []);
}

export async function createSale(input: CreateSaleInput): Promise<DatabaseSale> {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: org } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!org) throw new Error("Aucune organisation");

  const { data: sale, error: saleErr } = await supabase
    .from("sales")
    .insert({
      organization_id: org.organization_id,
      customer_id: input.customerId ?? null,
      reference: input.reference ?? null,
      sale_date: input.saleDate ?? new Date().toISOString().split("T")[0],
      notes: input.notes ?? null,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (saleErr) throw new Error(`Erreur création vente: ${saleErr.message}`);

  if (input.items.length > 0) {
    const { error: itemsErr } = await supabase
      .from("sale_items")
      .insert(
        input.items.map((item) => ({
          sale_id: sale.id,
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          unit_cost_snapshot: item.unitCostSnapshot,
        }))
      );

    if (itemsErr) throw new Error(`Erreur lignes vente: ${itemsErr.message}`);
  }

  return sale as DatabaseSale;
}

export async function updateSale(input: UpdateSaleInput): Promise<DatabaseSale> {
  const supabase = await createServerSupabase();

  const { data: existing } = await supabase
    .from("sales")
    .select("status")
    .eq("id", input.id)
    .single();

  if (!existing) throw new Error("Vente non trouvée");
  if (existing.status !== "draft") {
    throw new Error("Seules les ventes en brouillon peuvent être modifiées");
  }

  const updateData: Record<string, unknown> = {};
  if (input.reference !== undefined) updateData.reference = input.reference;
  if (input.saleDate !== undefined) updateData.sale_date = input.saleDate;
  if (input.notes !== undefined) updateData.notes = input.notes;
  if (input.customerId !== undefined) updateData.customer_id = input.customerId;

  const { data: sale, error } = await supabase
    .from("sales")
    .update(updateData)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) throw new Error(`Erreur mise à jour vente: ${error.message}`);
  return sale as DatabaseSale;
}

export async function confirmSale(saleId: string): Promise<SaleStatus> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.rpc("confirm_sale", {
    p_sale_id: saleId,
  });

  if (error) throw new Error(`Erreur confirmation: ${error.message}`);
  return data as SaleStatus;
}

export async function cancelSale(saleId: string): Promise<DatabaseSale> {
  const supabase = await createServerSupabase();

  const { data: existing } = await supabase
    .from("sales")
    .select("status")
    .eq("id", saleId)
    .single();

  if (!existing) throw new Error("Vente non trouvée");
  if (existing.status !== "draft") {
    throw new Error("Seules les ventes en brouillon peuvent être annulées");
  }

  const { data: sale, error } = await supabase
    .from("sales")
    .update({ status: "cancelled" })
    .eq("id", saleId)
    .select("*")
    .single();

  if (error) throw new Error(`Erreur annulation: ${error.message}`);
  return sale as DatabaseSale;
}
