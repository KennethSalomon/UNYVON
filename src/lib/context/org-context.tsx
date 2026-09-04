"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { getActiveOrganizationAction } from "@/lib/supabase/org-actions";

export type OrgRole = "owner" | "manager" | "seller" | "stockkeeper" | null;

export interface ActiveOrganization {
  id: string;
  name: string;
  sector: string;
  currency: string;
  role: Exclude<OrgRole, null>;
}

export interface Permissions {
  canManageOrganization: boolean;
  canManageTeam: boolean;
  canCreateSale: boolean;
  canManageInventory: boolean;
  canManageBilling: boolean;
  canManageProducts: boolean;
  canManageCategories: boolean;
}

const ROLE_PERMISSIONS: Record<Exclude<OrgRole, null>, Permissions> = {
  owner: {
    canManageOrganization: true,
    canManageTeam: true,
    canCreateSale: true,
    canManageInventory: true,
    canManageBilling: true,
    canManageProducts: true,
    canManageCategories: true,
  },
  manager: {
    canManageOrganization: true,
    canManageTeam: true,
    canCreateSale: true,
    canManageInventory: true,
    canManageBilling: false,
    canManageProducts: true,
    canManageCategories: true,
  },
  seller: {
    canManageOrganization: false,
    canManageTeam: false,
    canCreateSale: true,
    canManageInventory: false,
    canManageBilling: false,
    canManageProducts: false,
    canManageCategories: false,
  },
  stockkeeper: {
    canManageOrganization: false,
    canManageTeam: false,
    canCreateSale: false,
    canManageInventory: true,
    canManageBilling: false,
    canManageProducts: true,
    canManageCategories: false,
  },
};

interface OrgContextValue {
  /** null tant que le chargement n'est pas terminé (ou Supabase non configuré). */
  organization: ActiveOrganization | null;
  role: OrgRole;
  permissions: Permissions | null;
  loading: boolean;
  reload: () => void;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({ children }: { children: ReactNode }) {
  const [organization, setOrganization] = useState<ActiveOrganization | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const active = await getActiveOrganizationAction();
        if (cancelled) return;
        if (active) {
          const membership = Array.isArray(active.organization_users)
            ? active.organization_users[0]
            : null;
          const role = (membership?.role ?? null) as Exclude<OrgRole, null>;
          setOrganization({
            id: active.id,
            name: active.name,
            sector: active.sector,
            currency: active.currency,
            role,
          });
        } else {
          setOrganization(null);
        }
      } catch {
        if (cancelled) return;
        setOrganization(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tick]);

  const role: OrgRole = organization ? organization.role : null;
  const permissions = organization
    ? ROLE_PERMISSIONS[organization.role]
    : null;

  const value: OrgContextValue = {
    organization,
    role,
    permissions,
    loading,
    reload: () => {
      setLoading(true);
      setTick((t) => t + 1);
    },
  };

  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

export function useOrg(): OrgContextValue {
  const ctx = useContext(OrgContext);
  if (!ctx) {
    throw new Error("useOrg doit être utilisé à l'intérieur d'OrgProvider");
  }
  return ctx;
}
