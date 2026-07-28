import React from 'react';
import Link from 'next/link';
import { Store, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
        <div className="h-20 w-20 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Store className="h-10 w-10" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Page introuvable (404)
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          La page que vous recherchez n&apos;existe pas ou a été déplacée.
        </p>

        <Link
          href="/"
          className="w-full inline-flex items-center justify-center px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-sm gap-2"
        >
          <Home className="h-4 w-4" />
          Retourner à l&apos;accueil
        </Link>
      </div>
    </div>
  );
}
