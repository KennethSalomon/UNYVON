// ============================================================================
// NOVA Intelligence — Public API
// ============================================================================

export type {
  Signal,
  SignalType,
  SignalSeverity,
  SignalCategory,
  NovaResponse,
  NovaInsight,
  NovaContext,
  NovaProviderType,
  NovaProviderConfig,
} from "./types";

export { runAllSignals, prioritizeSignals } from "./engine";
export { generateNovaResponse, configureNovaProvider, getNovaProvider } from "./llm-provider";
export { detectStockRisk } from "./signals/stock-risk";
export { detectMarginDrop } from "./signals/margin-drop";
export { detectReceivableConcentration } from "./signals/receivable-concentration";
export { detectDeadStock } from "./signals/dead-stock";
export { detectAnomalies } from "./signals/anomalies";
