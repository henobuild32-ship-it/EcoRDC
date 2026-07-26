'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type Order, type Shop } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ShoppingBag,
  MessageCircle,
  ShoppingCart,
  Store,
  Package,
  ArrowRight,
  TrendingUp,
  Clock,
  Heart,
  ChevronRight,
  User,
  Sparkles,
  Zap,
  Star,
  Activity,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

// Animated counter hook - uses requestAnimationFrame callback to avoid sync setState in effect
function useAnimatedCounter(target: number, duration: number = 1200) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;

    if (target === 0) {
      // Use rAF to defer the setState call outside the effect body
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => setCount(0));
      return;
    }

    const startTime = Date.now();
    const startVal = prevTarget.current === target ? 0 : 0; // Start from 0 for first render
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return count;
}

// Order status steps for timeline visualization
const orderSteps = ['PENDING', 'CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED'];

function getOrderProgress(status: string): number {
  const idx = orderSteps.indexOf(status);
  if (status === 'CANCELLED') return -1;
  return idx >= 0 ? idx + 1 : 0;
}

// Activity types
interface ActivityItem {
  id: string;
  type: 'order' | 'message' | 'favorite' | 'follow';
  text: string;
  time: string;
}

export default function ClientDashboard() {
  const { user, token, setCurrentView, setSelectedShop } = useAppStore();
  const [stats, setStats] = useState({ orders: 0, messages: 0, cartItems: 0, favorites: 0, followedShops: 0 });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [recommendedShops, setRecommendedShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  // Animated counters
  const animatedOrders = useAnimatedCounter(stats.orders);
  const animatedMessages = useAnimatedCounter(stats.messages);
  const animatedCartItems = useAnimatedCounter(stats.cartItems);
  const animatedFavorites = useAnimatedCounter(stats.favorites);
  const animatedFollowed = useAnimatedCounter(stats.followedShops);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      try {
        const headers = { Authorization: `Bearer ${token}` };

        const [ordersRes, messagesRes, cartRes, favRes, followedRes, shopsRes] = await Promise.all([
          fetch('/api/orders', { headers }),
          fetch('/api/messages', { headers }),
          fetch('/api/cart', { headers }),
          fetch('/api/favorites', { headers }),
          fetch('/api/followed-shops', { headers }),
          fetch('/api/shops'),
        ]);

        if (ordersRes.ok) {
          const data = await ordersRes.json();
          setRecentOrders((data.orders || []).slice(0, 5));
          setStats((prev) => ({ ...prev, orders: (data.orders || []).length }));
        }
        if (messagesRes.ok) {
          const data = await messagesRes.json();
          const totalUnread = (data.conversations || []).reduce(
            (acc: number, c: { unreadCount?: number }) => acc + (c.unreadCount || 0),
            0
          );
          setStats((prev) => ({ ...prev, messages: totalUnread }));
        }
        if (cartRes.ok) {
          const data = await cartRes.json();
          setStats((prev) => ({ ...prev, cartItems: (data.cartItems || []).length }));
        }
        if (favRes.ok) {
          const data = await favRes.json();
          setStats((prev) => ({ ...prev, favorites: (data.favorites || []).length }));
        }
        if (followedRes.ok) {
          const data = await followedRes.json();
          setStats((prev) => ({ ...prev, followedShops: (data.followedShops || []).length }));
        }
        if (shopsRes.ok) {
          const data = await shopsRes.json();
          const allShops: Shop[] = data.shops || [];
          let rec = allShops.filter((s: Shop) => s.isRecommended).slice(0, 8);
          if (rec.length === 0) {
            rec = allShops.slice(0, 8);
          }
          setRecommendedShops(rec);
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

  // Build activity feed
  const activities: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];
    recentOrders.forEach((order) => {
      items.push({
        id: `order-${order.id}`,
        type: 'order',
        text: `Commande ${order.orderNumber} - ${statusLabel[order.status] || order.status}`,
        time: order.createdAt,
      });
    });
    if (stats.favorites > 0) {
      items.push({
        id: 'fav-info',
        type: 'favorite',
        text: `${stats.favorites} produit${stats.favorites > 1 ? 's' : ''} dans vos favoris`,
        time: new Date().toISOString(),
      });
    }
    if (stats.followedShops > 0) {
      items.push({
        id: 'follow-info',
        type: 'follow',
        text: `${stats.followedShops} boutique${stats.followedShops > 1 ? 's' : ''} suivie${stats.followedShops > 1 ? 's' : ''}`,
        time: new Date().toISOString(),
      });
    }
    return items.slice(0, 6);
  }, [recentOrders, stats.favorites, stats.followedShops]);

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

  const activityIcon: Record<string, React.ElementType> = {
    order: Package,
    message: MessageCircle,
    favorite: Heart,
    follow: Store,
  };

  const activityColor: Record<string, string> = {
    order: 'from-emerald-400 to-emerald-600',
    message: 'from-blue-400 to-blue-600',
    favorite: 'from-rose-400 to-rose-600',
    follow: 'from-amber-400 to-amber-600',
  };

  const statCards = [
    {
      label: 'Commandes',
      value: animatedOrders,
      icon: Package,
      gradient: 'from-emerald-500 to-green-600',
      borderColor: 'border-t-emerald-500',
      trend: '+12%',
      view: 'client-orders' as const,
    },
    {
      label: 'Messages',
      value: animatedMessages,
      icon: MessageCircle,
      gradient: 'from-teal-500 to-cyan-600',
      borderColor: 'border-t-teal-500',
      trend: '+5%',
      view: 'client-messages' as const,
    },
    {
      label: 'Favoris',
      value: animatedFavorites,
      icon: Heart,
      gradient: 'from-rose-500 to-pink-600',
      borderColor: 'border-t-rose-500',
      trend: '',
      view: 'client-favorites' as const,
    },
    {
      label: 'Boutiques suivies',
      value: animatedFollowed,
      icon: Store,
      gradient: 'from-amber-500 to-orange-600',
      borderColor: 'border-t-amber-500',
      trend: '',
      view: 'client-followed-shops' as const,
    },
  ];

  const quickLinks = [
    { label: 'Parcourir les boutiques', icon: Store, view: 'client-shop' as const, gradient: 'from-emerald-500 to-green-600', description: 'Découvrez les boutiques' },
    { label: 'Mes commandes', icon: Package, view: 'client-orders' as const, gradient: 'from-teal-500 to-cyan-600', description: 'Suivi en temps réel' },
    { label: 'Messagerie', icon: MessageCircle, view: 'client-messages' as const, gradient: 'from-sky-500 to-blue-600', description: 'Contactez les vendeurs' },
    { label: 'Favoris', icon: Heart, view: 'client-favorites' as const, gradient: 'from-rose-500 to-pink-600', description: 'Produits sauvegardés' },
    { label: 'Boutiques suivies', icon: Store, view: 'client-followed-shops' as const, gradient: 'from-amber-500 to-orange-600', description: 'Vos boutiques préférées' },
    { label: 'Mon profil', icon: User, view: 'client-profile' as const, gradient: 'from-violet-500 to-purple-600', description: 'Gérer votre compte' },
  ];

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* Welcome Banner */}
      <motion.div variants={itemVariants}>
        <Card className="border-0 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-xl overflow-hidden relative">
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
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
          <CardContent className="p-6 sm:p-8 relative z-10">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt={user.name}
                    className="h-14 w-14 rounded-full border-2 border-white/40 object-cover shadow-lg ring-2 ring-white/20"
                  />
                ) : (
                  <div className="h-14 w-14 rounded-full bg-gradient-to-br from-white/30 to-white/10 flex items-center justify-center text-white text-xl font-bold shadow-lg border border-white/20">
                    {user?.name?.charAt(0).toUpperCase() || 'C'}
                  </div>
                )}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {greeting}, {user?.name?.split(' ')[0] || 'Client'} 👋
                  </h1>
                  <p className="text-emerald-100 mt-1 text-sm sm:text-base">
                    Découvrez les meilleures boutiques de la RDC
                  </p>
                  <p className="text-emerald-200/60 text-xs mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setCurrentView('client-shop')}
                className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur-sm shrink-0 shadow-lg"
                variant="outline"
              >
                <Store className="mr-2 h-4 w-4" />
                Parcourir les boutiques
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Cards with Animated Counters */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card
            key={stat.label}
            className={`cursor-pointer card-hover border-t-4 ${stat.borderColor} overflow-hidden relative group`}
            onClick={() => setCurrentView(stat.view)}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-muted/20 to-transparent opacity-50 pointer-events-none group-hover:opacity-80 transition-opacity" />
            <CardContent className="p-4 sm:p-5 relative z-10">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</p>
                    {stat.trend && (
                      <span className="flex items-center text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 rounded-full">
                        <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                        {stat.trend}
                      </span>
                    )}
                  </div>
                  {loading ? (
                    <Skeleton className="h-8 w-16 mt-1" />
                  ) : (
                    <p className="text-2xl sm:text-3xl font-bold mt-1 tabular-nums">{stat.value}</p>
                  )}
                </div>
                <div
                  className={`h-11 w-11 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <stat.icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Recommended Shops Carousel */}
      {recommendedShops.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card className="overflow-hidden border-0 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-600" />
                  Boutiques recommandées
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentView('client-shop')}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  Voir tout
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {recommendedShops.map((shop) => (
                  <motion.div
                    key={shop.id}
                    whileHover={{ scale: 1.03 }}
                    className="shrink-0 w-56 cursor-pointer group"
                    onClick={() => {
                      setSelectedShop(shop);
                      setCurrentView('client-product');
                    }}
                  >
                    <div className="rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all">
                      <div className="h-24 bg-gradient-to-br from-emerald-400 to-green-500 relative overflow-hidden">
                        {shop.coverImage && (
                          <img src={shop.coverImage} alt={shop.name} className="w-full h-full object-cover" />
                        )}
                        {shop.isRecommended && (
                          <Badge className="absolute top-2 right-2 bg-emerald-600 text-white border-0 text-[10px] badge-shimmer">
                            <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                            Top
                          </Badge>
                        )}
                      </div>
                      <div className="p-3">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-white shadow-sm border overflow-hidden shrink-0">
                            {shop.logo ? (
                              <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                                <Store className="h-4 w-4 text-emerald-600" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-xs truncate">{shop.name}</p>
                            <p className="text-[10px] text-muted-foreground">{shop.products?.length || 0} produits</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Main content: Orders + Activity side by side on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card className="h-full shadow-md">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600" />
                Commandes récentes
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentView('client-orders')}
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
                <div className="text-center py-12">
                  <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                    <ShoppingBag className="h-10 w-10 text-emerald-300 dark:text-emerald-700" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold">Aucune commande</h3>
                  <p className="mt-1 text-muted-foreground text-sm max-w-xs mx-auto">Commencez à explorer nos boutiques et passez votre première commande !</p>
                  <Button
                    onClick={() => setCurrentView('client-shop')}
                    className="mt-5 bg-emerald-600 hover:bg-emerald-700 gap-2"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Commander maintenant
                  </Button>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
                  {recentOrders.map((order) => {
                    const progress = getOrderProgress(order.status);
                    const isCancelled = order.status === 'CANCELLED';
                    return (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/40 transition-colors"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">
                            {order.orderNumber}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {order.shop?.name || 'Boutique'} •{' '}
                            {new Date(order.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                          {!isCancelled && progress > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              {orderSteps.map((step, idx) => (
                                <div key={step} className="flex items-center">
                                  <div
                                    className={`h-1.5 w-1.5 rounded-full transition-colors ${
                                      idx < progress ? 'bg-emerald-500' : 'bg-muted-foreground/20'
                                    }`}
                                    title={statusLabel[step]}
                                  />
                                  {idx < orderSteps.length - 1 && (
                                    <div
                                      className={`h-0.5 w-2.5 ${idx < progress - 1 ? 'bg-emerald-500' : 'bg-muted-foreground/20'}`}
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                          {isCancelled && (
                            <div className="flex items-center gap-1 mt-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                              <span className="text-[10px] text-red-500 font-medium">Annulée</span>
                            </div>
                          )}
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
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Feed */}
        <motion.div variants={itemVariants}>
          <Card className="h-full shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="h-5 w-5 text-emerald-600" />
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                      <div className="flex-1 space-y-1">
                        <Skeleton className="h-3 w-3/4" />
                        <Skeleton className="h-2 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : activities.length === 0 ? (
                <div className="text-center py-8">
                  <Zap className="h-10 w-10 mx-auto text-muted-foreground/20" />
                  <p className="mt-2 text-sm text-muted-foreground">Aucune activité récente</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
                  {activities.map((activity) => {
                    const Icon = activityIcon[activity.type] || Package;
                    const color = activityColor[activity.type] || 'from-emerald-400 to-emerald-600';
                    return (
                      <div key={activity.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                        <div className={`h-8 w-8 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-sm`}>
                          <Icon className="h-4 w-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium truncate">{activity.text}</p>
                          <p className="text-[10px] text-muted-foreground">
                            {new Date(activity.time).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Action Grid */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-2 mb-3">
          <Zap className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold">Actions rapides</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickLinks.map((link) => (
            <Card
              key={link.label}
              className="cursor-pointer card-hover overflow-hidden relative group border-0 shadow-sm"
              onClick={() => setCurrentView(link.view)}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${link.gradient} opacity-0 group-hover:opacity-10 transition-opacity pointer-events-none`} />
              <CardContent className="p-4 text-center relative z-10">
                <div className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${link.gradient} flex items-center justify-center mx-auto mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                  <link.icon className="h-6 w-6 text-white" />
                </div>
                <p className="font-semibold text-sm">{link.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">{link.description}</p>
                <ChevronRight className="h-4 w-4 mx-auto mt-2 text-muted-foreground/30 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors" />
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
