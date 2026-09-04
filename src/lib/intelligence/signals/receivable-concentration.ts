// ============================================================================
// NOVA Signal 3 — Receivables Concentration
// Deterministic: top N clients / total outstanding
// ============================================================================

import type { Signal } from "../types";

interface Debtor {
  customerId: string;
  customerName: string;
  outstanding: number;
}

interface ReceivableConcentrationInput {
  debtors: Debtor[];
  totalOutstanding: number;
}

export function detectReceivableConcentration(input: ReceivableConcentrationInput): Signal | null {
  const { debtors, totalOutstanding } = input;

  if (totalOutstanding <= 0 || debtors.length === 0) return null;

  const sorted = [...debtors].sort((a, b) => b.outstanding - a.outstanding);
  const top2 = sorted.slice(0, 2);
  const top2Total = top2.reduce((sum, d) => sum + d.outstanding, 0);
  const concentration = (top2Total / totalOutstanding) * 100;

  if (concentration < 50) return null;

  const severity: Signal["severity"] =
    concentration >= 80 ? "high" : concentration >= 60 ? "medium" : "low";

  return {
    id: `sig-receivable-conc-${Date.now()}`,
    type: "receivable_concentration",
    severity,
    category: "receivable",
    title: `${top2.length} client${top2.length > 1 ? "s" : ""} concentre${top2.length > 1 ? "nt" : ""} ${Math.round(concentration)}% des créances`,
    evidence: {
      totalOutstanding,
      topDebtors: top2.map((d) => ({
        customerId: d.customerId,
        customerName: d.customerName,
        outstanding: d.outstanding,
        sharePercent: Math.round((d.outstanding / totalOutstanding) * 10000) / 100,
      })),
      concentrationPercent: Math.round(concentration * 100) / 100,
      debtorCount: debtors.length,
    },
    calculatedAt: new Date().toISOString(),
  };
}
