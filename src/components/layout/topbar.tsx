"use client";

import { Search, Bell, Menu } from "lucide-react";
import { useApp } from "@/lib/context/app-context";
import { useState } from "react";

interface TopbarProps {
  onMenuToggle?: () => void;
}

export function Topbar({ onMenuToggle }: TopbarProps) {
  const [searchFocused, setSearchFocused] = useState(false);
  const { organization } = useApp();

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

        <div
          className={`hidden sm:flex items-center gap-2 h-9 px-3 rounded-[10px] border transition-all duration-200 ${
            searchFocused
              ? "border-primary ring-2 ring-primary/20 w-64"
              : "border-border w-56"
          }`}
        >
          <Search className="w-4 h-4 text-muted shrink-0" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="flex-1 bg-transparent text-sm text-text placeholder:text-muted focus:outline-none"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="hidden lg:inline text-[10px] text-muted bg-background px-1.5 py-0.5 rounded border border-border">
            ⌘K
          </kbd>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          aria-label="Notifications"
          className="relative p-2 rounded-[10px] text-muted hover:text-text hover:bg-background transition-colors"
        >
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full" />
        </button>

        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <div className="w-8 h-8 rounded-full bg-lavender-soft flex items-center justify-center">
            <span className="text-primary font-display font-semibold text-xs">PO</span>
          </div>
          <div className="hidden lg:block">
            <p className="text-sm font-medium text-ink leading-tight">Patrick</p>
            <p className="text-xs text-muted leading-tight">{organization.name}</p>
          </div>
        </div>
      </div>
    </header>
  );
}

