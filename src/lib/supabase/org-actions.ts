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
 * Synchronise les données d'onboarding (produits, clients, stock initial,
 * vente) vers Supabase en utilisant les mêmes moteurs métier que les
 * pages normales.
 *
 * Idempotence : si des produits du même nom existent déjà pour l'org,
 * on les réutilise au lieu d'en créer de nouveaux.
 */
export async function syncOnboardingData(input: {
  products: { name: string; unit: string; costPrice: number; salePrice: number; minStockThreshold: number; categoryId: string | null; stockQuantity?: number }[];
  customers: { name: string; phone: string; email: string; address: string; notes: string }[];
  sale?: {
    customerId: string | null;
    customerName: string;
    items: { productId: string; productName: string; quantity: number; total: number }[];
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

  // Les IDs de catégorie du wizard sont des mocks locaux ("cat-cereales",
  // "cat-autre", …) absents de la base : on ne référence que des catégories
  // réellement présentes pour éviter une violation de clé étrangère.
  const { data: categories } = await supabase
    .from("categories")
    .select("id")
    .eq("organization_id", orgId);
  const validCategoryIds = new Set<string>((categories ?? []).map((c) => c.id));

  // ── 1. Sync products (idempotent: skip if name already exists) ──
  const productIds = new Map<string, string>();

  for (const product of input.products) {
    const normalizedName = product.name.trim().toLowerCase();

    // Check if product already exists (idempotency)
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("organization_id", orgId)
      .ilike("name", product.name.trim())
      .limit(1)
      .maybeSingle();

    if (existing) {
      productIds.set(normalizedName, existing.id);
      continue;
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        organization_id: orgId,
        name: product.name.trim(),
        unit: product.unit.trim() || "unité",
        cost_price: product.costPrice,
        sale_price: product.salePrice,
        min_stock_threshold: product.minStockThreshold,
        category_id:
          product.categoryId && validCategoryIds.has(product.categoryId)
            ? product.categoryId
            : null,
      })
      .select("id")
      .single();

    if (error) {
      return { ok: false, error: `Erreur produit "${product.name}": ${error.message}` };
    }
    productIds.set(normalizedName, data.id);
  }

  // ── 2. Stock initial via inventory_movements (opening) ──
  for (const product of input.products) {
    const qty = product.stockQuantity ?? 0;
    if (qty <= 0) continue;

    const productId = productIds.get(product.name.trim().toLowerCase());
    if (!productId) continue;

    // Check if opening movement already exists (idempotency)
    const { data: existingMovement } = await supabase
      .from("inventory_movements")
      .select("id")
      .eq("organization_id", orgId)
      .eq("product_id", productId)
      .eq("movement_type", "opening")
      .limit(1)
      .maybeSingle();

    if (existingMovement) continue;

    const { error: movErr } = await supabase
      .from("inventory_movements")
      .insert({
        organization_id: orgId,
        product_id: productId,
        movement_type: "opening",
        quantity: qty,
        unit_cost: product.costPrice,
        reason: "Stock initial — onboarding",
        created_by: user.id,
      });

    if (movErr) {
      return { ok: false, error: `Erreur stock initial "${product.name}": ${movErr.message}` };
    }
  }

  // ── 3. Sync customers (idempotent: skip if name already exists) ──
  const customerIds = new Map<string, string>();

  for (const customer of input.customers) {
    const normalizedName = customer.name.trim().toLowerCase();

    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("organization_id", orgId)
      .ilike("name", customer.name.trim())
      .limit(1)
      .maybeSingle();

    if (existing) {
      customerIds.set(normalizedName, existing.id);
      continue;
    }

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
    customerIds.set(normalizedName, data.id);
  }

  // ── 4. Première vente via le moteur métier (create → confirm) ──
  if (input.sale && input.sale.items.length > 0) {
    // Les ID du wizard sont des mocks locaux ("cust-1", "prod-1", …) :
    // on résout le client et les produits par leur nom vers les vrais ID.
    const saleCustomerId = input.sale.customerName
      ? customerIds.get(input.sale.customerName.trim().toLowerCase()) ?? null
      : null;

    const resolvedItems = input.sale.items
      .map((item) => {
        const productId = item.productName
          ? productIds.get(item.productName.trim().toLowerCase()) ?? null
          : null;
        if (!productId) return null;
        return { productId, quantity: item.quantity, total: item.total };
      })
      .filter(
        (item): item is { productId: string; quantity: number; total: number } =>
          item !== null
      );

    // Check if a sale already exists for this org with same total (idempotency)
    const { data: existingSale } = await supabase
      .from("sales")
      .select("id, status")
      .eq("organization_id", orgId)
      .eq("total_amount", input.sale.total)
      .eq("status", "confirmed")
      .limit(1)
      .maybeSingle();

    if (!existingSale && resolvedItems.length > 0) {
      // Create sale as draft (same as createSale server action)
      const { data: sale, error: saleErr } = await supabase
        .from("sales")
        .insert({
          organization_id: orgId,
          customer_id: saleCustomerId,
          sale_date: new Date().toISOString().split("T")[0],
          status: "draft",
          created_by: user.id,
        })
        .select("id")
        .single();

      if (saleErr) {
        return { ok: false, error: `Erreur vente: ${saleErr.message}` };
      }

      // Insert sale items with proper unit_price
      const saleItems = resolvedItems.map((item) => ({
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

      // Confirm via RPC (creates stock movement, sets cost snapshot, validates)
      const { error: confirmErr } = await supabase.rpc("confirm_sale", {
        p_sale_id: sale.id,
      });

      if (confirmErr) {
        return { ok: false, error: `Erreur confirmation vente: ${confirmErr.message}` };
      }

      // Record payment if amount > 0
      if (input.sale.amountPaid > 0) {
        const { error: payErr } = await supabase.rpc("create_payment", {
          p_sale_id: sale.id,
          p_amount: input.sale.amountPaid,
          p_payment_method: "cash",
          p_reference: "Paiement initial — onboarding",
          p_notes: "Paiement enregistré lors de l'onboarding",
        });

        // Payment error is non-fatal — sale is still valid
        if (payErr) {
          console.error("Onboarding payment error:", payErr.message);
        }
      }
    }
  }

  return { ok: true };
}

export async function getSubscriptionAction() {
  let supabase;
  try {
    supabase = await createServerSupabase();
  } catch {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: org } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  if (!org) return null;

  const { data: sub } = await supabase
    .from("subscriptions")
    .select("status, trial_start, trial_end, plan")
    .eq("organization_id", org.organization_id)
    .limit(1)
    .maybeSingle();

  if (!sub) return null;

  const now = Date.now();
  const trialEnd = sub.trial_end ? new Date(sub.trial_end).getTime() : 0;
  const daysRemaining = trialEnd > 0 ? Math.max(0, Math.ceil((trialEnd - now) / 86400000)) : 0;

  return {
    status: sub.status as string,
    trialStart: sub.trial_start as string | null,
    trialEnd: sub.trial_end as string | null,
    plan: sub.plan as string | null,
    daysRemaining,
  };
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
