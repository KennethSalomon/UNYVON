import type {
  Organization,
  Product,
  Customer,
  Supplier,
  Sale,
  Purchase,
  Expense,
} from "@/types";

export const organization: Organization = {
  id: "org-1",
  name: "AgroDistrib Cotonou",
  sector: "Distribution B2B agroalimentaire",
  currency: "FCFA",
};

export const products: Product[] = [
  {
    id: "prod-1",
    name: "Riz 25kg",
    unit: "sac",
    costPrice: 18000,
    salePrice: 22000,
    stockQuantity: 340,
    minStockThreshold: 100,
    categoryId: "cat-cereales",
  },
  {
    id: "prod-2",
    name: "Huile 5L",
    unit: "bidon",
    costPrice: 12000,
    salePrice: 15500,
    stockQuantity: 85,
    minStockThreshold: 40,
    categoryId: "cat-huiles",
  },
  {
    id: "prod-3",
    name: "Maïs 50kg",
    unit: "sac",
    costPrice: 22000,
    salePrice: 28000,
    stockQuantity: 120,
    minStockThreshold: 50,
    categoryId: "cat-cereales",
  },
  {
    id: "prod-4",
    name: "Soja 50kg",
    unit: "sac",
    costPrice: 25000,
    salePrice: 32000,
    stockQuantity: 15,
    minStockThreshold: 30,
    categoryId: "cat-cereales",
  },
  {
    id: "prod-5",
    name: "Aliment bétail 50kg",
    unit: "sac",
    costPrice: 19000,
    salePrice: 24000,
    stockQuantity: 60,
    minStockThreshold: 25,
    categoryId: "cat-betail",
  },
];

export const customers: Customer[] = [
  {
    id: "cust-1",
    name: "Épicerie Sainte-Rita",
    phone: "+229 97 00 00 01",
    address: "Quartier Zongo, Cotonou",
    totalPurchases: 633500,
    outstandingBalance: 483500,
  },
  {
    id: "cust-2",
    name: "Marché Zongo",
    phone: "+229 97 00 00 02",
    address: "Marché Dantokpa, Cotonou",
    totalPurchases: 440000,
    outstandingBalance: 0,
  },
  {
    id: "cust-3",
    name: "Restaurant Chez Maman",
    phone: "+229 97 00 00 03",
    address: "Haie-Vive, Cotonou",
    totalPurchases: 132000,
    outstandingBalance: 132000,
  },
  {
    id: "cust-4",
    name: "Boutique Y",
    phone: "+229 97 00 00 04",
    address: "Tokpa-Ahito, Cotonou",
    totalPurchases: 124000,
    outstandingBalance: 0,
  },
];

export const suppliers: Supplier[] = [
  {
    id: "sup-1",
    name: "Fournisseur A — Riz",
    phone: "+229 96 00 00 01",
    products: ["Riz 25kg", "Maïs 50kg"],
  },
  {
    id: "sup-2",
    name: "Fournisseur B — Huiles",
    phone: "+229 96 00 00 02",
    products: ["Huile 5L"],
  },
  {
    id: "sup-3",
    name: "Fournisseur C — Bétail",
    phone: "+229 96 00 00 03",
    products: ["Aliment bétail 50kg", "Soja 50kg"],
  },
];

export const sales: Sale[] = [
  {
    id: "sale-1",
    customerId: "cust-1",
    customerName: "Épicerie Sainte-Rita",
    items: [
      { productId: "prod-1", productName: "Riz 25kg", quantity: 10, unitPrice: 22000, total: 220000 },
      { productId: "prod-2", productName: "Huile 5L", quantity: 5, unitPrice: 15500, total: 77500 },
    ],
    total: 297500,
    paymentType: "credit",
    amountPaid: 100000,
    createdAt: "2026-09-02",
  },
  {
    id: "sale-2",
    customerId: "cust-2",
    customerName: "Marché Zongo",
    items: [
      { productId: "prod-1", productName: "Riz 25kg", quantity: 20, unitPrice: 22000, total: 440000 },
    ],
    total: 440000,
    paymentType: "cash",
    amountPaid: 440000,
    createdAt: "2026-09-02",
  },
  {
    id: "sale-3",
    customerId: "cust-3",
    customerName: "Restaurant Chez Maman",
    items: [
      { productId: "prod-3", productName: "Maïs 50kg", quantity: 3, unitPrice: 28000, total: 84000 },
      { productId: "prod-5", productName: "Aliment bétail 50kg", quantity: 2, unitPrice: 24000, total: 48000 },
    ],
    total: 132000,
    paymentType: "credit",
    amountPaid: 0,
    createdAt: "2026-09-01",
  },
  {
    id: "sale-4",
    customerId: "cust-4",
    customerName: "Boutique Y",
    items: [
      { productId: "prod-2", productName: "Huile 5L", quantity: 8, unitPrice: 15500, total: 124000 },
    ],
    total: 124000,
    paymentType: "cash",
    amountPaid: 124000,
    createdAt: "2026-09-01",
  },
  {
    id: "sale-5",
    customerId: "cust-1",
    customerName: "Épicerie Sainte-Rita",
    items: [
      { productId: "prod-4", productName: "Soja 50kg", quantity: 5, unitPrice: 32000, total: 160000 },
      { productId: "prod-1", productName: "Riz 25kg", quantity: 8, unitPrice: 22000, total: 176000 },
    ],
    total: 336000,
    paymentType: "credit",
    amountPaid: 50000,
    createdAt: "2026-08-30",
  },
];

export const purchases: Purchase[] = [
  {
    id: "pur-1",
    supplierId: "sup-1",
    supplierName: "Fournisseur A — Riz",
    items: [
      { productId: "prod-1", productName: "Riz 25kg", quantity: 50, unitCost: 18000, total: 900000 },
      { productId: "prod-3", productName: "Maïs 50kg", quantity: 20, unitCost: 22000, total: 440000 },
    ],
    total: 1340000,
    createdAt: "2026-08-28",
  },
  {
    id: "pur-2",
    supplierId: "sup-2",
    supplierName: "Fournisseur B — Huiles",
    items: [
      { productId: "prod-2", productName: "Huile 5L", quantity: 30, unitCost: 12000, total: 360000 },
    ],
    total: 360000,
    createdAt: "2026-08-27",
  },
];

export const expenses: Expense[] = [
  { id: "exp-1", category: "Loyer", description: "Loyer entrepôt septembre", amount: 150000, date: "2026-09-01" },
  { id: "exp-2", category: "Transport", description: "Livraison clients Zone Nord", amount: 35000, date: "2026-09-01" },
  { id: "exp-3", category: "Personnel", description: "Salaires septembre", amount: 280000, date: "2026-09-01" },
  { id: "exp-4", category: "Électricité", description: "Facture CEB septembre", amount: 45000, date: "2026-08-30" },
];



