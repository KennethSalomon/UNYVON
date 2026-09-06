/**
 * Centralized access to Supabase environment variables.
 *
 * Security rules enforced here:
 * - The public (anon) client only ever receives the NEXT_PUBLIC_* values,
 *   which are safe to ship to the browser (RLS is the real boundary).
 * - The service-role key is strictly server-only and must never be imported
 *   from a "use client" module. It is never returned by a public function.
 */

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
}

export function getSupabaseAnonKey(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
}

export function getSupabaseServiceRoleKey(): string {
  return process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
}

/**
 * Message renvoyé quand Supabase n'est pas configuré côté serveur. Les pages
 * client basculent alors en mode démo (mock) UNIQUEMENT sur ce message : une
 * erreur backend réelle (RLS, timeout, 500) ne doit jamais être masquée.
 * Sans "use server" et sans next/headers, donc sûre à importer depuis du
 * code client.
 */
export const SUPABASE_NOT_CONFIGURED_MESSAGE =
  "Supabase n'est pas configuré côté serveur. Renseignez les variables d'environnement.";

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseUrl() && getSupabaseAnonKey());
}
