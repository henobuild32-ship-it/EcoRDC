'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Message, type User } from '@/lib/store';
import { uploadImage } from '@/lib/upload';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Send,
  MessageCircle,
  User as UserIcon,
  Image as ImageIcon,
  Wifi,
  WifiOff,
  Search,
  Check,
  CheckCheck,
} from 'lucide-react';

interface Conversation {
  id: string;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  role?: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function ClientMessages() {
  const { user, token, chatPartner, setCurrentView, setChatPartner } = useAppStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedPartner, setSelectedPartner] = useState<string | null>(
    chatPartner?.id || null
  );
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMessages = useCallback(async () => {
    if (!token || !selectedPartner) return;
    try {
      const res = await fetch(`/api/messages?partnerId=${selectedPartner}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // silently handle
    }
  }, [token, selectedPartner]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  // Online status check
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedPartner || !token) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedPartner,
          content: newMessage.trim(),
        }),
      });
      if (res.ok) {
        setNewMessage('');
        fetchMessages();
        fetchConversations();
      }
    } catch {
      // silently handle
    } finally {
      setSending(false);
    }
  };

  const handleSelectPartner = (partnerId: string) => {
    setSelectedPartner(partnerId);
    setChatPartner({
      id: partnerId,
      name: conversations.find((c) => c.id === partnerId)?.name || '',
      email: '',
      isActive: true,
      createdAt: '',
    });
    inputRef.current?.focus();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token || !selectedPartner) return;
    try {
      // uploadImage tries /api/upload first, then falls back to base64.
      const url = await uploadImage(file);
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          receiverId: selectedPartner,
          content: '📷 Photo',
          attachment: url,
        }),
      });
      if (res.ok) {
        fetchMessages();
        fetchConversations();
      } else {
        toast.error('Erreur lors de l\'envoi de la photo');
      }
    } catch (e) {
      console.error('Image upload failed:', e);
      toast.error('Erreur lors du téléchargement de l\'image');
    } finally {
      // Reset the file input so the same file can be selected again.
      if (e.target) e.target.value = '';
    }
  };

  const selectedConversation = conversations.find((c) => c.id === selectedPartner);
  const filteredConversations = conversations.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      <Card className="overflow-hidden border-0 shadow-xl" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="flex h-full">
          {/* Conversation List */}
          <div
            className={`border-r flex flex-col ${
              selectedPartner ? 'hidden sm:flex w-80 lg:w-96' : 'w-full sm:w-80 lg:w-96'
            }`}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b space-y-3">
              <div className="flex items-center gap-3">
                {!selectedPartner && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setCurrentView('client-dashboard')}
                    className="shrink-0 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                )}
                <h2 className="text-lg font-semibold flex items-center gap-2">Messages</h2>
                <div className="ml-auto flex items-center gap-1">
                  {isOnline ? (
                    <div className="flex items-center gap-1 text-emerald-600">
                      <Wifi className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium">En ligne</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-red-500">
                      <WifiOff className="h-3.5 w-3.5" />
                      <span className="text-[10px] font-medium">Hors ligne</span>
                    </div>
                  )}
                </div>
              </div>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Rechercher une conversation..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loading ? (
                <div className="p-3 space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                    <MessageCircle className="h-8 w-8 text-emerald-300 dark:text-emerald-700" />
                  </div>
                  <p className="mt-4 text-sm font-medium text-muted-foreground">Aucune conversation</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Contactez un vendeur pour commencer
                  </p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectPartner(conv.id)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left ${
                      selectedPartner === conv.id
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-2 border-emerald-500'
                        : ''
                    }`}
                  >
                    <div className="h-11 w-11 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold shrink-0 shadow-md">
                      {conv.avatar ? (
                        <img
                          src={conv.avatar}
                          alt={conv.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        conv.name.charAt(0).toUpperCase()
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm truncate">{conv.name}</p>
                        <span className="text-[10px] text-muted-foreground shrink-0 ml-2">
                          {new Date(conv.lastMessageTime).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                        {conv.unreadCount > 0 && (
                          <Badge className="ml-2 bg-emerald-500 text-white border-0 text-[10px] shrink-0 h-5 min-w-[20px] justify-center">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div
            className={`flex-1 flex flex-col ${
              selectedPartner ? 'flex' : 'hidden sm:flex'
            }`}
          >
            {selectedPartner ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b flex items-center gap-3 bg-card">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedPartner(null)}
                    className="shrink-0 sm:hidden hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold shrink-0 shadow-md">
                    {selectedConversation?.avatar ? (
                      <img
                        src={selectedConversation.avatar}
                        alt={selectedConversation.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      selectedConversation?.name?.charAt(0).toUpperCase() || '?'
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm">
                      {selectedConversation?.name || 'Utilisateur'}
                    </p>
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation?.role === 'VENDOR' ? 'Vendeur' : 'Client'}
                      </p>
                      {isOnline && (
                        <div className="flex items-center gap-1">
                          <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[10px] text-emerald-600">En ligne</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/10">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                        <MessageCircle className="h-8 w-8 text-emerald-300 dark:text-emerald-700" />
                      </div>
                      <p className="mt-4 text-sm font-medium text-muted-foreground">Commencez la conversation</p>
                      <p className="text-xs text-muted-foreground mt-1">Envoyez un message pour démarrer</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === user?.id;
                      return (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[75%] ${isMine ? 'order-1' : 'order-1'}`}>
                            {!isMine && (
                              <div className="flex items-center gap-1.5 mb-1">
                                <div className="h-5 w-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[8px] font-semibold shrink-0">
                                  {selectedConversation?.name?.charAt(0).toUpperCase() || '?'}
                                </div>
                                <span className="text-[10px] text-muted-foreground">{selectedConversation?.name}</span>
                              </div>
                            )}
                            <div
                              className={`rounded-2xl px-4 py-2.5 shadow-sm ${
                                isMine
                                  ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white rounded-br-md'
                                  : 'bg-card border rounded-bl-md'
                              }`}
                            >
                              {msg.attachment && (
                                <div className="mb-2">
                                  <img
                                    src={msg.attachment}
                                    alt="Image"
                                    className="max-w-[200px] rounded-lg"
                                  />
                                </div>
                              )}
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 ${isMine ? '' : ''}`}>
                                <p className={`text-[10px] ${isMine ? 'text-emerald-100' : 'text-muted-foreground'}`}>
                                  {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </p>
                                {isMine && (
                                  msg.isRead ? (
                                    <CheckCheck className="h-3 w-3 text-emerald-100" />
                                  ) : (
                                    <Check className="h-3 w-3 text-emerald-100" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 border-t bg-card">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImageIcon className="h-5 w-5" />
                    </Button>
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrire un message..."
                      className="flex-1 border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="bg-emerald-600 hover:bg-emerald-700 shrink-0 shadow-md"
                      disabled={!newMessage.trim() || sending}
                    >
                      {sending ? (
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                    <MessageCircle className="h-10 w-10 text-emerald-300 dark:text-emerald-700" />
                  </div>
                  <p className="mt-4 text-lg font-medium text-muted-foreground">Sélectionnez une conversation</p>
                  <p className="text-sm text-muted-foreground mt-1">Choisissez un contact pour commencer à discuter</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
