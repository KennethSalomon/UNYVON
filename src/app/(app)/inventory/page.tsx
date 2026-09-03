"use client";

import { AlertTriangle, Package, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";

export default function InventoryPage() {
  const { products } = useApp();

  const criticalProducts = products.filter(
    (p) => p.stockQuantity <= p.minStockThreshold * 0.5
  );
  const warningProducts = products.filter(
    (p) =>
      p.stockQuantity > p.minStockThreshold * 0.5 &&
      p.stockQuantity <= p.minStockThreshold
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Stock</h1>
        <p className="text-sm text-muted mt-1">
          Suivi des mouvements et niveaux de stock
        </p>
      </div>

      {/* Alert summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-muted">Rupture imminente</p>
              <p className="font-display font-bold text-lg text-error">
                {criticalProducts.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-warning/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted">Stock bas</p>
              <p className="font-display font-bold text-lg text-warning">
                {warningProducts.length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-success/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted">Stock OK</p>
              <p className="font-display font-bold text-lg text-success">
                {products.length - criticalProducts.length - warningProducts.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock detail */}
      <Card variant="elevated">
        <CardContent>
          <h2 className="font-display font-semibold text-ink mb-4">
            État du stock
          </h2>
          <div className="space-y-4">
            {products.map((product) => {
              const ratio = product.stockQuantity / product.minStockThreshold;
              const status =
                ratio <= 0.5 ? "critical" : ratio <= 1 ? "warning" : "normal";

              return (
                <div
                  key={product.id}
                  className="p-4 rounded-[12px] border border-border hover:shadow-sm transition-shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-[10px] bg-lavender-soft flex items-center justify-center">
                        <Package className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-ink">{product.name}</p>
                        <p className="text-xs text-muted">
                          Seuil minimal : {product.minStockThreshold} {product.unit}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={cn(
                          "text-lg font-display font-bold",
                          status === "critical"
                            ? "text-error"
                            : status === "warning"
                            ? "text-warning"
                            : "text-ink"
                        )}
                      >
                        {product.stockQuantity}
                      </span>
                      <span className="text-xs text-muted ml-1">{product.unit}</span>
                    </div>
                  </div>
                  <div className="w-full h-2 bg-background rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-700",
                        status === "critical"
                          ? "bg-error"
                          : status === "warning"
                          ? "bg-warning"
                          : "bg-success"
                      )}
                      style={{ width: `${Math.min(ratio * 50, 100)}%` }}
                    />
                  </div>
                  {status !== "normal" && (
                    <div className="mt-2 flex items-center gap-1.5">
                      {status === "critical" ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-error" />
                      ) : (
                        <TrendingDown className="w-3.5 h-3.5 text-warning" />
                      )}
                      <span
                        className={cn(
                          "text-xs font-medium",
                          status === "critical" ? "text-error" : "text-warning"
                        )}
                      >
                        {status === "critical"
                          ? "Rupture imminente — réapprovisionner urgemment"
                          : "Stock bas — planifier réapprovisionnement"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Inventory formula */}
      <Card>
        <CardContent>
          <h3 className="font-display font-semibold text-sm text-ink mb-2">
            Formule de stock
          </h3>
          <div className="p-3 rounded-[10px] bg-background font-mono text-xs text-muted">
            STOCK THÉORIQUE = Stock initial + Réceptions - Ventes ± Ajustements
            <br />
            ÉCART = Stock réel (inventaire) - Stock théorique
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

