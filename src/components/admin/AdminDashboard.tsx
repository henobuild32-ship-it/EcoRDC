'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useAppStore, type AppView } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users, Store, ShoppingBag, ShoppingCart, Package, DollarSign,
  Star, KeyRound, ArrowRight, LayoutDashboard, Activity,
  CheckCircle, UserPlus, Bell, ShieldAlert, Settings,
  TrendingUp, Zap, Clock, AlertTriangle, Info, AlertCircle,
  ChevronRight, RefreshCw, CreditCard, Banknote,
  Flag, BadgeCheck, Calendar, UserCheck, Ban,
} from 'lucide-react';

/* ───────────────────────── Types ───────────────────────── */

interface DashboardStats {
  users: number;
  shops: number;
  products: number;
  orders: number;
  messages: number;
  vendorCount: number;
  clientCount: number;
  activeUsers: number;
  suspendedUsers: number;
  pendingRecommendations: number;
  recommendedShops: number;
  pendingPasswordResets: number;
  totalRevenue: number;
  pendingOrders: number;
  confirmedOrders: number;
  activeProducts: number;
  monthlyRevenue: Record<string, number>;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  subscriptionRevenue: number;
  registrationRevenue: number;
  pendingPayments: number;
  failedPayments: number;
  // New enhanced stats
  activeVendorsToday?: number;
  activeUsersToday?: number;
  newRegistrationsToday?: number;
  newRegistrationsThisWeek?: number;
  activeShops?: number;
  suspendedShops?: number;
  permanentlySuspendedShops?: number;
  temporarilySuspendedShops?: number;
  verifiedShopsCount?: number;
  inactiveSubscriptions?: number;
  trialSubscriptions?: number;
  pendingReports?: number;
  resolvedReports?: number;
  urgentReports?: number;
}

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

interface SystemNotification {
  id: string;
  type: 'warning' | 'info' | 'alert' | 'success';
  title: string;
  description: string;
  time: string;
}

/* ───────────────── Animated Counter Hook ───────────────── */

function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    const start = count;
    const diff = target - start;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]); // count intentionally excluded

  return count;
}

/* ───────────────── Framer Motion Variants ───────────────── */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

const cardHover: Variants = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.2, ease: 'easeInOut' } },
};

/* ───────────────── Stat Card Component ───────────────── */

function AnimatedStatCard({
  label, value, icon: Icon, gradient, view, onClick, isCurrency, spanTwo,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  gradient: string;
  view?: AppView;
  onClick?: (view: AppView) => void;
  isCurrency?: boolean;
  spanTwo?: boolean;
}) {
  const animatedValue = useAnimatedCounter(value);
  return (
    <motion.div
      variants={item}
      whileHover="hover"
      initial="rest"
      animate="rest"
      className={spanTwo ? 'col-span-2' : ''}
    >
      <motion.div variants={cardHover}>
        <Card
          className="overflow-hidden border-0 bg-[#1e293b] shadow-lg shadow-black/20 cursor-pointer group relative"
          onClick={() => view && onClick?.(view)}
        >
          {/* Subtle top gradient line */}
          <div className={`h-[2px] bg-gradient-to-r ${gradient}`} />
          <CardContent className="p-4 md:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
                <p className="text-xl md:text-2xl font-bold mt-1.5 tabular-nums text-white tracking-tight">
                  {isCurrency ? (
                    <>
                      {animatedValue.toLocaleString('fr-CD')}{' '}
                      <span className="text-sm font-medium text-slate-400">CDF</span>
                    </>
                  ) : animatedValue.toLocaleString('fr-CD')}
                </p>
              </div>
              <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="h-5 w-5 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}

/* ───────────────── Bar Chart Component ───────────────── */

function BarChart({ data, color, hoverColor, height = 140 }: {
  data: { label: string; value: number }[];
  color: string;
  hoverColor: string;
  height?: number;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div className="flex items-end gap-1.5 sm:gap-2" style={{ height }}>
      {data.map((d, i) => {
        const pct = (d.value / maxVal) * 100;
        const isHovered = hoveredIndex === i;
        return (
          <div
            key={d.label}
            className="flex-1 flex flex-col items-center gap-1 relative"
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {/* Tooltip */}
            <AnimatePresence>
              {isHovered && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  className="absolute -top-8 bg-slate-900 border border-slate-700 text-white text-[10px] px-2 py-0.5 rounded shadow-xl z-10 whitespace-nowrap"
                >
                  {d.value}
                </motion.div>
              )}
            </AnimatePresence>
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: `${pct}%` }}
              transition={{ duration: 0.6, delay: i * 0.07, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
              className={`w-full rounded-t-md transition-colors duration-200 ${isHovered ? hoverColor : color}`}
              style={{ minHeight: pct > 0 ? 4 : 0 }}
            />
            <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ───────────────── Quick Action Card ───────────────── */

function QuickActionCard({ label, icon: Icon, view, onClick, accentColor }: {
  label: string;
  icon: React.ElementType;
  view: AppView;
  onClick: (view: AppView) => void;
  accentColor: string;
}) {
  return (
    <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
      <Card
        className="border-0 bg-[#1e293b] shadow-lg shadow-black/20 cursor-pointer group overflow-hidden relative"
        onClick={() => onClick(view)}
      >
        <div className={`h-[2px] bg-gradient-to-r ${accentColor}`} />
        <CardContent className="p-4 flex flex-col items-center gap-2.5 text-center">
          <div className={`h-11 w-11 rounded-xl bg-gradient-to-br ${accentColor} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <span className="text-xs font-semibold text-slate-300 group-hover:text-white transition-colors">{label}</span>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/* ───────────────── Main Component ───────────────────────── */

export default function AdminDashboard() {
  const { token, setCurrentView } = useAppStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  /* ──── Data fetching ──── */

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin?section=stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch { /* silent */ }
  }, [token]);

  const fetchActivity = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin?section=activity', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecentActivity((data.logs || []).slice(0, 10));
      }
    } catch { /* silent */ }
  }, [token]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchActivity()]);
      setLoading(false);
      setLastRefresh(new Date());
    };
    load();
    const interval = setInterval(() => {
      fetchStats();
      fetchActivity();
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchStats, fetchActivity]);

  /* ──── Helpers ──── */

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatLastRefresh = () => {
    return lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, string> = {
      SUSPEND_USER: 'Suspension',
      REACTIVATE_USER: 'Réactivation',
      DELETE_USER: 'Suppression',
      RECOMMEND_SHOP: 'Recommandation',
      RESET_PASSWORD: 'Réinit. MDP',
      LOGIN: 'Connexion',
      REGISTER: 'Inscription',
      DELETE_SHOP: 'Suppr. boutique',
      TOGGLE_RECOMMENDATION: 'Toggle reco',
      SEND_GLOBAL_MESSAGE: 'Message global',
      SEND_PRIVATE_MESSAGE: 'Message privé',
      SEND_MULTI_MESSAGE: 'Message multi',
      SEND_ROLE_MESSAGE: 'Message rôle',
      ADMIN_ACCESS: 'Accès admin',
      GRANT_FREE_SHOP: 'Boutique gratuite',
      SUSPEND_SHOP: 'Suspension boutique',
      UNSUSPEND_SHOP: 'Réactivation boutique',
      TOGGLE_SHOP_BADGE: 'Badge boutique',
      RESOLVE_REPORT: 'Traitement signalement',
      CREATE_REPORT: 'Création signalement',
    };
    return labels[action] || action;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      SUSPEND_USER: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
      REACTIVATE_USER: 'bg-green-500/15 text-green-400 border-green-500/20',
      DELETE_USER: 'bg-red-500/15 text-red-400 border-red-500/20',
      RECOMMEND_SHOP: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/20',
      RESET_PASSWORD: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
      LOGIN: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
      REGISTER: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/20',
      ADMIN_ACCESS: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20',
      GRANT_FREE_SHOP: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
      SUSPEND_SHOP: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
      UNSUSPEND_SHOP: 'bg-green-500/15 text-green-400 border-green-500/20',
      TOGGLE_SHOP_BADGE: 'bg-violet-500/15 text-violet-400 border-violet-500/20',
      RESOLVE_REPORT: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
      SEND_GLOBAL_MESSAGE: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20',
      SEND_PRIVATE_MESSAGE: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20',
      SEND_MULTI_MESSAGE: 'bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/20',
    };
    return colors[action] || 'bg-slate-500/15 text-slate-400 border-slate-500/20';
  };

  /* ──── Stat cards config ──── */

  const statCards: {
    label: string; value: number; icon: React.ElementType;
    gradient: string; view?: AppView; isCurrency?: boolean; spanTwo?: boolean;
  }[] = stats ? [
    // Today's activity — primary insight
    { label: "Vendeurs actifs aujourd'hui", value: stats.activeVendorsToday || 0, icon: Store, gradient: 'from-cyan-500 to-cyan-700', view: 'admin-vendors' },
    { label: "Utilisateurs actifs aujourd'hui", value: stats.activeUsersToday || 0, icon: UserCheck, gradient: 'from-green-500 to-green-700' },
    { label: "Nouvelles inscriptions aujourd'hui", value: stats.newRegistrationsToday || 0, icon: UserPlus, gradient: 'from-teal-500 to-teal-700' },
    { label: 'Inscriptions (7 jours)', value: stats.newRegistrationsThisWeek || 0, icon: Calendar, gradient: 'from-emerald-500 to-emerald-700' },
    // Core counts
    { label: 'Total Clients', value: stats.clientCount, icon: Users, gradient: 'from-blue-500 to-blue-700', view: 'admin-clients' },
    { label: 'Total Vendeurs', value: stats.vendorCount, icon: Store, gradient: 'from-cyan-500 to-cyan-700', view: 'admin-vendors' },
    { label: 'Total Boutiques', value: stats.shops, icon: ShoppingBag, gradient: 'from-indigo-500 to-indigo-700', view: 'admin-shops' },
    { label: 'Produits publiés', value: stats.activeProducts, icon: Package, gradient: 'from-violet-500 to-violet-700', view: 'admin-products' },
    { label: 'Commandes totales', value: stats.orders, icon: ShoppingCart, gradient: 'from-amber-500 to-amber-700', view: 'admin-orders' },
    // Shop status overview
    { label: 'Boutiques actives', value: stats.activeShops || 0, icon: ShoppingBag, gradient: 'from-green-400 to-green-600', view: 'admin-shops' },
    { label: 'Boutiques suspendues', value: stats.suspendedShops || 0, icon: Ban, gradient: 'from-red-500 to-red-700', view: 'admin-shops' },
    { label: 'Boutiques vérifiées', value: stats.verifiedShopsCount || 0, icon: BadgeCheck, gradient: 'from-teal-400 to-teal-600', view: 'admin-verifications' },
    { label: 'Boutiques recommandées', value: stats.recommendedShops, icon: Star, gradient: 'from-yellow-500 to-yellow-700', spanTwo: true },
    // Users
    { label: 'Utilisateurs suspendus', value: stats.suspendedUsers, icon: ShieldAlert, gradient: 'from-red-500 to-red-700', view: 'admin-security' },
    { label: 'Utilisateurs actifs', value: stats.activeUsers, icon: CheckCircle, gradient: 'from-green-500 to-green-700' },
    // Subscriptions & revenue
    { label: 'Abonnements actifs', value: stats.activeSubscriptions || 0, icon: CreditCard, gradient: 'from-blue-400 to-blue-600', view: 'admin-subscriptions' },
    { label: 'Abonnements expirés', value: stats.expiredSubscriptions || 0, icon: AlertTriangle, gradient: 'from-orange-500 to-orange-700', view: 'admin-subscriptions' },
    { label: 'Revenus abonnements', value: stats.subscriptionRevenue || 0, icon: Banknote, gradient: 'from-cyan-400 to-cyan-600', isCurrency: true, view: 'admin-payments' },
    { label: 'Nouvelles inscriptions (total)', value: stats.users, icon: UserPlus, gradient: 'from-teal-500 to-teal-700' },
    { label: 'Revenus totaux', value: stats.totalRevenue, icon: DollarSign, gradient: 'from-blue-500 to-blue-700', isCurrency: true, spanTwo: true },
    // Reports
    { label: 'Signalements en attente', value: stats.pendingReports || 0, icon: Flag, gradient: 'from-rose-500 to-rose-700', view: 'admin-reports' },
    { label: 'Signalements urgents', value: stats.urgentReports || 0, icon: AlertTriangle, gradient: 'from-red-500 to-red-700', view: 'admin-reports' },
  ] : [];

  /* ──── Quick actions config ──── */

  const quickActions: {
    label: string; icon: React.ElementType; view: AppView; accentColor: string;
  }[] = [
    { label: 'Clients', icon: Users, view: 'admin-clients', accentColor: 'from-blue-500 to-blue-700' },
    { label: 'Vendeurs', icon: Store, view: 'admin-vendors', accentColor: 'from-cyan-500 to-cyan-700' },
    { label: 'Boutiques', icon: ShoppingBag, view: 'admin-shops', accentColor: 'from-indigo-500 to-indigo-700' },
    { label: 'Commandes', icon: ShoppingCart, view: 'admin-orders', accentColor: 'from-amber-500 to-amber-700' },
    { label: 'Produits', icon: Package, view: 'admin-products', accentColor: 'from-violet-500 to-violet-700' },
    { label: 'Abonnements', icon: CreditCard, view: 'admin-subscriptions', accentColor: 'from-blue-400 to-blue-600' },
    { label: 'Paiements', icon: Banknote, view: 'admin-payments', accentColor: 'from-cyan-400 to-cyan-600' },
    { label: 'Vérifications', icon: BadgeCheck, view: 'admin-verifications', accentColor: 'from-teal-400 to-teal-600' },
    { label: 'Signalements', icon: Flag, view: 'admin-reports', accentColor: 'from-rose-500 to-rose-700' },
    { label: 'Messages', icon: Bell, view: 'admin-messages', accentColor: 'from-fuchsia-400 to-fuchsia-600' },
    { label: 'Journal', icon: Activity, view: 'admin-activity', accentColor: 'from-slate-400 to-slate-600' },
    { label: 'Sécurité', icon: ShieldAlert, view: 'admin-security', accentColor: 'from-red-500 to-red-700' },
  ];

  /* ──── Chart data ──── */

  const userGrowthData = [
    { label: 'Lun', value: 12 },
    { label: 'Mar', value: 19 },
    { label: 'Mer', value: 15 },
    { label: 'Jeu', value: 27 },
    { label: 'Ven', value: 22 },
    { label: 'Sam', value: 34 },
    { label: 'Dim', value: 30 },
  ];

  const orderActivityData = [
    { label: 'Lun', value: 8 },
    { label: 'Mar', value: 14 },
    { label: 'Mer', value: 11 },
    { label: 'Jeu', value: 20 },
    { label: 'Ven', value: 16 },
    { label: 'Sam', value: 25 },
    { label: 'Dim', value: 21 },
  ];

  /* ──── System notifications (derived from stats) ──── */

  const systemNotifications: SystemNotification[] = [
    ...(stats && stats.pendingOrders > 0 ? [{
      id: 'pending-orders',
      type: 'alert' as const,
      title: `${stats.pendingOrders} commande(s) en attente`,
      description: 'Les vendeurs doivent confirmer ces commandes',
      time: 'Maintenant',
    }] : []),
    ...(stats && stats.suspendedUsers > 0 ? [{
      id: 'suspended-users',
      type: 'warning' as const,
      title: `${stats.suspendedUsers} utilisateur(s) suspendu(s)`,
      description: 'Comptes suspendus nécessitant une attention',
      time: 'Récent',
    }] : []),
    ...(stats && stats.pendingPasswordResets > 0 ? [{
      id: 'password-resets',
      type: 'info' as const,
      title: `${stats.pendingPasswordResets} demande(s) de réinitialisation`,
      description: 'Mot de passe en attente de traitement',
      time: 'En attente',
    }] : []),
    ...(stats && stats.pendingRecommendations > 0 ? [{
      id: 'recommendations',
      type: 'info' as const,
      title: `${stats.pendingRecommendations} recommandation(s) en attente`,
      description: 'Demandes de badge à examiner',
      time: 'En attente',
    }] : []),
    {
      id: 'system-ok',
      type: 'success',
      title: 'Système opérationnel',
      description: 'Tous les services fonctionnent normalement',
      time: formatLastRefresh(),
    },
  ];

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-amber-400" />;
      case 'info': return <Info className="h-4 w-4 text-blue-400" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-400" />;
      default: return <Bell className="h-4 w-4 text-slate-400" />;
    }
  };

  /* ───────────────── Loading State ───────────────── */

  if (loading) {
    return (
      <AdminSidebar>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-slate-800 animate-pulse rounded-lg" />
              <div className="h-4 w-72 bg-slate-800/60 animate-pulse rounded-lg" />
            </div>
            <div className="flex items-center gap-3">
              <div className="h-6 w-20 bg-slate-800 animate-pulse rounded-full" />
              <div className="h-10 w-10 bg-slate-800 animate-pulse rounded-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className={`h-28 bg-slate-800/80 animate-pulse rounded-xl ${i === 5 || i === 9 ? 'col-span-2' : ''}`} />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="h-56 bg-slate-800/80 animate-pulse rounded-xl" />
            <div className="h-56 bg-slate-800/80 animate-pulse rounded-xl" />
          </div>
        </div>
      </AdminSidebar>
    );
  }

  /* ───────────────── Render ───────────────── */

  return (
    <AdminSidebar>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

        {/* ════════ HEADER ════════ */}
        <motion.div variants={item}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Dashboard
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Vue d&apos;ensemble de la plateforme EcoRDC
              </p>
            </div>
            <div className="flex items-center gap-3">
              {/* Auto-refresh indicator */}
              <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-500">
                <RefreshCw className="h-3 w-3" />
                <span>Actualisé {formatLastRefresh()}</span>
              </div>
              {/* Online badge */}
              <Badge className="bg-green-500/15 text-green-400 border border-green-500/25 px-2.5 py-1 text-[11px] font-medium">
                <div className="h-2 w-2 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                En ligne
              </Badge>
              {/* Admin avatar */}
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-blue-900/30 ring-2 ring-blue-500/20">
                  A
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-semibold text-white">Admin</p>
                  <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/25 text-[9px] h-4 px-1.5">
                    Administrateur
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ════════ STATS GRID ════════ */}
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {statCards.map((card) => (
            <AnimatedStatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              gradient={card.gradient}
              view={card.view}
              onClick={(v) => setCurrentView(v)}
              isCurrency={card.isCurrency}
              spanTwo={card.spanTwo}
            />
          ))}
        </motion.div>

        {/* ════════ CHARTS SECTION ════════ */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* User Growth Chart */}
          <Card className="border-0 bg-[#1e293b] shadow-lg shadow-black/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-blue-400" />
                  </div>
                  Croissance utilisateurs
                </CardTitle>
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 h-5">
                  7 derniers jours
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <BarChart
                data={userGrowthData}
                color="bg-gradient-to-t from-blue-700 to-blue-500"
                hoverColor="bg-gradient-to-t from-blue-600 to-blue-400"
              />
            </CardContent>
          </Card>

          {/* Order Activity Chart */}
          <Card className="border-0 bg-[#1e293b] shadow-lg shadow-black/20">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <ShoppingCart className="h-4 w-4 text-blue-300" />
                  </div>
                  Activité commandes
                </CardTitle>
                <Badge variant="outline" className="text-[10px] border-slate-700 text-slate-400 h-5">
                  7 derniers jours
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <BarChart
                data={orderActivityData}
                color="bg-gradient-to-t from-sky-700 to-sky-500"
                hoverColor="bg-gradient-to-t from-sky-600 to-sky-400"
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* ════════ QUICK ACTIONS ════════ */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Zap className="h-4 w-4 text-blue-400" />
              </div>
              Accès rapide
            </h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map((action) => (
              <QuickActionCard
                key={action.view}
                label={action.label}
                icon={action.icon}
                view={action.view}
                onClick={(v) => setCurrentView(v)}
                accentColor={action.accentColor}
              />
            ))}
          </div>
        </motion.div>

        {/* ════════ ACTIVITY FEED & SIDEBAR ════════ */}
        <motion.div variants={item} className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ── Recent Activity Feed ── */}
          <Card className="border-0 bg-[#1e293b] shadow-lg shadow-black/20 lg:col-span-2">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Activity className="h-4 w-4 text-blue-400" />
                  </div>
                  Activité récente
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-[11px] h-7 text-slate-400 hover:text-white hover:bg-slate-800"
                  onClick={() => setCurrentView('admin-activity')}
                >
                  Voir tout <ArrowRight className="h-3 w-3 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-80 overflow-y-auto scrollbar-thin pr-1">
                {recentActivity.length === 0 ? (
                  <div className="text-center py-10">
                    <Activity className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">Aucune activité récente</p>
                  </div>
                ) : (
                  recentActivity.map((log, i) => (
                    <motion.div
                      key={log.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="h-8 w-8 rounded-full bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[10px] font-bold text-slate-400">
                          {(log.user?.name || 'S').charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm text-slate-200 truncate">
                            {log.user?.name || 'Système'}
                          </span>
                          <Badge className={`${getActionColor(log.action)} border text-[9px] h-4 px-1.5 font-medium`}>
                            {getActionLabel(log.action)}
                          </Badge>
                        </div>
                        {log.details && (
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{log.details}</p>
                        )}
                        <p className="text-[10px] text-slate-600 mt-0.5 flex items-center gap-1">
                          <Clock className="h-2.5 w-2.5" />
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* ── Right sidebar column ── */}
          <div className="space-y-4">

            {/* Pending Approvals */}
            {stats && (stats.pendingRecommendations > 0 || stats.pendingPasswordResets > 0 || (stats.expiredSubscriptions || 0) > 0) && (
              <Card className="border-0 bg-[#1e293b] shadow-lg shadow-black/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                    </div>
                    Approbations en attente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2.5">
                  {/* Recommendation requests */}
                  {stats.pendingRecommendations > 0 && (
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <div
                        className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/20 cursor-pointer hover:bg-amber-500/10 transition-colors flex items-center gap-3"
                        onClick={() => setCurrentView('admin-recommendations')}
                      >
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center shrink-0 shadow-lg">
                          <Star className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-amber-300">
                            {stats.pendingRecommendations} recommandation(s)
                          </p>
                          <p className="text-[10px] text-amber-400/60">Cliquez pour gérer</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-amber-500/50" />
                      </div>
                    </motion.div>
                  )}
                  {/* Password reset requests */}
                  {stats.pendingPasswordResets > 0 && (
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <div
                        className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-colors flex items-center gap-3"
                        onClick={() => setCurrentView('admin-password-resets')}
                      >
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shrink-0 shadow-lg">
                          <KeyRound className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-red-300">
                            {stats.pendingPasswordResets} réinitialisation(s)
                          </p>
                          <p className="text-[10px] text-red-400/60">Cliquez pour gérer</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-red-500/50" />
                      </div>
                    </motion.div>
                  )}
                  {/* Expired subscriptions */}
                  {(stats.expiredSubscriptions || 0) > 0 && (
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <div
                        className="p-3 rounded-xl bg-red-500/5 border border-red-500/20 cursor-pointer hover:bg-red-500/10 transition-colors flex items-center gap-3"
                        onClick={() => setCurrentView('admin-subscriptions')}
                      >
                        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center shrink-0 shadow-lg">
                          <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-red-300">
                            {stats.expiredSubscriptions} abonnement(s) expiré(s)
                          </p>
                          <p className="text-[10px] text-red-400/60">Voir</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-red-500/50" />
                      </div>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* System Notifications */}
            <Card className="border-0 bg-[#1e293b] shadow-lg shadow-black/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Bell className="h-4 w-4 text-blue-400" />
                  </div>
                  Notifications système
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5 max-h-64 overflow-y-auto scrollbar-thin pr-1">
                  {systemNotifications.map((notif, i) => (
                    <motion.div
                      key={notif.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-800/50 transition-colors"
                    >
                      <div className="mt-0.5 shrink-0">{getNotifIcon(notif.type)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-slate-200">{notif.title}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{notif.description}</p>
                        <p className="text-[9px] text-slate-600 mt-0.5">{notif.time}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

          </div>
        </motion.div>

        {/* ════════ FOOTER SPACER ════════ */}
        <div className="h-4" />

      </motion.div>
    </AdminSidebar>
  );
}
