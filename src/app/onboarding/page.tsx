"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ArrowRight, Building2, Package, Users, ShoppingCart, Sparkles, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppProvider, useApp } from "@/lib/context/app-context";
import { createOrganizationAction } from "@/lib/supabase/org-actions";
import { cn, formatFCFA } from "@/lib/utils";

const steps = [
  { id: 1, label: "Entreprise", icon: Building2 },
  { id: 2, label: "Activité", icon: Building2 },
  { id: 3, label: "Produits", icon: Package },
  { id: 4, label: "Stock", icon: Package },
  { id: 5, label: "Clients", icon: Users },
  { id: 6, label: "Première vente", icon: ShoppingCart },
  { id: 7, label: "Insight", icon: Sparkles },
];

export default function OnboardingPage() {
  return (
    <AppProvider>
      <OnboardingInner />
    </AppProvider>
  );
}

function OnboardingInner() {
  const { organization, updateOrganization, products, customers, addProduct, addCustomer, addSale } = useApp();
  const [currentStep, setCurrentStep] = useState(1);
  const [orgName, setOrgName] = useState(organization.name);
  const [sector, setSector] = useState(organization.sector);
  const [currency, setCurrency] = useState(organization.currency);
  const [activity, setActivity] = useState("");

  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState(0);

  const [newCustomerName, setNewCustomerName] = useState("");

  const [saleCustomerId, setSaleCustomerId] = useState("");
  const [saleQty, setSaleQty] = useState<Record<string, number>>({});
  const [orgError, setOrgError] = useState("");
  const orgCreatedRef = useRef(false);

  const progress = (currentStep / steps.length) * 100;

  const handleFinishStep1 = async () => {
    const name = orgName.trim() || organization.name;
    const finalSector = sector.trim() || organization.sector;
    const finalCurrency = currency.trim() || organization.currency;

    if (!orgCreatedRef.current) {
      orgCreatedRef.current = true;
      const res = await createOrganizationAction({
        name,
        sector: finalSector,
        currency: finalCurrency,
      });
      if (res.ok) {
        setOrgError("");
      } else {
        // Backend indisponible (dev sans Supabase) : on revient au mock pour
        // ne pas bloquer le parcours hors-auth.
        orgCreatedRef.current = false;
        setOrgError(
          res.error === "UNAUTHENTICATED"
            ? "Vous devez être connecté pour créer votre entreprise."
            : res.error === "NOT_CONFIGURED"
            ? "Backend non configuré : entreprise enregistrée localement (démo)."
            : res.error
        );
      }
    }

    updateOrganization({ name, sector: finalSector, currency: finalCurrency });
    setCurrentStep(2);
  };

  const canStep1 = orgName.trim().length > 0;
  const canStep3 = newProductName.trim().length > 0 && newProductPrice > 0;

  const cartItems = products
    .filter((p) => (saleQty[p.id] ?? 0) > 0)
    .map((p) => ({
      productId: p.id,
      quantity: saleQty[p.id],
      total: saleQty[p.id] * p.salePrice,
    }));
  const saleTotal = cartItems.reduce((sum, i) => sum + i.total, 0);
  const saleCustomer = customers.find((c) => c.id === saleCustomerId);

  const canStep6 = cartItems.length > 0 && saleTotal > 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="h-16 border-b border-border bg-surface flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">U</span>
          </div>
          <span className="font-display font-semibold text-lg text-ink">UNYVON</span>
        </div>
      </div>

      <div className="h-1 bg-background">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-lg mx-auto w-full">
        <div className="flex items-center gap-2 mb-8">
          {steps.map((step) => (
            <div
              key={step.id}
              className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-300",
                step.id < currentStep
                  ? "bg-success text-white"
                  : step.id === currentStep
                  ? "bg-primary text-white ring-4 ring-primary/20"
                  : "bg-background text-muted border border-border"
              )}
            >
              {step.id < currentStep ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                step.id
              )}
            </div>
          ))}
        </div>

        <h2 className="font-display text-xl font-bold text-ink mb-2">
          {steps[currentStep - 1].label}
        </h2>
        <p className="text-sm text-muted text-center mb-8">
          {currentStep === 1 && "Nommez votre entreprise et choisissez votre secteur."}
          {currentStep === 2 && "Décrivez brièvement votre activité pour personnaliser l'expérience."}
          {currentStep === 3 && "Ajoutez vos produits ou importez-les depuis un fichier CSV."}
          {currentStep === 4 && "Définissez le stock initial de chaque produit."}
          {currentStep === 5 && "Ajoutez vos clients ou importez-les."}
          {currentStep === 6 && "Enregistrez votre première vente pour voir le système en action."}
          {currentStep === 7 && "NOVA analyse vos données et vous donne votre premier insight."}
        </p>

        <div className="w-full p-6 rounded-[16px] border border-border bg-surface mb-8">
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">
                  Nom de l&apos;entreprise
                </label>
                <input
                  type="text"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full h-11 px-4 rounded-[10px] border border-border bg-background text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Secteur</label>
                <select
                  value={sector}
                  onChange={(e) => setSector(e.target.value)}
                  className="w-full h-11 px-4 rounded-[10px] border border-border bg-background text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option>Distribution B2B agroalimentaire</option>
                  <option>Commerce général</option>
                  <option>Restaurant</option>
                  <option>Services</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Devise</label>
                <input
                  type="text"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full h-11 px-4 rounded-[10px] border border-border bg-background text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
              {orgError && (
                <p role="status" className="text-xs text-muted">
                  {orgError}
                </p>
              )}
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-text block mb-1.5">
                Décrivez votre activité
              </label>
              <textarea
                rows={4}
                value={activity}
                onChange={(e) => setActivity(e.target.value)}
                placeholder="Ex. Nous distribuons des produits agroalimentaires en gros aux épiceries de Cotonou..."
                className="w-full px-4 py-3 rounded-[10px] border border-border bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <p className="text-xs text-muted">
                Cette description permet à NOVA de mieux contextualiser vos recommandations.
              </p>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newProductName}
                  onChange={(e) => setNewProductName(e.target.value)}
                  placeholder="Nom du produit"
                  className="flex-1 h-10 px-3 rounded-[10px] border border-border bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <input
                  type="number"
                  min="0"
                  value={newProductPrice === 0 ? "" : newProductPrice}
                  onChange={(e) => setNewProductPrice(Math.max(0, Number(e.target.value) || 0))}
                  placeholder="Prix"
                  aria-label="Prix de vente"
                  className="w-24 h-10 px-3 rounded-[10px] border border-border bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <Button
                  size="sm"
                  disabled={!canStep3}
                  onClick={() => {
                    addProduct({
                      name: newProductName.trim(),
                      unit: "unité",
                      costPrice: 0,
                      salePrice: newProductPrice,
                      stockQuantity: 0,
                      minStockThreshold: 0,
                      categoryId: "cat-autre",
                    });
                    setNewProductName("");
                    setNewProductPrice(0);
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </Button>
              </div>
              {products.length > 0 && (
                <div className="mt-2 space-y-2">
                  {products.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-[10px] border border-border bg-background"
                    >
                      <div>
                        <p className="text-sm font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-muted">{formatFCFA(p.salePrice)}</p>
                      </div>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-2">
              <p className="text-sm text-muted mb-2">
                Vérifiez le stock initial de vos produits.
              </p>
              {products.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between p-3 rounded-[10px] border border-border"
                >
                  <p className="text-sm font-medium text-ink">{p.name}</p>
                  <p className="text-sm text-muted">
                    {p.stockQuantity} {p.unit || "unité"}
                  </p>
                </div>
              ))}
            </div>
          )}

          {currentStep === 5 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  placeholder="Nom du client"
                  className="flex-1 h-10 px-3 rounded-[10px] border border-border bg-background text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
                <Button
                  size="sm"
                  disabled={newCustomerName.trim().length === 0}
                  onClick={() => {
                    addCustomer({
                      name: newCustomerName.trim(),
                      phone: "",
                      address: "",
                    });
                    setNewCustomerName("");
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Ajouter
                </Button>
              </div>
              {customers.length > 0 && (
                <div className="mt-2 space-y-2">
                  {customers.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between p-3 rounded-[10px] border border-border bg-background"
                    >
                      <p className="text-sm font-medium text-ink">{c.name}</p>
                      <CheckCircle2 className="w-4 h-4 text-success" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {currentStep === 6 && (
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">Client</label>
                <select
                  value={saleCustomerId}
                  onChange={(e) => setSaleCustomerId(e.target.value)}
                  className="w-full h-10 px-3 rounded-[10px] border border-border bg-background text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="">Client comptoir</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                {products.map((p) => {
                  const qty = saleQty[p.id] ?? 0;
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-[10px] border border-border"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">{p.name}</p>
                        <p className="text-xs text-muted">{formatFCFA(p.salePrice)}</p>
                      </div>
                      <input
                        type="number"
                        min="0"
                        value={qty === 0 ? "" : qty}
                        onChange={(e) =>
                          setSaleQty((prev) => ({
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
              <div className="flex items-center justify-between p-3 rounded-[10px] bg-background">
                <span className="text-sm text-muted">Total</span>
                <span className="font-display font-semibold text-lg text-ink">
                  {formatFCFA(saleTotal)}
                </span>
              </div>
            </div>
          )}

          {currentStep === 7 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-[16px] bg-lavender-soft flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display font-semibold text-ink mb-2">
                Votre premier insight NOVA
              </h3>
              <div className="p-4 rounded-[12px] bg-warning/5 border border-warning/20 text-left mt-4">
                <p className="text-sm font-medium text-ink">
                  Stock de {products[0]?.name ?? "produits"} — vigilance rapprovisionnement
                </p>
                <p className="text-xs text-muted mt-1">
                  {products.filter((p) => p.stockQuantity <= p.minStockThreshold && p.minStockThreshold > 0).length}{" "}
                  produit(s) proche(s) du seuil minimal. Configurez vos alertes dans le dashboard.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 w-full">
          {currentStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Retour
            </Button>
          )}
          {currentStep < steps.length ? (
            <Button
              className="flex-1"
              size="lg"
              onClick={() => {
                if (currentStep === 1) {
                  if (!canStep1) return;
                  handleFinishStep1();
                } else if (currentStep === 6) {
                  if (!canStep6) return;
                  addSale({
                    customerId: saleCustomerId || null,
                    customerName: saleCustomer?.name ?? "Client comptoir",
                    items: cartItems,
                    total: saleTotal,
                    paymentType: "cash",
                    amountPaid: saleTotal,
                  });
                  setCurrentStep(7);
                } else {
                  setCurrentStep(currentStep + 1);
                }
              }}
              disabled={
                (currentStep === 1 && !canStep1) ||
                (currentStep === 6 && !canStep6)
              }
            >
              {currentStep === 6 ? "Enregistrer la vente" : "Suivant"}
              <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Link href="/dashboard" className="flex-1">
              <Button className="w-full" size="lg">
                Accéder au dashboard
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}


