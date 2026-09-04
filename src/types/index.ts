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

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  type: "purchase" | "sale" | "adjustment";
  quantity: number;
  date: string;
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

