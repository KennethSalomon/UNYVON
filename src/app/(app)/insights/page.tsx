"use client";

import {
  AlertTriangle,
  TrendingDown,
  Users,
  TrendingUp,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/context/app-context";
import { cn } from "@/lib/utils";

const insightIcons = {
  risk: AlertTriangle,
  anomaly: TrendingDown,
  margin: TrendingDown,
  receivable: Users,
  opportunity: TrendingUp,
};

const insightColors = {
  risk: "text-warning",
  anomaly: "text-error",
  margin: "text-warning",
  receivable: "text-info",
  opportunity: "text-success",
};

const insightBgColors = {
  risk: "bg-warning/10",
  anomaly: "bg-error/10",
  margin: "bg-warning/10",
  receivable: "bg-info/10",
  opportunity: "bg-success/10",
};

export default function InsightsPage() {
  const { insights } = useApp();

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-[10px] bg-lavender-soft flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">NOVA</h1>
            <p className="text-sm text-muted">Intelligence et recommandations</p>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-[16px] bg-gradient-to-r from-lavender-soft to-surface border border-primary/10">
        <div className="flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-medium text-ink">
              NOVA analyse vos opérations en temps réel.
            </p>
            <p className="text-xs text-muted mt-1">
              Les alertes ci-dessous sont générées automatiquement à partir de vos données. Les
              calculs sont déterministes ; NOVA explique et recommande.
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {insights.map((insight) => {
          const Icon = insightIcons[insight.type];
          const color = insightColors[insight.type];
          const bgColor = insightBgColors[insight.type];

          return (
            <Card
              key={insight.id}
              variant="elevated"
              className="hover:shadow-md transition-shadow cursor-pointer"
            >
              <CardContent>
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0",
                      bgColor
                    )}
                  >
                    <Icon className={cn("w-5 h-5", color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge
                        variant={
                          insight.type === "opportunity" ? "success" : 
                          insight.type === "receivable" ? "info" : "warning"
                        }
                      >
                        {insight.type === "risk"
                          ? "Risque"
                          : insight.type === "anomaly"
                          ? "Anomalie"
                          : insight.type === "margin"
                          ? "Marge"
                          : insight.type === "receivable"
                          ? "Créance"
                          : "Opportunité"}
                      </Badge>
                    </div>
                    <h3 className="font-display font-semibold text-ink mb-1">
                      {insight.title}
                    </h3>
                    <p className="text-sm text-muted leading-relaxed">
                      {insight.description}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted shrink-0 mt-1" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent>
          <h3 className="font-display font-semibold text-sm text-ink mb-2">
            Règle NOVA
          </h3>
          <div className="space-y-1.5 text-xs text-muted">
            <p>• Les calculs financiers ne sont pas confiés au LLM.</p>
            <p>• Les règles déterministes identifient les signaux.</p>
            <p>• Le LLM explique les signaux avec le contexte.</p>
            <p>• Aucune action irréversible n&apos;est déclenchée sans validation humaine.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

