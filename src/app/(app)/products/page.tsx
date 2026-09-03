"use client";

import { useState } from "react";
import { Plus, Search, Package, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp, type NewProductInput } from "@/lib/context/app-context";
import { cn, formatFCFA } from "@/lib/utils";

export default function ProductsPage() {
  const { products, addProduct } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Produits</h1>
          <p className="text-sm text-muted mt-1">{products.length} produits en catalogue</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Ajouter un produit
        </Button>
      </div>

      <div className="flex items-center gap-2 h-9 px-3 rounded-[10px] border border-border bg-surface max-w-sm">
        <Search className="w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un produit"
          className="flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
        />
      </div>

      <Card variant="elevated">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Produit</th>
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Unité</th>
                <th className="text-right text-xs font-medium text-muted px-6 py-3">Coût</th>
                <th className="text-right text-xs font-medium text-muted px-6 py-3">Prix vente</th>
                <th className="text-right text-xs font-medium text-muted px-6 py-3">Marge</th>
                <th className="text-right text-xs font-medium text-muted px-6 py-3">Stock</th>
                <th className="text-center text-xs font-medium text-muted px-6 py-3">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const margin = ((product.salePrice - product.costPrice) / product.costPrice) * 100;
                const stockRatio = product.stockQuantity / product.minStockThreshold;
                const stockStatus =
                  stockRatio <= 0.5 ? "critical" : stockRatio <= 1 ? "warning" : "normal";

                return (
                  <tr
                    key={product.id}
                    className="border-b border-border last:border-0 hover:bg-background/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[10px] bg-lavender-soft flex items-center justify-center">
                          <Package className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-ink">{product.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{product.unit}</td>
                    <td className="px-6 py-4 text-right text-sm text-text">
                      {formatFCFA(product.costPrice)}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium text-ink">
                      {formatFCFA(product.salePrice)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-success">
                        {margin.toFixed(1)} %
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={cn(
                          "text-sm font-semibold",
                          stockStatus === "critical"
                            ? "text-error"
                            : stockStatus === "warning"
                            ? "text-warning"
                            : "text-ink"
                        )}
                      >
                        {product.stockQuantity} {product.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge
                        variant={
                          stockStatus === "critical"
                            ? "error"
                            : stockStatus === "warning"
                            ? "warning"
                            : "success"
                        }
                      >
                        {stockStatus === "critical"
                          ? "Critique"
                          : stockStatus === "warning"
                          ? "Bas"
                          : "OK"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted">
                    Aucun produit trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <ProductModal onClose={() => setShowModal(false)} onSave={addProduct} />
      )}
    </div>
  );
}

function ProductModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: NewProductInput) => void;
}) {
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("sac");
  const [costPrice, setCostPrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [stockQuantity, setStockQuantity] = useState(0);
  const [minStockThreshold, setMinStockThreshold] = useState(0);

  const canSubmit =
    name.trim().length > 0 && salePrice > 0 && stockQuantity > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({
      name: name.trim(),
      unit,
      costPrice,
      salePrice,
      stockQuantity,
      minStockThreshold,
      categoryId: "cat-autre",
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Ajouter un produit"
    >
      <div className="bg-surface rounded-card border border-border shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div>
            <h2 className="font-display font-semibold text-lg text-ink">Ajouter un produit</h2>
            <p className="text-sm text-muted mt-1">Référencer un article au catalogue</p>
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
            <label htmlFor="prod-name" className="text-sm font-medium text-text block mb-1.5">
              Nom
            </label>
            <input
              id="prod-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Riz 10kg"
              className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-unit" className="text-sm font-medium text-text block mb-1.5">
                Unité
              </label>
              <input
                id="prod-unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="prod-cost" className="text-sm font-medium text-text block mb-1.5">
                Coût d&apos;achat (FCFA)
              </label>
              <input
                id="prod-cost"
                type="number"
                min="0"
                value={costPrice === 0 ? "" : costPrice}
                onChange={(e) => setCostPrice(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="prod-sale" className="text-sm font-medium text-text block mb-1.5">
                Prix de vente (FCFA)
              </label>
              <input
                id="prod-sale"
                type="number"
                min="0"
                value={salePrice === 0 ? "" : salePrice}
                onChange={(e) => setSalePrice(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="prod-threshold" className="text-sm font-medium text-text block mb-1.5">
                Seuil d&apos;alerte
              </label>
              <input
                id="prod-threshold"
                type="number"
                min="0"
                value={minStockThreshold === 0 ? "" : minStockThreshold}
                onChange={(e) => setMinStockThreshold(Math.max(0, Number(e.target.value) || 0))}
                placeholder="0"
                className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label htmlFor="prod-stock" className="text-sm font-medium text-text block mb-1.5">
              Stock initial
            </label>
            <input
              id="prod-stock"
              type="number"
              min="0"
              value={stockQuantity === 0 ? "" : stockQuantity}
              onChange={(e) => setStockQuantity(Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Ajouter
          </Button>
        </div>
      </div>
    </div>
  );
}


