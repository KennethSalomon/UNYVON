"use server";

import { createServerSupabase } from "./server";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DashboardKPIs {
  totalRevenue: number;
  totalCost: number;
  grossMarginPct: number;
  totalReceipts: number;
  totalReceivables: number;
  totalExpenses: number;
  netCashflow: number;
  confirmedSales: number;
  draftSales: number;
}

export interface ActivityItem {
  id: string;
  type: "sale" | "payment" | "expense";
  description: string;
  amount: number;
  date: string;
}

export interface CriticalStockItem {
  productId: string;
  productName: string;
  unit: string;
  stock: number;
  minStockThreshold: number;
  status: "critical" | "warning";
}

export interface TopDebtor {
  customerId: string;
  customerName: string;
  outstanding: number;
}

export interface MonthlyPerformance {
  month: string;
  revenue: number;
  receipts: number;
}

// ---------------------------------------------------------------------------
// Helper: get user's org ID
// ---------------------------------------------------------------------------

async function getUserOrgId(supabase: Awaited<ReturnType<typeof createServerSupabase>>): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: org } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!org) throw new Error("Aucune organisation");
  return String(org.organization_id);
}

// ---------------------------------------------------------------------------
// getDashboardKPIs
// ---------------------------------------------------------------------------

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const supabase = await createServerSupabase();
  const orgId = await getUserOrgId(supabase);

  const queryErrors: string[] = [];

  // 1. Confirmed sales
  let sales: { id: string; total_amount: number; status: string }[] | null = null;
  try {
    const result = await supabase
      .from("sales")
      .select("id, total_amount, status")
      .eq("organization_id", orgId)
      .eq("status", "confirmed");
    if (result.error) {
      console.error("[getDashboardKPIs] Failed to fetch confirmed sales:", result.error.message);
      queryErrors.push("confirmed sales");
    } else {
      sales = result.data;
    }
  } catch (e) {
    console.error("[getDashboardKPIs] Unexpected error fetching confirmed sales:", e);
    queryErrors.push("confirmed sales");
  }

  const totalRevenue = (sales ?? []).reduce((sum, s) => sum + Number(s.total_amount), 0);
  const confirmedSales = (sales ?? []).length;

  // 2. Draft sales count
  let draftSales = 0;
  try {
    const result = await supabase
      .from("sales")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("status", "draft");
    if (result.error) {
      console.error("[getDashboardKPIs] Failed to fetch draft sales:", result.error.message);
      queryErrors.push("draft sales");
    } else {
      draftSales = result.count ?? 0;
    }
  } catch (e) {
    console.error("[getDashboardKPIs] Unexpected error fetching draft sales:", e);
    queryErrors.push("draft sales");
  }

  // 3. Sale items for cost calculation
  let totalCost = 0;
  if (sales && sales.length > 0) {
    const saleIds = sales.map((s) => s.id);
    try {
      const result = await supabase
        .from("sale_items")
        .select("quantity, unit_cost_snapshot, sale_id")
        .in("sale_id", saleIds);
      if (result.error) {
        console.error("[getDashboardKPIs] Failed to fetch sale items:", result.error.message);
        queryErrors.push("sale items");
      } else {
        totalCost = (result.data ?? []).reduce(
          (sum, item) => sum + Number(item.quantity) * Number(item.unit_cost_snapshot),
          0
        );
      }
    } catch (e) {
      console.error("[getDashboardKPIs] Unexpected error fetching sale items:", e);
      queryErrors.push("sale items");
    }
  }

  const grossMarginPct = totalRevenue > 0
    ? ((totalRevenue - totalCost) / totalRevenue) * 100
    : 0;

  // 4. Payments / receipts
  let totalReceipts = 0;
  try {
    const result = await supabase
      .from("payments")
      .select("amount, sales(organization_id)")
      .limit(10000);
    if (result.error) {
      console.error("[getDashboardKPIs] Failed to fetch payments:", result.error.message);
      queryErrors.push("payments");
    } else {
      totalReceipts = (result.data ?? [])
        .filter((p: Record<string, unknown>) => {
          const sale = p.sales as { organization_id: string } | null;
          return sale?.organization_id === orgId;
        })
        .reduce((sum: number, p: Record<string, unknown>) => sum + Number(p.amount), 0);
    }
  } catch (e) {
    console.error("[getDashboardKPIs] Unexpected error fetching payments:", e);
    queryErrors.push("payments");
  }

  const totalReceivables = totalRevenue - totalReceipts;

  // 5. Expenses
  let totalExpenses = 0;
  try {
    const result = await supabase
      .from("expenses")
      .select("amount")
      .eq("organization_id", orgId);
    if (result.error) {
      console.error("[getDashboardKPIs] Failed to fetch expenses:", result.error.message);
      queryErrors.push("expenses");
    } else {
      totalExpenses = (result.data ?? []).reduce((sum, e) => sum + Number(e.amount), 0);
    }
  } catch (e) {
    console.error("[getDashboardKPIs] Unexpected error fetching expenses:", e);
    queryErrors.push("expenses");
  }

  const netCashflow = totalReceipts - totalExpenses;

  if (queryErrors.length === 5) {
    throw new Error("Échec du chargement des indicateurs: toutes les requêtes ont échoué");
  }

  return {
    totalRevenue,
    totalCost,
    grossMarginPct,
    totalReceipts,
    totalReceivables,
    totalExpenses,
    netCashflow,
    confirmedSales,
    draftSales,
  };
}

// ---------------------------------------------------------------------------
// getRecentActivity
// ---------------------------------------------------------------------------

export async function getRecentActivity(limit = 8): Promise<ActivityItem[]> {
  const supabase = await createServerSupabase();
  const orgId = await getUserOrgId(supabase);
  const activities: ActivityItem[] = [];
  const queryErrors: string[] = [];

  // 1. Sales
  try {
    const result = await supabase
      .from("sales")
      .select("id, total_amount, status, sale_date, customers(name)")
      .eq("organization_id", orgId)
      .in("status", ["confirmed", "cancelled"])
      .order("sale_date", { ascending: false })
      .limit(5);
    if (result.error) {
      console.error("[getRecentActivity] Failed to fetch sales:", result.error.message);
      queryErrors.push("sales");
    } else {
      for (const s of result.data ?? []) {
        const custName = Array.isArray(s.customers) ? s.customers[0]?.name : (s.customers as { name: string } | null)?.name;
        activities.push({
          id: String(s.id),
          type: "sale",
          description: `Vente ${s.status === "confirmed" ? "confirmée" : "annulée"}${custName ? ` — ${custName}` : ""}`,
          amount: Number(s.total_amount),
          date: String(s.sale_date),
        });
      }
    }
  } catch (e) {
    console.error("[getRecentActivity] Unexpected error fetching sales:", e);
    queryErrors.push("sales");
  }

  // 2. Payments
  try {
    const result = await supabase
      .from("payments")
      .select("id, amount, payment_date, sales(organization_id)")
      .order("payment_date", { ascending: false })
      .limit(5);
    if (result.error) {
      console.error("[getRecentActivity] Failed to fetch payments:", result.error.message);
      queryErrors.push("payments");
    } else {
      for (const p of result.data ?? []) {
        const sale = Array.isArray(p.sales) ? p.sales[0] : p.sales;
        if ((sale as { organization_id: string } | null)?.organization_id !== orgId) continue;
        activities.push({
          id: String(p.id),
          type: "payment",
          description: "Paiement reçu",
          amount: Number(p.amount),
          date: String(p.payment_date),
        });
      }
    }
  } catch (e) {
    console.error("[getRecentActivity] Unexpected error fetching payments:", e);
    queryErrors.push("payments");
  }

  // 3. Expenses
  try {
    const result = await supabase
      .from("expenses")
      .select("id, description, amount, expense_date")
      .eq("organization_id", orgId)
      .order("expense_date", { ascending: false })
      .limit(5);
    if (result.error) {
      console.error("[getRecentActivity] Failed to fetch expenses:", result.error.message);
      queryErrors.push("expenses");
    } else {
      for (const e of result.data ?? []) {
        activities.push({
          id: String(e.id),
          type: "expense",
          description: String(e.description),
          amount: Number(e.amount),
          date: String(e.expense_date),
        });
      }
    }
  } catch (e) {
    console.error("[getRecentActivity] Unexpected error fetching expenses:", e);
    queryErrors.push("expenses");
  }

  if (queryErrors.length === 3) {
    throw new Error("Échec du chargement de l'activité récente: toutes les requêtes ont échoué");
  }

  activities.sort((a, b) => (a.date < b.date ? 1 : -1));
  return activities.slice(0, limit);
}

// ---------------------------------------------------------------------------
// getCriticalStock
// ---------------------------------------------------------------------------

export async function getCriticalStock(): Promise<CriticalStockItem[]> {
  const supabase = await createServerSupabase();
  const orgId = await getUserOrgId(supabase);

  let products: { id: string; name: string; unit: string; min_stock_threshold: number }[] | null = null;
  try {
    const result = await supabase
      .from("products")
      .select("id, name, unit, min_stock_threshold")
      .eq("organization_id", orgId)
      .eq("is_active", true);
    if (result.error) {
      console.error("[getCriticalStock] Failed to fetch products:", result.error.message);
      return [];
    }
    products = result.data;
  } catch (e) {
    console.error("[getCriticalStock] Unexpected error fetching products:", e);
    return [];
  }

  if (!products?.length) return [];

  const items: CriticalStockItem[] = [];

  for (const p of products) {
    let stock = 0;
    try {
      const result = await supabase.rpc("get_product_stock", {
        p_org_id: orgId,
        p_product_id: p.id,
      });
      if (result.error) {
        console.error(`[getCriticalStock] Failed to fetch stock for product ${p.id}:`, result.error.message);
      } else {
        stock = Number(result.data) ?? 0;
      }
    } catch (e) {
      console.error(`[getCriticalStock] Unexpected error fetching stock for product ${p.id}:`, e);
    }

    const threshold = Number(p.min_stock_threshold);
    const ratio = threshold > 0 ? stock / threshold : 999;

    if (ratio <= 1) {
      items.push({
        productId: String(p.id),
        productName: String(p.name),
        unit: String(p.unit),
        stock,
        minStockThreshold: threshold,
        status: ratio <= 0.5 ? "critical" : "warning",
      });
    }
  }

  items.sort((a, b) => a.stock / a.minStockThreshold - b.stock / b.minStockThreshold);
  return items;
}

// ---------------------------------------------------------------------------
// getTopDebtors
// ---------------------------------------------------------------------------

export async function getTopDebtors(limit = 5): Promise<TopDebtor[]> {
  const supabase = await createServerSupabase();
  const orgId = await getUserOrgId(supabase);

  let sales: { customer_id: string; total_amount: number; id: string; customers: unknown }[] | null = null;
  try {
    const result = await supabase
      .from("sales")
      .select("customer_id, total_amount, id, customers(name)")
      .eq("organization_id", orgId)
      .eq("status", "confirmed");
    if (result.error) {
      console.error("[getTopDebtors] Failed to fetch sales:", result.error.message);
      return [];
    }
    sales = result.data;
  } catch (e) {
    console.error("[getTopDebtors] Unexpected error fetching sales:", e);
    return [];
  }

  if (!sales?.length) return [];

  const saleIds = sales.map((s) => String(s.id));
  let payments: { sale_id: string; amount: number }[] | null = null;
  try {
    const result = await supabase
      .from("payments")
      .select("sale_id, amount")
      .in("sale_id", saleIds);
    if (result.error) {
      console.error("[getTopDebtors] Failed to fetch payments:", result.error.message);
    } else {
      payments = result.data;
    }
  } catch (e) {
    console.error("[getTopDebtors] Unexpected error fetching payments:", e);
  }

  const paidBySale = new Map<string, number>();
  for (const p of payments ?? []) {
    const sid = String(p.sale_id);
    paidBySale.set(sid, (paidBySale.get(sid) ?? 0) + Number(p.amount));
  }

  const customerMap = new Map<string, { name: string; total: number; paid: number }>();
  for (const s of sales) {
    const cid = String(s.customer_id);
    if (!cid || cid === "null") continue;
    const custArr = s.customers as { name: string }[] | null;
    const custName = Array.isArray(custArr) ? custArr[0]?.name : (custArr as { name: string } | null)?.name ?? "Client";
    const existing = customerMap.get(cid) ?? { name: custName, total: 0, paid: 0 };
    existing.total += Number(s.total_amount);
    existing.paid += paidBySale.get(String(s.id)) ?? 0;
    customerMap.set(cid, existing);
  }

  const debtors: TopDebtor[] = [];
  for (const [customerId, data] of customerMap) {
    const outstanding = data.total - data.paid;
    if (outstanding > 0) {
      debtors.push({ customerId, customerName: data.name, outstanding });
    }
  }

  debtors.sort((a, b) => b.outstanding - a.outstanding);
  return debtors.slice(0, limit);
}

// ---------------------------------------------------------------------------
// getSalesPerformance (monthly)
// ---------------------------------------------------------------------------

export async function getSalesPerformance(): Promise<MonthlyPerformance[]> {
  const supabase = await createServerSupabase();
  const orgId = await getUserOrgId(supabase);

  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const fromDate = twelveMonthsAgo.toISOString().slice(0, 10);

  const queryErrors: string[] = [];

  // 1. Sales
  let sales: { total_amount: number; sale_date: string }[] | null = null;
  try {
    const result = await supabase
      .from("sales")
      .select("total_amount, sale_date")
      .eq("organization_id", orgId)
      .eq("status", "confirmed")
      .gte("sale_date", fromDate);
    if (result.error) {
      console.error("[getSalesPerformance] Failed to fetch sales:", result.error.message);
      queryErrors.push("sales");
    } else {
      sales = result.data;
    }
  } catch (e) {
    console.error("[getSalesPerformance] Unexpected error fetching sales:", e);
    queryErrors.push("sales");
  }

  // 2. Payments
  let paymentsData: { amount: number; payment_date: string; sales: unknown }[] | null = null;
  try {
    const result = await supabase
      .from("payments")
      .select("amount, payment_date, sales(organization_id)")
      .gte("payment_date", fromDate)
      .limit(10000);
    if (result.error) {
      console.error("[getSalesPerformance] Failed to fetch payments:", result.error.message);
      queryErrors.push("payments");
    } else {
      paymentsData = result.data;
    }
  } catch (e) {
    console.error("[getSalesPerformance] Unexpected error fetching payments:", e);
    queryErrors.push("payments");
  }

  if (queryErrors.length === 2) {
    throw new Error("Échec du chargement de la performance: toutes les requêtes ont échoué");
  }

  const monthMap = new Map<string, { revenue: number; receipts: number }>();

  for (const s of sales ?? []) {
    const month = String(s.sale_date)?.slice(0, 7);
    if (!month) continue;
    const existing = monthMap.get(month) ?? { revenue: 0, receipts: 0 };
    existing.revenue += Number(s.total_amount);
    monthMap.set(month, existing);
  }

  for (const p of paymentsData ?? []) {
    const sale = Array.isArray(p.sales) ? p.sales[0] : p.sales;
    if ((sale as { organization_id: string } | null)?.organization_id !== orgId) continue;
    const month = String(p.payment_date)?.slice(0, 7);
    if (!month) continue;
    const existing = monthMap.get(month) ?? { revenue: 0, receipts: 0 };
    existing.receipts += Number(p.amount);
    monthMap.set(month, existing);
  }

  const result: MonthlyPerformance[] = [];
  for (const [month, data] of monthMap) {
    result.push({ month, ...data });
  }
  result.sort((a, b) => a.month.localeCompare(b.month));

  return result;
}
