"use server";

import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";

export type AuthActionState =
  | { ok: true; message?: string }
  | { ok: false; error: string };

const NOT_CONFIGURED_MSG =
  "Backend non configuré. Copiez .env.local.example vers .env.local et renseignez vos clés Supabase.";

async function supabaseOrNull() {
  try {
    return await createServerSupabase();
  } catch {
    return null;
  }
}

export async function signUpAction(
  _prev: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (!email || !password) {
    return { ok: false, error: "L'email et le mot de passe sont requis." };
  }
  if (password.length < 8) {
    return { ok: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  const supabase = await supabaseOrNull();
  if (!supabase) {
    return { ok: false, error: NOT_CONFIGURED_MSG };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { firstName, lastName },
    },
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  if (!data.session) {
    // Confirmation par email requise (configuration du projet Supabase).
    return {
      ok: true,
      message: "Compte créé. Vérifiez votre boîte mail pour confirmer votre adresse.",
    };
  }

  redirect("/onboarding");
}

export async function signInAction(
  _prev: AuthActionState | null,
  formData: FormData
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) {
    return { ok: false, error: "L'email et le mot de passe sont requis." };
  }

  const supabase = await supabaseOrNull();
  if (!supabase) {
    return { ok: false, error: NOT_CONFIGURED_MSG };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { ok: false, error: error.message };
  }

  // Check if user already has an organization
  const { data: membership } = await supabase
    .from("organization_users")
    .select("organization_id")
    .limit(1)
    .maybeSingle();

  if (membership?.organization_id) {
    redirect("/dashboard");
  }

  redirect("/onboarding");
}

export async function signOutAction(): Promise<void> {
  const supabase = await supabaseOrNull();
  if (supabase) {
    await supabase.auth.signOut();
  }
  redirect("/login");
}
