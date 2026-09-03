"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp, type NewExpenseInput } from "@/lib/context/app-context";
import { formatFCFA } from "@/lib/utils";

const CATEGORIES = ["Loyer", "Transport", "Personnel", "Électricité", "Achat fournisseur", "Autre"];

export default function ExpensesPage() {
  const { expenses, addExpense } = useApp();
  const [showModal, setShowModal] = useState(false);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryColors: Record<string, string> = {
    Loyer: "bg-primary/10 text-primary",
    Transport: "bg-info/10 text-info",
    Personnel: "bg-warning/10 text-warning",
    Électricité: "bg-success/10 text-success",
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Dépenses</h1>
          <p className="text-sm text-muted mt-1">
            Total : {formatFCFA(totalExpenses)}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4" />
          Nouvelle dépense
        </Button>
      </div>

      <Card variant="elevated">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Date</th>
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Catégorie</th>
                <th className="text-left text-xs font-medium text-muted px-6 py-3">Description</th>
                <th className="text-right text-xs font-medium text-muted px-6 py-3">Montant</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((expense) => (
                <tr
                  key={expense.id}
                  className="border-b border-border last:border-0 hover:bg-background/50 transition-colors"
                >
                  <td className="px-6 py-4 text-sm text-text">
                    {new Date(expense.date).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={categoryColors[expense.category] || "bg-background text-muted"}
                    >
                      {expense.category}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-sm text-text">{expense.description}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="text-sm font-semibold text-error">
                      -{formatFCFA(expense.amount)}
                    </span>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-sm text-muted">
                    Aucune dépense enregistrée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showModal && (
        <ExpenseModal onClose={() => setShowModal(false)} onSave={addExpense} />
      )}
    </div>
  );
}

function ExpenseModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (input: NewExpenseInput) => void;
}) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);

  const canSubmit = description.trim().length > 0 && amount > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSave({
      category,
      description: description.trim(),
      amount,
      date: new Date().toISOString().slice(0, 10),
    });
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Nouvelle dépense"
    >
      <div className="bg-surface rounded-card border border-border shadow-lg w-full max-w-md">
        <div className="p-6 border-b border-border flex items-start justify-between">
          <div>
            <h2 className="font-display font-semibold text-lg text-ink">Nouvelle dépense</h2>
            <p className="text-sm text-muted mt-1">Enregistrer une sortie de trésorerie</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="p-2 rounded-[10px] text-muted hover:text-text hover:bg-background transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="exp-category" className="text-sm font-medium text-text block mb-1.5">
              Catégorie
            </label>
            <select
              id="exp-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="exp-desc" className="text-sm font-medium text-text block mb-1.5">
              Description
            </label>
            <input
              id="exp-desc"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex. Loyer entrepôt octobre"
              className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>

          <div>
            <label htmlFor="exp-amount" className="text-sm font-medium text-text block mb-1.5">
              Montant (FCFA)
            </label>
            <input
              id="exp-amount"
              type="number"
              min="0"
              value={amount === 0 ? "" : amount}
              onChange={(e) => setAmount(Math.max(0, Number(e.target.value) || 0))}
              placeholder="0"
              className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="p-6 border-t border-border flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
}

