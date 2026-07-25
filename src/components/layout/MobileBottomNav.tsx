'use client';

import React, { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type AppView } from '@/lib/store';
import {
  Home,
  Store,
  ShoppingCart,
  MessageCircle,
  User,
  Package,
} from 'lucide-react';

// Navigation items for client role
const clientTabs: { view: AppView; label: string; icon: React.ElementType; badge?: 'cart' | 'messages' }[] = [
  { view: 'client-dashboard', label: 'Accueil', icon: Home },
  { view: 'client-shop', label: 'Boutiques', icon: Store },
  { view: 'client-cart', label: 'Panier', icon: ShoppingCart, badge: 'cart' },
  { view: 'client-messages', label: 'Messages', icon: MessageCircle, badge: 'messages' },
  { view: 'client-profile', label: 'Profil', icon: User },
];

// Navigation items for vendor role
const vendorTabs: { view: AppView; label: string; icon: React.ElementType; badge?: 'cart' | 'messages' }[] = [
  { view: 'vendor-dashboard', label: 'Accueil', icon: Home },
  { view: 'vendor-products', label: 'Produits', icon: Package },
  { view: 'vendor-orders', label: 'Commandes', icon: ShoppingCart },
  { view: 'vendor-messages', label: 'Messages', icon: MessageCircle, badge: 'messages' },
  { view: 'vendor-shop-settings', label: 'Boutique', icon: Store },
];

// Hook to detect client-side mounting
const emptySubscribe = () => () => {};
function useHasMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

export default function MobileBottomNav() {
  const { currentView, setCurrentView, user, token } = useAppStore();
  const [cartCount, setCartCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const mounted = useHasMounted();

  // Determine which tabs to show based on user role
  const tabs = user?.role === 'VENDOR' ? vendorTabs : clientTabs;

  // Fetch cart count for clients
  const fetchCartCount = useCallback(async () => {
    if (!token || !user || user.role !== 'CLIENT') return;
    try {
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const items = data.items || data.cart?.items || [];
        const total = items.reduce((sum: number, item: { quantity: number }) => sum + item.quantity, 0);
        setCartCount(total);
      }
    } catch {
      // Silently handle
    }
  }, [token, user]);

  // Fetch unread message count
  const fetchUnreadCount = useCallback(async () => {
    if (!token || !user) return;
    try {
      const res = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const messages = data.messages || data.conversations || [];
        const unread = messages.filter(
          (m: { isRead?: boolean; unreadCount?: number }) =>
            m.unreadCount ? m.unreadCount > 0 : !m.isRead
        ).length;
        setUnreadCount(unread);
      }
    } catch {
      // Silently handle
    }
  }, [token, user]);

  // Poll for cart and unread counts
  useEffect(() => {
    if (!token || !user) return;

    const timeoutId = setTimeout(() => {
      fetchCartCount();
      fetchUnreadCount();
    }, 500);

    const interval = setInterval(() => {
      fetchCartCount();
      fetchUnreadCount();
    }, 30000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(interval);
    };
  }, [token, user, fetchCartCount, fetchUnreadCount]);

  // Don't render on server or before mount
  if (!mounted) return null;

  // Don't show on landing, login, register, or admin views
  if (!user) return null;
  if (currentView === 'landing' || currentView === 'login' || currentView === 'register') return null;
  if (currentView.startsWith('admin-')) return null;

  // Get badge count for a tab
  const getBadgeCount = (badge?: 'cart' | 'messages') => {
    if (badge === 'cart') return cartCount;
    if (badge === 'messages') return unreadCount;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden">
      {/* Gradient top border */}
      <div className="h-px bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />

      {/* Background with blur */}
      <div className="bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 border-t border-border/50">
        <div className="flex items-center justify-around px-1 pb-[env(safe-area-inset-bottom)] pt-1.5">
          {tabs.map((tab) => {
            const isActive = currentView === tab.view;
            const badgeCount = getBadgeCount(tab.badge);
            const Icon = tab.icon;

            return (
              <button
                key={tab.view}
                onClick={() => setCurrentView(tab.view)}
                className="relative flex flex-col items-center justify-center min-w-[56px] py-1.5 px-1 group"
              >
                {/* Active indicator dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      layoutId="bottom-nav-active"
                      className="absolute -top-1.5 h-1 w-6 rounded-full bg-emerald-500"
                      initial={{ opacity: 0, scale: 0.5 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.5 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </AnimatePresence>

                {/* Icon container */}
                <div className="relative">
                  <motion.div
                    whileTap={{ scale: 0.85 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                  >
                    <Icon
                      className={`h-5 w-5 transition-colors duration-200 ${
                        isActive
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-muted-foreground group-hover:text-foreground'
                      }`}
                    />
                  </motion.div>

                  {/* Badge */}
                  {badgeCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                      className="absolute -top-1.5 -right-2.5 h-4 min-w-[16px] flex items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white px-1 shadow-sm"
                    >
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </motion.span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`text-[10px] mt-0.5 font-medium transition-colors duration-200 leading-tight ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-muted-foreground group-hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
