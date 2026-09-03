import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "./env";

/**
 * Server Supabase client bound to the current request's cookies.
 *
 * It uses the authenticated user's session (never the service-role key), so
 * Postgres RLS is always enforced. Import from server actions / server
 * components only — never from a "use client" module.
 */
export async function createServerSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase n'est pas configuré côté serveur. Renseignez les variables d'environnement."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignoré — survient lors du rendu serveur (Server Components).
          // Le middleware rafraîchit normalement la session à chaque requête.
        }
      },
    },
  });
}
