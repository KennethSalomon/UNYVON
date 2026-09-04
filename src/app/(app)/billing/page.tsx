"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getSubscriptionAction } from "@/lib/supabase/org-actions";

type SubscriptionInfo = {
  status: string;
  trialStart: string | null;
  trialEnd: string | null;
  plan: string | null;
  daysRemaining: number;
};

export default function BillingPage() {
  const [sub, setSub] = useState<SubscriptionInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSubscriptionAction().then((s) => {
      setSub(s);
      setLoading(false);
    });
  }, []);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Facturation</h1>
        <p className="text-sm text-muted mt-1">
          Gérez votre plan et votre facturation
        </p>
      </div>

      {/* Subscription status */}
      {loading ? (
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-muted">Chargement…</p>
            </div>
          </CardContent>
        </Card>
      ) : sub ? (
        <Card variant="elevated" className="border-primary/20">
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[12px] bg-lavender-soft flex items-center justify-center shrink-0">
                {sub.status === "trialing" ? (
                  <Clock className="w-6 h-6 text-primary" />
                ) : sub.status === "active" ? (
                  <CheckCircle2 className="w-6 h-6 text-success" />
                ) : (
                  <AlertTriangle className="w-6 h-6 text-warning" />
                )}
              </div>
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-semibold text-lg text-ink">
                    {sub.status === "trialing"
                      ? "Essai gratuit"
                      : sub.status === "active"
                        ? "Abonnement actif"
                        : "Abonnement inactif"}
                  </h2>
                  <Badge variant={sub.status === "trialing" ? "info" : sub.status === "active" ? "success" : "warning"}>
                    {sub.status}
                  </Badge>
                </div>
                {sub.status === "trialing" && sub.trialEnd && (
                  <p className="text-sm text-muted">
                    {sub.daysRemaining > 0
                      ? `${sub.daysRemaining} jour${sub.daysRemaining > 1 ? "s" : ""} restant${sub.daysRemaining > 1 ? "s" : ""}`
                      : "L'essai est terminé"}
                    {" — "}
                    se termine le {new Date(sub.trialEnd).toLocaleDateString("fr-FR")}
                  </p>
                )}
                {sub.plan && (
                  <p className="text-xs text-muted">Plan actuel : {sub.plan}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[12px] bg-lavender-soft flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <div className="space-y-2">
                <h2 className="font-display font-semibold text-lg text-ink">
                  Aucun abonnement
                </h2>
                <p className="text-sm text-muted leading-relaxed">
                  Vous n&apos;avez pas encore d&apos;abonnement. Créez une organisation pour démarrer votre essai gratuit de 14 jours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Coming soon */}
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
