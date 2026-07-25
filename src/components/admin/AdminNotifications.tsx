'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell, ShoppingCart, MessageCircle, Megaphone, Info, AlertCircle, Store,
  Trash2, CheckCheck, Send, Filter,
} from 'lucide-react';

interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string; color: string }> = {
  ORDER: { icon: ShoppingCart, label: 'Commande', color: 'bg-blue-500/20 text-blue-400' },
  MESSAGE: { icon: MessageCircle, label: 'Message', color: 'bg-cyan-500/20 text-cyan-400' },
  PROMOTION: { icon: Megaphone, label: 'Promotion', color: 'bg-amber-500/20 text-amber-400' },
  INFO: { icon: Info, label: 'Information', color: 'bg-slate-500/20 text-slate-400' },
  ALERT: { icon: AlertCircle, label: 'Alerte', color: 'bg-red-500/20 text-red-400' },
  SYSTEM: { icon: Info, label: 'Système', color: 'bg-purple-500/20 text-purple-400' },
  SHOP: { icon: Store, label: 'Boutique', color: 'bg-teal-500/20 text-teal-400' },
};

const SEND_TYPES = [
  { value: 'ANNOUNCEMENT', label: 'Annonce' },
  { value: 'MAINTENANCE', label: 'Maintenance' },
  { value: 'WARNING', label: 'Avertissement' },
  { value: 'PROMOTION', label: 'Promotion' },
  { value: 'SECURITY', label: 'Sécurité' },
];

const RECIPIENT_TYPES = [
  { value: 'ALL', label: 'Tous les utilisateurs' },
  { value: 'CLIENT', label: 'Client spécifique' },
  { value: 'VENDOR', label: 'Vendeur spécifique' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AdminNotifications() {
  const { token } = useAppStore();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [activeTab, setActiveTab] = useState('received');

  // Send notification form state
  const [sendType, setSendType] = useState('ANNOUNCEMENT');
  const [recipientType, setRecipientType] = useState('ALL');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [sendTitle, setSendTitle] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sendError, setSendError] = useState('');

  const fetchNotifications = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({ limit: '50' });
      if (typeFilter !== 'ALL') params.set('type', typeFilter);

      const res = await fetch(`/api/notifications?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
      }
    } catch {
      // silently handle
    }
  }, [token, typeFilter]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await fetchNotifications();
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [fetchNotifications]);

  const handleMarkAsRead = async (notificationId: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId }),
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
        );
      }
    } catch {
      // silently handle
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/notifications?id=${notificationId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
      }
    } catch {
      // silently handle
    }
  };

  const handleMarkAllRead = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      }
    } catch {
      // silently handle
    }
  };

  const handleSendNotification = async () => {
    if (!token || !sendTitle.trim() || !sendMessage.trim()) return;

    if ((recipientType === 'CLIENT' || recipientType === 'VENDOR') && !recipientEmail.trim()) {
      setSendError('Veuillez entrer l\'email du destinataire');
      return;
    }

    setSending(true);
    setSendError('');
    setSendSuccess(false);

    try {
      const body: Record<string, string> = {
        action: recipientType === 'ALL' ? 'send-global-message' : 'send-private-message',
        title: sendTitle,
        message: sendMessage,
      };

      if (recipientType !== 'ALL') {
        // Look up user by email
        const searchRes = await fetch(`/api/admin?section=${recipientType === 'CLIENT' ? 'clients' : 'vendors'}&search=${encodeURIComponent(recipientEmail)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (searchRes.ok) {
          const searchData = await searchRes.json();
          const users = recipientType === 'CLIENT' ? searchData.clients : searchData.vendors;
          const user = users?.find((u: { email: string }) => u.email === recipientEmail);
          if (!user) {
            setSendError('Utilisateur non trouvé avec cet email');
            setSending(false);
            return;
          }
          body.targetId = user.id;
        }
      }

      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSendSuccess(true);
        setSendTitle('');
        setSendMessage('');
        setRecipientEmail('');
        setTimeout(() => setSendSuccess(false), 3000);
      } else {
        const data = await res.json();
        setSendError(data.error || 'Erreur lors de l\'envoi');
      }
    } catch {
      setSendError('Erreur de connexion');
    } finally {
      setSending(false);
    }
  };

  const getTypeIcon = (type: string) => {
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.INFO;
    return config.icon;
  };

  const getTypeColor = (type: string) => {
    const config = TYPE_CONFIG[type] || TYPE_CONFIG.INFO;
    return config.color;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <AdminSidebar>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <Bell className="h-7 w-7 text-blue-400" />
                Notifications & Annonces
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                {unreadCount > 0 ? `${unreadCount} non lue(s)` : 'Toutes les notifications sont lues'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                onClick={handleMarkAllRead}
              >
                <CheckCheck className="h-4 w-4 mr-1" />
                Tout marquer lu
              </Button>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <motion.div variants={item}>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-[#1e293b] border border-slate-700">
              <TabsTrigger value="received" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
                Notifications reçues
                {unreadCount > 0 && (
                  <Badge className="ml-2 h-5 min-w-[20px] text-[10px] bg-red-500 text-white border-0 px-1.5">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="send" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white text-slate-400">
                Envoyer une notification
              </TabsTrigger>
            </TabsList>

            {/* Tab 1: Received Notifications */}
            <TabsContent value="received" className="mt-4 space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-3">
                <Filter className="h-4 w-4 text-slate-500 shrink-0" />
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48 bg-[#1e293b] border-slate-700 text-white">
                    <SelectValue placeholder="Filtrer par type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">Tous les types</SelectItem>
                    {Object.entries(TYPE_CONFIG).map(([key, config]) => (
                      <SelectItem key={key} value={key}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Notifications List */}
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Card key={i} className="border-0 bg-[#1e293b] shadow-lg">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-slate-700 animate-pulse rounded-xl" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-slate-700 animate-pulse rounded w-48" />
                            <div className="h-3 bg-slate-700 animate-pulse rounded w-64" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <Card className="border-0 bg-[#1e293b] shadow-lg">
                  <CardContent className="py-16 text-center">
                    <Bell className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                    <p className="text-slate-500 text-lg font-medium">Aucune notification</p>
                    <p className="text-slate-600 text-sm mt-1">Les notifications système apparaîtront ici</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-2 max-h-[60vh] overflow-y-auto scrollbar-thin">
                  <AnimatePresence>
                    {notifications.map(notification => {
                      const IconComponent = getTypeIcon(notification.type);
                      return (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 10, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card className={`border-0 shadow-lg transition-all hover:shadow-xl ${
                            notification.isRead ? 'bg-[#1e293b]' : 'bg-[#1e293b] border-l-2 border-l-blue-500'
                          }`}>
                            <CardContent className="p-4">
                              <div className="flex items-start gap-3">
                                {/* Type Icon */}
                                <div className={`h-10 w-10 rounded-xl ${getTypeColor(notification.type)} flex items-center justify-center shrink-0`}>
                                  <IconComponent className="h-5 w-5" />
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className={`text-sm font-medium truncate ${notification.isRead ? 'text-slate-300' : 'text-white'}`}>
                                      {notification.title}
                                    </p>
                                    {!notification.isRead && (
                                      <div className="h-2 w-2 rounded-full bg-blue-400 shrink-0 animate-pulse" />
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{notification.message}</p>
                                  <div className="flex items-center gap-2 mt-1.5">
                                    <Badge className={`${getTypeColor(notification.type)} border-0 text-[9px] h-4`}>
                                      {TYPE_CONFIG[notification.type]?.label || notification.type}
                                    </Badge>
                                    <span className="text-[10px] text-slate-600">{formatDate(notification.createdAt)}</span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                  {!notification.isRead && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7 text-slate-500 hover:text-blue-400 hover:bg-blue-500/10"
                                      onClick={() => handleMarkAsRead(notification.id)}
                                      title="Marquer comme lu"
                                    >
                                      <CheckCheck className="h-3.5 w-3.5" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10"
                                    onClick={() => handleDelete(notification.id)}
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              )}
            </TabsContent>

            {/* Tab 2: Send Notification */}
            <TabsContent value="send" className="mt-4">
              <Card className="border-0 bg-[#1e293b] shadow-lg">
                <CardHeader>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                    <Send className="h-4 w-4 text-blue-400" />
                    Envoyer une notification
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Type */}
                  <div>
                    <label className="text-xs text-slate-400 font-medium mb-1.5 block">Type de notification</label>
                    <Select value={sendType} onValueChange={setSendType}>
                      <SelectTrigger className="bg-[#0f172a] border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {SEND_TYPES.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Recipient */}
                  <div>
                    <label className="text-xs text-slate-400 font-medium mb-1.5 block">Destinataire</label>
                    <Select value={recipientType} onValueChange={setRecipientType}>
                      <SelectTrigger className="bg-[#0f172a] border-slate-700 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RECIPIENT_TYPES.map(r => (
                          <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Email input for specific recipient */}
                  {(recipientType === 'CLIENT' || recipientType === 'VENDOR') && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                      <label className="text-xs text-slate-400 font-medium mb-1.5 block">
                        Email du {recipientType === 'CLIENT' ? 'client' : 'vendeur'}
                      </label>
                      <Input
                        type="email"
                        placeholder={`Email du ${recipientType === 'CLIENT' ? 'client' : 'vendeur'}`}
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                        className="bg-[#0f172a] border-slate-700 text-white placeholder:text-slate-500"
                      />
                    </motion.div>
                  )}

                  {/* Title */}
                  <div>
                    <label className="text-xs text-slate-400 font-medium mb-1.5 block">Titre</label>
                    <Input
                      placeholder="Titre de la notification"
                      value={sendTitle}
                      onChange={(e) => setSendTitle(e.target.value)}
                      className="bg-[#0f172a] border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="text-xs text-slate-400 font-medium mb-1.5 block">Message</label>
                    <Textarea
                      placeholder="Contenu de la notification..."
                      value={sendMessage}
                      onChange={(e) => setSendMessage(e.target.value)}
                      rows={4}
                      className="bg-[#0f172a] border-slate-700 text-white placeholder:text-slate-500 resize-none"
                    />
                  </div>

                  {/* Success/Error Feedback */}
                  {sendSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm"
                    >
                      <CheckCheck className="h-4 w-4" />
                      Notification envoyée avec succès !
                    </motion.div>
                  )}

                  {sendError && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"
                    >
                      <AlertCircle className="h-4 w-4" />
                      {sendError}
                    </motion.div>
                  )}

                  {/* Send Button */}
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    onClick={handleSendNotification}
                    disabled={sending || !sendTitle.trim() || !sendMessage.trim()}
                  >
                    {sending ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    {sending ? 'Envoi en cours...' : 'Envoyer la notification'}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </AdminSidebar>
  );
}
