'use client';

import React, { useEffect } from 'react';
import { notFound } from 'next/navigation';

export default function ShopError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    if (error?.message?.includes('NEXT_NOT_FOUND') || error?.digest === 'NEXT_NOT_FOUND') {
      notFound();
    }
  }, [error]);

  if (error?.message?.includes('NEXT_NOT_FOUND') || error?.digest === 'NEXT_NOT_FOUND') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-orange-50/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
        <div className="h-20 w-20 rounded-2xl bg-red-100 dark:bg-red-900/30 text-red-500 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <svg className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Chargement de la boutique
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Un problème temporaire est survenu lors de l&apos;accès à la boutique. Cliquez sur réessayer pour recharger.
        </p>

        <div className="space-y-3">
          <button
            onClick={() => reset()}
            className="w-full inline-flex items-center justify-center px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-sm"
          >
            Réessayer
          </button>

          <a
            href="/"
            className="w-full inline-flex items-center justify-center px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors text-sm"
          >
            Retourner à l&apos;accueil
          </a>
        </div>
      </div>
    </div>
  );
}

