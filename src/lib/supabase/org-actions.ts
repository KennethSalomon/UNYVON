"use server";

import { createServerSupabase } from "@/lib/supabase/server";

export type OrgActionState =
  | { ok: true; organizationId: string }
  | { ok: false; error: string }
  | { ok: false; error: "UNAUTHENTICATED" | "NOT_CONFIGURED" };

export type UpdateOrgActionState =
  | { ok: true }
  | { ok: false; error: string }
  | { ok: false; error: "UNAUTHENTICATED" | "NOT_CONFIGURED" };

/**
 * Crée l'organisation + le membership « owner » + l'abonnement trial de
 * l'utilisateur connecté. Utilise la session utilisateur (jamais la clé
 * service-role) donc la RLS s'applique ; le trigger `handle_new_org`
 * crée le membership owner et l'abonnement trial de façon atomique en base.
 */
export async function createOrganizationAction(
  input: { name: string; sector: string; currency: string }
): Promise<OrgActionState> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Le nom de l'entreprise est requis." };
  }

  let supabase;
  try {
    supabase = await createServerSupabase();
  } catch {
    return { ok: false, error: "NOT_CONFIGURED" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const { data, error } = await supabase
    .from("organizations")
    .insert({
      name,
      sector: input.sector.trim() || "Commerce général",
      currency: input.currency.trim() || "FCFA",
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, organizationId: data.id };
}

/**
 * Met à jour l'organisation active de l'utilisateur connecté.
 * Nécessite le rôle owner ou manager.
 */
export async function updateOrganizationAction(
  input: { name: string; sector: string; currency: string }
): Promise<UpdateOrgActionState> {
  const name = input.name.trim();
  if (!name) {
    return { ok: false, error: "Le nom de l'entreprise est requis." };
  }

  let supabase;
  try {
    supabase = await createServerSupabase();
  } catch {
    return { ok: false, error: "NOT_CONFIGURED" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const { data: org } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!org) {
    return { ok: false, error: "Aucune organisation trouvée." };
  }

  const { data: role } = await supabase.rpc("current_org_role", {
    org_id: org.organization_id,
  });

  if (!["owner", "manager"].includes(role)) {
    return { ok: false, error: "Vous n'avez pas les droits pour modifier l'organisation." };
  }

  const { error } = await supabase
    .from("organizations")
    .update({
      name,
      sector: input.sector.trim() || "Commerce général",
      currency: input.currency.trim() || "FCFA",
    })
    .eq("id", org.organization_id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export type SyncOnboardingState =
  | { ok: true }
  | { ok: false; error: string }
  | { ok: false; error: "UNAUTHENTICATED" | "NOT_CONFIGURED" };

/**
 * Synchronise les données d'onboarding (produits, clients, vente) vers Supabase.
 * Appelée une seule fois à la fin de l'onboarding.
 */
export async function syncOnboardingData(input: {
  products: { name: string; unit: string; costPrice: number; salePrice: number; minStockThreshold: number; categoryId: string | null }[];
  customers: { name: string; phone: string; email: string; address: string; notes: string }[];
  sale?: {
    customerId: string | null;
    customerName: string;
    items: { productId: string; quantity: number; total: number }[];
    total: number;
    amountPaid: number;
  };
}): Promise<SyncOnboardingState> {
  let supabase;
  try {
    supabase = await createServerSupabase();
  } catch {
    return { ok: false, error: "NOT_CONFIGURED" };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "UNAUTHENTICATED" };
  }

  const { data: org } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!org) {
    return { ok: false, error: "Aucune organisation trouvée." };
  }

  const orgId = org.organization_id;

  // Sync products
  const productIds = new Map<string, string>();
  for (const product of input.products) {
    const { data, error } = await supabase
      .from("products")
      .insert({
        organization_id: orgId,
        name: product.name.trim(),
        unit: product.unit.trim() || "unité",
        cost_price: product.costPrice,
        sale_price: product.salePrice,
        min_stock_threshold: product.minStockThreshold,
        category_id: product.categoryId || null,
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, error: `Erreur produit "${product.name}": ${error.message}` };
    }
    productIds.set(product.name.toLowerCase().trim(), data.id);
  }

  // Sync customers
  const customerIds = new Map<string, string>();
  for (const customer of input.customers) {
    const { data, error } = await supabase
      .from("customers")
      .insert({
        organization_id: orgId,
        name: customer.name.trim(),
        phone: customer.phone.trim() || null,
        email: customer.email.trim() || null,
        address: customer.address.trim() || null,
        notes: customer.notes.trim() || null,
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, error: `Erreur client "${customer.name}": ${error.message}` };
    }
    customerIds.set(customer.name.toLowerCase().trim(), data.id);
  }

  // Sync sale if provided
  if (input.sale && input.sale.items.length > 0) {
    const saleCustomerId = input.sale.customerId
      ? customerIds.get(input.sale.customerId.toLowerCase().trim()) ?? input.sale.customerId
      : null;

    const { data: sale, error: saleErr } = await supabase
      .from("sales")
      .insert({
        organization_id: orgId,
        customer_id: saleCustomerId,
        sale_date: new Date().toISOString().split("T")[0],
        status: "confirmed",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (saleErr) {
      return { ok: false, error: `Erreur vente: ${saleErr.message}` };
    }

    // Insert sale items
    const saleItems = input.sale.items.map((item) => ({
      sale_id: sale.id,
      product_id: item.productId,
      quantity: item.quantity,
      unit_price: item.quantity > 0 ? item.total / item.quantity : 0,
      unit_cost_snapshot: 0,
    }));

    const { error: itemsErr } = await supabase.from("sale_items").insert(saleItems);
    if (itemsErr) {
      return { ok: false, error: `Erreur lignes vente: ${itemsErr.message}` };
    }
  }

  return { ok: true };
}

/**
 * Retourne l'organisation active de l'utilisateur connecté (la première
 * à laquelle il appartient), ou null. Sert de base au contexte d'org.
 */
export async function getActiveOrganizationAction() {
  let supabase;
  try {
    supabase = await createServerSupabase();
  } catch {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("organizations")
    .select(
      "id, name, sector, currency, organization_users(role)"
    )
    .limit(1)
    .maybeSingle();

  const userMeta = user.user_metadata ?? {};

  return {
    organization: data ?? null,
    user: {
      id: user.id,
      email: user.email ?? "",
      firstName: (userMeta.firstName as string) ?? "",
      lastName: (userMeta.lastName as string) ?? "",
    },
  };
}
