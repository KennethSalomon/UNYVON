"use client";

import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Users,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/context/app-context";
import { cn, formatFCFA } from "@/lib/utils";





export default function DashboardPage() {
  const { sales, customers, products, purchases, expenses, insights } = useApp();

  const totalRevenue = sales.reduce((sum, s) => sum + s.total, 0);
  const totalCost = sales.reduce((sum, s) => {
    const cost = s.items.reduce((iSum, item) => {
      const prod = products.find((p) => p.id === item.productId);
      return iSum + (prod ? prod.costPrice * item.quantity : 0);
    }, 0);
    return sum + cost;
  }, 0);
  const marginPct = totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue) * 100 : 0;
  const totalCash = sales
    .filter((s) => s.paymentType === "cash")
    .reduce((sum, s) => sum + s.total, 0);
  const totalReceivables = customers.reduce((sum, c) => sum + c.outstandingBalance, 0);

  const kpis = [
    {
      label: "CA",
      value: formatFCFA(totalRevenue),
      unit: "",
      change: 12.5,
      icon: TrendingUp,
      color: "text-ink",
      bgColor: "bg-lavender-soft",
    },
    {
      label: "Marge brute",
      value: marginPct.toFixed(1).replace(".", ","),
      unit: "%",
      change: -2.3,
      icon: TrendingDown,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: "Comptant",
      value: formatFCFA(totalCash),
      unit: "",
      change: 8.2,
      icon: TrendingUp,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      label: "Créances",
      value: formatFCFA(totalReceivables),
      unit: "",
      change: -5.1,
      icon: Users,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ];

  const lowStockProducts = products.filter(
    (p) => p.stockQuantity <= p.minStockThreshold
  );

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

  const recentActivity = [
    ...sales.map((s) => ({
      id: s.id,
      type: "sale",
      desc: `Vente à ${s.customerName}`,
      amount: formatFCFA(s.total),
      date: formatDate(s.createdAt),
    })),
    ...purchases.map((p) => ({
      id: p.id,
      type: "purchase",
      desc: `Réception ${p.supplierName}`,
      amount: formatFCFA(p.total),
      date: formatDate(p.createdAt),
    })),
    ...expenses.map((e) => ({
      id: e.id,
      type: "expense",
      desc: e.description,
      amount: formatFCFA(e.amount),
      date: formatDate(e.date),
    })),
  ]
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 6);

  const chartData = [40, 55, 45, 65, 50, 70, 60, 75, 80, 65, 85, 90];
  const chartLabels = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
    "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">
          Bonjour Patrick 👋
        </h1>
        <p className="text-sm text-muted mt-1">
          Voici ce qui mérite votre attention.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} variant="elevated">
            <CardContent className="flex items-start justify-between">
              <div>
                <p className="text-xs text-muted font-medium">{kpi.label}</p>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className={cn("font-display text-2xl font-bold", kpi.color)}>
                    {kpi.value}
                  </span>
                  <span className="text-xs text-muted">{kpi.unit}</span>
                </div>
                <div className="flex items-center gap-1 mt-2">
                  {kpi.change >= 0 ? (
                    <ArrowUpRight className="w-3.5 h-3.5 text-success" />
                  ) : (
                    <ArrowDownRight className="w-3.5 h-3.5 text-error" />
                  )}
                  <span
                    className={cn(
                      "text-xs font-medium",
                      kpi.change >= 0 ? "text-success" : "text-error"
                    )}
                  >
                    {Math.abs(kpi.change)} %
                  </span>
                  <span className="text-xs text-muted">vs mois dernier</span>
                </div>
              </div>
              <div className={cn("w-10 h-10 rounded-[10px] flex items-center justify-center", kpi.bgColor)}>
                <kpi.icon className={cn("w-5 h-5", kpi.color)} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Performance Chart */}
        <Card variant="elevated" className="lg:col-span-2">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-semibold text-ink">Performance</h2>
                <p className="text-xs text-muted mt-0.5">Chiffre d&apos;affaires mensuel</p>
              </div>
              <Badge variant="info">2026</Badge>
            </div>
            <div className="flex items-end gap-1.5 h-48">
              {chartData.map((h, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end h-40">
                    <div
                      className={cn(
                        "w-full rounded-t-sm transition-all duration-500",
                        i === chartData.length - 1 ? "bg-primary" : "bg-primary/20"
                      )}
                      style={{ height: `${h}%` }}
                    >
                      <div
                        className={cn(
                          "w-full rounded-t-sm",
                          i === chartData.length - 1 ? "bg-primary" : "bg-primary/40"
                        )}
                        style={{ height: "50%" }}
                      />
                    </div>
                  </div>
                  <span className="text-[10px] text-muted">{chartLabels[i]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* NOVA Panel */}
        <Card variant="elevated" className="border-primary/20">
          <CardContent>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-[10px] bg-lavender-soft flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="font-display font-semibold text-ink">NOVA</h2>
                <p className="text-xs text-muted">Intelligence du jour</p>
              </div>
            </div>
            <div className="space-y-3">
              {insights.map((insight) => (
                <div
                  key={insight.id}
                  className={cn(
                    "p-3 rounded-[12px] border transition-colors duration-200 hover:shadow-sm cursor-pointer",
                    insight.severity === "warning"
                      ? "bg-warning/5 border-warning/20"
                      : "bg-info/5 border-info/20"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {insight.severity === "warning" ? (
                      <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-info mt-0.5 shrink-0" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-ink">{insight.title}</p>
                      <p className="text-xs text-muted mt-1 leading-relaxed">
                        {insight.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card variant="elevated">
          <CardContent>
            <h2 className="font-display font-semibold text-ink mb-4">Activité récente</h2>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center",
                        activity.type === "sale"
                          ? "bg-success/10"
                          : activity.type === "purchase"
                          ? "bg-info/10"
                          : "bg-warning/10"
                      )}
                    >
                      {activity.type === "sale" ? (
                        <TrendingUp className="w-4 h-4 text-success" />
                      ) : activity.type === "purchase" ? (
                        <Package className="w-4 h-4 text-info" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4 text-warning" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-ink">{activity.desc}</p>
                      <p className="text-xs text-muted">{activity.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-ink">{activity.amount}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Low Stock Alert */}
        <Card variant="elevated">
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display font-semibold text-ink">Stock critique</h2>
              <Badge variant="warning">{lowStockProducts.length} alertes</Badge>
            </div>
            <div className="space-y-3">
              {products.map((product) => {
                const ratio = product.stockQuantity / product.minStockThreshold;
                const status =
                  ratio <= 0.5 ? "critical" : ratio <= 1 ? "warning" : "normal";
                return (
                  <div
                    key={product.id}
                    className="flex items-center justify-between py-2 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{product.name}</p>
                      <p className="text-xs text-muted">
                        Seuil : {product.minStockThreshold} {product.unit}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "text-sm font-semibold",
                            status === "critical"
                              ? "text-error"
                              : status === "warning"
                              ? "text-warning"
                              : "text-success"
                          )}
                        >
                          {product.stockQuantity} {product.unit}
                        </span>
                        {status !== "normal" && (
                          <div
                            className={cn(
                              "w-2 h-2 rounded-full",
                              status === "critical" ? "bg-error" : "bg-warning"
                            )}
                          />
                        )}
                      </div>
                      <div className="w-24 h-1.5 bg-background rounded-full mt-1.5 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all duration-500",
                            status === "critical"
                              ? "bg-error"
                              : status === "warning"
                              ? "bg-warning"
                              : "bg-success"
                          )}
                          style={{ width: `${Math.min(ratio * 100, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}



