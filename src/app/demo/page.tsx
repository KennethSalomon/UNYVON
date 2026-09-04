"use client";

import { useEffect, useState } from "react";
import { Eye, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getDemoData, type DemoData } from "@/lib/supabase/demo-actions";
import { formatFCFA } from "@/lib/utils";

export default function DemoPage() {
  const [data, setData] = useState<DemoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDemoData().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-muted">Chargement de la démo…</p>
        </div>
      </div>
    );
  }

  if (!data?.organization) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-sm">
          <Eye className="w-12 h-12 text-muted mx-auto" />
          <h1 className="font-display text-xl font-bold text-ink">Démo non disponible</h1>
          <p className="text-sm text-muted">
            Aucune organisation de démo n&apos;a été trouvée. Créez votre propre compte pour commencer.
          </p>
          <a href="/signup">
            <Button>Créer un compte gratuit</Button>
          </a>
        </div>
      </div>
    );
  }

  const kpis = [
    { label: "Chiffre d'affaires", value: data.kpis.ca, icon: TrendingUp, color: "text-primary" },
    { label: "Marge brute", value: data.kpis.marge, icon: TrendingUp, color: "text-success" },
    { label: "Créances", value: data.kpis.creances, icon: TrendingUp, color: "text-warning" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="border-b border-border bg-surface px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[8px] bg-lavender-soft flex items-center justify-center">
            <Eye className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="font-display font-bold text-ink text-sm">UNYVON — Démo</h1>
            <p className="text-xs text-muted">{data.organization.name} · {data.organization.sector}</p>
          </div>
        </div>
        <a href="/signup">
          <Button size="sm">Créer un compte</Button>
        </a>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* KPIs */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label}>
              <CardContent>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-[10px] bg-lavender-soft flex items-center justify-center shrink-0">
                    <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                  </div>
                  <div>
                    <p className="text-xs text-muted">{kpi.label}</p>
                    <p className="font-display text-lg font-bold text-ink">
                      {formatFCFA(kpi.value)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Products */}
          <Card>
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold text-ink text-sm">Produits</h2>
              <Badge variant="info" className="ml-auto">{data.products.length}</Badge>
            </div>
            <div className="divide-y divide-border">
              {data.products.map((p) => (
                <div key={p.name} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-muted">{p.unit}</p>
                  </div>
                  <p className="text-sm font-medium text-ink">{formatFCFA(p.sale_price)}</p>
                </div>
              ))}
              {data.products.length === 0 && (
                <p className="px-6 py-4 text-sm text-muted text-center">Aucun produit</p>
              )}
            </div>
          </Card>

          {/* Recent sales */}
          <Card>
            <div className="px-6 py-4 border-b border-border flex items-center gap-2">
              <ShoppingCart className="w-4 h-4 text-primary" />
              <h2 className="font-display font-semibold text-ink text-sm">Ventes récentes</h2>
            </div>
            <div className="divide-y divide-border">
              {data.recentSales.map((s) => (
                <div key={s.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {s.customer_name ?? "Client anonyme"}
                    </p>
                    <p className="text-xs text-muted">
                      {new Date(s.sale_date).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-ink">{formatFCFA(s.total_amount)}</p>
                    <Badge variant="success" className="text-[10px]">Confirmée</Badge>
                  </div>
                </div>
              ))}
              {data.recentSales.length === 0 && (
                <p className="px-6 py-4 text-sm text-muted text-center">Aucune vente</p>
              )}
            </div>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center space-y-3 py-6">
          <p className="text-sm text-muted">
            Ceci est une démonstration avec de vraies données.
          </p>
          <a href="/signup">
            <Button>Commencer maintenant — C&apos;est gratuit</Button>
          </a>
        </div>
      </main>
    </div>
  );
}
