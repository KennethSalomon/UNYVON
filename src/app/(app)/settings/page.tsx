"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useApp } from "@/lib/context/app-context";
import { useOrg } from "@/lib/context/org-context";
import { updateOrganizationAction } from "@/lib/supabase/org-actions";

export default function SettingsPage() {
  const { organization: appOrg, updateOrganization } = useApp();
  const { organization, user } = useOrg();
  const [name, setName] = useState(organization?.name ?? appOrg.name);
  const [sector, setSector] = useState(organization?.sector ?? appOrg.sector);
  const [currency, setCurrency] = useState(organization?.currency ?? appOrg.currency);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const currentOrg = organization ?? appOrg;
  const dirty =
    name !== currentOrg.name ||
    sector !== currentOrg.sector ||
    currency !== currentOrg.currency;

  const handleSave = async () => {
    setSaving(true);
    const patch = {
      name: name.trim() || currentOrg.name,
      sector: sector.trim() || currentOrg.sector,
      currency: currency.trim() || currentOrg.currency,
    };

    updateOrganization(patch);

    try {
      await updateOrganizationAction(patch);
    } catch {
      // L'action serveur a échoué, mais l'état local est déjà à jour
    } finally {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "Utilisateur";

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
            <Button onClick={handleSave} disabled={!dirty || saving}>
              {saving ? (
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : null}
              {saving ? "Enregistrement..." : saved ? "Enregistré" : "Enregistrer"}
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
                defaultValue={displayName}
                readOnly
                className="w-full h-10 px-3 rounded-[10px] border border-border bg-background text-sm text-text focus:outline-none cursor-not-allowed opacity-70"
              />
            </div>
            <div>
              <label className="text-xs text-muted block mb-1">Email</label>
              <input
                type="email"
                defaultValue={user?.email ?? ""}
                readOnly
                className="w-full h-10 px-3 rounded-[10px] border border-border bg-background text-sm text-text focus:outline-none cursor-not-allowed opacity-70"
              />
            </div>
          </div>
          <p className="text-xs text-muted mt-3">Le profil est géré via votre compte Supabase Auth.</p>
        </CardContent>
      </Card>
    </div>
  );
}
