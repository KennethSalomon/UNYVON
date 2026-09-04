"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
  DatabaseCustomer,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers : snake_case ↔ camelCase
// ---------------------------------------------------------------------------

function toCustomer(row: DatabaseCustomer): Customer {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    phone: row.phone ?? "",
    email: row.email ?? "",
    address: row.address ?? "",
    notes: row.notes ?? "",
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    totalPurchases: 0,
    outstandingBalance: 0,
  };
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export async function getCustomers(): Promise<Customer[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(`Erreur lors du chargement des clients: ${error.message}`);
  }

  return (data as DatabaseCustomer[]).map(toCustomer);
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Erreur lors du chargement du client: ${error.message}`);
  }

  return toCustomer(data as DatabaseCustomer);
}

export async function createCustomer(
  input: CreateCustomerInput
): Promise<Customer> {
  if (!input.name || input.name.trim().length === 0) {
    throw new Error("Le nom du client est requis");
  }

  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("customers")
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
    throw new Error(`Erreur lors de la création du client: ${error.message}`);
  }

  return toCustomer(data as DatabaseCustomer);
}

export async function updateCustomer(
  input: UpdateCustomerInput
): Promise<Customer> {
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
    .from("customers")
    .update(updates)
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    throw new Error(
      `Erreur lors de la mise à jour du client: ${error.message}`
    );
  }

  return toCustomer(data as DatabaseCustomer);
}

// L'archivage (is_active=false) est privilégié à la suppression physique afin de
// conserver l'historique des ventes/achats rattachés à un client.
export async function archiveCustomer(id: string): Promise<Customer> {
  return updateCustomer({ id, isActive: false });
}

export async function restoreCustomer(id: string): Promise<Customer> {
  return updateCustomer({ id, isActive: true });
}
