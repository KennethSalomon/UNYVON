export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <p className="font-display text-6xl font-bold text-ink mb-4">404</p>
        <h1 className="font-display text-xl font-semibold text-ink mb-2">
          Page introuvable
        </h1>
        <p className="text-sm text-muted mb-6">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>
        <a
          href="/dashboard"
          className="inline-flex items-center justify-center h-11 px-6 rounded-button bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          Retour au dashboard
        </a>
      </div>
    </div>
  );
}
