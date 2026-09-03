"use client";

import { useState } from "react";
import { Plus, Search, Phone, MapPin, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp, type NewCustomerInput } from "@/lib/context/app-context";
import { cn, formatFCFA } from "@/lib/utils";

export default function CustomersPage() {
  const { customers, addCustomer } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = customers.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase())
  );

  const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Clients</h1>
          <p className="text-sm text-muted mt-1">
            {customers.length} clients · Créances totales : {formatFCFA(totalReceivables)}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Ajouter un client
        </Button>
      </div>

      <div className="flex items-center gap-2 h-9 px-3 rounded-[10px] border border-border bg-surface max-w-sm">
        <Search className="w-4 h-4 text-muted" />
        <input
          type="text"
          placeholder="Rechercher un client..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Rechercher un client"
          className="flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map((customer) => (
          <Card key={customer.id} variant="elevated" className="hover:shadow-md transition-shadow">
            <CardContent>
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-display font-semibold text-ink">{customer.name}</h3>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted">
                    <Phone className="w-3 h-3" />
                    {customer.phone || "—"}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted">
                    <MapPin className="w-3 h-3" />
                    {customer.address || "—"}
                  </div>
                </div>
                {customer.outstandingBalance > 0 && (
                  <Badge variant="warning">Créance</Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border">
                <div>
                  <p className="text-xs text-muted">Total achats</p>
                  <p className="text-sm font-semibold text-ink mt-0.5">
                    {formatFCFA(customer.totalPurchases)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted">Solde dû</p>
                  <p
                    className={cn(
                      "text-sm font-semibold mt-0.5",
                      customer.outstandingBalance > 0 ? "text-warning" : "text-success"
                    )}
                  >
                    {formatFCFA(customer.outstandingBalance)}
                  </p>
                </div>
              </div>

              {customer.outstandingBalance > 0 && (
                <div className="mt-3 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted">Ancienneté créance</span>
                    <Badge variant={customer.outstandingBalance > 300000 ? "error" : "warning"}>
                      {customer.outstandingBalance > 300000 ? "30+ jours" : "8–30 jours"}
                    </Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <Card>
            <CardContent className="py-10 text-center text-sm text-muted">
              Aucun client trouvé.
            </CardContent>
          </Card>
        )}
      </div>

      {showModal && (
        <CustomerModal onClose={() => setShowModal(false)} onSave={addCustomer} />
      )}
    </div>
  );
}

function CustomerModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: NewCustomerInput) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  const canSubmit = name.trim().length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({ name: name.trim(), phone: phone.trim(), address: address.trim() });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Ajouter un client"
    >
      <div className="bg-surface rounded-card border border-border shadow-lg w-full max-w-md">
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div>
            <h2 className="font-display font-semibold text-lg text-ink">Ajouter un client</h2>
            <p className="text-sm text-muted mt-1">Référencer un acheteur B2B</p>
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
            <label htmlFor="cust-name" className="text-sm font-medium text-text block mb-1.5">
              Nom
            </label>
            <input
              id="cust-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex. Épicerie du Marché"
              className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="cust-phone" className="text-sm font-medium text-text block mb-1.5">
              Téléphone
            </label>
            <input
              id="cust-phone"
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+229 ..."
              className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="cust-address" className="text-sm font-medium text-text block mb-1.5">
              Adresse
            </label>
            <input
              id="cust-address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Quartier, ville"
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
