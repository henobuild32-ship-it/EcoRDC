'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Message } from '@/lib/store';
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
  ImagePlus,
  Paperclip,
  Wifi,
  WifiOff,
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export default function VendorMessages() {
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
      setIsOnline(false);
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
        setIsOnline(true);
      }
    } catch {
      setIsOnline(false);
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
    const interval = setInterval(fetchConversations, 5000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedPartner || !token) return;
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
          content: `📎 ${file.name}`,
          attachment: url,
        }),
      });
      if (res.ok) {
        fetchMessages();
        fetchConversations();
      } else {
        toast.error('Erreur lors de l\'envoi du fichier');
      }
    } catch (e) {
      console.error('File upload failed:', e);
      toast.error('Erreur lors du téléchargement du fichier');
    } finally {
      // Reset the file input so the same file can be selected again.
      if (e.target) e.target.value = '';
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

  const selectedConversation = conversations.find((c) => c.id === selectedPartner);

  const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6"
    >
      <Card className="overflow-hidden border-0 shadow-lg" style={{ height: 'calc(100vh - 140px)' }}>
        <div className="flex h-full">
          {/* Conversation List */}
          <div
            className={`border-r flex flex-col ${
              selectedPartner ? 'hidden sm:flex w-80 lg:w-96' : 'w-full sm:w-80 lg:w-96'
            }`}
          >
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {!selectedPartner && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setCurrentView('vendor-dashboard')}
                      className="shrink-0 sm:hidden"
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                  )}
                  <h2 className="text-lg font-semibold">Messages</h2>
                </div>
                <div className="flex items-center gap-2">
                  {isOnline ? (
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 text-[10px]">
                      <Wifi className="h-3 w-3 mr-1" />
                      En ligne
                    </Badge>
                  ) : (
                    <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0 text-[10px]">
                      <WifiOff className="h-3 w-3 mr-1" />
                      Hors ligne
                    </Badge>
                  )}
                  {totalUnread > 0 && (
                    <Badge className="bg-emerald-500 text-white border-0 text-[10px]">
                      {totalUnread} non lu{totalUnread > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
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
              ) : conversations.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                    <MessageCircle className="h-10 w-10 text-emerald-300 dark:text-emerald-700" />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground font-medium">
                    Aucune conversation
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vos clients vous contacteront ici
                  </p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectPartner(conv.id)}
                    className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors text-left ${
                      selectedPartner === conv.id
                        ? 'bg-emerald-50 dark:bg-emerald-900/20 border-l-2 border-emerald-500'
                        : ''
                    }`}
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold shrink-0 relative">
                      {conv.avatar ? (
                        <img
                          src={conv.avatar}
                          alt={conv.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        conv.name.charAt(0).toUpperCase()
                      )}
                      {conv.unreadCount > 0 && (
                        <div className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-red-500 border-2 border-white dark:border-card" />
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
                        <p className="text-xs text-muted-foreground truncate">
                          {conv.lastMessage}
                        </p>
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
                <div className="p-4 border-b flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedPartner(null)}
                    className="shrink-0 sm:hidden"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-semibold shrink-0">
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
                    <p className="font-medium text-sm">
                      {selectedConversation?.name || 'Utilisateur'}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <p className="text-xs text-muted-foreground">
                        {selectedConversation?.role === 'CLIENT' ? 'Client' : 'Utilisateur'} · En ligne
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 text-[10px]">
                    <Wifi className="h-3 w-3 mr-1" />
                    Temps réel
                  </Badge>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="h-16 w-16 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                        <MessageCircle className="h-8 w-8 text-emerald-300 dark:text-emerald-700" />
                      </div>
                      <p className="mt-3 text-sm text-muted-foreground">
                        Commencez la conversation
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Envoyez un message pour débuter l&apos;échange
                      </p>
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
                          <div className="max-w-[75%]">
                            <div
                              className={`rounded-2xl px-4 py-2.5 ${
                                isMine
                                  ? 'bg-emerald-500 text-white rounded-br-md'
                                  : 'bg-muted rounded-bl-md'
                              }`}
                            >
                              {msg.attachment && (
                                <div className={`mb-2 p-2 rounded-lg text-xs ${
                                  isMine ? 'bg-emerald-600/50' : 'bg-muted-foreground/10'
                                }`}>
                                  📎 Fichier joint
                                </div>
                              )}
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                            </div>
                            <div className={`flex items-center gap-1 mt-0.5 ${isMine ? 'justify-end' : 'justify-start'}`}>
                              <p className="text-[10px] text-muted-foreground">
                                {new Date(msg.createdAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                              {isMine && (
                                msg.isRead ? (
                                  <CheckCheck className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Check className="h-3 w-3 text-muted-foreground" />
                                )
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t">
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
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-9 w-9"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <ImagePlus className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-9 w-9"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Paperclip className="h-4 w-4 text-muted-foreground" />
                    </Button>
                    <Input
                      ref={inputRef}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Écrire un message..."
                      className="flex-1"
                      disabled={sending}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                      disabled={!newMessage.trim() || sending}
                    >
                      <Send className="h-4 w-4" />
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
                  <p className="mt-4 text-muted-foreground font-medium">
                    Sélectionnez une conversation
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Choisissez un client pour commencer à discuter
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
