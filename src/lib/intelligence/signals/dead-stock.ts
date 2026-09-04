// ============================================================================
// NOVA Signal 4 — Dead Stock / Low Rotation
// Deterministic: products with stock but no sales in period
// ============================================================================

import type { Signal } from "../types";

interface ProductSales {
  productId: string;
  productName: string;
  unit: string;
  currentStock: number;
  soldQuantity: number;
  dateRangeDays: number;
}

interface DeadStockInput {
  products: ProductSales[];
}

export function detectDeadStock(input: DeadStockInput): Signal[] {
  const { products } = input;
  const signals: Signal[] = [];

  for (const p of products) {
    if (p.currentStock <= 0) continue;
    if (p.dateRangeDays <= 0) continue;

    const rotation = p.soldQuantity / p.currentStock;
    const daysOfStock = p.soldQuantity > 0
      ? Math.floor(p.currentStock / (p.soldQuantity / p.dateRangeDays))
      : null;

    // Dead stock: no sales in the period
    if (p.soldQuantity === 0 && p.currentStock > 0) {
      signals.push({
        id: `sig-dead-stock-${p.productId}`,
        type: "dead_stock",
        severity: p.currentStock > 50 ? "medium" : "low",
        category: "stock",
        title: `Stock immobilisé : ${p.productName}`,
        evidence: {
          productId: p.productId,
          productName: p.productName,
          unit: p.unit,
          currentStock: p.currentStock,
          soldQuantity: 0,
          dateRangeDays: p.dateRangeDays,
          rotation: 0,
          status: "no_sales",
        },
        calculatedAt: new Date().toISOString(),
        productId: p.productId,
      });
      continue;
    }

    // Low rotation: very slow moving stock
    if (daysOfStock !== null && daysOfStock > 90 && rotation < 0.1) {
      signals.push({
        id: `sig-low-rotation-${p.productId}`,
        type: "dead_stock",
        severity: "low",
        category: "stock",
        title: `Rotation lente : ${p.productName} (~${daysOfStock} jours de stock)`,
        evidence: {
          productId: p.productId,
          productName: p.productName,
          unit: p.unit,
          currentStock: p.currentStock,
          soldQuantity: p.soldQuantity,
          dateRangeDays: p.dateRangeDays,
          rotation: Math.round(rotation * 1000) / 1000,
          estimatedDaysOfStock: daysOfStock,
          status: "slow_moving",
        },
        calculatedAt: new Date().toISOString(),
        productId: p.productId,
      });
    }
  }

  return signals;
}
