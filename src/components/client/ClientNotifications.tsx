'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Notification } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Bell,
  ArrowLeft,
  Package,
  MessageCircle,
  Shield,
  Info,
  Tag,
  CheckCheck,
  Loader2,
  Filter,
  BellOff,
  ShoppingBag,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

const notifVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 20, transition: { duration: 0.2 } },
};

function getRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);

  if (diffSeconds < 60) return 'À l\'instant';
  if (diffMinutes < 60) return `Il y a ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  if (diffHours < 24) return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
  if (diffDays < 7) return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
  if (diffWeeks < 4) return `Il y a ${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''}`;
  if (diffMonths < 12) return `Il y a ${diffMonths} mois`;
  return `Il y a plus d'un an`;
}

function getNotificationIcon(type: string) {
  switch (type) {
    case 'ORDER': return Package;
    case 'MESSAGE': return MessageCircle;
    case 'SYSTEM': return Shield;
    case 'PROMOTION': return Tag;
    case 'RESTOCK': return Bell;
    case 'STOCK_ALERT': return Bell;
    case 'NEW_PRODUCT': return ShoppingBag;
    case 'INFO': default: return Info;
  }
}

function getNotificationColor(type: string) {
  switch (type) {
    case 'ORDER': return 'from-emerald-400 to-emerald-600';
    case 'MESSAGE': return 'from-sky-400 to-sky-600';
    case 'SYSTEM': return 'from-orange-400 to-orange-600';
    case 'PROMOTION': return 'from-pink-400 to-pink-600';
    case 'RESTOCK': return 'from-amber-400 to-amber-600';
    case 'STOCK_ALERT': return 'from-red-400 to-red-600';
    case 'NEW_PRODUCT': return 'from-teal-400 to-emerald-600';
    case 'INFO': default: return 'from-teal-400 to-teal-600';
  }
}

function getNotificationBg(type: string, isRead: boolean) {
  if (isRead) return 'bg-muted/20';
  switch (type) {
    case 'ORDER': return 'bg-emerald-50/50 dark:bg-emerald-900/10 border-l-emerald-500';
    case 'MESSAGE': return 'bg-sky-50/50 dark:bg-sky-900/10 border-l-sky-500';
    case 'SYSTEM': return 'bg-orange-50/50 dark:bg-orange-900/10 border-l-orange-500';
    case 'PROMOTION': return 'bg-pink-50/50 dark:bg-pink-900/10 border-l-pink-500';
    case 'RESTOCK': return 'bg-amber-50/50 dark:bg-amber-900/10 border-l-amber-500';
    case 'STOCK_ALERT': return 'bg-red-50/50 dark:bg-red-900/10 border-l-red-500';
    case 'NEW_PRODUCT': return 'bg-emerald-50/50 dark:bg-emerald-900/10 border-l-emerald-500';
    case 'INFO': default: return 'bg-teal-50/50 dark:bg-teal-900/10 border-l-teal-500';
  }
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'ORDER': return 'Commande';
    case 'MESSAGE': return 'Message';
    case 'SYSTEM': return 'Système';
    case 'PROMOTION': return 'Promotion';
    case 'RESTOCK': return 'Réassort';
    case 'STOCK_ALERT': return 'Alerte Stock';
    case 'NEW_PRODUCT': return 'Nouveau Produit';
    case 'INFO': default: return 'Info';
  }
}

export default function ClientNotifications() {
  const { token, setCurrentView } = useAppStore();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!token) return;
    setMarkingReadId(notificationId);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ notificationId }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch {
      // silently handle
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    setMarkingAllRead(true);
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
        setUnreadCount(0);
      }
    } catch {
      // silently handle
    } finally {
      setMarkingAllRead(false);
    }
  };

  const filteredNotifications = useMemo(() => {
    if (typeFilter === 'all') return notifications;
    return notifications.filter((n) => n.type === typeFilter);
  }, [notifications, typeFilter]);

  const notificationTypes = useMemo(() => {
    const types = new Set<string>();
    notifications.forEach((n) => types.add(n.type));
    return Array.from(types);
  }, [notifications]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('client-dashboard')}
          className="shrink-0 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6 text-emerald-600" />
            Notifications
          </h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? `${unreadCount} notification${unreadCount > 1 ? 's' : ''} non lue${unreadCount > 1 ? 's' : ''}`
              : 'Toutes les notifications sont lues'}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            size="sm"
            className="bg-emerald-600 hover:bg-emerald-700 shadow-md"
            onClick={handleMarkAllRead}
            disabled={markingAllRead}
          >
            {markingAllRead ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <CheckCheck className="h-4 w-4 mr-1" />
            )}
            Tout marquer comme lu
          </Button>
        )}
      </motion.div>

      {/* Filter */}
      <motion.div variants={itemVariants} className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue placeholder="Filtrer par type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {notificationTypes.map((type) => (
              <SelectItem key={type} value={type}>{getTypeLabel(type)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {typeFilter !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-emerald-600 hover:text-emerald-700"
            onClick={() => setTypeFilter('all')}
          >
            Réinitialiser
          </Button>
        )}
      </motion.div>

      {/* Content */}
      {loading ? (
        <Card className="shadow-sm">
          <CardContent className="p-4 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-start gap-3 p-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ) : filteredNotifications.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed border-2 border-emerald-200 dark:border-emerald-800">
            <CardContent className="p-16 text-center">
              <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                {typeFilter !== 'all' ? (
                  <Filter className="h-10 w-10 text-emerald-300 dark:text-emerald-700" />
                ) : (
                  <BellOff className="h-10 w-10 text-emerald-300 dark:text-emerald-700" />
                )}
              </div>
              <h3 className="text-xl font-semibold mt-6">
                {typeFilter !== 'all' ? 'Aucune notification de ce type' : 'Aucune notification'}
              </h3>
              <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                {typeFilter !== 'all'
                  ? 'Essayez un autre filtre pour voir vos notifications'
                  : 'Nous vous informerons des mises à jour de vos commandes, messages et promotions.'}
              </p>
              {typeFilter !== 'all' && (
                <Button
                  variant="outline"
                  className="mt-4 border-emerald-200 dark:border-emerald-800 text-emerald-600"
                  onClick={() => setTypeFilter('all')}
                >
                  Voir toutes les notifications
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants}>
          <Card className="shadow-sm overflow-hidden">
            <CardHeader className="pb-3 bg-muted/20">
              <CardTitle className="text-base flex items-center gap-2">
                <Bell className="h-4 w-4 text-emerald-600" />
                Toutes les notifications
                {unreadCount > 0 && (
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-[10px]">
                    {unreadCount} nouvelle{unreadCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <AnimatePresence mode="popLayout">
                <div className="max-h-[600px] overflow-y-auto divide-y scrollbar-thin">
                  {filteredNotifications.map((notification) => {
                    const Icon = getNotificationIcon(notification.type);
                    const color = getNotificationColor(notification.type);
                    const bg = getNotificationBg(notification.type, notification.isRead);

                    return (
                      <motion.div
                        key={notification.id}
                        variants={notifVariants}
                        initial="hidden"
                        animate="visible"
                        exit="exit"
                        layout
                        className={`flex items-start gap-3 p-4 cursor-pointer border-l-4 transition-colors hover:bg-muted/30 ${bg}`}
                        onClick={() => {
                          if (!notification.isRead) handleMarkAsRead(notification.id);
                        }}
                      >
                        <div
                          className={`h-10 w-10 rounded-full bg-gradient-to-br ${color} flex items-center justify-center shrink-0 shadow-sm`}
                        >
                          <Icon className="h-5 w-5 text-white" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4
                                className={`text-sm ${
                                  notification.isRead
                                    ? 'font-medium text-muted-foreground'
                                    : 'font-semibold text-foreground'
                                }`}
                              >
                                {notification.title}
                              </h4>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 shrink-0 mt-1.5 animate-pulse" />
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-muted-foreground">
                              {getRelativeTime(notification.createdAt)}
                            </span>
                            <Badge
                              variant="outline"
                              className="text-[9px] border-0 py-0 px-1.5 bg-muted/50"
                            >
                              {getTypeLabel(notification.type)}
                            </Badge>
                            {!notification.isRead && markingReadId === notification.id && (
                              <Loader2 className="h-3 w-3 animate-spin text-emerald-500" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </AnimatePresence>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}
