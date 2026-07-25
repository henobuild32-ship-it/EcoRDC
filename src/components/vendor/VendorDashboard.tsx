'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Order } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package,
  MessageCircle,
  ShoppingCart,
  TrendingUp,
  Plus,
  ArrowRight,
  Clock,
  Star,
  DollarSign,
  BarChart3,
  Tag,
  ExternalLink,
  Copy,
  Check,
  Store,
  Settings,
  AlertCircle,
  CreditCard,
  CheckCircle,
  AlertTriangle,
  Zap,
  RefreshCw,
  Crown,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const statusColor: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  CONFIRMED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  PAID: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  SHIPPED: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  DELIVERED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

const statusLabel: Record<string, string> = {
  PENDING: 'En attente',
  CONFIRMED: 'Confirmée',
  PAID: 'Payée',
  SHIPPED: 'Expédiée',
  DELIVERED: 'Livrée',
  CANCELLED: 'Annulée',
};

// Animated counter hook
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
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCount(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

// Mini sparkline component using SVG
function MiniSparkline({ data, color }: { data: number[]; color: string }) {
  if (data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const width = 60;
  const height = 24;
  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * width;
      const y = height - ((v - min) / range) * (height - 4) - 2;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={width} height={height} className="opacity-50">
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Stat card with animated counter
function StatCard({
  label,
  value,
  icon: Icon,
  color,
  borderColor,
  trend,
  sparkData,
  sparkColor,
  view,
  loading,
  isCurrency,
  onClick,
}: {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  trend?: string;
  sparkData: number[];
  sparkColor: string;
  view: string;
  loading: boolean;
  isCurrency?: boolean;
  onClick: (view: string) => void;
}) {
  const animatedValue = useAnimatedCounter(value);
  const displayValue = isCurrency
    ? `${animatedValue.toLocaleString('fr-FR')} CDF`
    : animatedValue;

  return (
    <Card
      className={`cursor-pointer card-hover border-t-4 ${borderColor} overflow-hidden relative group`}
      onClick={() => onClick(view)}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-muted/30 to-transparent opacity-50 pointer-events-none" />
      <CardContent className="p-4 sm:p-5 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <p className="text-xs sm:text-sm text-muted-foreground">{label}</p>
              {trend && (
                <span className="flex items-center text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  <TrendingUp className="h-3 w-3 mr-0.5" />
                  {trend}
                </span>
              )}
            </div>
            {loading ? (
              <Skeleton className="h-7 w-20 mt-1" />
            ) : (
              <motion.p
                className="text-xl sm:text-2xl font-bold mt-1 tabular-nums"
                key={value}
              >
                {displayValue}
              </motion.p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <div
              className={`h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform`}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <MiniSparkline data={sparkData} color={sparkColor} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SubscriptionInfo {
  id: string;
  status: 'INACTIVE' | 'ACTIVE' | 'EXPIRED' | 'TRIAL' | 'PERMANENT';
  startDate: string | null;
  expiryDate: string | null;
  amount: number;
  daysRemaining: number;
  totalDaysInPeriod: number;
}

export default function VendorDashboard() {
  const { user, token, setCurrentView } = useAppStore();
  const [stats, setStats] = useState({ products: 0, orders: 0, pendingOrders: 0, revenue: 0, messages: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription);
      }
    } catch {
      // silently handle
    }
  }, [token]);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [productsRes, ordersRes, messagesRes, subscriptionRes] = await Promise.all([
          fetch('/api/products', { headers }),
          fetch('/api/orders', { headers }),
          fetch('/api/messages', { headers }),
          fetch('/api/subscriptions', { headers }),
        ]);

        if (productsRes.ok) {
          const data = await productsRes.json();
          setStats((prev) => ({ ...prev, products: (data.products || []).length }));
        }
        if (ordersRes.ok) {
          const data = await ordersRes.json();
          const orders = data.orders || [];
          setRecentOrders(orders.slice(0, 5));
          const revenue = orders
            .filter((o: Order) => o.status === 'PAID' || o.status === 'DELIVERED')
            .reduce((acc: number, o: Order) => acc + o.totalAmount, 0);
          const pendingOrders = orders.filter((o: Order) => o.status === 'PENDING').length;
          setStats((prev) => ({ ...prev, orders: orders.length, pendingOrders, revenue }));
        }
        if (messagesRes.ok) {
          const data = await messagesRes.json();
          const totalUnread = (data.conversations || []).reduce(
            (acc: number, c: { unreadCount?: number }) => acc + (c.unreadCount || 0),
            0
          );
          setStats((prev) => ({ ...prev, messages: totalUnread }));
        }
        if (subscriptionRes.ok) {
          const data = await subscriptionRes.json();
          setSubscription(data.subscription);
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [token]);

  // Time-based greeting
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  }, []);

  const shopUrl = user?.shop?.slug
    ? `${window.location.origin}/shop/${user.shop.slug}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shopUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const statCards = [
    {
      label: 'Produits',
      value: stats.products,
      icon: Package,
      color: 'from-emerald-400 to-emerald-600',
      borderColor: 'border-t-emerald-500',
      trend: '+8%',
      sparkData: [2, 4, 3, 6, 5, stats.products || 7],
      sparkColor: '#10B981',
      view: 'vendor-products',
      isCurrency: false,
    },
    {
      label: 'Commandes',
      value: stats.orders,
      icon: ShoppingCart,
      color: 'from-green-400 to-green-600',
      borderColor: 'border-t-green-500',
      trend: '+15%',
      sparkData: [1, 3, 2, 5, 4, stats.orders || 6],
      sparkColor: '#22C55E',
      view: 'vendor-orders',
      isCurrency: false,
    },
    {
      label: 'En attente',
      value: stats.pendingOrders,
      icon: AlertCircle,
      color: 'from-amber-400 to-amber-600',
      borderColor: 'border-t-amber-500',
      trend: stats.pendingOrders > 0 ? '!' : undefined,
      sparkData: [0, 1, 2, 1, 3, stats.pendingOrders],
      sparkColor: '#F59E0B',
      view: 'vendor-orders',
      isCurrency: false,
    },
    {
      label: 'Revenus',
      value: stats.revenue,
      icon: DollarSign,
      color: 'from-teal-400 to-teal-600',
      borderColor: 'border-t-teal-500',
      trend: '+22%',
      sparkData: [100, 300, 250, 500, 400, stats.revenue || 600],
      sparkColor: '#14B8A6',
      view: 'vendor-orders',
      isCurrency: true,
    },
    {
      label: 'Messages',
      value: stats.messages,
      icon: MessageCircle,
      color: 'from-lime-400 to-lime-600',
      borderColor: 'border-t-lime-500',
      trend: '+3%',
      sparkData: [0, 2, 1, 3, 2, stats.messages || 4],
      sparkColor: '#84CC16',
      view: 'vendor-messages',
      isCurrency: false,
    },
  ];

  const quickActions = [
    {
      label: 'Mon abonnement',
      icon: CreditCard,
      view: 'vendor-subscription' as const,
      gradient: 'from-teal-50 to-emerald-50 dark:from-teal-950/30 dark:to-emerald-950/30',
      iconColor: 'text-teal-600',
      desc: 'Gérer votre abonnement',
    },
    {
      label: 'Ajouter un produit',
      icon: Plus,
      view: 'vendor-add-product' as const,
      gradient: 'from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30',
      iconColor: 'text-emerald-600',
      desc: 'Créez une nouvelle annonce',
    },
    {
      label: 'Gérer les commandes',
      icon: ShoppingCart,
      view: 'vendor-orders' as const,
      gradient: 'from-blue-50 to-cyan-50 dark:from-blue-950/30 dark:to-cyan-950/30',
      iconColor: 'text-blue-600',
      desc: 'Suivi et mise à jour',
    },
    {
      label: 'Messagerie',
      icon: MessageCircle,
      view: 'vendor-messages' as const,
      gradient: 'from-lime-50 to-green-50 dark:from-lime-950/30 dark:to-green-950/30',
      iconColor: 'text-lime-600',
      desc: 'Répondre aux clients',
    },
    {
      label: 'Promotions',
      icon: Tag,
      view: 'vendor-promotions' as const,
      gradient: 'from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30',
      iconColor: 'text-violet-600',
      desc: 'Créer des offres',
    },
    {
      label: 'Paramètres boutique',
      icon: Settings,
      view: 'vendor-shop-settings' as const,
      gradient: 'from-slate-50 to-gray-50 dark:from-slate-950/30 dark:to-gray-950/30',
      iconColor: 'text-slate-600',
      desc: 'Personnaliser votre boutique',
    },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* Subscription Status Banner - Expired/Inactive */}
      <AnimatePresence>
        {subscription && subscription.status === 'EXPIRED' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-gradient-to-r from-red-500 to-amber-500 text-white rounded-xl p-4 shadow-lg">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-semibold">⚠️ Votre abonnement a expiré</p>
                    <p className="text-sm text-white/80">
                      Renouvelez-le pour continuer à utiliser votre boutique.
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setCurrentView('vendor-subscription')}
                  className="bg-white text-red-600 hover:bg-white/90 font-medium shrink-0 shadow-md"
                  size="sm"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renouveler maintenant
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {subscription && subscription.status === 'INACTIVE' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-md shrink-0">
                      <Zap className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-amber-800 dark:text-amber-200">Activez votre abonnement</p>
                      <p className="text-sm text-amber-600/80 dark:text-amber-300/70">
                        10 000 FC/mois pour accéder à toutes les fonctionnalités vendeur
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setCurrentView('vendor-subscription')}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-md shrink-0"
                    size="sm"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    S&apos;abonner
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Subscription Active Status Widget */}
      <AnimatePresence>
        {subscription && subscription.status === 'PERMANENT' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border border-purple-300 dark:border-purple-800 bg-gradient-to-r from-purple-50 to-amber-50 dark:from-purple-950/30 dark:to-amber-950/30">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-purple-500 to-amber-500 flex items-center justify-center shadow-sm">
                      <Crown className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <Badge className="bg-gradient-to-r from-purple-100 to-amber-100 text-purple-700 dark:from-purple-900/40 dark:to-amber-900/40 dark:text-purple-300 border-0 text-xs">
                        Accès permanent à vie ⭐
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Vous ne payez jamais d&apos;abonnement — profitez-en !
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {subscription && subscription.status === 'ACTIVE' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm">
                      <CheckCircle className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 text-xs">
                        Abonnement actif
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Expire le {subscription.expiryDate ? new Date(subscription.expiryDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'} • {subscription.daysRemaining}j restants
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentView('vendor-subscription')}
                    className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20"
                  >
                    Gérer
                    <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Welcome Section - Shop Header */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 bg-gradient-to-r from-emerald-600 to-green-700 text-white shadow-lg overflow-hidden relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-4 right-4 grid grid-cols-5 gap-3">
              {Array.from({ length: 25 }).map((_, i) => (
                <div key={i} className="h-2 w-2 rounded-full bg-white" />
              ))}
            </div>
            <div className="absolute bottom-4 left-20 grid grid-cols-4 gap-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-white" />
              ))}
            </div>
          </div>
          <CardContent className="p-6 sm:p-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-xl font-bold shadow-lg border border-white/20">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} className="h-full w-full rounded-xl object-cover" />
                  ) : (
                    <Store className="h-7 w-7" />
                  )}
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold">
                    {greeting}, {user?.name?.split(' ')[0] || 'Vendeur'} 👋
                  </h1>
                  <p className="text-emerald-100 mt-1">
                    Gérez votre boutique et vos commandes
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <ExternalLink className="h-3 w-3 text-emerald-200/70" />
                    <span className="text-emerald-200/80 text-xs font-mono">{user?.shop?.slug}.ecordc</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  onClick={() => setCurrentView('vendor-shop-settings')}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm"
                  variant="outline"
                  size="sm"
                >
                  <Store className="mr-2 h-4 w-4" />
                  Voir ma boutique
                </Button>
                <Button
                  onClick={handleCopyLink}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm"
                  variant="outline"
                  size="sm"
                >
                  {copied ? (
                    <Check className="mr-1 h-4 w-4 text-green-300" />
                  ) : (
                    <Copy className="mr-1 h-4 w-4" />
                  )}
                  {copied ? 'Copié !' : 'Copier le lien'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards with Animated Counters */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
        {statCards.map((stat) => (
          <StatCard
            key={stat.label}
            label={stat.label}
            value={stat.value}
            icon={stat.icon}
            color={stat.color}
            borderColor={stat.borderColor}
            trend={stat.trend}
            sparkData={stat.sparkData}
            sparkColor={stat.sparkColor}
            view={stat.view}
            loading={loading}
            isCurrency={stat.isCurrency}
            onClick={(v) => setCurrentView(v as any)}
          />
        ))}
      </motion.div>

      {/* Recommendation Badge Card */}
      <motion.div variants={itemVariants}>
        <Card className="border-2 border-amber-300 dark:border-amber-700 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-950/30 dark:to-yellow-950/30 overflow-hidden relative">
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-2 right-2 grid grid-cols-4 gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              ))}
            </div>
          </div>
          <CardContent className="p-5 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-md">
                  <Star className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                    Demander le badge de recommandation
                  </h3>
                  <p className="text-sm text-amber-600/80 dark:text-amber-300/70 mt-0.5">
                    Obtenez une visibilité accrue et gagnez la confiance des clients. Les boutiques recommandées apparaissent en premier dans les résultats de recherche.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setCurrentView('vendor-shop-settings')}
                className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md shrink-0"
                size="sm"
              >
                <Star className="mr-2 h-4 w-4" />
                Demander
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Orders */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="h-5 w-5 text-emerald-600" />
              Commandes récentes
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentView('vendor-orders')}
              className="text-emerald-600 hover:text-emerald-700"
            >
              Voir tout
              <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : recentOrders.length === 0 ? (
              <div className="text-center py-16">
                <div className="relative inline-block">
                  <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                    <ShoppingCart className="h-12 w-12 text-emerald-300 dark:text-emerald-700" />
                  </div>
                </div>
                <h3 className="mt-4 text-lg font-semibold">Aucune commande</h3>
                <p className="mt-1 text-muted-foreground text-sm">Vos commandes apparaîtront ici dès qu&apos;un client passera une commande</p>
                <Button
                  onClick={() => setCurrentView('vendor-add-product')}
                  className="mt-5 bg-emerald-600 hover:bg-emerald-700 gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un produit
                </Button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-4 rounded-xl border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => setCurrentView('vendor-orders')}
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {order.orderNumber}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.customer?.name || 'Client'} •{' '}
                        {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <p className="font-semibold text-sm">
                        {order.totalAmount.toLocaleString('fr-FR')} CDF
                      </p>
                      <Badge
                        className={`text-[10px] border-0 ${statusColor[order.status] || 'bg-gray-100 text-gray-700'}`}
                      >
                        {statusLabel[order.status] || order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-600" />
          Actions rapides
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Card
              key={action.label}
              className="cursor-pointer card-hover overflow-hidden relative group"
              onClick={() => setCurrentView(action.view)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-60 pointer-events-none`} />
              <CardContent className="p-4 text-center relative z-10">
                <div className={`h-12 w-12 rounded-xl bg-white/60 dark:bg-white/10 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform shadow-sm`}>
                  <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                </div>
                <p className="font-medium text-xs sm:text-sm">{action.label}</p>
                <p className="text-[10px] text-muted-foreground mt-1 line-clamp-1">{action.desc}</p>
                <ArrowRight className="h-4 w-4 mx-auto mt-2 text-muted-foreground/40 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
