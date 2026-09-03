"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AppProvider } from "@/lib/context/app-context";
import { useState, useCallback } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  return (
    <AppProvider>
      <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 backdrop-blur-sm md:hidden"
          onClick={closeMenu}
        />
      )}

      <Sidebar mobileOpen={mobileMenuOpen} onClose={closeMenu} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Topbar onMenuToggle={toggleMenu} />
        <main id="main-content" className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="animate-fade-in">{children}</div>
        </main>
        </div>
      </div>
    </AppProvider>
  );
}

