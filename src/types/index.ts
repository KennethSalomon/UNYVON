export interface Organization {
  id: string;
  name: string;
  sector: string;
  currency: string;
}

export interface Category {
  id: string;
  organizationId: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  organizationId: string;
  name: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minStockThreshold: number;
  categoryId: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryInput {
  name: string;
}

export interface UpdateCategoryInput {
  id: string;
  name: string;
}

export interface CreateProductInput {
  name: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  minStockThreshold: number;
  categoryId: string | null;
}

export interface UpdateProductInput {
  id: string;
  name?: string;
  unit?: string;
  costPrice?: number;
  salePrice?: number;
  minStockThreshold?: number;
  categoryId?: string | null;
  isActive?: boolean;
}

// Supabase DB row types (snake_case)
export interface DatabaseCategory {
  id: string;
  organization_id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseProduct {
  id: string;
  organization_id: string;
  category_id: string | null;
  name: string;
  unit: string;
  cost_price: number;
  sale_price: number;
  min_stock_threshold: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  totalPurchases: number;
  outstandingBalance: number;
}

export interface Supplier {
  id: string;
  organizationId: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  products: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCustomerInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface UpdateCustomerInput {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

export interface CreateSupplierInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface UpdateSupplierInput {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  address?: string;
  notes?: string;
  isActive?: boolean;
}

// Supabase DB row types (snake_case)
export interface DatabaseCustomer {
  id: string;
  organization_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSupplier {
  id: string;
  organization_id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Sale {
  id: string;
  customerId: string | null;
  customerName: string;
  items: SaleItem[];
  total: number;
  paymentType: "cash" | "credit";
  amountPaid: number;
  createdAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export type PurchaseStatus = "draft" | "received" | "cancelled";

export type SaleStatus = "draft" | "confirmed" | "cancelled";

export interface DatabaseSale {
  id: string;
  organization_id: string;
  customer_id: string | null;
  reference: string | null;
  status: SaleStatus;
  sale_date: string;
  subtotal: number;
  total_amount: number;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  unit_cost_snapshot: number;
  total: number;
  created_at: string;
}

export interface SaleWithItems extends DatabaseSale {
  items: (DatabaseSaleItem & { productName: string; productUnit: string })[];
  customerName: string | null;
}

export interface CreateSaleInput {
  customerId?: string | null;
  reference?: string;
  saleDate?: string;
  notes?: string;
  items: {
    productId: string;
    quantity: number;
    unitPrice: number;
    unitCostSnapshot: number;
  }[];
}

export interface UpdateSaleInput {
  id: string;
  reference?: string;
  saleDate?: string;
  notes?: string;
  customerId?: string | null;
}

export interface Purchase {
  id: string;
  organizationId: string;
  supplierId: string;
  supplierName: string;
  reference: string;
  status: PurchaseStatus;
  totalAmount: number;
  purchaseDate: string;
  notes: string;
  items: PurchaseItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
}

export interface DatabasePurchase {
  id: string;
  organization_id: string;
  supplier_id: string;
  reference: string | null;
  status: PurchaseStatus;
  total_amount: number;
  purchase_date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface DatabasePurchaseItem {
  id: string;
  purchase_id: string;
  product_id: string;
  quantity: number;
  unit_cost: number;
  total: number;
  created_at: string;
}

export interface CreatePurchaseInput {
  supplierId: string;
  reference: string;
  purchaseDate: string;
  notes: string;
  items: {
    productId: string;
    quantity: number;
    unitCost: number;
  }[];
}

export interface UpdatePurchaseInput {
  id: string;
  reference?: string;
  purchaseDate?: string;
  notes?: string;
}

export interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

export type MovementType = "opening" | "purchase_receipt" | "sale" | "adjustment_in" | "adjustment_out";

export type AdjustmentReason = "loss" | "damage" | "counting_error" | "data_entry_error" | "other";

export interface InventoryMovement {
  id: string;
  organizationId: string;
  productId: string;
  productName: string;
  movementType: MovementType;
  quantity: number;
  unitCost: number | null;
  referenceType: string | null;
  referenceId: string | null;
  reason: string | null;
  createdBy: string;
  createdAt: string;
}

export interface DatabaseInventoryMovement {
  id: string;
  organization_id: string;
  product_id: string;
  movement_type: MovementType;
  quantity: number;
  unit_cost: number | null;
  reference_type: string | null;
  reference_id: string | null;
  reason: string | null;
  created_by: string;
  created_at: string;
}

export interface InventoryCount {
  id: string;
  organizationId: string;
  productId: string;
  productName: string;
  theoreticalQty: number;
  physicalQty: number;
  gap: number;
  reason: AdjustmentReason | null;
  notes: string | null;
  createdBy: string;
  createdAt: string;
}

export interface DatabaseInventoryCount {
  id: string;
  organization_id: string;
  product_id: string;
  theoretical_qty: number;
  physical_qty: number;
  gap: number;
  reason: AdjustmentReason | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface ProductStock {
  productId: string;
  productName: string;
  unit: string;
  stock: number;
  minStockThreshold: number;
  status: "critical" | "warning" | "normal";
}

export interface CreateInventoryCountInput {
  productId: string;
  physicalQty: number;
  reason: AdjustmentReason;
  notes: string;
}

export interface Insight {
  id: string;
  type: "risk" | "anomaly" | "margin" | "receivable" | "opportunity";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
}

export interface KPICard {
  label: string;
  value: string;
  change: number;
  changeLabel: string;
}

export interface Payment {
  id: string;
  saleId: string;
  customerId: string;
  amount: number;
  method: "cash" | "momo" | "moov" | "bank_transfer" | "other";
  reference?: string;
  date: string;
}

export type PaymentMethod = Payment["method"];

export type DatabasePaymentMethod = "cash" | "mobile_money" | "bank_transfer" | "other";

export type PaymentStatus = "unpaid" | "partially_paid" | "paid";

export interface DatabasePayment {
  id: string;
  organization_id: string;
  sale_id: string;
  amount: number;
  payment_method: DatabasePaymentMethod;
  payment_date: string;
  reference: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
}

export interface PaymentWithSale extends DatabasePayment {
  saleReference: string | null;
  saleTotalAmount: number;
  customerName: string | null;
}

export interface SalePaymentStatus {
  total_amount: number;
  total_paid: number;
  remaining: number;
  payment_status: PaymentStatus;
}

export interface CustomerBalance {
  total_purchases: number;
  total_paid: number;
  outstanding: number;
}

export interface CreatePaymentInput {
  sale_id: string;
  amount: number;
  payment_method: DatabasePaymentMethod;
  reference?: string;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Expenses + Cashflow (Phase 2H)
// ---------------------------------------------------------------------------

export type ExpenseCategory =
  | "rent"
  | "transport"
  | "personnel"
  | "electricity"
  | "communication"
  | "supplies"
  | "maintenance"
  | "other";

export interface DatabaseExpense {
  id: string;
  organization_id: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date: string;
  payment_method: DatabasePaymentMethod;
  reference: string | null;
  notes: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ExpenseSummary {
  total: number;
  expense_count: number;
  category: ExpenseCategory;
  category_total: number;
}

export interface CashflowSummary {
  total_receipts: number;
  total_expenses: number;
  net_cashflow: number;
}

export interface CreateExpenseInput {
  category: ExpenseCategory;
  description: string;
  amount: number;
  expense_date?: string;
  payment_method: DatabasePaymentMethod;
  reference?: string;
  notes?: string;
}

export interface UpdateExpenseInput {
  id: string;
  category?: ExpenseCategory;
  description?: string;
  amount?: number;
  expense_date?: string;
  payment_method?: DatabasePaymentMethod;
  reference?: string;
  notes?: string;
}

