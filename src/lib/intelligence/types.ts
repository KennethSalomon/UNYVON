// ============================================================================
// NOVA Intelligence — Types
// ============================================================================

export type SignalType =
  | "stock_risk"
  | "margin_drop"
  | "receivable_concentration"
  | "dead_stock"
  | "anomaly";

export type SignalSeverity = "high" | "medium" | "low";

export type SignalCategory = "stock" | "margin" | "receivable" | "activity" | "opportunity";

export interface Signal {
  id: string;
  type: SignalType;
  severity: SignalSeverity;
  category: SignalCategory;
  title: string;
  evidence: Record<string, unknown>;
  calculatedAt: string;
  productId?: string;
  customerId?: string;
}

export interface NovaResponse {
  signal: Signal;
  explanation: string;
  recommendation: string;
  actions: string[];
}

export interface NovaInsight {
  id: string;
  signal: Signal;
  response: NovaResponse;
  createdAt: string;
}

export interface NovaContext {
  orgId: string;
  signal: Signal;
  evidence: Record<string, unknown>;
}

export type NovaProviderType = "fallback" | "openai" | "anthropic" | "gemini";

export interface NovaProviderConfig {
  type: NovaProviderType;
  apiKey?: string;
  model?: string;
}
