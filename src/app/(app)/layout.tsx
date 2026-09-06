"use client";

import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { AppProvider } from "@/lib/context/app-context";
import { OrgProvider, useOrg } from "@/lib/context/org-context";
import { useRouter } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { Loader2 } from "lucide-react";

function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { organization, user, loading } = useOrg();

  useEffect(() => {
    if (!loading && user && !organization) {
      router.replace("/onboarding");
    }
  }, [loading, user, organization, router]);

  const toggleMenu = useCallback(() => {
    setMobileMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);

  if (loading || !user || !organization) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
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
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppProvider>
      <OrgProvider>
        <AppShell>{children}</AppShell>
      </OrgProvider>
    </AppProvider>
  );
}

