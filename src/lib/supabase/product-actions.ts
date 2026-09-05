"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import type {
  Category,
  Product,
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateProductInput,
  UpdateProductInput,
  DatabaseCategory,
  DatabaseProduct,
} from "@/types";

// ---------------------------------------------------------------------------
// Helpers : snake_case ↔ camelCase
// ---------------------------------------------------------------------------

function toCategory(row: DatabaseCategory): Category {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toProduct(row: DatabaseProduct): Product {
  return {
    id: row.id,
    organizationId: row.organization_id,
    name: row.name,
    unit: row.unit,
    costPrice: Number(row.cost_price),
    salePrice: Number(row.sale_price),
    stockQuantity: 0,
    minStockThreshold: row.min_stock_threshold,
    categoryId: row.category_id,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------------------------------------------------------------------------
// Role check helper
// ---------------------------------------------------------------------------

async function requireProductRole(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>,
  allowedRoles: string[]
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: org } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!org) throw new Error("Aucune organisation");

  const { data: role } = await supabase.rpc("current_org_role", {
    org_id: org.organization_id,
  });

  if (!allowedRoles.includes(role)) {
    throw new Error("Les vendeurs ne peuvent pas gérer les produits");
  }

  return { orgId: org.organization_id as string };
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

export async function getCategories(): Promise<Category[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return (data as DatabaseCategory[]).map(toCategory);
}

export async function createCategory(
  input: CreateCategoryInput
): Promise<Category> {
  const supabase = await createServerSupabase();
  const name = input.name.trim();
  if (!name) throw new Error("Le nom de la catégorie est requis.");

  const { orgId } = await requireProductRole(supabase, [
    "owner",
    "manager",
    "stockkeeper",
  ]);

  const { data, error } = await supabase
    .from("categories")
    .insert({ name, organization_id: orgId })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toCategory(data as DatabaseCategory);
}

export async function updateCategory(
  input: UpdateCategoryInput
): Promise<Category> {
  const supabase = await createServerSupabase();
  const name = input.name.trim();
  if (!name) throw new Error("Le nom de la catégorie est requis.");

  const { data, error } = await supabase
    .from("categories")
    .update({ name })
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toCategory(data as DatabaseCategory);
}

export async function deleteCategory(id: string): Promise<void> {
  const supabase = await createServerSupabase();
  const { orgId } = await requireProductRole(supabase, [
    "owner",
    "manager",
    "stockkeeper",
  ]);
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", id)
    .eq("organization_id", orgId);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function getProducts(): Promise<Product[]> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("name");

  if (error) throw new Error(error.message);
  return (data as DatabaseProduct[]).map(toProduct);
}

export async function getProduct(id: string): Promise<Product | null> {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("id", id)
    .single();

  if (error) return null;
  return toProduct(data as DatabaseProduct);
}

export async function createProduct(
  input: CreateProductInput
): Promise<Product> {
  const supabase = await createServerSupabase();
  const name = input.name.trim();
  if (!name) throw new Error("Le nom du produit est requis.");
  if (input.salePrice < 0) throw new Error("Le prix de vente ne peut pas être négatif.");
  if (input.costPrice < 0) throw new Error("Le coût ne peut pas être négatif.");
  if (input.minStockThreshold < 0) throw new Error("Le seuil ne peut pas être négatif.");

  const { orgId } = await requireProductRole(supabase, [
    "owner",
    "manager",
    "stockkeeper",
  ]);

  const { data, error } = await supabase
    .from("products")
    .insert({
      organization_id: orgId,
      name,
      unit: input.unit.trim() || "unité",
      cost_price: input.costPrice,
      sale_price: input.salePrice,
      min_stock_threshold: input.minStockThreshold,
      category_id: input.categoryId || null,
    })
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toProduct(data as DatabaseProduct);
}

export async function updateProduct(
  input: UpdateProductInput
): Promise<Product> {
  const supabase = await createServerSupabase();
  const { id, ...fields } = input;

  const { orgId } = await requireProductRole(supabase, [
    "owner",
    "manager",
    "stockkeeper",
  ]);

  const update: Record<string, unknown> = {};
  if (fields.name !== undefined) update.name = fields.name.trim();
  if (fields.unit !== undefined) update.unit = fields.unit.trim();
  if (fields.costPrice !== undefined) update.cost_price = fields.costPrice;
  if (fields.salePrice !== undefined) update.sale_price = fields.salePrice;
  if (fields.minStockThreshold !== undefined)
    update.min_stock_threshold = fields.minStockThreshold;
  if (fields.categoryId !== undefined) update.category_id = fields.categoryId;
  if (fields.isActive !== undefined) update.is_active = fields.isActive;

  if (Object.keys(update).length === 0) {
    throw new Error("Aucun champ à modifier.");
  }

  const { data, error } = await supabase
    .from("products")
    .update(update)
    .eq("id", id)
    .eq("organization_id", orgId)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return toProduct(data as DatabaseProduct);
}

export async function archiveProduct(id: string): Promise<Product> {
  return updateProduct({ id, isActive: false });
}

export async function restoreProduct(id: string): Promise<Product> {
  return updateProduct({ id, isActive: true });
}
