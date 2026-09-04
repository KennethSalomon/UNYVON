"use server";

import { createServerSupabase } from "./server";
import type {
  DatabaseExpense,
  CreateExpenseInput,
  UpdateExpenseInput,
  ExpenseSummary,
  CashflowSummary,
} from "@/types";

export async function getExpenses(): Promise<DatabaseExpense[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .order("expense_date", { ascending: false });

  if (error) throw new Error(`Erreur dépenses: ${error.message}`);
  return (data as DatabaseExpense[]) ?? [];
}

export async function getExpense(id: string): Promise<DatabaseExpense | null> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw new Error(`Erreur dépense: ${error.message}`);
  return data as DatabaseExpense | null;
}

export async function createExpense(input: CreateExpenseInput): Promise<DatabaseExpense> {
  const supabase = await createServerSupabase();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié");

  const { data: org } = await supabase
    .from("organization_users")
    .select("organization_id")
    .eq("user_id", user.id)
    .limit(1)
    .single();

  if (!org) throw new Error("Aucune organisation");

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      organization_id: org.organization_id,
      category: input.category,
      description: input.description,
      amount: input.amount,
      expense_date: input.expense_date ?? new Date().toISOString().slice(0, 10),
      payment_method: input.payment_method,
      reference: input.reference ?? null,
      notes: input.notes ?? null,
      created_by: user.id,
    })
    .select("*")
    .single();

  if (error) throw new Error(`Erreur création dépense: ${error.message}`);
  return data as DatabaseExpense;
}

export async function updateExpense(input: UpdateExpenseInput): Promise<DatabaseExpense> {
  const supabase = await createServerSupabase();

  const updates: Record<string, unknown> = {};
  if (input.category !== undefined) updates.category = input.category;
  if (input.description !== undefined) updates.description = input.description;
  if (input.amount !== undefined) updates.amount = input.amount;
  if (input.expense_date !== undefined) updates.expense_date = input.expense_date;
  if (input.payment_method !== undefined) updates.payment_method = input.payment_method;
  if (input.reference !== undefined) updates.reference = input.reference;
  if (input.notes !== undefined) updates.notes = input.notes;

  const { data, error } = await supabase
    .from("expenses")
    .update(updates)
    .eq("id", input.id)
    .select("*")
    .single();

  if (error) throw new Error(`Erreur modification dépense: ${error.message}`);
  return data as DatabaseExpense;
}

export async function deleteExpense(id: string): Promise<void> {
  const supabase = await createServerSupabase();

  const { error } = await supabase
    .from("expenses")
    .delete()
    .eq("id", id);

  if (error) throw new Error(`Erreur suppression dépense: ${error.message}`);
}

export async function getExpensesSummary(
  orgId: string,
  from?: string,
  to?: string
): Promise<ExpenseSummary[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.rpc("get_expenses_summary", {
    p_org_id: orgId,
    p_from: from ?? null,
    p_to: to ?? null,
  });

  if (error) throw new Error(`Erreur résumé dépenses: ${error.message}`);
  return (data as ExpenseSummary[]) ?? [];
}

export async function getCashflowSummary(
  orgId: string,
  from?: string,
  to?: string
): Promise<CashflowSummary> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.rpc("get_cashflow_summary", {
    p_org_id: orgId,
    p_from: from ?? null,
    p_to: to ?? null,
  });

  if (error) throw new Error(`Erreur trésorerie: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    total_receipts: row?.total_receipts ?? 0,
    total_expenses: row?.total_expenses ?? 0,
    net_cashflow: row?.net_cashflow ?? 0,
  };
}
