'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  MessageCircle, Send, Globe, User, Users, Search, Clock,
  Megaphone, Wrench, AlertTriangle, Tag, ShieldCheck, Info,
  ChevronDown, ChevronRight, History,
} from 'lucide-react';
import { toast } from 'sonner';

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  city?: string;
}

interface Conversation {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  createdAt: string;
}

interface AdminMessageItem {
  id: string;
  type: string; // GLOBAL | ROLE_TARGETED | PRIVATE | MULTI
  targetId: string | null;
  targetRole: string | null;
  messageType: string; // SYSTEM | ALERT | INFO | PROMOTION | MAINTENANCE
  title: string;
  message: string;
  createdAt: string;
}

interface HistoryStats {
  total: number;
  global: number;
  roleTargeted: number;
  private: number;
  multi: number;
}

/* ------------------------------------------------------------------ */
/* Constants                                                           */
/* ------------------------------------------------------------------ */

const MESSAGE_TYPES = [
  { value: 'SYSTEM', label: 'Notification système', icon: Megaphone, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
  { value: 'ALERT', label: 'Alerte', icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  { value: 'INFO', label: 'Information', icon: Info, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' },
  { value: 'PROMOTION', label: 'Promotion', icon: Tag, color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20' },
  { value: 'MAINTENANCE', label: 'Maintenance', icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
];

const TARGET_AUDIENCES = [
  { value: 'ALL', label: 'Tous les utilisateurs', icon: Globe, hint: 'Vendeurs et clients' },
  { value: 'VENDOR', label: 'Tous les vendeurs', icon: Users, hint: 'Comptes vendeurs actifs' },
  { value: 'CLIENT', label: 'Tous les clients', icon: User, hint: 'Comptes clients actifs' },
];

const AUDIENCE_BADGE: Record<string, { label: string; color: string }> = {
  GLOBAL: { label: 'Global', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  ROLE_TARGETED: { label: 'Rôle ciblé', color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
  PRIVATE: { label: 'Privé', color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
  MULTI: { label: 'Multi', color: 'bg-amber-500/15 text-amber-300 border-amber-500/30' },
};

const HISTORY_TYPE_FILTERS = [
  { value: 'ALL', label: 'Tous les types' },
  { value: 'GLOBAL', label: 'Global' },
  { value: 'ROLE_TARGETED', label: 'Rôle ciblé' },
  { value: 'PRIVATE', label: 'Privé' },
  { value: 'MULTI', label: 'Multi' },
];

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

const getTypeConfig = (value: string) =>
  MESSAGE_TYPES.find((t) => t.value === value) || MESSAGE_TYPES[0];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function AdminMessages() {
  const { token } = useAppStore();

  /* --- Active tab --- */
  const [activeTab, setActiveTab] = useState<'received' | 'global' | 'targeted' | 'history'>('received');

  /* --- Global send state --- */
  const [globalTitle, setGlobalTitle] = useState('');
  const [globalMessage, setGlobalMessage] = useState('');
  const [globalType, setGlobalType] = useState('SYSTEM');
  const [globalAudience, setGlobalAudience] = useState<'ALL' | 'VENDOR' | 'CLIENT'>('ALL');

  /* --- Targeted send state --- */
  const [targetedMode, setTargetedMode] = useState<'single' | 'multi'>('single');
  const [targetedTitle, setTargetedTitle] = useState('');
  const [targetedMessage, setTargetedMessage] = useState('');
  const [targetedType, setTargetedType] = useState('SYSTEM');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [multiSelectedIds, setMultiSelectedIds] = useState<string[]>([]);

  /* --- Users (minimal) --- */
  const [users, setUsers] = useState<UserItem[]>([]);
  const [searchUsers, setSearchUsers] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  /* --- History state --- */
  const [historyMessages, setHistoryMessages] = useState<AdminMessageItem[]>([]);
  const [historyStats, setHistoryStats] = useState<HistoryStats>({ total: 0, global: 0, roleTargeted: 0, private: 0, multi: 0 });
  const [historyFilterType, setHistoryFilterType] = useState('ALL');
  const [historyFilterMessageType, setHistoryFilterMessageType] = useState('ALL');
  const [expandedMessageId, setExpandedMessageId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  /* --- Received messages state (kept as-is) --- */
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [conversationMessages, setConversationMessages] = useState<ChatMessage[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const [sending, setSending] = useState(false);

  /* ---------------------------------------------------------------- */
  /* Fetchers                                                         */
  /* ---------------------------------------------------------------- */

  const fetchUsersMinimal = useCallback(async (search?: string) => {
    if (!token) return;
    setLoadingUsers(true);
    try {
      const params = new URLSearchParams({ section: 'users-minimal', role: 'ALL' });
      if (search && search.trim()) params.set('search', search.trim());
      const res = await fetch(`/api/admin?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      } else {
        setUsers([]);
      }
    } catch {
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [token]);

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        const convs = (data.conversations || []).map((c: any) => ({
          id: c.id,
          name: c.name,
          email: c.email || '',
          role: c.role || 'USER',
          avatar: c.avatar,
          lastMessage: c.lastMessage || '',
          lastMessageTime: c.lastMessageTime || '',
          unreadCount: c.unreadCount || 0,
        }));
        setConversations(convs);
      }
    } catch { /* silently handle */ }
    finally { setLoadingConversations(false); }
  }, [token]);

  const fetchConversationMessages = useCallback(async (partnerId: string) => {
    if (!token) return;
    setLoadingMessages(true);
    try {
      const res = await fetch(`/api/messages?partnerId=${partnerId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversationMessages(data.messages || []);
      }
    } catch { /* silently handle */ }
    finally { setLoadingMessages(false); }
  }, [token]);

  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setLoadingHistory(true);
    try {
      const params = new URLSearchParams({ section: 'admin-messages' });
      if (historyFilterType !== 'ALL') params.set('type', historyFilterType);
      if (historyFilterMessageType !== 'ALL') params.set('messageType', historyFilterMessageType);
      const res = await fetch(`/api/admin?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistoryMessages(data.messages || []);
        setHistoryStats(data.stats || { total: 0, global: 0, roleTargeted: 0, private: 0, multi: 0 });
      } else {
        setHistoryMessages([]);
      }
    } catch {
      setHistoryMessages([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [token, historyFilterType, historyFilterMessageType]);

  /* ---------------------------------------------------------------- */
  /* Effects                                                          */
  /* ---------------------------------------------------------------- */

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  // Load users when entering targeted tab
  useEffect(() => {
    if (activeTab === 'targeted' && users.length === 0 && token) {
      fetchUsersMinimal();
    }
  }, [activeTab, users.length, token, fetchUsersMinimal]);

  // Debounced search inside targeted tab
  useEffect(() => {
    if (activeTab !== 'targeted' || !token) return;
    const t = setTimeout(() => fetchUsersMinimal(searchUsers), 350);
    return () => clearTimeout(t);
  }, [searchUsers, activeTab, token, fetchUsersMinimal]);

  // Load history when entering history tab
  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  /* ---------------------------------------------------------------- */
  /* Handlers                                                         */
  /* ---------------------------------------------------------------- */

  const handleSelectConversation = async (convId: string) => {
    setSelectedConversation(convId);
    await fetchConversationMessages(convId);
  };

  const toggleMultiSelect = (id: string) => {
    setMultiSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const selectAllUsers = () => {
    setMultiSelectedIds(users.map((u) => u.id));
  };

  const clearAllUsers = () => {
    setMultiSelectedIds([]);
  };

  const sendGlobalMessage = async () => {
    if (!globalTitle.trim() || !globalMessage.trim() || !token) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'send-global-message',
          title: globalTitle.trim(),
          message: globalMessage.trim(),
          messageType: globalType,
          targetRole: globalAudience,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const count = typeof data.recipients === 'number' ? data.recipients : 0;
        toast.success(`Message envoyé à ${count} utilisateur${count > 1 ? 's' : ''}`);
        setGlobalTitle('');
        setGlobalMessage('');
      } else {
        toast.error('Erreur lors de l\'envoi');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSending(false);
    }
  };

  const sendPrivateMessage = async () => {
    if (!selectedUserId || !targetedTitle.trim() || !targetedMessage.trim() || !token) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'send-private-message',
          targetId: selectedUserId,
          title: targetedTitle.trim(),
          message: targetedMessage.trim(),
          messageType: targetedType,
        }),
      });
      if (res.ok) {
        toast.success('Message privé envoyé avec succès');
        setTargetedTitle('');
        setTargetedMessage('');
        setSelectedUserId('');
      } else {
        toast.error('Erreur lors de l\'envoi');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSending(false);
    }
  };

  const sendMultiMessage = async () => {
    if (multiSelectedIds.length === 0 || !targetedTitle.trim() || !targetedMessage.trim() || !token) return;
    setSending(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'send-multi-message',
          targetIds: multiSelectedIds,
          title: targetedTitle.trim(),
          message: targetedMessage.trim(),
          messageType: targetedType,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const count = typeof data.recipients === 'number' ? data.recipients : multiSelectedIds.length;
        toast.success(`Message envoyé à ${count} utilisateur${count > 1 ? 's' : ''}`);
        setTargetedTitle('');
        setTargetedMessage('');
        setMultiSelectedIds([]);
      } else {
        toast.error('Erreur lors de l\'envoi');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSending(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /* Helpers                                                          */
  /* ---------------------------------------------------------------- */

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatFullDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const previewTypeConfig = activeTab === 'global'
    ? getTypeConfig(globalType)
    : getTypeConfig(targetedType);

  const previewAudience = TARGET_AUDIENCES.find((a) => a.value === globalAudience) || TARGET_AUDIENCES[0];

  const previewTitle = activeTab === 'global' ? globalTitle : targetedTitle;
  const previewMessage = activeTab === 'global' ? globalMessage : targetedMessage;

  /* ---------------------------------------------------------------- */
  /* Render                                                           */
  /* ---------------------------------------------------------------- */

  return (
    <AdminSidebar>
      <motion.div {...fadeIn} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <MessageCircle className="h-6 w-6 text-blue-400" />
            Messagerie Admin
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Envoyez des messages globaux, ciblés et consultez l&apos;historique
          </p>
        </div>

        {/* Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'received' | 'global' | 'targeted' | 'history')}
          className="space-y-4"
        >
          <TabsList className="bg-[#1e293b] border border-[#334155] p-1 h-auto flex flex-wrap">
            <TabsTrigger
              value="received"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-400 hover:text-slate-200 gap-2 px-4 py-2"
            >
              <MessageCircle className="h-4 w-4" /> Messages reçus
            </TabsTrigger>
            <TabsTrigger
              value="global"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-400 hover:text-slate-200 gap-2 px-4 py-2"
            >
              <Globe className="h-4 w-4" /> Envoi global
            </TabsTrigger>
            <TabsTrigger
              value="targeted"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-400 hover:text-slate-200 gap-2 px-4 py-2"
            >
              <Send className="h-4 w-4" /> Envoi ciblé
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md text-slate-400 hover:text-slate-200 gap-2 px-4 py-2"
            >
              <History className="h-4 w-4" /> Historique
            </TabsTrigger>
          </TabsList>

          {/* ============================================================ */}
          {/* Messages Reçus Tab (unchanged)                               */}
          {/* ============================================================ */}
          <TabsContent value="received">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Conversation List */}
              <Card className="border border-[#334155] bg-[#1e293b] lg:col-span-1">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-400" /> Conversations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingConversations ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3 p-3">
                          <Skeleton className="h-10 w-10 rounded-full bg-slate-700" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4 bg-slate-700" />
                            <Skeleton className="h-3 w-1/2 bg-slate-700" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : conversations.length === 0 ? (
                    <div className="text-center py-12">
                      <MessageCircle className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                      <p className="text-sm text-slate-500">Aucune conversation</p>
                    </div>
                  ) : (
                    <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1
                                    [&::-webkit-scrollbar]:w-1.5
                                    [&::-webkit-scrollbar-thumb]:bg-slate-700
                                    [&::-webkit-scrollbar-thumb]:rounded-full
                                    [&::-webkit-scrollbar-track]:bg-transparent">
                      {conversations.map((conv) => (
                        <button
                          key={conv.id}
                          onClick={() => handleSelectConversation(conv.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                            selectedConversation === conv.id
                              ? 'bg-blue-500/10 border border-blue-500/30'
                              : 'hover:bg-[#0f172a]/50 border border-transparent'
                          }`}
                        >
                          <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-semibold shrink-0">
                            {conv.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate text-slate-200">{conv.name}</p>
                              {conv.unreadCount > 0 && (
                                <Badge className="bg-blue-500 text-white border-0 text-[10px] shrink-0 h-5 min-w-[20px] justify-center">
                                  {conv.unreadCount}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-slate-500 truncate">{conv.lastMessage || 'Aucun message'}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <Badge variant="outline" className="text-[9px] h-4 px-1 border-[#334155] text-slate-400">
                                {conv.role === 'VENDOR' ? 'Vendeur' : 'Client'}
                              </Badge>
                              {conv.lastMessageTime && (
                                <span className="text-[9px] text-slate-600">{formatTime(conv.lastMessageTime)}</span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Message View */}
              <Card className="border border-[#334155] bg-[#1e293b] lg:col-span-2">
                <CardContent className="p-0">
                  {!selectedConversation ? (
                    <div className="text-center py-20">
                      <MessageCircle className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                      <p className="text-slate-500 text-sm">Sélectionnez une conversation pour voir les messages</p>
                    </div>
                  ) : loadingMessages ? (
                    <div className="space-y-3 p-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="flex gap-3">
                          <Skeleton className="h-8 w-8 rounded-full bg-slate-700" />
                          <Skeleton className="h-12 w-3/4 bg-slate-700 rounded-lg" />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col h-[500px]">
                      {/* Conversation header */}
                      <div className="px-4 py-3 border-b border-[#334155] flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                          {conversations.find(c => c.id === selectedConversation)?.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">{conversations.find(c => c.id === selectedConversation)?.name}</p>
                          <p className="text-xs text-slate-500">{conversations.find(c => c.id === selectedConversation)?.email}</p>
                        </div>
                        <Badge variant="outline" className="text-[9px] border-[#334155] text-slate-400 ml-auto">
                          {conversations.find(c => c.id === selectedConversation)?.role === 'VENDOR' ? 'Vendeur' : 'Client'}
                        </Badge>
                      </div>
                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3
                                      [&::-webkit-scrollbar]:w-1.5
                                      [&::-webkit-scrollbar-thumb]:bg-slate-700
                                      [&::-webkit-scrollbar-thumb]:rounded-full
                                      [&::-webkit-scrollbar-track]:bg-transparent">
                        {conversationMessages.length === 0 ? (
                          <div className="text-center py-12">
                            <p className="text-slate-500 text-sm">Aucun message dans cette conversation</p>
                          </div>
                        ) : (
                          conversationMessages.map((msg) => {
                            const isAdmin = msg.senderId !== selectedConversation;
                            return (
                              <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}
                              >
                                <div className={`max-w-[70%] rounded-xl px-4 py-2.5 text-sm ${
                                  isAdmin
                                    ? 'bg-blue-600/20 text-blue-100 border border-blue-500/20'
                                    : 'bg-[#334155] text-slate-200 border border-[#475569]'
                                }`}>
                                  <p className="text-xs font-medium mb-1 text-slate-400">{msg.senderName}</p>
                                  <p className="whitespace-pre-wrap">{msg.content}</p>
                                  <p className="text-[9px] text-slate-500 mt-1.5">{formatTime(msg.createdAt)}</p>
                                </div>
                              </motion.div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* Envoi Global Tab                                              */}
          {/* ============================================================ */}
          <TabsContent value="global">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Send Form */}
              <Card className="border border-[#334155] bg-[#1e293b]">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-blue-400" /> Envoi global
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Target audience */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Public cible</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {TARGET_AUDIENCES.map((aud) => (
                        <button
                          key={aud.value}
                          type="button"
                          onClick={() => setGlobalAudience(aud.value as 'ALL' | 'VENDOR' | 'CLIENT')}
                          className={`flex flex-col items-start gap-1 p-3 rounded-lg border text-left transition-colors ${
                            globalAudience === aud.value
                              ? 'bg-blue-500/10 border-blue-500/40 text-white'
                              : 'bg-[#0f172a]/60 border-[#334155] text-slate-300 hover:border-slate-600'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <aud.icon className={`h-4 w-4 ${globalAudience === aud.value ? 'text-blue-400' : 'text-slate-400'}`} />
                            <span className="text-xs font-medium">{aud.label}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{aud.hint}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Message type */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Type de message</Label>
                    <Select value={globalType} onValueChange={setGlobalType}>
                      <SelectTrigger className="bg-[#0f172a] border-[#334155] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e293b] border-[#334155]">
                        {MESSAGE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className={`h-4 w-4 ${type.color}`} />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Titre</Label>
                    <Input
                      placeholder="Titre du message"
                      value={globalTitle}
                      onChange={(e) => setGlobalTitle(e.target.value)}
                      className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-blue-500"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Message</Label>
                    <Textarea
                      placeholder="Contenu du message..."
                      value={globalMessage}
                      onChange={(e) => setGlobalMessage(e.target.value)}
                      rows={5}
                      className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-blue-500 resize-none"
                    />
                  </div>

                  {/* Send button */}
                  <Button
                    onClick={sendGlobalMessage}
                    disabled={sending || !globalTitle.trim() || !globalMessage.trim()}
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white gap-2 w-full"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? 'Envoi en cours...' : `Envoyer · ${previewAudience.label}`}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview */}
              <div className="space-y-4">
                <Card className="border border-[#334155] bg-[#1e293b]">
                  <CardHeader>
                    <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                      <previewTypeConfig.icon className={`h-4 w-4 ${previewTypeConfig.color}`} /> Aperçu de la notification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`p-4 rounded-lg border ${previewTypeConfig.bg} ${previewTypeConfig.border}`}>
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${previewTypeConfig.bg} border ${previewTypeConfig.border}`}>
                          <previewTypeConfig.icon className={`h-5 w-5 ${previewTypeConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-[9px] border-0 ${previewTypeConfig.bg} ${previewTypeConfig.color}`}>
                              {previewTypeConfig.label}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] border-[#334155] text-slate-400">
                              <previewAudience.icon className="h-3 w-3 mr-1" />
                              {previewAudience.label}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm text-slate-100 truncate">
                            {previewTitle || 'Titre de votre message apparaîtra ici'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-4 whitespace-pre-wrap">
                            {previewMessage || 'Le contenu de votre message apparaîtra ici. Les utilisateurs verront cette notification dans leur Centre de notifications.'}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> À l&apos;instant
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border border-amber-500/20 bg-[#1e293b]">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 text-amber-400 mb-2">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="text-sm font-medium">Bon à savoir</span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Ce message sera envoyé à tous les utilisateurs actifs correspondant au public cible.
                      Une notification sera créée pour chaque destinataire et l&apos;envoi sera enregistré dans l&apos;historique.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* Envoi Ciblé Tab                                               */}
          {/* ============================================================ */}
          <TabsContent value="targeted">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Send Form */}
              <Card className="border border-[#334155] bg-[#1e293b]">
                <CardHeader>
                  <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                    <Send className="h-4 w-4 text-blue-400" /> Envoi ciblé
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Sub-mode toggle */}
                  <div className="flex items-center gap-2 p-1 rounded-lg bg-[#0f172a]/60 border border-[#334155]">
                    <button
                      type="button"
                      onClick={() => { setTargetedMode('single'); setMultiSelectedIds([]); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-colors ${
                        targetedMode === 'single'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <User className="h-4 w-4" /> Utilisateur unique
                    </button>
                    <button
                      type="button"
                      onClick={() => { setTargetedMode('multi'); setSelectedUserId(''); }}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-xs font-medium transition-colors ${
                        targetedMode === 'multi'
                          ? 'bg-blue-600 text-white shadow'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <Users className="h-4 w-4" /> Multi-utilisateurs
                    </button>
                  </div>

                  {/* Search */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Rechercher un utilisateur</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        placeholder="Nom ou email..."
                        value={searchUsers}
                        onChange={(e) => setSearchUsers(e.target.value)}
                        className="pl-9 bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Multi-select actions */}
                  {targetedMode === 'multi' && users.length > 0 && (
                    <div className="flex items-center justify-between gap-2">
                      <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 border">
                        {multiSelectedIds.length} sélectionné{multiSelectedIds.length > 1 ? 's' : ''}
                      </Badge>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllUsers}
                          className="border-[#334155] text-slate-300 hover:bg-[#334155] text-xs h-7"
                        >
                          Tout sélectionner
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={clearAllUsers}
                          disabled={multiSelectedIds.length === 0}
                          className="border-[#334155] text-slate-300 hover:bg-[#334155] text-xs h-7 disabled:opacity-40"
                        >
                          Tout désélectionner
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* User list */}
                  <div className="border border-[#334155] rounded-lg bg-[#0f172a]/60 max-h-64 overflow-y-auto
                                  [&::-webkit-scrollbar]:w-1.5
                                  [&::-webkit-scrollbar-thumb]:bg-slate-700
                                  [&::-webkit-scrollbar-thumb]:rounded-full
                                  [&::-webkit-scrollbar-track]:bg-transparent">
                    {loadingUsers ? (
                      <div className="p-3 space-y-2">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="flex items-center gap-3 p-2">
                            <Skeleton className="h-7 w-7 rounded-full bg-slate-700" />
                            <div className="flex-1 space-y-1">
                              <Skeleton className="h-3 w-2/3 bg-slate-700" />
                              <Skeleton className="h-2 w-1/2 bg-slate-700" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : users.length === 0 ? (
                      <p className="text-sm text-slate-500 text-center py-6">
                        {searchUsers ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
                      </p>
                    ) : (
                      users.slice(0, 50).map((u) => {
                        const isMultiSelected = multiSelectedIds.includes(u.id);
                        const isSingleSelected = selectedUserId === u.id;
                        return (
                          <div
                            key={u.id}
                            onClick={() => {
                              if (targetedMode === 'single') {
                                setSelectedUserId(u.id);
                              } else {
                                toggleMultiSelect(u.id);
                              }
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm cursor-pointer transition-colors border-b border-[#0f172a]/60 last:border-b-0 ${
                              (targetedMode === 'multi' && isMultiSelected) ||
                              (targetedMode === 'single' && isSingleSelected)
                                ? 'bg-blue-500/10 border-l-2 border-blue-400'
                                : 'hover:bg-[#1e293b]/80 border-l-2 border-transparent'
                            }`}
                          >
                            {targetedMode === 'multi' && (
                              <Checkbox
                                checked={isMultiSelected}
                                onCheckedChange={() => toggleMultiSelect(u.id)}
                                onClick={(e) => e.stopPropagation()}
                                className="border-slate-500 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                              />
                            )}
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                              {u.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="text-left flex-1 min-w-0">
                              <p className="font-medium truncate text-slate-200">{u.name}</p>
                              <p className="text-xs text-slate-500 truncate">{u.email}</p>
                            </div>
                            {u.city && (
                              <span className="text-[10px] text-slate-600 hidden sm:inline">{u.city}</span>
                            )}
                            <Badge variant="outline" className="text-[9px] border-[#334155] text-slate-400 shrink-0">
                              {u.role === 'VENDOR' ? 'Vendeur' : u.role === 'CLIENT' ? 'Client' : u.role}
                            </Badge>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Selected (single mode) */}
                  {targetedMode === 'single' && selectedUserId && (
                    <div className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-lg px-3 py-2">
                      <span className="text-sm text-slate-400">Sélectionné :</span>
                      <Badge className="bg-blue-500/20 text-blue-300 border-0">
                        {users.find((u) => u.id === selectedUserId)?.name || 'Utilisateur'}
                      </Badge>
                      <button onClick={() => setSelectedUserId('')} className="text-xs text-red-400 hover:underline ml-auto">
                        Changer
                      </button>
                    </div>
                  )}

                  {/* Message type */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Type de message</Label>
                    <Select value={targetedType} onValueChange={setTargetedType}>
                      <SelectTrigger className="bg-[#0f172a] border-[#334155] text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e293b] border-[#334155]">
                        {MESSAGE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className={`h-4 w-4 ${type.color}`} />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Title */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Titre</Label>
                    <Input
                      placeholder="Titre du message"
                      value={targetedTitle}
                      onChange={(e) => setTargetedTitle(e.target.value)}
                      disabled={targetedMode === 'single' ? !selectedUserId : multiSelectedIds.length === 0}
                      className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-blue-500 disabled:opacity-50"
                    />
                  </div>

                  {/* Message */}
                  <div className="space-y-2">
                    <Label className="text-slate-300 text-sm">Message</Label>
                    <Textarea
                      placeholder="Contenu du message..."
                      value={targetedMessage}
                      onChange={(e) => setTargetedMessage(e.target.value)}
                      rows={4}
                      disabled={targetedMode === 'single' ? !selectedUserId : multiSelectedIds.length === 0}
                      className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-blue-500 resize-none disabled:opacity-50"
                    />
                  </div>

                  {/* Send button */}
                  <Button
                    onClick={targetedMode === 'single' ? sendPrivateMessage : sendMultiMessage}
                    disabled={
                      sending ||
                      (targetedMode === 'single'
                        ? !selectedUserId || !targetedTitle.trim() || !targetedMessage.trim()
                        : multiSelectedIds.length === 0 || !targetedTitle.trim() || !targetedMessage.trim())
                    }
                    className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white gap-2 w-full"
                  >
                    <Send className="h-4 w-4" />
                    {sending
                      ? 'Envoi en cours...'
                      : targetedMode === 'single'
                        ? 'Envoyer le message'
                        : `Envoyer à ${multiSelectedIds.length} utilisateur${multiSelectedIds.length > 1 ? 's' : ''}`}
                  </Button>
                </CardContent>
              </Card>

              {/* Preview */}
              <div className="space-y-4">
                <Card className="border border-[#334155] bg-[#1e293b]">
                  <CardHeader>
                    <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                      <previewTypeConfig.icon className={`h-4 w-4 ${previewTypeConfig.color}`} /> Aperçu de la notification
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className={`p-4 rounded-lg border ${previewTypeConfig.bg} ${previewTypeConfig.border}`}>
                      <div className="flex items-start gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${previewTypeConfig.bg} border ${previewTypeConfig.border}`}>
                          <previewTypeConfig.icon className={`h-5 w-5 ${previewTypeConfig.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <Badge className={`text-[9px] border-0 ${previewTypeConfig.bg} ${previewTypeConfig.color}`}>
                              {previewTypeConfig.label}
                            </Badge>
                            <Badge variant="outline" className="text-[9px] border-[#334155] text-slate-400">
                              {targetedMode === 'single' ? (
                                <>
                                  <User className="h-3 w-3 mr-1" /> Privé
                                </>
                              ) : (
                                <>
                                  <Users className="h-3 w-3 mr-1" /> {multiSelectedIds.length} destinataires
                                </>
                              )}
                            </Badge>
                          </div>
                          <p className="font-medium text-sm text-slate-100 truncate">
                            {previewTitle || 'Titre de votre message apparaîtra ici'}
                          </p>
                          <p className="text-xs text-slate-400 mt-1 line-clamp-4 whitespace-pre-wrap">
                            {previewMessage || 'Le contenu de votre message apparaîtra ici.'}
                          </p>
                          <p className="text-[10px] text-slate-600 mt-2 flex items-center gap-1">
                            <Clock className="h-3 w-3" /> À l&apos;instant
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recipients summary */}
                <Card className="border border-[#334155] bg-[#1e293b]">
                  <CardHeader>
                    <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-400" /> Destinataires
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {targetedMode === 'single' ? (
                      selectedUserId ? (
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#0f172a]/60 border border-[#334155]">
                          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                            {users.find((u) => u.id === selectedUserId)?.name.charAt(0).toUpperCase() || '?'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-200 truncate">
                              {users.find((u) => u.id === selectedUserId)?.name || 'Inconnu'}
                            </p>
                            <p className="text-xs text-slate-500 truncate">
                              {users.find((u) => u.id === selectedUserId)?.email}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-[9px] border-[#334155] text-slate-400">
                            {users.find((u) => u.id === selectedUserId)?.role === 'VENDOR' ? 'Vendeur' : 'Client'}
                          </Badge>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 text-center py-4">Aucun destinataire sélectionné</p>
                      )
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Utilisateurs sélectionnés</span>
                          <Badge className="bg-blue-500/15 text-blue-300 border-blue-500/30 border">
                            {multiSelectedIds.length}
                          </Badge>
                        </div>
                        {multiSelectedIds.length > 0 ? (
                          <div className="max-h-40 overflow-y-auto space-y-1 pr-1
                                          [&::-webkit-scrollbar]:w-1.5
                                          [&::-webkit-scrollbar-thumb]:bg-slate-700
                                          [&::-webkit-scrollbar-thumb]:rounded-full
                                          [&::-webkit-scrollbar-track]:bg-transparent">
                            {multiSelectedIds.map((id) => {
                              const u = users.find((x) => x.id === id);
                              if (!u) return null;
                              return (
                                <div key={id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-[#0f172a]/40">
                                  <div className="h-5 w-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[9px] font-semibold shrink-0">
                                    {u.name.charAt(0).toUpperCase()}
                                  </div>
                                  <span className="text-slate-300 truncate flex-1">{u.name}</span>
                                  <button
                                    onClick={() => toggleMultiSelect(id)}
                                    className="text-red-400 hover:text-red-300 text-[10px]"
                                  >
                                    Retirer
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-500 text-center py-4">Aucun destinataire sélectionné</p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* ============================================================ */}
          {/* Historique Tab                                                */}
          {/* ============================================================ */}
          <TabsContent value="history">
            <div className="space-y-4">
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {[
                  { label: 'Total', value: historyStats.total, icon: MessageCircle, color: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
                  { label: 'Globaux', value: historyStats.global, icon: Globe, color: 'text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
                  { label: 'Ciblés (rôle)', value: historyStats.roleTargeted, icon: Users, color: 'text-pink-400', bg: 'bg-pink-500/10', border: 'border-pink-500/20' },
                  { label: 'Privés', value: historyStats.private, icon: User, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
                  { label: 'Multi', value: historyStats.multi, icon: Send, color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
                ].map((stat) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`p-4 rounded-xl border ${stat.bg} ${stat.border}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <stat.icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Filters + table */}
              <Card className="border border-[#334155] bg-[#1e293b]">
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
                      <History className="h-4 w-4 text-blue-400" /> Messages envoyés
                    </CardTitle>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={historyFilterType} onValueChange={setHistoryFilterType}>
                        <SelectTrigger className="h-8 w-40 bg-[#0f172a] border-[#334155] text-xs text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e293b] border-[#334155]">
                          {HISTORY_TYPE_FILTERS.map((f) => (
                            <SelectItem key={f.value} value={f.value} className="text-xs">
                              {f.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={historyFilterMessageType} onValueChange={setHistoryFilterMessageType}>
                        <SelectTrigger className="h-8 w-44 bg-[#0f172a] border-[#334155] text-xs text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e293b] border-[#334155]">
                          <SelectItem value="ALL" className="text-xs">Tous les types de message</SelectItem>
                          {MESSAGE_TYPES.map((t) => (
                            <SelectItem key={t.value} value={t.value} className="text-xs">
                              <div className="flex items-center gap-2">
                                <t.icon className={`h-3.5 w-3.5 ${t.color}`} />
                                {t.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={fetchHistory}
                        disabled={loadingHistory}
                        className="h-8 border-[#334155] text-slate-300 hover:bg-[#334155] text-xs gap-1"
                      >
                        <Clock className="h-3 w-3" /> Actualiser
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingHistory ? (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Skeleton key={i} className="h-12 w-full bg-slate-700 rounded-lg" />
                      ))}
                    </div>
                  ) : historyMessages.length === 0 ? (
                    <div className="text-center py-16">
                      <History className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                      <p className="text-slate-500 text-sm">Aucun message dans l&apos;historique</p>
                      <p className="text-slate-600 text-xs mt-1">
                        Les messages envoyés via les onglets « Envoi global » et « Envoi ciblé » apparaîtront ici.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-lg border border-[#334155] overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-[#334155] hover:bg-transparent">
                            <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wide text-slate-500">Date</TableHead>
                            <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wide text-slate-500">Audience</TableHead>
                            <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wide text-slate-500">Type</TableHead>
                            <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wide text-slate-500">Titre</TableHead>
                            <TableHead className="h-9 px-3 text-[11px] uppercase tracking-wide text-slate-500">Aperçu</TableHead>
                            <TableHead className="h-9 px-3 w-8"></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {historyMessages.map((msg) => {
                            const cfg = getTypeConfig(msg.messageType);
                            const audienceCfg = AUDIENCE_BADGE[msg.type] || AUDIENCE_BADGE.GLOBAL;
                            const isExpanded = expandedMessageId === msg.id;
                            return (
                              <React.Fragment key={msg.id}>
                                <TableRow
                                  className="border-[#334155] cursor-pointer hover:bg-[#0f172a]/40"
                                  onClick={() => setExpandedMessageId(isExpanded ? null : msg.id)}
                                >
                                  <TableCell className="px-3 py-2.5 text-[11px] text-slate-400 whitespace-nowrap">
                                    {formatTime(msg.createdAt)}
                                  </TableCell>
                                  <TableCell className="px-3 py-2.5">
                                    <Badge variant="outline" className={`text-[9px] border ${audienceCfg.color}`}>
                                      {audienceCfg.label}
                                      {msg.type === 'ROLE_TARGETED' && msg.targetRole && msg.targetRole !== 'ALL' && (
                                        <span className="ml-1 opacity-70">· {msg.targetRole === 'VENDOR' ? 'Vendeurs' : 'Clients'}</span>
                                      )}
                                      {msg.type === 'MULTI' && msg.targetId && (
                                        <span className="ml-1 opacity-70">· {msg.targetId.split(',').length} dest.</span>
                                      )}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="px-3 py-2.5">
                                    <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                                      <cfg.icon className="h-3 w-3" />
                                      {cfg.label}
                                    </div>
                                  </TableCell>
                                  <TableCell className="px-3 py-2.5 text-xs font-medium text-slate-200 max-w-[180px] truncate">
                                    {msg.title}
                                  </TableCell>
                                  <TableCell className="px-3 py-2.5 text-xs text-slate-400 max-w-[220px] truncate">
                                    {msg.message}
                                  </TableCell>
                                  <TableCell className="px-3 py-2.5 text-right">
                                    {isExpanded ? (
                                      <ChevronDown className="h-4 w-4 text-slate-500" />
                                    ) : (
                                      <ChevronRight className="h-4 w-4 text-slate-500" />
                                    )}
                                  </TableCell>
                                </TableRow>
                                <AnimatePresence initial={false}>
                                  {isExpanded && (
                                    <motion.tr
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      exit={{ opacity: 0 }}
                                      transition={{ duration: 0.15 }}
                                      className="border-[#334155]"
                                    >
                                      <TableCell colSpan={6} className="px-4 py-4 bg-[#0f172a]/60">
                                        <div className="space-y-3">
                                          <div className="flex items-center gap-2 flex-wrap">
                                            <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                                            <span className="text-sm font-semibold text-white">{msg.title}</span>
                                            <Badge variant="outline" className={`text-[9px] border ${audienceCfg.color}`}>
                                              {audienceCfg.label}
                                            </Badge>
                                            <Badge variant="outline" className={`text-[9px] border ${cfg.border} ${cfg.color}`}>
                                              {cfg.label}
                                            </Badge>
                                          </div>
                                          <p className="text-sm text-slate-300 whitespace-pre-wrap leading-relaxed">
                                            {msg.message}
                                          </p>
                                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-slate-500 pt-2 border-t border-[#334155]">
                                            <span>Date complète : {formatFullDate(msg.createdAt)}</span>
                                            {msg.type === 'PRIVATE' && (
                                              <span>Destinataire : {msg.targetId ? msg.targetId.slice(0, 12) + '…' : '—'}</span>
                                            )}
                                            {msg.type === 'MULTI' && msg.targetId && (
                                              <span>Destinataires : {msg.targetId.split(',').length}</span>
                                            )}
                                            {msg.type === 'ROLE_TARGETED' && msg.targetRole && (
                                              <span>Rôle ciblé : {msg.targetRole === 'VENDOR' ? 'Vendeurs' : msg.targetRole === 'CLIENT' ? 'Clients' : msg.targetRole}</span>
                                            )}
                                          </div>
                                        </div>
                                      </TableCell>
                                    </motion.tr>
                                  )}
                                </AnimatePresence>
                              </React.Fragment>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </motion.div>
    </AdminSidebar>
  );
}
