"use server";

import { createServerSupabase } from "@/lib/supabase/server";

export interface TeamMember {
  userId: string;
  role: string;
  createdAt: string;
}

export async function getTeamMembersAction(
  organizationId: string
): Promise<{ ok: true; members: TeamMember[] } | { ok: false; error: string }> {
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
    .from("organization_users")
    .select("user_id, role, created_at")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: true });

  if (error) {
    return { ok: false, error: error.message };
  }

  const members: TeamMember[] = (data ?? []).map((row) => ({
    userId: row.user_id,
    role: row.role ?? "member",
    createdAt: row.created_at ?? new Date().toISOString(),
  }));

  return { ok: true, members };
}
