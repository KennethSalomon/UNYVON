export interface Organization {
  id: string;
  name: string;
  sector: string;
  currency: string;
}

export interface Product {
  id: string;
  name: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minStockThreshold: number;
  categoryId: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  totalPurchases: number;
  outstandingBalance: number;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  products: string[];
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

export interface Purchase {
  id: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  total: number;
  createdAt: string;
}

export interface PurchaseItem {
  productId: string;
  productName: string;
  quantity: number;
  unitCost: number;
  total: number;
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

