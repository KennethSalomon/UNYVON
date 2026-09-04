// ============================================================================
// NOVA Signal 1 — Rupture Risk
// Deterministic: stock / avg daily consumption = days until stockout
// ============================================================================

import type { Signal } from "../types";

interface StockRiskInput {
  productId: string;
  productName: string;
  unit: string;
  currentStock: number;
  minStockThreshold: number;
  totalSoldQuantity: number;
  dateRangeDays: number;
}

export function detectStockRisk(input: StockRiskInput): Signal | null {
  const { productId, productName, unit, currentStock, minStockThreshold, totalSoldQuantity, dateRangeDays } = input;

  if (currentStock <= 0) {
    return {
      id: `sig-stock-empty-${productId}`,
      type: "stock_risk",
      severity: "high",
      category: "stock",
      title: `Rupture de stock : ${productName}`,
      evidence: {
        productId,
        productName,
        unit,
        currentStock: 0,
        minStockThreshold,
        avgDailyConsumption: 0,
        daysUntilStockout: 0,
        status: "out_of_stock",
      },
      calculatedAt: new Date().toISOString(),
      productId,
    };
  }

  if (dateRangeDays <= 0 || totalSoldQuantity <= 0) {
    if (currentStock <= minStockThreshold) {
      return {
        id: `sig-stock-low-nodata-${productId}`,
        type: "stock_risk",
        severity: "medium",
        category: "stock",
        title: `Stock faible : ${productName}`,
        evidence: {
          productId,
          productName,
          unit,
          currentStock,
          minStockThreshold,
          avgDailyConsumption: null,
          daysUntilStockout: null,
          status: "insufficient_data",
        },
        calculatedAt: new Date().toISOString(),
        productId,
      };
    }
    return null;
  }

  const avgDailyConsumption = totalSoldQuantity / dateRangeDays;
  if (avgDailyConsumption <= 0) return null;

  const daysUntilStockout = Math.floor(currentStock / avgDailyConsumption);

  if (daysUntilStockout <= 7 || currentStock <= minStockThreshold) {
    const severity: Signal["severity"] =
      daysUntilStockout <= 2 || currentStock <= minStockThreshold * 0.3
        ? "high"
        : daysUntilStockout <= 5
        ? "medium"
        : "low";

    return {
      id: `sig-stock-risk-${productId}`,
      type: "stock_risk",
      severity,
      category: "stock",
      title: `Rupture probable : ${productName} dans ~${daysUntilStockout} jour${daysUntilStockout > 1 ? "s" : ""}`,
      evidence: {
        productId,
        productName,
        unit,
        currentStock,
        minStockThreshold,
        avgDailyConsumption: Math.round(avgDailyConsumption * 100) / 100,
        daysUntilStockout,
        dateRangeDays,
        totalSoldQuantity,
        status: "risk",
      },
      calculatedAt: new Date().toISOString(),
      productId,
    };
  }

  return null;
}
