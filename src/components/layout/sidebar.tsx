"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Truck,
  Users,
  Receipt,
  Sparkles,
  UserCog,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Ventes", icon: ShoppingCart },
  { href: "/products", label: "Produits", icon: Package },
  { href: "/inventory", label: "Stock", icon: Warehouse },
  { href: "/purchases", label: "Achats", icon: Truck },
  { href: "/customers", label: "Clients", icon: Users },
  { href: "/expenses", label: "Dépenses", icon: Receipt },
];

const bottomItems = [
  { href: "/insights", label: "NOVA", icon: Sparkles },
  { href: "/team", label: "Équipe", icon: UserCog },
  { href: "/settings", label: "Paramètres", icon: Settings },
  { href: "/billing", label: "Abonnement", icon: CreditCard },
];

interface SidebarProps {
  mobileOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex flex-col h-screen border-r border-border bg-surface transition-all duration-300 ease-out sticky top-0 shrink-0",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        <SidebarContent pathname={pathname} collapsed={collapsed} onToggleCollapse={() => setCollapsed(!collapsed)} />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex flex-col w-[280px] bg-surface border-r border-border transform transition-transform duration-300 ease-out md:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-border shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">U</span>
            </div>
            <span className="font-display font-semibold text-lg text-ink">UNYVON</span>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-[10px] text-muted hover:text-text hover:bg-background transition-colors"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <SidebarContent pathname={pathname} collapsed={false} onLinkClick={onClose} />
      </aside>
    </>
  );
}

interface SidebarContentProps {
  pathname: string;
  collapsed: boolean;
  onToggleCollapse?: () => void;
  onLinkClick?: () => void;
}

function SidebarContent({ pathname, collapsed, onToggleCollapse, onLinkClick }: SidebarContentProps) {
  return (
    <>
      {!collapsed && (
        <div className="hidden md:flex items-center gap-2 px-4 h-16 border-b border-border shrink-0">
          <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center">
            <span className="text-white font-display font-bold text-sm">U</span>
          </div>
          <span className="font-display font-semibold text-lg text-ink">UNYVON</span>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-3 px-2">
        <div className="space-y-0.5">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors duration-150",
                  active
                    ? "bg-lavender-soft text-primary"
                    : "text-muted hover:text-text hover:bg-background"
                )}
                title={collapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>

        <div className="my-3 mx-3 border-t border-border" />

        <div className="space-y-0.5">
          {bottomItems.map((item) => {
            const active = pathname === item.href;
            const isNova = item.label === "NOVA";
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onLinkClick}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-[10px] text-sm font-medium transition-colors duration-150",
                  isNova && !active && "text-primary/70 hover:text-primary",
                  active
                    ? "bg-lavender-soft text-primary"
                    : !isNova && "text-muted hover:text-text hover:bg-background"
                )}
                title={collapsed ? item.label : undefined}
              >
                {isNova ? (
                  <span className="w-5 h-5 shrink-0 flex items-center justify-center text-primary">
                    ✦
                  </span>
                ) : (
                  <item.icon className="w-5 h-5 shrink-0" />
                )}
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </div>
      </nav>

      {onToggleCollapse && (
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center h-12 border-t border-border text-muted hover:text-text transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      )}
    </>
  );
}
