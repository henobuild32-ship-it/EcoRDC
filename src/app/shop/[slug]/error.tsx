'use client';

export default function ShopError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-red-50/30 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="h-20 w-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
          <svg className="h-10 w-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold mb-2">Une erreur est survenue</h1>
        <p className="text-muted-foreground mb-6">
          La boutique est temporairement indisponible. Veuillez réessayer.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          Réessayer
        </button>
      </div>
    </div>
  );
}
