"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import type {
  Supplier,
  CreateSupplierInput,
  UpdateSupplierInput,
  DatabaseSupplier,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers : snake_case ↔ camelCase
// ---------------------------------------------------------------------------

function toSupplier(row: DatabaseSupplier): Supplier {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    notes: row.notes ?? "",
    products: [],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Suppliers
// ---------------------------------------------------------------------------

export async function getSuppliers(): Promise<Supplier[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(
      `Erreur lors du chargement des fournisseurs: ${error.message}`
    );
  }

  return (data as DatabaseSupplier[]).map(toSupplier);
}

export async function getSupplier(id: string): Promise<Supplier | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("suppliers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(
      `Erreur lors du chargement du fournisseur: ${error.message}`
    );
  }

  return toSupplier(data as DatabaseSupplier);
}

export async function createSupplier(
  input: CreateSupplierInput
): Promise<Supplier> {
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Le nom du fournisseur est requis");
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("suppliers")
    .insert({
      name: input.name.trim(),
      phone: input.phone.trim() || null,
      email: input.email.trim() || null,
      address: input.address.trim() || null,
      notes: input.notes.trim() || null,
    })
    .select()
    .single();

  if (error) {
    throw new Error(
      `Erreur lors de la création du fournisseur: ${error.message}`
    );
  }

  return toSupplier(data as DatabaseSupplier);
}

export async function updateSupplier(
  input: UpdateSupplierInput
): Promise<Supplier> {
  const supabase = await createServerSupabase();
  const updates: Record<string, unknown> = {};

  if (input.name !== undefined) updates.name = input.name.trim();
  if (input.phone !== undefined) updates.phone = input.phone.trim() || null;
  if (input.email !== undefined) updates.email = input.email.trim() || null;
  if (input.address !== undefined)
    updates.address = input.address.trim() || null;
  if (input.notes !== undefined) updates.notes = input.notes.trim() || null;
  if (input.isActive !== undefined) updates.is_active = input.isActive;

  if (Object.keys(updates).length === 0) {
    throw new Error("Aucun champ à mettre à jour");
  }

  const { data, error } = await supabase
    .from("suppliers")
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Erreur lors de la mise à jour du fournisseur: ${error.message}`
    );
  }

  return toSupplier(data as DatabaseSupplier);
}

export async function deleteSupplier(id: string): Promise<void> {
  const supabase = await createServerSupabase();
  const { error } = await supabase.from("suppliers").delete().eq("id", id);

  if (error) {
    throw new Error(
      `Erreur lors de la suppression du fournisseur: ${error.message}`
    );
  }
}
