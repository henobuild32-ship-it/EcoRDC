'use client';

import React, { useState, useEffect, useRef, useCallback, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from 'next-themes';
import { useAppStore, type AppView } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  Sun,
  Moon,
  Bell,
  Menu,
  LogOut,
  User,
  Store,
  ShoppingBag,
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageCircle,
  Settings,
  Shield,
  Users,
  FileText,
  Star,
  KeyRound,
  Activity,
  ChevronDown,
  Heart,
  Tag,
  Search,
  Globe,
  X,
  Clock,
  Check,
  ShoppingBasket,
  AlertCircle,
  Info,
  Megaphone,
  CreditCard,
} from 'lucide-react';

// Navigation items per role
const clientNav: { view: AppView; label: string; icon: React.ElementType }[] = [
  { view: 'client-dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { view: 'client-shop', label: 'Boutiques', icon: Store },
  { view: 'client-cart', label: 'Panier', icon: ShoppingCart },
  { view: 'client-orders', label: 'Commandes', icon: Package },
  { view: 'client-favorites', label: 'Favoris', icon: Heart },
  { view: 'client-followed-shops', label: 'Boutiques suivies', icon: Store },
  { view: 'client-messages', label: 'Messages', icon: MessageCircle },
  { view: 'client-profile', label: 'Profil', icon: User },
];

const vendorNav: { view: AppView; label: string; icon: React.ElementType }[] = [
  { view: 'vendor-dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { view: 'vendor-products', label: 'Produits', icon: Package },
  { view: 'vendor-orders', label: 'Commandes', icon: ShoppingCart },
  { view: 'vendor-promotions', label: 'Promotions', icon: Tag },
  { view: 'vendor-messages', label: 'Messages', icon: MessageCircle },
  { view: 'vendor-invoices', label: 'Factures', icon: FileText },
  { view: 'vendor-subscription', label: 'Abonnement', icon: CreditCard },
  { view: 'vendor-shop-settings', label: 'Ma Boutique', icon: Settings },
];

const adminNav: { view: AppView; label: string; icon: React.ElementType }[] = [
  { view: 'admin-dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { view: 'admin-vendors', label: 'Vendeurs', icon: Store },
  { view: 'admin-clients', label: 'Clients', icon: Users },
  { view: 'admin-shops', label: 'Boutiques', icon: ShoppingBag },
  { view: 'admin-orders', label: 'Commandes', icon: ShoppingCart },
  { view: 'admin-recommendations', label: 'Recommandations', icon: Star },
  { view: 'admin-password-resets', label: 'Mots de passe', icon: KeyRound },
  { view: 'admin-activity', label: 'Activité', icon: Activity },
  { view: 'admin-settings', label: 'Paramètres', icon: Settings },
];

// Notification type icon map
const notifTypeIcons: Record<string, React.ElementType> = {
  order: ShoppingCart,
  message: MessageCircle,
  promotion: Megaphone,
  system: Info,
  alert: AlertCircle,
  shop: Store,
};

// Hook to detect client-side mounting without setState in effect
const emptySubscribe = () => () => {};
function useHasMounted() {
  return useSyncExternalStore(emptySubscribe, () => true, () => false);
}

// Theme toggle that avoids hydration mismatch
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const mounted = useHasMounted();

  if (!mounted) {
    return <Button variant="ghost" size="icon" className="opacity-0" aria-hidden />;
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="text-muted-foreground hover:text-foreground"
    >
      <AnimatePresence mode="wait" initial={false}>
        {theme === 'dark' ? (
          <motion.div
            key="sun"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-5 w-5" />
          </motion.div>
        ) : (
          <motion.div
            key="moon"
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-5 w-5" />
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}

// Notification type icon helper
function NotifIcon({ type }: { type: string }) {
  const Icon = notifTypeIcons[type] || Bell;
  return <Icon className="h-4 w-4" />;
}

// Relative time helper in French
function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.max(0, now - then);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "À l'instant";
  if (mins < 60) return `Il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function AppHeader() {
  const { currentView, setCurrentView, user, logout, incrementLogoTap, token } = useAppStore();
  const [notificationCount, setNotificationCount] = useState(0);
  const [prevNotificationCount, setPrevNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  }>>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{
    id: string;
    name: string;
    type: 'shop' | 'product';
    image?: string;
    subtitle?: string;
  }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const notifCountRef = useRef(0);

  // Keep ref in sync with state
  useEffect(() => {
    notifCountRef.current = notificationCount;
  }, [notificationCount]);

  // Fetch notification count and latest notifications
  const fetchNotifications = useCallback(async () => {
    if (!token || !user) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const all = data.notifications || [];
        const unread = all.filter((n: { isRead: boolean }) => !n.isRead).length;
        setPrevNotificationCount(notifCountRef.current);
        setNotificationCount(unread);
        setNotifications(all.slice(0, 10));
      }
    } catch {
      // Silently handle
    }
  }, [token, user]);

  // Setup polling for notifications
  useEffect(() => {
    if (!token || !user) return;
    const timeoutId = setTimeout(() => { fetchNotifications(); }, 0);
    intervalRef.current = setInterval(fetchNotifications, 30000);
    return () => {
      clearTimeout(timeoutId);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [token, user, fetchNotifications]);

  // Search functionality
  const performSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    try {
      const [shopsRes, productsRes] = await Promise.all([
        fetch(`/api/shops?search=${encodeURIComponent(query)}`),
        fetch(`/api/products?search=${encodeURIComponent(query)}`),
      ]);
      const results: Array<{
        id: string; name: string; type: 'shop' | 'product'; image?: string; subtitle?: string;
      }> = [];
      if (shopsRes.ok) {
        const data = await shopsRes.json();
        const shops = data.shops || [];
        shops.slice(0, 5).forEach((s: { id: string; name: string; logo?: string; category?: string; slug?: string }) => {
          results.push({
            id: s.id,
            name: s.name,
            type: 'shop',
            image: s.logo,
            subtitle: s.category || s.slug,
          });
        });
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        const products = data.products || [];
        products.slice(0, 5).forEach((p: { id: string; name: string; images?: string; price?: number; category?: string }) => {
          const imgs = p.images ? p.images.split(',').map((i: string) => i.trim()) : [];
          results.push({
            id: p.id,
            name: p.name,
            type: 'product',
            image: imgs[0],
            subtitle: p.price ? `${p.price.toLocaleString('fr-FR')} CDF` : p.category,
          });
        });
      }
      setSearchResults(results);
    } catch {
      // Silently handle
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchLoading(false);
      return;
    }
    searchDebounceRef.current = setTimeout(() => performSearch(searchQuery), 300);
    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [searchQuery, performSearch]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  const handleLogoClick = () => {
    const isTripleTap = incrementLogoTap();
    if (isTripleTap) {
      return;
    } else if (user) {
      if (user.role === 'ADMIN') setCurrentView('admin-dashboard');
      else if (user.role === 'VENDOR') setCurrentView('vendor-dashboard');
      else setCurrentView('client-dashboard');
    } else {
      setCurrentView('landing');
    }
  };

  const handleSearchResultClick = (result: { id: string; name: string; type: 'shop' | 'product' }) => {
    setSearchOpen(false);
    setSearchQuery('');
    if (result.type === 'shop') {
      setCurrentView('client-shop');
    } else {
      setCurrentView('client-shop');
    }
  };

  const markNotificationRead = async (notifId: string) => {
    if (!token) return;
    try {
      await fetch(`/api/notifications/${notifId}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ isRead: true }),
      });
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, isRead: true } : n));
      setNotificationCount(prev => Math.max(0, prev - 1));
    } catch {
      // Silently handle
    }
  };

  const markAllNotificationsRead = async () => {
    if (!token) return;
    try {
      const unreadNotifs = notifications.filter(n => !n.isRead);
      await Promise.all(unreadNotifs.map(n =>
        fetch(`/api/notifications/${n.id}`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ isRead: true }),
        })
      ));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setNotificationCount(0);
    } catch {
      // Silently handle
    }
  };

  const getNavItems = () => {
    if (!user) return [];
    if (user.role === 'ADMIN') return adminNav;
    if (user.role === 'VENDOR') return vendorNav;
    return clientNav;
  };

  const getRoleLabel = (role: string) => {
    if (role === 'ADMIN') return 'Administrateur';
    if (role === 'VENDOR') return 'Vendeur';
    return 'Client';
  };

  const getRoleBadgeClass = (role: string) => {
    if (role === 'ADMIN') return 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300';
    if (role === 'VENDOR') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300';
    return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300';
  };

  const navItems = getNavItems();
  const isLanding = currentView === 'landing';
  const isAuth = currentView === 'login' || currentView === 'register';
  const notificationChanged = notificationCount > prevNotificationCount && prevNotificationCount >= 0;

  // Don't show header on landing page
  if (isLanding || isAuth) return null;

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      {/* Gradient bottom border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-3">
          {/* Logo */}
          <button
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 shrink-0 group relative"
          >
            <div className="relative">
              <img
                src="/ecordc-logo.png"
                alt="EcoRDC"
                className="h-8 w-8 object-contain"
              />
              {/* Hover glow effect */}
              <div className="absolute inset-0 rounded-full bg-emerald-500/0 group-hover:bg-emerald-500/20 blur-md transition-all duration-300" />
            </div>
            <span className="font-bold text-lg bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent hidden sm:inline group-hover:from-emerald-500 group-hover:to-green-400 transition-all duration-300">
              EcoRDC
            </span>
          </button>

          {/* Desktop Search Bar */}
          {user && (
            <div className="hidden lg:flex items-center flex-1 max-w-md mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher boutiques, produits..."
                  className="pl-9 pr-9 h-9 bg-muted/50 border-border/50 focus:bg-background focus:border-emerald-500/50 transition-all duration-200"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchOpen(true)}
                />
                {searchQuery && (
                  <button
                    onClick={() => { setSearchQuery(''); setSearchOpen(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* Search Results Dropdown */}
                <AnimatePresence>
                  {searchOpen && searchQuery.trim() && (
                    <motion.div
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-full left-0 right-0 mt-1.5 bg-popover border border-border rounded-xl shadow-xl overflow-hidden z-50"
                      onMouseLeave={() => { if (!searchQuery) setSearchOpen(false); }}
                    >
                      <ScrollArea className="max-h-80">
                        {searchLoading && (
                          <div className="flex items-center justify-center py-6">
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                          </div>
                        )}
                        {!searchLoading && searchResults.length === 0 && searchQuery.trim() && (
                          <div className="flex flex-col items-center justify-center py-6 px-4 text-center">
                            <Search className="h-8 w-8 text-muted-foreground/50 mb-2" />
                            <p className="text-sm text-muted-foreground">Aucun résultat pour &ldquo;{searchQuery}&rdquo;</p>
                            <p className="text-xs text-muted-foreground/70 mt-1">Essayez avec d&apos;autres mots-clés</p>
                          </div>
                        )}
                        {!searchLoading && searchResults.length > 0 && (
                          <div className="py-1">
                            {searchResults.some(r => r.type === 'shop') && (
                              <>
                                <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  Boutiques
                                </div>
                                {searchResults.filter(r => r.type === 'shop').map(result => (
                                  <button
                                    key={`shop-${result.id}`}
                                    onClick={() => handleSearchResultClick(result)}
                                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                                  >
                                    <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                                      {result.image ? (
                                        <img src={result.image} alt={result.name} className="h-full w-full object-cover" />
                                      ) : (
                                        <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{result.name}</p>
                                      {result.subtitle && (
                                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                      )}
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] shrink-0">Boutique</Badge>
                                  </button>
                                ))}
                              </>
                            )}
                            {searchResults.some(r => r.type === 'product') && (
                              <>
                                {searchResults.some(r => r.type === 'shop') && <Separator />}
                                <div className="px-3 py-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                                  Produits
                                </div>
                                {searchResults.filter(r => r.type === 'product').map(result => (
                                  <button
                                    key={`product-${result.id}`}
                                    onClick={() => handleSearchResultClick(result)}
                                    className="flex items-center gap-3 w-full px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                                  >
                                    <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0 overflow-hidden">
                                      {result.image ? (
                                        <img src={result.image} alt={result.name} className="h-full w-full object-cover" />
                                      ) : (
                                        <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium truncate">{result.name}</p>
                                      {result.subtitle && (
                                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                                      )}
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] shrink-0">Produit</Badge>
                                  </button>
                                ))}
                              </>
                            )}
                          </div>
                        )}
                      </ScrollArea>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          )}

          {/* Desktop Navigation */}
          {user && (
            <nav className="hidden lg:flex items-center gap-0.5">
              {navItems.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <button
                    key={item.view}
                    onClick={() => setCurrentView(item.view)}
                    className={`relative flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {isActive && (
                      <motion.div
                        layoutId="nav-active"
                        className="absolute bottom-0 left-2 right-2 h-0.5 bg-emerald-500 rounded-full"
                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                      />
                    )}
                  </button>
                );
              })}
            </nav>
          )}

          {/* Right side actions */}
          <div className="flex items-center gap-1">
            {/* Mobile Search Button */}
            {user && (
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-muted-foreground hover:text-foreground"
                onClick={() => setSearchOpen(!searchOpen)}
              >
                <Search className="h-5 w-5" />
              </Button>
            )}

            {/* Dark mode toggle */}
            <ThemeToggle />

            {/* Notification bell with dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative text-muted-foreground hover:text-foreground">
                    <Bell className="h-5 w-5" />
                    {notificationCount > 0 && (
                      <motion.span
                        key={notificationChanged ? 'bounce' : 'stable'}
                        initial={notificationChanged ? { scale: 0.5 } : { scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={notificationChanged ? { type: 'spring', stiffness: 500, damping: 15 } : { duration: 0.2 }}
                        className="absolute -top-0.5 -right-0.5 h-5 min-w-[20px] flex items-center justify-center rounded-full bg-emerald-500 text-[10px] font-bold text-white px-1"
                      >
                        {notificationCount > 99 ? '99+' : notificationCount}
                      </motion.span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80 p-0">
                  <div className="flex items-center justify-between px-4 py-3 border-b">
                    <h4 className="text-sm font-semibold">Notifications</h4>
                    {notificationCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                        onClick={markAllNotificationsRead}
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Tout marquer lu
                      </Button>
                    )}
                  </div>
                  <ScrollArea className="max-h-80">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <Bell className="h-8 w-8 text-muted-foreground/40 mb-2" />
                        <p className="text-sm text-muted-foreground">Aucune notification</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">Vous êtes à jour !</p>
                      </div>
                    ) : (
                      <div className="py-1">
                        {notifications.map((notif) => (
                          <button
                            key={notif.id}
                            onClick={() => {
                              markNotificationRead(notif.id);
                              if (user.role === 'CLIENT') setCurrentView('client-notifications');
                            }}
                            className={`flex items-start gap-3 w-full px-4 py-3 hover:bg-muted/50 transition-colors text-left ${
                              !notif.isRead ? 'bg-emerald-50/50 dark:bg-emerald-950/20' : ''
                            }`}
                          >
                            <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                              !notif.isRead
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                                : 'bg-muted text-muted-foreground'
                            }`}>
                              <NotifIcon type={notif.type} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm truncate ${!notif.isRead ? 'font-medium' : 'font-normal text-muted-foreground'}`}>
                                {notif.title}
                              </p>
                              <p className="text-xs text-muted-foreground truncate mt-0.5">
                                {notif.message}
                              </p>
                              <p className="text-[11px] text-muted-foreground/70 mt-1 flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {relativeTime(notif.createdAt)}
                              </p>
                            </div>
                            {!notif.isRead && (
                              <div className="mt-1.5 h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                  <div className="border-t px-4 py-2.5">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full h-8 text-xs justify-center text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300"
                      onClick={() => {
                        if (user.role === 'CLIENT') setCurrentView('client-notifications');
                        else if (user.role === 'VENDOR') setCurrentView('vendor-messages');
                        else setCurrentView('admin-messages');
                      }}
                    >
                      Voir toutes les notifications
                    </Button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* User menu dropdown */}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center gap-2 px-2 h-9">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover border border-border shadow-sm"
                      />
                    ) : (
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden sm:inline text-sm font-medium max-w-[120px] truncate">
                      {user.name}
                    </span>
                    <ChevronDown className="h-3.5 w-3.5 text-muted-foreground hidden sm:inline" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="h-10 w-10 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold shadow-md">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="font-medium block truncate">{user.name}</span>
                        <span className="text-xs text-muted-foreground font-normal block truncate">{user.email}</span>
                        <Badge className={`mt-1 text-[10px] border-0 ${getRoleBadgeClass(user.role)}`}>
                          {getRoleLabel(user.role)}
                        </Badge>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                      <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Dernière connexion : {new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                  <DropdownMenuSeparator />
                  {user.role === 'ADMIN' && (
                    <DropdownMenuItem onClick={() => setCurrentView('admin-dashboard')}>
                      <Shield className="mr-2 h-4 w-4" />
                      Administration
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem
                    onClick={() => {
                      if (user.role === 'VENDOR') setCurrentView('vendor-shop-settings');
                      else setCurrentView('client-profile');
                    }}
                  >
                    <User className="mr-2 h-4 w-4" />
                    Mon profil
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      if (user.role === 'VENDOR') setCurrentView('vendor-shop-settings');
                      else if (user.role === 'ADMIN') setCurrentView('admin-settings');
                      else setCurrentView('client-profile');
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Paramètres
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {/* Quick settings */}
                  <div className="px-2 py-1.5 flex items-center justify-between">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Globe className="h-3 w-3" />
                      Français
                    </span>
                    <ThemeToggle />
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout();
                      setCurrentView('landing');
                    }}
                    className="text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            {/* Mobile menu trigger */}
            {user && (
              <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 p-0 flex flex-col">
                  <SheetHeader className="p-4 border-b bg-emerald-50/50 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-3">
                      <img
                        src="/ecordc-logo.png"
                        alt="EcoRDC"
                        className="h-8 w-8 object-contain"
                      />
                      <SheetTitle className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-green-500 bg-clip-text text-transparent">
                        EcoRDC
                      </SheetTitle>
                    </div>
                    {user && (
                      <div className="flex items-center gap-3 mt-3">
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt={user.name}
                            className="h-10 w-10 rounded-full object-cover border border-border shadow-md"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold shadow-md">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{user.name}</p>
                          <Badge className={`mt-0.5 text-[10px] border-0 ${getRoleBadgeClass(user.role)}`}>
                            {getRoleLabel(user.role)}
                          </Badge>
                        </div>
                      </div>
                    )}
                    {/* Quick action buttons */}
                    {user && (
                      <div className="flex items-center gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1.5"
                          onClick={() => {
                            if (user.role === 'CLIENT') setCurrentView('client-notifications');
                            else setCurrentView('vendor-messages');
                            setMobileOpen(false);
                          }}
                        >
                          <Bell className="h-3.5 w-3.5" />
                          Notifications
                          {notificationCount > 0 && (
                            <span className="h-4 min-w-[16px] flex items-center justify-center rounded-full bg-emerald-500 text-[9px] font-bold text-white px-1">
                              {notificationCount}
                            </span>
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 h-8 text-xs gap-1.5"
                          onClick={() => {
                            if (user.role === 'CLIENT') setCurrentView('client-messages');
                            else if (user.role === 'VENDOR') setCurrentView('vendor-messages');
                            else setCurrentView('admin-messages');
                            setMobileOpen(false);
                          }}
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          Messages
                        </Button>
                      </div>
                    )}

                    {/* Mobile Search */}
                    {user && (
                      <div className="mt-3 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Rechercher..."
                          className="pl-9 h-8 text-sm bg-background border-border/50"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && searchQuery.trim()) {
                              setCurrentView('client-shop');
                              setMobileOpen(false);
                              setSearchQuery('');
                            }
                          }}
                        />
                      </div>
                    )}
                  </SheetHeader>

                  <nav className="flex flex-col p-2 overflow-y-auto flex-1">
                    {navItems.map((item) => {
                      const isActive = currentView === item.view;
                      return (
                        <button
                          key={item.view}
                          onClick={() => {
                            setCurrentView(item.view);
                            setMobileOpen(false);
                          }}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                            isActive
                              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 shadow-sm'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          <item.icon className="h-5 w-5" />
                          <span>{item.label}</span>
                          {isActive && (
                            <div className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />
                          )}
                        </button>
                      );
                    })}
                  </nav>

                  <div className="p-4 border-t space-y-3">
                    {/* PWA Version indicator & HenoBuild */}
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                        <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                        Version PWA 1.0
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">© HenoBuild</span>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                      onClick={() => {
                        logout();
                        setCurrentView('landing');
                        setMobileOpen(false);
                      }}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Se déconnecter
                    </Button>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Search Bar (slides down) */}
      <AnimatePresence>
        {searchOpen && user && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="lg:hidden border-t border-border/50 overflow-hidden bg-background/95 backdrop-blur-sm"
          >
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  ref={searchInputRef}
                  placeholder="Rechercher boutiques, produits..."
                  className="pl-9 pr-9 h-10 bg-muted/50 border-border/50 focus:bg-background focus:border-emerald-500/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchOpen(false);
                      setSearchQuery('');
                    }
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      setCurrentView('client-shop');
                      setSearchOpen(false);
                      setSearchQuery('');
                    }
                  }}
                />
                <button
                  onClick={() => {
                    setSearchOpen(false);
                    setSearchQuery('');
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Mobile search results */}
              {searchQuery.trim() && (
                <div className="mt-2 max-h-60 overflow-y-auto rounded-lg border border-border/50 bg-background">
                  {searchLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="text-center py-4 px-3">
                      <p className="text-sm text-muted-foreground">Aucun résultat</p>
                    </div>
                  ) : (
                    <div className="py-1">
                      {searchResults.map(result => (
                        <button
                          key={`${result.type}-${result.id}`}
                          onClick={() => handleSearchResultClick(result)}
                          className="flex items-center gap-3 w-full px-3 py-2 hover:bg-muted/50 transition-colors text-left"
                        >
                          <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                            {result.type === 'shop' ? (
                              <Store className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                            ) : (
                              <Package className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{result.name}</p>
                            {result.subtitle && (
                              <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close search */}
      {searchOpen && (
        <div
          className="fixed inset-0 z-[-1] lg:hidden"
          onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
        />
      )}
    </header>
  );
}
