"use server";

import { createServerSupabase } from "@/lib/supabase/server";

export type OrgActionState =
  | { ok: true; organizationId: string }
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

  return data ?? null;
}
