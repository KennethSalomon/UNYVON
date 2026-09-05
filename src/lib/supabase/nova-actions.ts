// ============================================================================
// NOVA Server Actions — fetches real data, runs signal engine, returns insights
// ============================================================================

"use server";

import { createServerSupabase } from "./server";
import type { NovaInsight, NovaResponse } from "../intelligence/types";
import { runAllSignals } from "../intelligence/engine";
import { generateNovaResponse } from "../intelligence/llm-provider";

// ---------------------------------------------------------------------------
// Helper: get user's org ID
// ---------------------------------------------------------------------------

async function getOrgId(): Promise<string> {
  const supabase = await createServerSupabase();
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
// getNovaInsights — main entry point
// ---------------------------------------------------------------------------

export async function getNovaInsights(): Promise<NovaInsight[]> {
  const supabase = await createServerSupabase();
  const orgId = await getOrgId();

  // 1. Fetch all needed data in parallel
  const [
    { data: products },
    { data: movements },
    { data: sales },
    { data: saleItems },
    { data: payments },
    { data: customers },
    { data: expenses },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("id, name, unit, min_stock_threshold, is_active")
      .eq("organization_id", orgId)
      .eq("is_active", true),

    supabase
      .from("inventory_movements")
      .select("product_id, movement_type, quantity, created_at")
      .eq("organization_id", orgId),

    supabase
      .from("sales")
      .select("id, customer_id, total_amount, status, sale_date")
      .eq("organization_id", orgId)
      .eq("status", "confirmed"),

    supabase
      .from("sale_items")
      .select("sale_id, product_id, quantity, unit_price, unit_cost_snapshot"),

    supase_from_payments(supabase, orgId),

    supase_from_customers(supabase, orgId),

    supase_from_expenses(supabase, orgId),
  ]);

  // 2. Compute stock per product
  const stockMap = new Map<string, number>();
  for (const m of movements ?? []) {
    const mt = m.movement_type;
    const current = stockMap.get(m.product_id) ?? 0;
    if (mt === "opening" || mt === "purchase_receipt" || mt === "adjustment_in") {
      stockMap.set(m.product_id, current + m.quantity);
    } else {
      stockMap.set(m.product_id, current - m.quantity);
    }
  }

  // 3. Compute sales per product (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const fromDate = thirtyDaysAgo.toISOString().slice(0, 10);

  const recentSales = (sales ?? []).filter((s) => s.sale_date >= fromDate);
  const recentSaleIds = new Set(recentSales.map((s) => s.id));

  const soldByProduct = new Map<string, number>();
  for (const item of saleItems ?? []) {
    if (recentSaleIds.has(item.sale_id)) {
      soldByProduct.set(
        item.product_id,
        (soldByProduct.get(item.product_id) ?? 0) + item.quantity
      );
    }
  }

  // 4. Compute monthly revenue for margin + anomaly detection
  const monthMap = new Map<string, { revenue: number; cost: number }>();
  for (const sale of sales ?? []) {
    const month = sale.sale_date?.slice(0, 7);
    if (!month) continue;
    const existing = monthMap.get(month) ?? { revenue: 0, cost: 0 };
    existing.revenue += Number(sale.total_amount);
    monthMap.set(month, existing);
  }

  for (const item of saleItems ?? []) {
    const sale = (sales ?? []).find((s) => s.id === item.sale_id);
    if (sale) {
      const month = sale.sale_date?.slice(0, 7);
      if (month) {
        const existing = monthMap.get(month);
        if (existing) {
          existing.cost += Number(item.quantity) * Number(item.unit_cost_snapshot);
        }
      }
    }
  }

  const salesByMonth = Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    revenue: data.revenue,
    cost: data.cost,
  }));

  // 5. Compute expense totals by month
  const expMonthMap = new Map<string, number>();
  for (const exp of expenses ?? []) {
    const month = exp.expense_date?.slice(0, 7);
    if (!month) continue;
    expMonthMap.set(month, (expMonthMap.get(month) ?? 0) + Number(exp.amount));
  }
  const expensesByMonth = Array.from(expMonthMap.entries()).map(([month, total]) => ({
    month,
    revenue: total,
  }));

  // 6. Compute receivables per customer
  const saleByCustomer = new Map<string, { total: number; paid: number }>();
  for (const sale of sales ?? []) {
    if (!sale.customer_id) continue;
    const existing = saleByCustomer.get(sale.customer_id) ?? { total: 0, paid: 0 };
    existing.total += Number(sale.total_amount);
    saleByCustomer.set(sale.customer_id, existing);
  }

  const payBySale = new Map<string, number>();
  for (const pay of payments ?? []) {
    payBySale.set(pay.sale_id, (payBySale.get(pay.sale_id) ?? 0) + Number(pay.amount));
  }

  for (const sale of sales ?? []) {
    if (!sale.customer_id) continue;
    const cust = saleByCustomer.get(sale.customer_id);
    if (cust) {
      cust.paid += payBySale.get(sale.id) ?? 0;
    }
  }

  const debtors = Array.from(saleByCustomer.entries())
    .map(([customerId, data]) => {
      const cust = (customers ?? []).find((c) => c.id === customerId);
      return {
        customerId,
        customerName: cust?.name ?? "Client",
        outstanding: data.total - data.paid,
      };
    })
    .filter((d) => d.outstanding > 0);

  const totalOutstanding = debtors.reduce((sum, d) => sum + d.outstanding, 0);

  // 7. Compute purchase costs by month for anomaly detection
  const { data: purchases } = await supabase
    .from("purchases")
    .select("id, total_amount, purchase_date, status")
    .eq("organization_id", orgId)
    .eq("status", "received");

  const purchaseCostByMonth = new Map<string, { total: number; count: number }>();
  for (const pur of purchases ?? []) {
    const month = pur.purchase_date?.slice(0, 7);
    if (!month) continue;
    const existing = purchaseCostByMonth.get(month) ?? { total: 0, count: 0 };
    existing.total += Number(pur.total_amount);
    existing.count += 1;
    purchaseCostByMonth.set(month, existing);
  }

  const purchaseCosts = Array.from(purchaseCostByMonth.entries()).map(([month, data]) => ({
    month,
    avgCost: data.count > 0 ? data.total / data.count : 0,
  }));

  // 8. Run signal engine
  const signals = runAllSignals({
    stockRiskInputs: (products ?? []).map((p) => ({
      productId: p.id,
      productName: p.name,
      unit: p.unit,
      currentStock: stockMap.get(p.id) ?? 0,
      minStockThreshold: Number(p.min_stock_threshold),
      totalSoldQuantity: soldByProduct.get(p.id) ?? 0,
      dateRangeDays: 30,
    })),
    marginDropInput: salesByMonth.length >= 2 ? {
      currentRevenue: salesByMonth[salesByMonth.length - 1]?.revenue ?? 0,
      currentCost: salesByMonth[salesByMonth.length - 1]?.cost ?? 0,
      previousRevenue: salesByMonth[salesByMonth.length - 2]?.revenue ?? 0,
      previousCost: salesByMonth[salesByMonth.length - 2]?.cost ?? 0,
      currentPeriodLabel: salesByMonth[salesByMonth.length - 1]?.month ?? "",
      previousPeriodLabel: salesByMonth[salesByMonth.length - 2]?.month ?? "",
    } : undefined,
    receivableInput: debtors.length > 0 ? {
      debtors,
      totalOutstanding,
    } : undefined,
    deadStockInput: {
      products: (products ?? []).map((p) => ({
        productId: p.id,
        productName: p.name,
        unit: p.unit,
        currentStock: stockMap.get(p.id) ?? 0,
        soldQuantity: soldByProduct.get(p.id) ?? 0,
        dateRangeDays: 30,
      })),
    },
    anomalyInput: {
      salesByMonth,
      expensesByMonth,
      purchaseCosts,
    },
  });

  // 9. Generate NOVA responses for each signal
  const insights: NovaInsight[] = [];

  for (const signal of signals) {
    let response: NovaResponse;

    try {
      response = await generateNovaResponse({
        orgId,
        signal,
        evidence: signal.evidence,
      });
    } catch (err) {
      console.error(`[NOVA] LLM failed for signal ${signal.id}:`, err);
      response = {
        signal,
        explanation: signal.title,
        recommendation: "Analyse déterministe — consultez les données pour agir.",
        actions: [],
      };
    }

    insights.push({
      id: signal.id,
      signal,
      response,
      createdAt: new Date().toISOString(),
    });
  }

  return insights;
}

// ---------------------------------------------------------------------------
// Data fetchers with org scoping
// ---------------------------------------------------------------------------

async function supase_from_payments(supabase: Awaited<ReturnType<typeof createServerSupabase>>, orgId: string) {
  const { data, error } = await supabase
    .from("payments")
    .select("id, sale_id, amount, payment_date, sales(organization_id)")
    .limit(10000);

  if (error) return { data: [], error };

  const filtered = (data ?? []).filter((p: Record<string, unknown>) => {
    const sale = p.sales as { organization_id: string } | null;
    return sale?.organization_id === orgId;
  });

  return { data: filtered, error: null };
}

async function supase_from_customers(supabase: Awaited<ReturnType<typeof createServerSupabase>>, orgId: string) {
  return supabase
    .from("customers")
    .select("id, name")
    .eq("organization_id", orgId);
}

async function supase_from_expenses(supabase: Awaited<ReturnType<typeof createServerSupabase>>, orgId: string) {
  return supabase
    .from("expenses")
    .select("id, amount, expense_date, category")
    .eq("organization_id", orgId);
}

// ---------------------------------------------------------------------------
// getNovaInsightCount — for dashboard badge
// ---------------------------------------------------------------------------

export async function getNovaInsightCount(): Promise<number> {
  const insights = await getNovaInsights();
  return insights.length;
}
