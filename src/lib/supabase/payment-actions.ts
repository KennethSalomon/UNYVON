"use server";

import { createServerSupabase } from "./server";
import type {
  DatabasePayment,
  PaymentWithSale,
  SalePaymentStatus,
  CustomerBalance,
  CreatePaymentInput,
} from "@/types";

interface PaymentRow extends DatabasePayment {
  sales: { reference: string | null; total_amount: number; customers: { name: string } | null } | null;
}

function toPaymentWithSale(row: PaymentRow): PaymentWithSale {
  return {
    id: row.id,
    organization_id: row.organization_id,
    sale_id: row.sale_id,
    amount: row.amount,
    payment_method: row.payment_method,
    payment_date: row.payment_date,
    reference: row.reference,
    notes: row.notes,
    created_by: row.created_by,
    created_at: row.created_at,
    saleReference: row.sales?.reference ?? null,
    saleTotalAmount: row.sales?.total_amount ?? 0,
    customerName: row.sales?.customers?.name ?? null,
  };
}

export async function getPayments(): Promise<PaymentWithSale[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("payments")
    .select("*, sales(reference, total_amount, customers(name))")
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Erreur paiements: ${error.message}`);
  return (data as PaymentRow[]).map(toPaymentWithSale);
}

export async function getPaymentsForSale(saleId: string): Promise<DatabasePayment[]> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("payments")
    .select("*")
    .eq("sale_id", saleId)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Erreur paiements: ${error.message}`);
  return (data as DatabasePayment[]) ?? [];
}

export async function getSalePaymentStatus(saleId: string): Promise<SalePaymentStatus> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.rpc("get_sale_payment_status", {
    p_sale_id: saleId,
  });

  if (error) throw new Error(`Erreur statut paiement: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    total_amount: row.total_amount,
    total_paid: row.total_paid,
    remaining: row.remaining,
    payment_status: row.payment_status as SalePaymentStatus["payment_status"],
  };
}

export async function getCustomerBalance(customerId: string): Promise<CustomerBalance> {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase.rpc("get_customer_balance", {
    p_customer_id: customerId,
  });

  if (error) throw new Error(`Erreur balance client: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    total_purchases: row.total_purchases,
    total_paid: row.total_paid,
    outstanding: row.outstanding,
  };
}

export async function createPayment(input: CreatePaymentInput): Promise<DatabasePayment> {
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

  // Use RPC for atomic operation with concurrency protection
  const { error: rpcErr } = await supabase.rpc("create_payment", {
    p_sale_id: input.sale_id,
    p_amount: input.amount,
    p_payment_method: input.payment_method,
    p_reference: input.reference ?? null,
    p_notes: input.notes ?? null,
  });

  if (rpcErr) throw new Error(`Erreur paiement: ${rpcErr.message}`);

  // Fetch the created payment (most recent for this sale)
  const { data: payment, error: fetchErr } = await supabase
    .from("payments")
    .select("*")
    .eq("sale_id", input.sale_id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (fetchErr) throw new Error(`Erreur récupération paiement: ${fetchErr.message}`);
  return payment as DatabasePayment;
}

export async function getPaymentsSummary(): Promise<{
  totalReceived: number;
  totalPending: number;
  paidSales: number;
  partiallyPaidSales: number;
  unpaidSales: number;
}> {
  const supabase = await createServerSupabase();

  const { data: sales } = await supabase
    .from("sales")
    .select("id, total_amount")
    .eq("status", "confirmed");

  if (!sales?.length) {
    return { totalReceived: 0, totalPending: 0, paidSales: 0, partiallyPaidSales: 0, unpaidSales: 0 };
  }

  const saleIds = sales.map((s) => s.id);

  const { data: payments } = await supabase
    .from("payments")
    .select("sale_id, amount")
    .in("sale_id", saleIds);

  const paidBySale = new Map<string, number>();
  for (const p of payments ?? []) {
    paidBySale.set(p.sale_id, (paidBySale.get(p.sale_id) ?? 0) + p.amount);
  }

  let totalReceived = 0;
  let totalPending = 0;
  let paidSales = 0;
  let partiallyPaidSales = 0;
  let unpaidSales = 0;

  for (const sale of sales) {
    const paid = paidBySale.get(sale.id) ?? 0;
    totalReceived += paid;
    totalPending += sale.total_amount - paid;

    if (paid <= 0) unpaidSales++;
    else if (paid >= sale.total_amount) paidSales++;
    else partiallyPaidSales++;
  }

  return { totalReceived, totalPending, paidSales, partiallyPaidSales, unpaidSales };
}
