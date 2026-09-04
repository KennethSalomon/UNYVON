import { InventoryClient } from "./inventory-client";
import { getOrgStocks, getInventoryMovements, getInventoryHistory } from "@/lib/supabase/inventory-actions";
import type { ProductStock, InventoryMovement, InventoryCount } from "@/types";

export default async function InventoryPage() {
  let stocks: ProductStock[] = [];
  let movements: InventoryMovement[] = [];
  let history: InventoryCount[] = [];
  let error: string | null = null;

  try {
    [stocks, movements, history] = await Promise.all([
      getOrgStocks(),
      getInventoryMovements(),
      getInventoryHistory(),
    ]);
  } catch (e) {
    error = e instanceof Error ? e.message : "Erreur chargement stock";
  }

  return (
    <InventoryClient
      stocks={stocks}
      movements={movements}
      history={history}
      error={error ?? null}
    />
  );
}
