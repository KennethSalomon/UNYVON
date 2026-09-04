"use server";

import { createClient } from "@supabase/supabase-js";

/**
 * Server-side demo data fetcher — uses the service-role key to bypass RLS
 * and read the demo organization's data. This key is NEVER exposed to the client.
 */

function getDemoClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export type DemoData = {
  organization: { name: string; sector: string; currency: string } | null;
  products: { name: string; sale_price: number; cost_price: number; unit: string }[];
  recentSales: { id: string; sale_date: string; total_amount: number; status: string; customer_name: string | null }[];
  kpis: { ca: number; marge: number; creances: number };
};

export async function getDemoData(): Promise<DemoData | null> {
  const supabase = getDemoClient();
  if (!supabase) return null;

  const { data: org } = await supabase
    .from("organizations")
    .select("name, sector, currency")
    .ilike("name", "%AgroDistrib%")
    .limit(1)
    .maybeSingle();

  if (!org) return null;

  const { data: products } = await supabase
    .from("products")
    .select("name, sale_price, cost_price, unit")
    .limit(20);

  const { data: sales } = await supabase
    .from("sales")
    .select("id, sale_date, total_amount, status, customers(name)")
    .eq("status", "confirmed")
    .order("sale_date", { ascending: false })
    .limit(10);

  const recentSales = (sales ?? []).map((s: Record<string, unknown>) => ({
    id: s.id as string,
    sale_date: s.sale_date as string,
    total_amount: s.total_amount as number,
    status: s.status as string,
    customer_name: (s.customers as { name: string } | null)?.name ?? null,
  }));

  const totalCA = recentSales.reduce((sum, s) => sum + s.total_amount, 0);
  const totalCost = recentSales.reduce((sum, s) => {
    return sum; // simplified — we don't have per-item cost here
  }, 0);

  return {
    organization: org,
    products: products ?? [],
    recentSales,
    kpis: {
      ca: totalCA,
      marge: totalCA * 0.3, // rough estimate for demo
      creances: 0,
    },
  };
}
