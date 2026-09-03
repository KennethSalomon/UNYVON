"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  ShoppingCart,
  CreditCard,
  Banknote,
  X,
  ChevronDown,
  Check,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp, type NewSaleInput } from "@/lib/context/app-context";
import type { PaymentMethod } from "@/types";
import { cn, formatFCFA } from "@/lib/utils";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Espèces" },
  { value: "momo", label: "MTN MoMo" },
  { value: "moov", label: "Moov Money" },
  { value: "bank_transfer", label: "Virement bancaire" },
  { value: "other", label: "Autre" },
];

export default function SalesPage() {
  const { sales, customers, products, addSale, recordPayment } = useApp();

  const [showNewSale, setShowNewSale] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [payFor, setPayFor] = useState<string | null>(null);

  const totalCash = sales
    .filter((s) => s.paymentType === "cash")
    .reduce((sum, s) => sum + s.total, 0);
  const totalCredit = sales
    .filter((s) => s.paymentType === "credit")
    .reduce((sum, s) => sum + (s.total - s.amountPaid), 0);

  const filteredSales = sales.filter(
    (s) =>
      s.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Ventes</h1>
          <p className="text-sm text-muted mt-1">
            {sales.length} vente{sales.length > 1 ? "s" : ""} enregistrée{sales.length > 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setShowNewSale(true)}>
          <Plus className="w-4 h-4" />
          Nouvelle vente
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted">Total ventes</p>
              <p className="font-display font-bold text-lg text-ink">
                {formatFCFA(sales.reduce((sum, s) => sum + s.total, 0))}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-success/10 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-muted">Comptant</p>
              <p className="font-display font-bold text-lg text-success">
                {formatFCFA(totalCash)}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-warning/10 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-xs text-muted">Crédit à encaisser</p>
              <p className="font-display font-bold text-lg text-warning">
                {formatFCFA(totalCredit)}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 h-9 px-3 rounded-[10px] border border-border bg-surface flex-1 max-w-sm">
          <Search className="w-4 h-4 text-muted" />
          <input
            type="text"
            placeholder="Rechercher par client..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            aria-label="Rechercher une vente"
            className="flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
          />
        </div>
      </div>

      <Card variant="elevated">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Date</th>
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Client</th>
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Articles</th>
                <th className="text-right text-xs font-medium text-muted px-6 py-3">Total</th>
                <th className="text-right text-xs font-medium text-muted px-6 py-3">Payé</th>
                <th className="text-center text-xs font-medium text-muted px-6 py-3">Mode</th>
                <th className="text-right text-xs font-medium text-muted px-6 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => {
                const due = sale.total - sale.amountPaid;
                const isCreditDue = sale.paymentType === "credit" && due > 0;
                return (
                  <tr
                    key={sale.id}
                    className="border-b border-border last:border-0 hover:bg-background/50 transition-colors"
                  >
                    <td className="px-6 py-4 text-sm text-text">
                      {new Date(sale.createdAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "short",
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-ink">{sale.customerName}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {sale.items.map((item, i) => (
                          <Badge key={i} variant="default">
                            {item.productName} ×{item.quantity}
                          </Badge>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-sm font-semibold text-ink">
                        {formatFCFA(sale.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span
                        className={cn(
                          "text-sm",
                          sale.amountPaid >= sale.total ? "text-success" : "text-muted"
                        )}
                      >
                        {formatFCFA(sale.amountPaid)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Badge variant={sale.paymentType === "cash" ? "success" : "warning"}>
                        {sale.paymentType === "cash" ? "Comptant" : "Crédit"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {isCreditDue ? (
                        <Button size="sm" variant="outline" onClick={() => setPayFor(sale.id)}>
                          Encaisser {formatFCFA(due)}
                        </Button>
                      ) : (
                        <span className="text-xs text-success">Soldée</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-sm text-muted">
                    Aucune vente trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showNewSale && (
        <NewSaleModal
          customers={customers}
          products={products}
          onClose={() => setShowNewSale(false)}
          onSave={addSale}
        />
      )}

      {payFor && (
        <PaymentModal
          sale={sales.find((s) => s.id === payFor)}
          onClose={() => setPayFor(null)}
          onPay={(saleId, amount, method, ref) =>
            recordPayment({ saleId, amount, method, reference: ref })
          }
        />
      )}
    </div>
  );
}

function NewSaleModal({
  customers,
  products,
  onClose,
  onSave,
}: {
  customers: { id: string; name: string }[];
  products: { id: string; name: string; unit: string; salePrice: number; stockQuantity: number }[];
  onClose: () => void;
  onSave: (input: NewSaleInput) => void;
}) {
  const [customerId, setCustomerId] = useState("");
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [paymentType, setPaymentType] = useState<"cash" | "credit">("cash");
  const [amountPaid, setAmountPaid] = useState<number>(0);

  const cartItems = products
    .filter((p) => (quantities[p.id] ?? 0) > 0)
    .map((p) => ({
      productId: p.id,
      quantity: quantities[p.id],
      total: quantities[p.id] * p.salePrice,
    }));

  const total = cartItems.reduce((sum, item) => sum + item.total, 0);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const customerName = selectedCustomer?.name ?? "Client comptoir";

  const canSubmit =
    cartItems.length > 0 && total > 0 && (paymentType === "cash" ? total > 0 : true);

  const handleSubmit = () => {
    if (!canSubmit) return;
    const paid =
      paymentType === "cash"
        ? total
        : Math.min(Math.max(amountPaid, 0), total);
    onSave({
      customerId: customerId || null,
      customerName,
      items: cartItems,
      total,
      paymentType,
      amountPaid: paid,
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Nouvelle vente"
    >
      <div className="bg-surface rounded-card border border-border shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div>
            <h2 className="font-display font-semibold text-lg text-ink">Nouvelle vente</h2>
            <p className="text-sm text-muted mt-1">Enregistrer une vente B2B</p>
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
            <label htmlFor="sale-customer" className="text-sm font-medium text-text block mb-1.5">
              Client
            </label>
            <select
              id="sale-customer"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
              className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="">Client comptoir</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium text-text block mb-1.5">Produits</label>
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
                        {formatFCFA(p.salePrice)} / {p.unit} · Stock : {p.stockQuantity}
                      </p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={qty === 0 ? "" : qty}
                      onChange={(e) => {
                        const v = Math.max(0, Number(e.target.value) || 0);
                        if (v > p.stockQuantity) return;
                        setQuantities((prev) => ({ ...prev, [p.id]: v }));
                      }}
                      placeholder="0"
                      aria-label={`Quantité pour ${p.name}`}
                      className="w-16 h-9 px-2 rounded-[8px] border border-border text-sm text-center text-ink focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-text block mb-1.5">Mode de paiement</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPaymentType("cash")}
                aria-pressed={paymentType === "cash"}
                className={cn(
                  "flex-1 h-11 rounded-[10px] border text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                  paymentType === "cash"
                    ? "border-primary bg-lavender-soft text-primary"
                    : "border-border bg-surface text-muted hover:border-primary/40"
                )}
              >
                <Banknote className="w-4 h-4" />
                Comptant
              </button>
              <button
                type="button"
                onClick={() => setPaymentType("credit")}
                aria-pressed={paymentType === "credit"}
                className={cn(
                  "flex-1 h-11 rounded-[10px] border text-sm font-medium flex items-center justify-center gap-2 transition-colors",
                  paymentType === "credit"
                    ? "border-primary bg-lavender-soft text-primary"
                    : "border-border bg-surface text-muted hover:border-primary/40"
                )}
              >
                <CreditCard className="w-4 h-4" />
                Crédit
              </button>
            </div>
          </div>

          {paymentType === "credit" && (
            <div>
              <label htmlFor="sale-paid" className="text-sm font-medium text-text block mb-1.5">
                Avance reçue (FCFA)
              </label>
              <input
                id="sale-paid"
                type="number"
                min="0"
                max={total}
                value={amountPaid === 0 ? "" : amountPaid}
                onChange={(e) =>
                  setAmountPaid(Math.max(0, Number(e.target.value) || 0))
                }
                placeholder="0"
                className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          )}

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
            Enregistrer la vente
          </Button>
        </div>
      </div>
    </div>
  );
}

function PaymentModal({
  sale,
  onClose,
  onPay,
}: {
  sale: { id: string; customerName: string; total: number; amountPaid: number } | undefined;
  onClose: () => void;
  onPay: (saleId: string, amount: number, method: PaymentMethod, ref?: string) => void;
}) {
  const [amount, setAmount] = useState(0);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [reference, setReference] = useState("");

  if (!sale) return null;
  const due = sale.total - sale.amountPaid;
  const selected = Math.min(amount > 0 ? amount : due, due);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Encaisser une créance"
    >
      <div className="bg-surface rounded-card border border-border shadow-lg w-full max-w-md">
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div>
            <h2 className="font-display font-semibold text-lg text-ink">Encaisser</h2>
            <p className="text-sm text-muted mt-1">{sale.customerName}</p>
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
          <div className="flex items-center justify-between p-3 rounded-[10px] bg-background">
            <span className="text-sm text-muted">Reste dû</span>
            <span className="font-display font-semibold text-lg text-warning">
              {formatFCFA(due)}
            </span>
          </div>

          <div>
            <label htmlFor="pay-amount" className="text-sm font-medium text-text block mb-1.5">
              Montant à encaisser (FCFA)
            </label>
            <input
              id="pay-amount"
              type="number"
              min="0"
              max={due}
              value={amount === 0 ? "" : amount}
              onChange={(e) =>
                setAmount(Math.max(0, Number(e.target.value) || 0))
              }
              placeholder={due.toLocaleString("fr-FR")}
              className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="pay-method" className="text-sm font-medium text-text block mb-1.5">
              Méthode de paiement
            </label>
            <div className="flex items-center gap-2 h-11 px-3 rounded-[10px] border border-border bg-surface">
              <select
                id="pay-method"
                value={method}
                onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                className="flex-1 bg-transparent text-sm text-text focus:outline-none appearance-none cursor-pointer"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-muted" />
            </div>
          </div>

          {(method === "momo" || method === "moov" || method === "bank_transfer") && (
            <div>
              <label htmlFor="pay-ref" className="text-sm font-medium text-text block mb-1.5">
                Référence de transaction
              </label>
              <input
                id="pay-ref"
                type="text"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="Réf. transaction"
                className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          )}
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              onPay(sale.id, selected, method, reference || undefined);
              onClose();
            }}
            disabled={selected <= 0}
          >
            <Check className="w-4 h-4" />
            Encaisser {formatFCFA(selected)}
          </Button>
        </div>
      </div>
    </div>
  );
}
