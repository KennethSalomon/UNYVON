"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary-dark items-center justify-center p-12">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 rounded-[16px] bg-white/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-white font-display font-bold text-2xl">U</span>
          </div>
          <h1 className="font-display text-3xl font-bold text-white mb-4">
            UNYVON
          </h1>
          <p className="text-white/80 text-lg leading-relaxed">
            Créez votre compte et commencez à piloter votre entreprise en quelques minutes.
          </p>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-[10px] bg-primary flex items-center justify-center">
              <span className="text-white font-display font-bold text-sm">U</span>
            </div>
            <span className="font-display font-semibold text-lg text-ink">UNYVON</span>
          </div>

          <h2 className="font-display text-2xl font-bold text-ink">Créer un compte</h2>
          <p className="text-sm text-muted mt-1 mb-8">
            Essai gratuit de 14 jours. Sans carte bancaire.
          </p>

          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">
                  Prénom
                </label>
                <input
                  type="text"
                  placeholder="Patrick"
                  className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-text block mb-1.5">
                  Nom
                </label>
                <input
                  type="text"
                  placeholder="Tognon"
                  className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">
                Email
              </label>
              <input
                type="email"
                placeholder="vous@entreprise.com"
                className="w-full h-11 px-4 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-text block mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="8 caractères minimum"
                  className="w-full h-11 px-4 pr-10 rounded-[10px] border border-border bg-surface text-sm text-text placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-text transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
            <Link href="/onboarding">
              <Button className="w-full" size="lg">
                Créer mon compte
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </form>

          <p className="text-center text-sm text-muted mt-6">
            Déjà un compte ?{" "}
            <Link href="/login" className="text-primary font-medium hover:text-primary-dark transition-colors">
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

