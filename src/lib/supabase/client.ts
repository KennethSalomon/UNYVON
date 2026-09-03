"use client";

import { createBrowserClient } from "@supabase/ssr";
import {
  getSupabaseAnonKey,
  getSupabaseUrl,
  isSupabaseConfigured,
} from "./env";

/**
 * Browser Supabase client (uses Next.js public env vars).
 * Safe for client components — uses only the public anon key / URL.
 * Session is persisted automatically in cookies by @supabase/ssr.
 */
export function createClient() {
  if (!isSupabaseConfigured()) {
    throw new Error(
      "Supabase n'est pas configuré. Copiez .env.local.example vers .env.local et renseignez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  return createBrowserClient(getSupabaseUrl(), getSupabaseAnonKey());
}
