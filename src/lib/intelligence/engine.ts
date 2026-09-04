// ============================================================================
// NOVA Signal Engine — runs all detectors, prioritizes, returns signals
// ============================================================================

import type { Signal, SignalSeverity } from "./types";
import { detectStockRisk } from "./signals/stock-risk";
import { detectMarginDrop } from "./signals/margin-drop";
import { detectReceivableConcentration } from "./signals/receivable-concentration";
import { detectDeadStock } from "./signals/dead-stock";
import { detectAnomalies } from "./signals/anomalies";

const SEVERITY_ORDER: Record<SignalSeverity, number> = {
  high: 0,
  medium: 1,
  low: 2,
};

export function prioritizeSignals(signals: Signal[]): Signal[] {
  return [...signals].sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );
}

export {
  detectStockRisk,
  detectMarginDrop,
  detectReceivableConcentration,
  detectDeadStock,
  detectAnomalies,
};

export function runAllSignals(data: {
  stockRiskInputs?: Parameters<typeof detectStockRisk>[0][];
  marginDropInput?: Parameters<typeof detectMarginDrop>[0];
  receivableInput?: Parameters<typeof detectReceivableConcentration>[0];
  deadStockInput?: Parameters<typeof detectDeadStock>[0];
  anomalyInput?: Parameters<typeof detectAnomalies>[0];
}): Signal[] {
  const all: Signal[] = [];

  if (data.stockRiskInputs) {
    for (const input of data.stockRiskInputs) {
      const sig = detectStockRisk(input);
      if (sig) all.push(sig);
    }
  }

  if (data.marginDropInput) {
    const sig = detectMarginDrop(data.marginDropInput);
    if (sig) all.push(sig);
  }

  if (data.receivableInput) {
    const sig = detectReceivableConcentration(data.receivableInput);
    if (sig) all.push(sig);
  }

  if (data.deadStockInput) {
    const sigs = detectDeadStock(data.deadStockInput);
    all.push(...sigs);
  }

  if (data.anomalyInput) {
    const sigs = detectAnomalies(data.anomalyInput);
    all.push(...sigs);
  }

  return prioritizeSignals(all);
}
