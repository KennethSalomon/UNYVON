"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  Organization,
  Product,
  Customer,
  Supplier,
  Sale,
  Purchase,
  Expense,
  Payment,
  Insight,
} from "@/types";
import {
  organization as initialOrganization,
  products as initialProducts,
  customers as initialCustomers,
  suppliers as initialSuppliers,
  sales as initialSales,
  purchases as initialPurchases,
  expenses as initialExpenses,
} from "@/lib/mock/data";

export interface NewSaleInput {
  customerId: string | null;
  customerName: string;
  items: { productId: string; quantity: number; total: number }[];
  total: number;
  paymentType: "cash" | "credit";
  amountPaid: number;
}

export interface NewPurchaseInput {
  supplierId: string;
  supplierName: string;
  items: { productId: string; quantity: number; total: number }[];
  total: number;
}

export interface NewExpenseInput {
  category: string;
  description: string;
  amount: number;
  date: string;
}

export interface NewProductInput {
  name: string;
  unit: string;
  costPrice: number;
  salePrice: number;
  stockQuantity: number;
  minStockThreshold: number;
  categoryId: string;
}

export interface NewCustomerInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

export interface NewSupplierInput {
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
}

interface AppContextValue {
  organization: Organization;
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  payments: Payment[];
  insights: Insight[];
  addSale: (input: NewSaleInput) => Sale;
  addPurchase: (input: NewPurchaseInput) => Purchase;
  addExpense: (input: NewExpenseInput) => Expense;
  addProduct: (input: NewProductInput) => Product;
  addCustomer: (input: NewCustomerInput) => Customer;
  addSupplier: (input: NewSupplierInput) => Supplier;
  recordPayment: (input: {
    saleId: string;
    amount: number;
    method: Payment["method"];
    reference?: string;
  }) => void;
  updateOrganization: (patch: Partial<Organization>) => void;
  getSale: (id: string) => Sale | undefined;
  getCustomer: (id: string) => Customer | undefined;
  getSupplier: (id: string) => Supplier | undefined;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_KEY = "unyvon-app-state-v1";

interface PersistedState {
  organization: Organization;
  products: Product[];
  suppliers: Supplier[];
  customers: Customer[];
  sales: Sale[];
  purchases: Purchase[];
  expenses: Expense[];
  payments: Payment[];
}

function makeId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
}

function getDefaults(): PersistedState {
  return {
    organization: initialOrganization,
    products: initialProducts,
    customers: initialCustomers,
    suppliers: initialSuppliers,
    sales: initialSales,
    purchases: initialPurchases,
    expenses: initialExpenses,
    payments: [],
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PersistedState>(() => getDefaults());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydratation one-shot du localStorage (système externe)
    setState((prev) => {
      const merged = { ...prev };
      try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          Object.assign(merged, JSON.parse(raw));
        }
      } catch {
        // stockage indisponible : on garde l'état par défaut
      }
      return merged;
    });
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) {
      return;
    }
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // stockage indisponible : on ignore silencieusement
    }
  }, [state, hydrated]);

  const { organization } = state;

  const value = useMemo<AppContextValue>(() => {
    const addSale = (input: NewSaleInput): Sale => {
      const sale: Sale = {
        id: makeId("sale"),
        customerId: input.customerId,
        customerName: input.customerName,
        items: input.items.map((item) => ({
          productId: item.productId,
          productName:
            state.products.find((p) => p.id === item.productId)?.name ?? "",
          quantity: item.quantity,
          unitPrice: item.quantity > 0 ? item.total / item.quantity : 0,
          total: item.total,
        })),
        total: input.total,
        paymentType: input.paymentType,
        amountPaid: input.amountPaid,
        createdAt: new Date().toISOString().slice(0, 10),
      };

      const nextProducts = state.products.map((p) => {
        const line = input.items.find((i) => i.productId === p.id);
        if (!line) return p;
        return { ...p, stockQuantity: Math.max(0, p.stockQuantity - line.quantity) };
      });

      let nextCustomers = state.customers;
      if (input.customerId) {
        nextCustomers = state.customers.map((c) =>
          c.id === input.customerId
            ? {
                ...c,
                totalPurchases: c.totalPurchases + input.total,
                outstandingBalance:
                  input.paymentType === "credit"
                    ? c.outstandingBalance + (input.total - input.amountPaid)
                    : c.outstandingBalance,
              }
            : c
        );
      } else {
        nextCustomers = [
          ...state.customers,
          {
            id: makeId("cust"),
            organizationId: state.organization.id,
            name: input.customerName,
            phone: "",
            email: "",
            address: "",
            notes: "",
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            totalPurchases: input.total,
            outstandingBalance:
              input.paymentType === "credit"
                ? input.total - input.amountPaid
                : 0,
          },
        ];
      }

      setState((prev) => ({
        ...prev,
        sales: [sale, ...prev.sales],
        products: nextProducts,
        customers: nextCustomers,
      }));

      return sale;
    };

    const addPurchase = (input: NewPurchaseInput): Purchase => {
      const purchaseId = makeId("pur");
      const purchase: Purchase = {
        id: purchaseId,
        organizationId: state.organization.id,
        supplierId: input.supplierId,
        supplierName: input.supplierName,
        reference: "",
        status: "received",
        totalAmount: input.total,
        purchaseDate: new Date().toISOString().slice(0, 10),
        notes: "",
        items: input.items.map((item, idx) => ({
          id: `pi-${purchaseId}-${idx}`,
          purchaseId,
          productId: item.productId,
          productName:
            state.products.find((p) => p.id === item.productId)?.name ?? "",
          quantity: item.quantity,
          unitCost: item.quantity > 0 ? item.total / item.quantity : 0,
          total: item.total,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const nextProducts = state.products.map((p) => {
        const line = input.items.find((i) => i.productId === p.id);
        if (!line) return p;
        return { ...p, stockQuantity: p.stockQuantity + line.quantity };
      });

      setState((prev) => ({
        ...prev,
        purchases: [purchase, ...prev.purchases],
        products: nextProducts,
      }));

      return purchase;
    };

    const addExpense = (input: NewExpenseInput): Expense => {
      const expense: Expense = {
        id: makeId("exp"),
        category: input.category,
        description: input.description,
        amount: input.amount,
        date: input.date,
      };
      setState((prev) => ({ ...prev, expenses: [expense, ...prev.expenses] }));
      return expense;
    };

    const addProduct = (input: NewProductInput): Product => {
      const now = new Date().toISOString();
      const product: Product = {
        id: makeId("prod"),
        organizationId: state.organization.id,
        name: input.name,
        unit: input.unit,
        costPrice: input.costPrice,
        salePrice: input.salePrice,
        stockQuantity: input.stockQuantity,
        minStockThreshold: input.minStockThreshold,
        categoryId: input.categoryId,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({ ...prev, products: [...prev.products, product] }));
      return product;
    };

    const addCustomer = (input: NewCustomerInput): Customer => {
      const now = new Date().toISOString();
      const customer: Customer = {
        id: makeId("cust"),
        organizationId: state.organization.id,
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        notes: input.notes,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        totalPurchases: 0,
        outstandingBalance: 0,
      };
      setState((prev) => ({ ...prev, customers: [...prev.customers, customer] }));
      return customer;
    };

    const addSupplier = (input: NewSupplierInput): Supplier => {
      const now = new Date().toISOString();
      const supplier: Supplier = {
        id: makeId("sup"),
        organizationId: state.organization.id,
        name: input.name,
        phone: input.phone,
        email: input.email,
        address: input.address,
        notes: input.notes,
        products: [],
        isActive: true,
        createdAt: now,
        updatedAt: now,
      };
      setState((prev) => ({ ...prev, suppliers: [...prev.suppliers, supplier] }));
      return supplier;
    };

    const recordPayment = (input: {
      saleId: string;
      amount: number;
      method: Payment["method"];
      reference?: string;
    }) => {
      const sale = state.sales.find((s) => s.id === input.saleId);
      if (!sale) return;

      const payment: Payment = {
        id: makeId("pay"),
        saleId: input.saleId,
        customerId: sale.customerId ?? "",
        amount: input.amount,
        method: input.method,
        reference: input.reference,
        date: new Date().toISOString().slice(0, 10),
      };

      setState((prev) => {
        const nextSales = prev.sales.map((s) =>
          s.id === input.saleId
            ? { ...s, amountPaid: s.amountPaid + input.amount }
            : s
        );

        const nextCustomers = prev.customers.map((c) => {
          if (c.id !== sale.customerId) return c;
          const due = sale.total - sale.amountPaid;
          const reduce = Math.min(due, input.amount);
          return {
            ...c,
            outstandingBalance: Math.max(0, c.outstandingBalance - reduce),
          };
        });

        return {
          ...prev,
          sales: nextSales,
          customers: nextCustomers,
          payments: [payment, ...prev.payments],
        };
      });
    };

    const updateOrganization = (patch: Partial<Organization>) => {
      setState((prev) => ({
        ...prev,
        organization: { ...prev.organization, ...patch },
      }));
    };

    return {
      organization,
      products: state.products,
      customers: state.customers,
      suppliers: state.suppliers,
      sales: state.sales,
      purchases: state.purchases,
      expenses: state.expenses,
      payments: state.payments,
      insights: computeInsights(state),
      addSale,
      addPurchase,
      addExpense,
      addProduct,
      addCustomer,
      addSupplier,
      recordPayment,
      updateOrganization,
      getSale: (id) => state.sales.find((s) => s.id === id),
      getCustomer: (id) => state.customers.find((c) => c.id === id),
      getSupplier: (id) => state.suppliers.find((s) => s.id === id),
    };
  }, [state, organization]);

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useApp doit être utilisé à l'intérieur d'AppProvider");
  }
  return ctx;
}




function computeInsights(state: PersistedState): Insight[] {
  const result: Insight[] = [];

  const lowStock = state.products.filter(
    (p) => p.stockQuantity <= p.minStockThreshold
  );
  for (const product of lowStock) {
    result.push({
      id: `ins-stock-${product.id}`,
      type: "risk",
      title: `Stock faible : ${product.name}`,
      description: `Il reste ${product.stockQuantity} ${product.unit}, sous le seuil minimal de ${product.minStockThreshold} ${product.unit}. Prévoyez un réapprovisionnement.`,
      severity: "warning",
    });
  }

  const totalReceivables = state.customers.reduce(
    (sum, c) => sum + c.outstandingBalance,
    0
  );
  if (totalReceivables > 0) {
    const topDebtors = [...state.customers]
      .sort((a, b) => b.outstandingBalance - a.outstandingBalance)
      .slice(0, 2)
      .filter((c) => c.outstandingBalance > 0);
    if (topDebtors.length > 0) {
      const share = Math.round(
        (topDebtors.reduce((s, c) => s + c.outstandingBalance, 0) /
          totalReceivables) *
          100
      );
      result.push({
        id: "ins-receiv-total",
        type: "receivable",
        title: `${topDebtors.length} client${topDebtors.length > 1 ? "s" : ""} concentre${topDebtors.length > 1 ? "nt" : ""} ${share} % des créances`,
        description: `${topDebtors
          .map((c) => `${c.name} (${new Intl.NumberFormat("fr-FR").format(c.outstandingBalance)} FCFA)`)
          .join(" et ")} représentent la majorité des ${new Intl.NumberFormat("fr-FR").format(totalReceivables)} FCFA de créances totales.`,
        severity: "warning",
      });
    }
  }

  const creditDue = state.sales
    .filter((s) => s.paymentType === "credit" && s.amountPaid < s.total)
    .reduce((sum, s) => sum + (s.total - s.amountPaid), 0);
  if (creditDue > 0) {
    result.push({
      id: "ins-receiv-due",
      type: "receivable",
      title: `${new Intl.NumberFormat("fr-FR").format(creditDue)} FCFA de factures à encaisser`,
      description: `Les ventes à crédit non soldées représentent ${new Intl.NumberFormat("fr-FR").format(creditDue)} FCFA. Relancez vos clients pour sécuriser la trésorerie.`,
      severity: "info",
    });
  }

  const totalRevenue = state.sales.reduce((sum, s) => sum + s.total, 0);
  const totalCost = state.sales.reduce((sum, s) => {
    const cost = s.items.reduce((iSum, item) => {
      const prod = state.products.find((p) => p.id === item.productId);
      return iSum + (prod ? prod.costPrice * item.quantity : 0);
    }, 0);
    return sum + cost;
  }, 0);
  if (totalRevenue > 0) {
    const margin = ((totalRevenue - totalCost) / totalRevenue) * 100;
    if (margin < 20) {
      result.push({
        id: "ins-margin-low",
        type: "margin",
        title: "Marge globale sous les 20 %",
        description: `La marge brute globale est de ${margin.toFixed(1)} %. Passez en revue vos prix de vente et vos coûts d'achat.`,
        severity: "warning",
      });
    }
  }

  const topProducts = [...state.products]
    .sort((a, b) => b.salePrice - a.salePrice)
    .slice(0, 1);
  if (topProducts.length > 0 && totalRevenue > 0) {
    result.push({
      id: "ins-opp-ca",
      type: "opportunity",
      title: `${topProducts[0].name} est un produit à fort potentiel`,
      description: `Son prix de vente unitaire est le plus élevé du catalogue. Misez dessus dans vos prochaines ventes pour doper le chiffre d'affaires.`,
      severity: "info",
    });
  }

  return result;
}









