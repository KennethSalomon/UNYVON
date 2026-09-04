"use client";

import { CheckCircle2, CreditCard, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function BillingPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Facturation</h1>
        <p className="text-sm text-muted mt-1">
          Gérez votre plan et votre facturation
        </p>
      </div>

      {/* Coming soon card */}
      <Card variant="elevated" className="border-primary/20">
        <CardContent>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-[12px] bg-lavender-soft flex items-center justify-center shrink-0">
              <Clock className="w-6 h-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h2 className="font-display font-semibold text-lg text-ink">
                Facturation bientôt disponible
              </h2>
              <p className="text-sm text-muted leading-relaxed">
                Le système de facturation et les plans payants seront bientôt
                activés. En attendant, vous pouvez utiliser toutes les
                fonctionnalités d&apos;UNYVON gratuitement.
              </p>
              <p className="text-xs text-muted mt-3">
                Vous serez notifié lorsque les plans payants seront disponibles.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans (informational) */}
      <div>
        <h2 className="font-display font-semibold text-ink mb-3">
          Plans à venir
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            {
              name: "Starter",
              price: "7 500",
              features: [
                "1 utilisateur",
                "Ventes, stock, clients",
                "Dashboard de base",
              ],
            },
            {
              name: "Business",
              price: "15 000",
              features: [
                "5 utilisateurs",
                "Toutes les fonctionnalités",
                "Import CSV",
              ],
              upcoming: true,
            },
            {
              name: "Pro",
              price: "30 000",
              features: [
                "Utilisateurs illimités",
                "Multi-sites",
                "Intégrations",
              ],
            },
          ].map((plan) => (
            <Card key={plan.name} className={plan.upcoming ? "border-primary ring-1 ring-primary/20" : ""}>
              <CardContent>
                <h3 className="font-display font-semibold text-ink">{plan.name}</h3>
                <p className="font-display text-2xl font-bold text-ink mt-2">
                  {plan.price}{" "}
                  <span className="text-sm font-normal text-muted">FCFA/mois</span>
                </p>
                <ul className="mt-4 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                {plan.upcoming && (
                  <p className="mt-4 text-xs text-primary font-medium">
                    Plan recommandé
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
