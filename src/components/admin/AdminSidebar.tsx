'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type AppView } from '@/lib/store';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  LayoutDashboard,
  Store,
  Users,
  ShoppingBag,
  ShoppingCart,
  MessageCircle,
  Star,
  KeyRound,
  Settings,
  Package,
  FileText,
  Bell,
  BarChart3,
  LogOut,
  Menu,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Flag,
  CreditCard,
  Banknote,
} from 'lucide-react';

interface AdminNavItem {
  view: AppView;
  label: string;
  icon: React.ElementType;
}

const adminNavItems: AdminNavItem[] = [
  { view: 'admin-dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { view: 'admin-clients', label: 'Clients', icon: Users },
  { view: 'admin-vendors', label: 'Vendeurs', icon: Store },
  { view: 'admin-shops', label: 'Boutiques', icon: ShoppingBag },
  { view: 'admin-products', label: 'Produits', icon: Package },
  { view: 'admin-orders', label: 'Commandes', icon: ShoppingCart },
  { view: 'admin-invoices', label: 'Factures', icon: FileText },
  { view: 'admin-messages', label: 'Messages', icon: MessageCircle },
  { view: 'admin-notifications', label: 'Notifications', icon: Bell },
  { view: 'admin-recommendations', label: 'Boutiques recommandées', icon: Star },
  { view: 'admin-verifications', label: 'Vérifications', icon: ShieldCheck },
  { view: 'admin-reports', label: 'Signalements', icon: Flag },
  { view: 'admin-password-resets', label: 'Mots de passe', icon: KeyRound },
  { view: 'admin-subscriptions', label: 'Abonnements', icon: CreditCard },
  { view: 'admin-payments', label: 'Paiements', icon: Banknote },
  { view: 'admin-security', label: 'Sécurité', icon: ShieldAlert },
  { view: 'admin-statistics', label: 'Statistiques', icon: BarChart3 },
  { view: 'admin-settings', label: 'Paramètres', icon: Settings },
];

function SidebarContent({ onItemClick }: { onItemClick?: () => void }) {
  const { currentView, setCurrentView, logout } = useAppStore();

  return (
    <div className="flex flex-col h-full bg-[#0f172a]">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-[#1e3a5f] flex items-center justify-center shadow-lg shadow-blue-900/30 shrink-0 border border-blue-500/20">
            <Shield className="h-5 w-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg text-white leading-tight">
              EcoRDC Admin
            </h2>
            <p className="text-[10px] text-slate-500 font-mono">
              Panneau d&apos;administration
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-0.5 max-h-[calc(100vh-10rem)]">
        {adminNavItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              onClick={() => {
                setCurrentView(item.view);
                onItemClick?.();
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative border-l-2 ${
                isActive
                  ? 'text-white bg-[#1e3a5f] border-blue-400 shadow-md shadow-blue-900/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700 border-transparent'
              }`}
            >
              <item.icon
                className={`h-4 w-4 shrink-0 transition-colors ${
                  isActive
                    ? 'text-blue-400'
                    : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              <span className="truncate">{item.label}</span>
              {isActive && (
                <motion.div
                  layoutId="admin-nav-dot"
                  className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0 ml-auto"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-700/50 space-y-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10"
          onClick={() => {
            logout();
            setCurrentView('landing');
            onItemClick?.();
          }}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span>Déconnexion</span>
        </Button>
        <p className="text-[9px] text-slate-600 text-center font-mono">
          © HenoBuild
        </p>
      </div>
    </div>
  );
}

export default function AdminSidebar({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex shrink-0 w-64 border-r border-slate-700/50 flex-col sticky top-16 h-[calc(100vh-4rem)]">
        <SidebarContent />
      </aside>

      {/* Main content area */}
      <main className="flex-1 min-w-0 bg-[#0f172a]">
        {/* Mobile header */}
        <div className="lg:hidden sticky top-16 z-40 bg-[#0f172a]/95 backdrop-blur-xl border-b border-slate-700/50 px-4 py-2 flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-slate-400 hover:text-white"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className="w-72 p-0 bg-[#0f172a] border-slate-700/50"
            >
              <SheetHeader className="sr-only">
                <SheetTitle>Navigation Admin</SheetTitle>
              </SheetHeader>
              <SidebarContent onItemClick={() => setMobileOpen(false)} />
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-blue-400" />
            <span className="font-semibold text-sm text-white">
              Administration
            </span>
          </div>
        </div>
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
