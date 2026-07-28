'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Bell,
  Package,
  MessageCircle,
  Star,
  Truck,
  CreditCard,
  Info,
  CheckCircle2,
  X,
  Loader2,
  Trash2,
  ArrowRight,
  ShoppingBag,
  AlertTriangle,
} from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  link: string | null;
  data: string | null;
  isRead: boolean;
  createdAt: string;
}

const typeIcons: Record<string, { icon: React.ComponentType<{ className?: string }>; color: string; bg: string }> = {
  ORDER: { icon: Package, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' },
  MESSAGE: { icon: MessageCircle, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  REVIEW: { icon: Star, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' },
  SHIPPING: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' },
  PAYMENT: { icon: CreditCard, color: 'text-emerald-500', bg: 'bg-emerald-100 dark:bg-emerald-900/30' },
  SYSTEM: { icon: Info, color: 'text-sky-500', bg: 'bg-sky-100 dark:bg-sky-900/30' },
};

function getTypeConfig(type: string) {
  return typeIcons[type] || { icon: Info, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' };
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'À l\'instant';
  if (mins < 60) return `Il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `Il y a ${hrs}h`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `Il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

export function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('ecordc_token');
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/notifications?limit=5', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {} finally { setLoading(false); }
  };

  useEffect(() => { fetchNotifications(); }, []);

  const handleMarkRead = async (id: string) => {
    const token = localStorage.getItem('ecordc_token');
    if (!token) return;
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await fetch('/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ notificationId: id }),
    });
  };

  const handleClearAll = async () => {
    const token = localStorage.getItem('ecordc_token');
    if (!token) return;
    setClearing(true);
    try {
      await fetch('/api/notifications?clearRead=true', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications([]);
      setUnreadCount(0);
    } catch {} finally { setClearing(false); }
  };

  const handleNavigate = (notification: Notification) => {
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  return (
    <div ref={ref} className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => { setOpen(!open); if (!open) fetchNotifications(); }}>
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 text-[9px] bg-red-500 text-white border-0 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 origin-top-right z-50"
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-muted overflow-hidden">
              <div className="flex items-center justify-between p-3 border-b">
                <h3 className="font-semibold text-sm flex items-center gap-2">
                  <Bell className="h-4 w-4 text-emerald-500" />
                  Notifications
                </h3>
                <div className="flex items-center gap-1">
                  {notifications.length > 0 && (
                    <Button variant="ghost" size="sm" className="h-7 text-[10px] text-red-500" onClick={handleClearAll} disabled={clearing}>
                      {clearing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3 mr-1" />}
                      Effacer
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto">
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucune notification</p>
                  </div>
                ) : (
                  notifications.map((notif, i) => {
                    const config = getTypeConfig(notif.type);
                    return (
                      <div key={notif.id}>
                        {i > 0 && <Separator />}
                        <div
                          className={`p-3 cursor-pointer transition-colors hover:bg-muted/50 ${!notif.isRead ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''}`}
                          onClick={() => {
                            handleMarkRead(notif.id);
                            handleNavigate(notif);
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`h-8 w-8 rounded-full ${config.bg} flex items-center justify-center shrink-0`}>
                              <config.icon className={`h-4 w-4 ${config.color}`} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={`text-sm ${!notif.isRead ? 'font-semibold' : ''} truncate`}>{notif.title}</p>
                                <span className="text-[9px] text-muted-foreground shrink-0">{timeAgo(notif.createdAt)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{notif.message}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {!notif.isRead && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
                                {notif.link && (
                                  <span className="text-[9px] text-emerald-600 flex items-center gap-0.5">
                                    <ArrowRight className="h-2.5 w-2.5" />Voir les détails
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {notifications.length > 0 && (
                <div className="p-2 border-t">
                  <Button variant="ghost" size="sm" className="w-full text-xs text-emerald-600" onClick={() => { window.location.href = '/notifications'; }}>
                    Voir toutes les notifications
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
