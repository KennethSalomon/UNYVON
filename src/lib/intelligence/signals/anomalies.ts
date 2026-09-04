// ============================================================================
// NOVA Signal 5 — Simple Anomalies
// Deterministic: detect unusual variations in sales, expenses, costs
// ============================================================================

import type { Signal } from "../types";

interface MonthlyData {
  month: string;
  revenue: number;
  cost?: number;
}

interface AnomalyInput {
  salesByMonth: MonthlyData[];
  expensesByMonth: MonthlyData[];
  purchaseCosts: { month: string; avgCost: number }[];
}

export function detectAnomalies(input: AnomalyInput): Signal[] {
  const { salesByMonth, expensesByMonth, purchaseCosts } = input;
  const signals: Signal[] = [];

  // --- Sales volume drop ---
  if (salesByMonth.length >= 3) {
    const sorted = [...salesByMonth].sort((a, b) => a.month.localeCompare(b.month));
    const recent = sorted[sorted.length - 1];
    const previousAvg = sorted.slice(0, -1).reduce((s, m) => s + m.revenue, 0) / (sorted.length - 1);

    if (previousAvg > 0 && recent.revenue < previousAvg * 0.5) {
      const drop = Math.round(((previousAvg - recent.revenue) / previousAvg) * 100);
      signals.push({
        id: `sig-sales-drop-${recent.month}`,
        type: "anomaly",
        severity: drop >= 70 ? "high" : "medium",
        category: "activity",
        title: `Chute de ventes : -${drop}% en ${recent.month}`,
        evidence: {
          month: recent.month,
          currentRevenue: recent.revenue,
          previousAvgRevenue: Math.round(previousAvg),
          dropPercent: drop,
        },
        calculatedAt: new Date().toISOString(),
      });
    }
  }

  // --- Expense spike ---
  if (expensesByMonth.length >= 3) {
    const sorted = [...expensesByMonth].sort((a, b) => a.month.localeCompare(b.month));
    const recent = sorted[sorted.length - 1];
    const previousAvg = sorted.slice(0, -1).reduce((s, m) => s + m.revenue, 0) / (sorted.length - 1);

    if (previousAvg > 0 && recent.revenue > previousAvg * 1.5) {
      const spike = Math.round(((recent.revenue - previousAvg) / previousAvg) * 100);
      signals.push({
        id: `sig-expense-spike-${recent.month}`,
        type: "anomaly",
        severity: spike >= 100 ? "high" : "medium",
        category: "activity",
        title: `Hausse des dépenses : +${spike}% en ${recent.month}`,
        evidence: {
          month: recent.month,
          currentExpenses: recent.revenue,
          previousAvgExpenses: Math.round(previousAvg),
          spikePercent: spike,
        },
        calculatedAt: new Date().toISOString(),
      });
    }
  }

  // --- Purchase cost increase ---
  if (purchaseCosts.length >= 2) {
    const sorted = [...purchaseCosts].sort((a, b) => a.month.localeCompare(b.month));
    const recent = sorted[sorted.length - 1];
    const previous = sorted[sorted.length - 2];

    if (previous.avgCost > 0 && recent.avgCost > previous.avgCost * 1.15) {
      const increase = Math.round(((recent.avgCost - previous.avgCost) / previous.avgCost) * 100);
      signals.push({
        id: `sig-cost-increase-${recent.month}`,
        type: "anomaly",
        severity: increase >= 30 ? "high" : "medium",
        category: "margin",
        title: `Hausse du coût d'achat : +${increase}% en ${recent.month}`,
        evidence: {
          month: recent.month,
          currentAvgCost: recent.avgCost,
          previousAvgCost: previous.avgCost,
          increasePercent: increase,
        },
        calculatedAt: new Date().toISOString(),
      });
    }
  }

  return signals;
}
