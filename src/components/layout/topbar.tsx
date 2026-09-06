"use client";

import { Menu, LogOut } from "lucide-react";
import { useOrg } from "@/lib/context/org-context";
import { signOutAction } from "@/lib/supabase/auth-actions";

interface TopbarProps {
  onMenuToggle?: () => void;
}

function getInitials(firstName: string, lastName: string, email: string): string {
  if (firstName || lastName) {
    return ((firstName?.[0] ?? "") + (lastName?.[0] ?? "")).toUpperCase() || "U";
  }
  return email?.[0]?.toUpperCase() ?? "U";
}

function getDisplayName(firstName: string, lastName: string, email: string): string {
  if (firstName || lastName) {
    return `${firstName} ${lastName}`.trim();
  }
  return email?.split("@")[0] ?? "Utilisateur";
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const { organization, user } = useOrg();

  const displayName = getDisplayName(
    user?.firstName ?? "",
    user?.lastName ?? "",
    user?.email ?? ""
  );
  const initials = getInitials(
    user?.firstName ?? "",
    user?.lastName ?? "",
    user?.email ?? ""
  );

  return (
    <header className="h-16 border-b border-border bg-surface/80 backdrop-blur-lg flex items-center justify-between px-4 md:px-6 sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          aria-label="Ouvrir le menu"
          className="md:hidden p-2 rounded-[10px] text-muted hover:text-text hover:bg-background transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-lavender-soft flex items-center justify-center">
            <span className="text-primary font-display font-semibold text-xs">{initials}</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-ink leading-tight">{displayName}</p>
            <p className="text-xs text-muted leading-tight">{organization?.name ?? ""}</p>
          </div>
        </div>

        <form action={signOutAction}>
          <button
            type="submit"
            aria-label="Se déconnecter"
            title="Se déconnecter"
            className="p-2 rounded-[10px] text-muted hover:text-error hover:bg-background transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </form>
      </div>
    </header>
  );
}

