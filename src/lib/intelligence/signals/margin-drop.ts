// ============================================================================
// NOVA Signal 2 — Margin Drop
// Deterministic: compare current period margin to reference period margin
// ============================================================================

import type { Signal } from "../types";

interface MarginDropInput {
  currentRevenue: number;
  currentCost: number;
  previousRevenue: number;
  previousCost: number;
  currentPeriodLabel: string;
  previousPeriodLabel: string;
}

export function detectMarginDrop(input: MarginDropInput): Signal | null {
  const { currentRevenue, currentCost, previousRevenue, previousCost, currentPeriodLabel, previousPeriodLabel } = input;

  if (currentRevenue <= 0 || previousRevenue <= 0) return null;

  const currentMargin = ((currentRevenue - currentCost) / currentRevenue) * 100;
  const previousMargin = ((previousRevenue - previousCost) / previousRevenue) * 100;
  const drop = previousMargin - currentMargin;

  if (drop < 2) return null;

  const severity: Signal["severity"] =
    drop >= 10 ? "high" : drop >= 5 ? "medium" : "low";

  return {
    id: `sig-margin-drop-${Date.now()}`,
    type: "margin_drop",
    severity,
    category: "margin",
    title: `Baisse de marge : ${drop.toFixed(1)} points`,
    evidence: {
      currentMargin: Math.round(currentMargin * 100) / 100,
      previousMargin: Math.round(previousMargin * 100) / 100,
      drop: Math.round(drop * 100) / 100,
      currentRevenue,
      currentCost,
      previousRevenue,
      previousCost,
      currentPeriodLabel,
      previousPeriodLabel,
    },
    calculatedAt: new Date().toISOString(),
  };
}
