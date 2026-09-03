"use client";

import { CheckCircle2, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Abonnement</h1>
        <p className="text-sm text-muted mt-1">Gérez votre plan et votre facturation</p>
      </div>

      {/* Current plan */}
      <Card variant="elevated" className="border-primary/20">
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[10px] bg-lavender-soft flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-ink">Plan actuel</h2>
                <p className="text-xs text-muted">Essai gratuit — 10 jours restants</p>
              </div>
            </div>
            <Badge variant="info">Essai</Badge>
          </div>

          <div className="p-4 rounded-[12px] bg-lavender-soft/50 border border-primary/10">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-display font-semibold text-ink text-lg">Business</p>
                <p className="text-sm text-muted">15 000 FCFA / mois</p>
              </div>
              <Button>Passer au plan payant</Button>
            </div>
          </div>

          <div className="mt-4 grid sm:grid-cols-3 gap-3">
            {["5 utilisateurs", "Toutes les fonctionnalités", "Support prioritaire"].map(
              (f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-text">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  {f}
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { name: "Starter", price: "7 500", features: ["1 utilisateur", "Ventes, stock, clients", "Dashboard de base"] },
          { name: "Business", price: "15 000", features: ["5 utilisateurs", "Toutes les fonctionnalités", "Import CSV"], current: true },
          { name: "Pro", price: "30 000", features: ["Utilisateurs illimités", "Multi-sites", "Intégrations"] },
        ].map((plan) => (
          <Card
            key={plan.name}
            className={plan.current ? "border-primary ring-1 ring-primary/20" : ""}
          >
            <CardContent>
              <h3 className="font-display font-semibold text-ink">{plan.name}</h3>
              <p className="font-display text-2xl font-bold text-ink mt-2">
                {plan.price} <span className="text-sm font-normal text-muted">FCFA/mois</span>
              </p>
              <ul className="mt-4 space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-xs text-muted">
                    <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
