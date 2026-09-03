"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useApp } from "@/lib/context/app-context";

export default function SettingsPage() {
  const { organization, updateOrganization } = useApp();
  const [name, setName] = useState(organization.name);
  const [sector, setSector] = useState(organization.sector);
  const [currency, setCurrency] = useState(organization.currency);
  const [saved, setSaved] = useState(false);

  const dirty =
    name !== organization.name ||
    sector !== organization.sector ||
    currency !== organization.currency;

  const handleSave = () => {
    updateOrganization({
      name: name.trim() || organization.name,
      sector: sector.trim() || organization.sector,
      currency: currency.trim() || organization.currency,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Paramètres</h1>
        <p className="text-sm text-muted mt-1">Configuration de votre entreprise</p>
      </div>

      <Card variant="elevated">
        <CardContent>
          <h2 className="font-display font-semibold text-ink mb-4">Entreprise</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="set-name" className="text-xs text-muted block mb-1">Nom</label>
              <input
                id="set-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border border-border bg-background text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="set-sector" className="text-xs text-muted block mb-1">Secteur</label>
              <input
                id="set-sector"
                type="text"
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border border-border bg-background text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label htmlFor="set-currency" className="text-xs text-muted block mb-1">Devise</label>
              <input
                id="set-currency"
                type="text"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full h-10 px-3 rounded-[10px] border border-border bg-background text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Statut</label>
              <Badge variant="success" className="mt-2">Actif</Badge>
            </div>
          </div>
          <div className="mt-5 flex items-center gap-3">
            <Button onClick={handleSave} disabled={!dirty}>
              {saved ? <Check className="w-4 h-4" /> : null}
              {saved ? "Enregistré" : "Enregistrer"}
            </Button>
            <span className="text-xs text-muted">
              Ces informations apparaissent dans le menu et l&apos;en-tête.
            </span>
          </div>
        </CardContent>
      </Card>

      <Card variant="elevated">
        <CardContent>
          <h2 className="font-display font-semibold text-ink mb-4">Profil</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted block mb-1">Nom complet</label>
              <input
                type="text"
                defaultValue="Patrick TOGNON"
                className="w-full h-10 px-3 rounded-[10px] border border-border bg-background text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Email</label>
              <input
                type="email"
                defaultValue="patrick@agrodistrib.bj"
                className="w-full h-10 px-3 rounded-[10px] border border-border bg-background text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
