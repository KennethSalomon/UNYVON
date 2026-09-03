"use client";

import { useState } from "react";
import { Plus, X, Send } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const teamMembers = [
  {
    name: "Patrick TOGNON",
    email: "patrick@agrodistrib.bj",
    role: "owner",
    roleLabel: "Propriétaire",
    lastActive: "En ligne",
  },
  {
    name: "Marie AGBODJAN",
    email: "marie@agrodistrib.bj",
    role: "manager",
    roleLabel: "Manager",
    lastActive: "Il y a 2h",
  },
  {
    name: "Jean BAGUET",
    email: "jean@agrodistrib.bj",
    role: "seller",
    roleLabel: "Vendeur",
    lastActive: "Il y a 1j",
  },
  {
    name: "Paulin DASSI",
    email: "paulin@agrodistrib.bj",
    role: "warehouse",
    roleLabel: "Magasinier",
    lastActive: "Il y a 3j",
  },
];


const roleColors: Record<string, string> = {
  owner: "bg-primary/10 text-primary",
  manager: "bg-info/10 text-info",
  seller: "bg-success/10 text-success",
  warehouse: "bg-warning/10 text-warning",
};

export default function TeamPage() {
  const [showInvite, setShowInvite] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("seller");
  const [sent, setSent] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Équipe</h1>
          <p className="text-sm text-muted mt-1">
            {teamMembers.length} membres
          </p>
        </div>
        <Button onClick={() => setShowInvite(true)}>
          <Plus className="w-4 h-4" />
          Inviter un membre
        </Button>
      </div>

      <Card variant="elevated">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Membre</th>
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Rôle</th>
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Dernière activité</th>
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => {
                return (
                  <tr
                    key={member.email}
                    className="border-b border-border last:border-0 hover:bg-background/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-lavender-soft flex items-center justify-center">
                          <span className="text-primary font-display font-semibold text-xs">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </span>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-ink">{member.name}</p>
                          <p className="text-xs text-muted">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge className={roleColors[member.role]}>
                        {member.roleLabel}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-muted">{member.lastActive}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <Card>
        <CardContent>
          <h3 className="font-display font-semibold text-sm text-ink mb-2">
            Rôles et permissions
          </h3>
          <div className="space-y-2 text-xs text-muted">
            <p><strong className="text-text">Propriétaire :</strong> Accès complet, abonnements, utilisateurs, paramètres.</p>
            <p><strong className="text-text">Manager :</strong> Supervision des opérations et rapports.</p>
            <p><strong className="text-text">Vendeur :</strong> Ventes et consultation limitée.</p>
            <p><strong className="text-text">Magasinier :</strong> Stock, réceptions et inventaires.</p>
          </div>
        </CardContent>
      </Card>

      {showInvite && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Inviter un membre"
        >
          <div className="bg-surface rounded-card border border-border shadow-lg w-full max-w-md">
            <div className="p-6 border-b border-border flex items-start justify-between">
              <div>
                <h2 className="font-display font-semibold text-lg text-ink">Inviter un membre</h2>
                <p className="text-sm text-muted mt-1">Envoyer une invitation par e-mail</p>
              </div>
              <button
                onClick={() => setShowInvite(false)}
                aria-label="Fermer"
                className="p-2 rounded-[10px] text-muted hover:text-text hover:bg-background transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label htmlFor="invite-email" className="text-sm font-medium text-text block mb-1.5">
                  Adresse e-mail
                </label>
                <input
                  id="invite-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="collegue@agrodistrib.bj"
                  className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="invite-role" className="text-sm font-medium text-text block mb-1.5">
                  Rôle
                </label>
                <select
                  id="invite-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="seller">Vendeur</option>
                  <option value="manager">Manager</option>
                  <option value="warehouse">Magasinier</option>
                </select>
              </div>

              {sent && (
                <div className="p-3 rounded-[10px] bg-success/10 text-sm text-success">
                  Invitation envoyée à {email}.
                </div>
              )}
            </div>

            <div className="p-6 border-t border-border flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowInvite(false)}>
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (email.trim().length === 0) return;
                  setSent(true);
                  setEmail("");
                }}
                disabled={email.trim().length === 0}
              >
                <Send className="w-4 h-4" />
                Envoyer l&apos;invitation
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}



