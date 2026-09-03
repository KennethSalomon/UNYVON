"use client";

import { useState } from "react";
import { Plus, Truck, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp, type NewPurchaseInput } from "@/lib/context/app-context";
import { formatFCFA } from "@/lib/utils";

export default function PurchasesPage() {
  const { purchases, suppliers, products, addPurchase } = useApp();
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Achats</h1>
          <p className="text-sm text-muted mt-1">
            {purchases.length} réception{purchases.length > 1 ? "s" : ""} enregistrée{purchases.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Enregistrer un achat
        </Button>
      </div>

      <Card variant="elevated">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Date</th>
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Fournisseur</th>
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Articles</th>
                <th className="text-right text-xs font-medium text-muted px-6 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {purchases.map((purchase) => (
                <tr
                  key={purchase.id}
                  className="border-b border-border last:border-0 hover:bg-background/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-text">
                    {new Date(purchase.createdAt).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-info" />
                      </div>
                      <span className="text-sm font-medium text-ink">
                        {purchase.supplierName}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {purchase.items.map((item, i) => (
                        <Badge key={i} variant="default">
                          {item.productName} ×{item.quantity}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-ink">
                      {formatFCFA(purchase.total)}
                    </span>
                  </td>
                </tr>
              ))}
              {purchases.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted">
                    Aucun achat enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <PurchaseModal
          suppliers={suppliers}
          products={products}
          onClose={() => setShowModal(false)}
          onSave={addPurchase}
        />
      )}
    </div>
  );
}

function PurchaseModal({
  suppliers,
  products,
  onClose,
  onSave,
}: {
  suppliers: { id: string; name: string }[];
  products: { id: string; name: string; unit: string; costPrice: number }[];
  onClose: () => void;
  onSave: (input: NewPurchaseInput) => void;
}) {
  const [supplierId, setSupplierId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const cartItems = products
    .filter((p) => (quantities[p.id] ?? 0) > 0)
    .map((p) => ({
      productId: p.id,
      quantity: quantities[p.id],
      total: quantities[p.id] * p.costPrice,
    }));

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);
  const supplier = suppliers.find((s) => s.id === supplierId);
  const canSubmit = cartItems.length > 0 && total > 0 && !!supplier;

  const handleSubmit = () => {
    if (!canSubmit || !supplier) return;
    onSave({
      supplierId: supplier.id,
      supplierName: supplier.name,
      items: cartItems,
      total,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Enregistrer un achat"
    >
      <div className="bg-surface rounded-card border border-border shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div>
            <h2 className="font-display font-semibold text-lg text-ink">Nouvel achat</h2>
            <p className="text-sm text-muted mt-1">Réceptionner une livraison fournisseur</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 rounded-[10px] text-muted hover:text-text hover:bg-background transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="pur-supplier" className="text-sm font-medium text-text block mb-1.5">
              Fournisseur
            </label>
            <select
              id="pur-supplier"
              value={supplierId}
              onChange={(e) => setSupplierId(e.target.value)}
              className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Sélectionner un fournisseur</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-text block mb-1.5">Produits reçus</label>
            <div className="space-y-2">
              {products.map((p) => {
                const qty = quantities[p.id] ?? 0;
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 p-3 rounded-[10px] border border-border"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                      <p className="text-xs text-muted">
                        {formatFCFA(p.costPrice)} / {p.unit}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={qty === 0 ? "" : qty}
                      onChange={(e) =>
                        setQuantities((prev) => ({
                          ...prev,
                          [p.id]: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                      placeholder="0"
                      aria-label={`Quantité pour ${p.name}`}
                      className="w-16 h-9 px-2 rounded-[8px] border border-border text-sm text-center text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-[10px] bg-background">
            <span className="text-sm text-muted">Total</span>
            <span className="font-display font-semibold text-lg text-ink">
              {formatFCFA(total)}
            </span>
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}


