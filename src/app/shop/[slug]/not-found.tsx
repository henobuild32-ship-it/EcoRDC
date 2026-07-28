import React from 'react';
import Link from 'next/link';
import { Store, ArrowLeft, Home, Search } from 'lucide-react';

export default function ShopNotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/30 to-teal-50/20 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center bg-white dark:bg-slate-900 rounded-3xl p-8 shadow-xl border border-slate-100 dark:border-slate-800">
        <div className="h-20 w-20 rounded-2xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <Store className="h-10 w-10" />
        </div>

        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Boutique introuvable
        </h1>

        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          La boutique que vous cherchez n&apos;existe pas, a été déplacée ou son adresse a changé.
        </p>

        <div className="space-y-3">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition-all shadow-lg shadow-emerald-600/20 text-sm gap-2"
          >
            <Search className="h-4 w-4" />
            Parcourir les boutiques sur EcoRDC
          </Link>

          <Link
            href="/"
            className="w-full inline-flex items-center justify-center px-5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors text-sm gap-2"
          >
            <Home className="h-4 w-4" />
            Page d&apos;accueil
          </Link>
        </div>
      </div>
    </div>
  );
}
