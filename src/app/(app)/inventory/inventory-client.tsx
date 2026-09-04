"use client";

import { useState, useTransition } from "react";
import {
  AlertTriangle,
  Package,
  TrendingDown,
  TrendingUp,
  ClipboardCheck,
  ArrowUpCircle,
  ArrowDownCircle,
  Search,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { ProductStock, InventoryMovement, InventoryCount, AdjustmentReason } from "@/types";
import { createInventory } from "@/lib/supabase/inventory-actions";
import { useOrg } from "@/lib/context/org-context";

interface Props {
  stocks: ProductStock[];
  movements: InventoryMovement[];
  history: InventoryCount[];
  error: string | null;
}

const MOVEMENT_LABELS: Record<string, string> = {
  opening: "Stock initial",
  purchase_receipt: "Réception achat",
  sale: "Vente",
  adjustment_in: "Ajustement +",
  adjustment_out: "Ajustement -",
};

const REASON_LABELS: Record<AdjustmentReason, string> = {
  loss: "Perte",
  damage: "Casse / Avarie",
  counting_error: "Erreur de comptage",
  data_entry_error: "Erreur de saisie",
  other: "Autre",
};

export function InventoryClient({ stocks, movements, history, error }: Props) {
  const { permissions } = useOrg();
  const [search, setSearch] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const filtered = stocks.filter((s) =>
    s.productName.toLowerCase().includes(search.toLowerCase())
  );

  const outOfStock = stocks.filter((s) => s.status === "critical").length;
  const lowStock = stocks.filter((s) => s.status === "warning").length;
  const normalStock = stocks.filter((s) => s.status === "normal").length;

  const productMovements = selectedProduct
    ? movements.filter((m) => m.productId === selectedProduct)
    : movements;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Stock</h1>
        <p className="text-sm text-muted mt-1">
          Suivi des mouvements et niveaux de stock
        </p>
      </div>

      {error && (
        <Card className="border-error/30 bg-error/5">
          <CardContent className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-error" />
            <p className="text-sm text-error">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Alert summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-error/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-error" />
            </div>
            <div>
              <p className="text-xs text-muted">Rupture imminente</p>
              <p className="font-display font-bold text-lg text-error">{outOfStock}</p>
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
              <p className="font-display font-bold text-lg text-warning">{lowStock}</p>
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
              <p className="font-display font-bold text-lg text-success">{normalStock}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-[10px] border border-border bg-background text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Stock detail */}
      <Card variant="elevated">
        <CardContent>
          <h2 className="font-display font-semibold text-ink mb-4">
            État du stock ({filtered.length} produits)
          </h2>
          {filtered.length === 0 ? (
            <p className="text-sm text-muted py-8 text-center">
              {stocks.length === 0
                ? "Aucun produit en stock. Enregistrez un stock initial pour commencer."
                : "Aucun produit ne correspond à votre recherche."}
            </p>
          ) : (
            <div className="space-y-4">
              {filtered.map((product) => {
                const ratio = product.minStockThreshold > 0
                  ? product.stock / product.minStockThreshold
                  : 999;
                const status = product.status;

                return (
                  <div
                    key={product.productId}
                    className={cn(
                      "p-4 rounded-[12px] border hover:shadow-sm transition-shadow cursor-pointer",
                      selectedProduct === product.productId
                        ? "border-primary bg-primary/5"
                        : "border-border"
                    )}
                    onClick={() =>
                      setSelectedProduct(
                        selectedProduct === product.productId ? null : product.productId
                      )
                    }
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[10px] bg-lavender-soft flex items-center justify-center">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink">{product.productName}</p>
                          <p className="text-xs text-muted">
                            Seuil : {product.minStockThreshold} {product.unit}
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
                          {product.stock}
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
          )}
        </CardContent>
      </Card>

      {/* Movements */}
      <Card variant="elevated">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-ink">
              Mouvements récents
              {selectedProduct && (
                <span className="text-sm font-normal text-muted ml-2">
                  (produit sélectionné)
                </span>
              )}
            </h2>
            {selectedProduct && (
              <button
                onClick={() => setSelectedProduct(null)}
                className="text-xs text-primary hover:underline"
              >
                Voir tous
              </button>
            )}
          </div>
          {productMovements.length === 0 ? (
            <p className="text-sm text-muted py-6 text-center">
              Aucun mouvement de stock enregistré.
            </p>
          ) : (
            <div className="space-y-2">
              {productMovements.slice(0, 20).map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between py-2 px-3 rounded-[8px] bg-background"
                >
                  <div className="flex items-center gap-3">
                    {m.movementType === "opening" || m.movementType === "purchase_receipt" || m.movementType === "adjustment_in" ? (
                      <ArrowUpCircle className="w-4 h-4 text-success" />
                    ) : (
                      <ArrowDownCircle className="w-4 h-4 text-error" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {MOVEMENT_LABELS[m.movementType] ?? m.movementType}
                      </p>
                      <p className="text-xs text-muted">
                        {m.productName} — {new Date(m.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-display font-bold",
                      m.movementType === "opening" || m.movementType === "purchase_receipt" || m.movementType === "adjustment_in"
                        ? "text-success"
                        : "text-error"
                    )}
                  >
                    {m.movementType === "opening" || m.movementType === "purchase_receipt" || m.movementType === "adjustment_in"
                      ? "+"
                      : "-"}
                    {m.quantity}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card variant="elevated">
          <CardContent>
            <h2 className="font-display font-semibold text-ink mb-4">
              Historique des inventaires
            </h2>
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between py-2 px-3 rounded-[8px] bg-background"
                >
                  <div className="flex items-center gap-3">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm font-medium text-ink">{h.productName}</p>
                      <p className="text-xs text-muted">
                        Théorique : {h.theoreticalQty} → Physique : {h.physicalQty}
                        {h.reason && ` — ${REASON_LABELS[h.reason] ?? h.reason}`}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "text-sm font-display font-bold",
                      h.gap === 0
                        ? "text-success"
                        : h.gap > 0
                        ? "text-success"
                        : "text-error"
                    )}
                  >
                    {h.gap > 0 ? "+" : ""}{h.gap}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Inventory form */}
      {selectedProduct && permissions?.canManageInventory && (
        <InventoryForm
          productId={selectedProduct}
          productName={stocks.find((s) => s.productId === selectedProduct)?.productName ?? ""}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Formula */}
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

// ---------------------------------------------------------------------------
// Inventory Form (inline)
// ---------------------------------------------------------------------------

function InventoryForm({
  productId,
  productName,
  onClose,
}: {
  productId: string;
  productName: string;
  onClose: () => void;
}) {
  const [physicalQty, setPhysicalQty] = useState("");
  const [reason, setReason] = useState<AdjustmentReason>("counting_error");
  const [notes, setNotes] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const qty = parseInt(physicalQty, 10);
    if (isNaN(qty) || qty < 0) {
      setMessage("Quantité invalide.");
      return;
    }

    startTransition(async () => {
      try {
        await createInventory({
          productId,
          physicalQty: qty,
          reason,
          notes,
        });
        setMessage("Inventaire enregistré. Ajustement appliqué si écart.");
        setPhysicalQty("");
        setNotes("");
      } catch (err) {
        setMessage(err instanceof Error ? err.message : "Erreur inconnue");
      }
    });
  }

  return (
    <Card variant="elevated" className="border-primary/30">
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-ink">
            Inventaire physique — {productName}
          </h3>
          <button onClick={onClose} className="text-xs text-muted hover:text-ink">
            Fermer
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-ink">Quantité physique comptée</label>
            <input
              type="number"
              min={0}
              value={physicalQty}
              onChange={(e) => setPhysicalQty(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-[8px] border border-border bg-background text-sm"
              placeholder="Ex: 320"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Raison de l&apos;écart</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as AdjustmentReason)}
              className="w-full mt-1 px-3 py-2 rounded-[8px] border border-border bg-background text-sm"
            >
              <option value="counting_error">Erreur de comptage</option>
              <option value="data_entry_error">Erreur de saisie</option>
              <option value="loss">Perte</option>
              <option value="damage">Casse / Avarie</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-ink">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-[8px] border border-border bg-background text-sm"
              rows={2}
              placeholder="Détails..."
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="px-4 py-2 rounded-[8px] bg-primary text-white text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...
              </span>
            ) : (
              "Enregistrer l inventaire"
            )}
          </button>
          {message && (
            <p className={cn(
              "text-sm",
              message.includes("Erreur") || message.includes("invalide")
                ? "text-error"
                : "text-success"
            )}>
              {message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
