'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Users, Search, MoreHorizontal, UserCheck, UserX, Trash2, ShieldAlert, ShoppingCart,
  Mail, Calendar, MapPin, ChevronDown, ChevronUp, Send, Phone, Globe, Activity,
  UserCircle,
} from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  city?: string;
  country?: string;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
  customerOrders?: { id: string; totalAmount: number; status: string; createdAt: string }[];
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function AdminClients() {
  const { token } = useAppStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [expandedClient, setExpandedClient] = useState<string | null>(null);
  const [actionDialog, setActionDialog] = useState<'suspend' | 'reactivate' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [messageDialog, setMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState('');

  const fetchClients = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin?section=clients', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setClients(data.clients || []);
      }
    } catch { /* silently handle */ }
  }, [token]);

  useEffect(() => {
    fetchClients().then(() => setLoading(false));
  }, [fetchClients]);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q) ||
        (c.city || '').toLowerCase().includes(q) ||
        (c.phone || '').includes(q)
    );
    if (statusFilter === 'active') {
      result = result.filter((c) => c.isActive && !c.isSuspended);
    } else if (statusFilter === 'suspended') {
      result = result.filter((c) => c.isSuspended);
    }
    setFilteredClients(result);
  }, [clients, search, statusFilter]);

  const handleAction = async () => {
    if (!selectedClient || !actionDialog || !token) return;
    setActionLoading(true);
    try {
      const actionMap: Record<string, string> = {
        suspend: 'suspend-user',
        reactivate: 'reactivate-user',
        delete: 'delete-user',
      };
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: actionMap[actionDialog], userId: selectedClient.id }),
      });
      if (res.ok) {
        toast.success(
          actionDialog === 'suspend' ? 'Client suspendu' :
          actionDialog === 'reactivate' ? 'Client réactivé' : 'Client supprimé'
        );
        await fetchClients();
      } else {
        toast.error('Erreur lors de l\'opération');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(false);
      setActionDialog(null);
      setSelectedClient(null);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedClient || !messageText.trim() || !token) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'send-private-message', targetId: selectedClient.id, title: 'Message administrateur', message: messageText }),
      });
      if (res.ok) {
        toast.success('Message envoyé');
        setMessageDialog(false);
        setMessageText('');
      } else {
        toast.error('Erreur lors de l\'envoi');
      }
    } catch {
      toast.error('Erreur de connexion');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const getStatusBadge = (c: Client) => {
    if (c.isSuspended) return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]">Suspendu</Badge>;
    if (!c.isActive) return <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/30 text-[10px]">Inactif</Badge>;
    return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px]">Actif</Badge>;
  };

  const totalSpent = (orders?: { totalAmount: number }[]) =>
    (orders || []).reduce((sum, o) => sum + o.totalAmount, 0);

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(amount);

  const activeCount = clients.filter(c => c.isActive && !c.isSuspended).length;
  const suspendedCount = clients.filter(c => c.isSuspended).length;

  return (
    <AdminSidebar>
      <motion.div {...fadeIn} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Users className="h-6 w-6 text-blue-400" />
              Gestion des Clients
            </h1>
            <p className="text-slate-400 text-sm mt-1">{clients.length} client(s) enregistré(s)</p>
          </div>
          <div className="flex gap-2">
            <Badge className="bg-green-500/15 text-green-400 border border-green-500/30">
              {activeCount} actif(s)
            </Badge>
            <Badge className="bg-red-500/15 text-red-400 border border-red-500/30">
              {suspendedCount} suspendu(s)
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#1e293b] border-[#334155] text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-[#1e293b] border-[#334155] text-white">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-[#334155]">
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Client Table */}
        <Card className="border border-[#334155] bg-[#1e293b] shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#334155] hover:bg-transparent">
                    <TableHead className="text-slate-400">Client</TableHead>
                    <TableHead className="hidden md:table-cell text-slate-400">Email</TableHead>
                    <TableHead className="hidden lg:table-cell text-slate-400">Téléphone</TableHead>
                    <TableHead className="hidden sm:table-cell text-slate-400">Pays</TableHead>
                    <TableHead className="text-slate-400">Statut</TableHead>
                    <TableHead className="hidden lg:table-cell text-slate-400">Inscription</TableHead>
                    <TableHead className="w-20 text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-[#334155]/50">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <TableCell key={j}><div className="h-4 bg-slate-700 animate-pulse rounded w-20" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredClients.length === 0 ? (
                    <TableRow className="border-[#334155]/50">
                      <TableCell colSpan={7} className="text-center py-16">
                        <UserCircle className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                        <p className="text-slate-500 text-sm">
                          {search || statusFilter !== 'ALL' ? 'Aucun client trouvé pour ces filtres' : 'Aucun client enregistré'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredClients.map((client) => (
                      <React.Fragment key={client.id}>
                        <TableRow
                          className="border-[#334155]/50 hover:bg-[#0f172a]/50 cursor-pointer"
                          onClick={() => setExpandedClient(expandedClient === client.id ? null : client.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden">
                                {client.avatar ? (
                                  <img src={client.avatar} alt={client.name} className="w-full h-full object-cover" />
                                ) : (
                                  client.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate text-slate-200">{client.name}</p>
                                <p className="text-xs text-slate-500 truncate md:hidden">{client.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-slate-400">{client.email}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-slate-400">{client.phone || '—'}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <span className="text-sm text-slate-400 flex items-center gap-1">
                              <Globe className="h-3 w-3 text-slate-500" />
                              {client.country || '—'}
                            </span>
                          </TableCell>
                          <TableCell>{getStatusBadge(client)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-slate-500">{formatDate(client.createdAt)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-[#334155]">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1e293b] border-[#334155]">
                                  <DropdownMenuItem onClick={() => { setSelectedClient(client); setMessageDialog(true); }} className="text-slate-300 focus:bg-[#334155] focus:text-white">
                                    <Send className="mr-2 h-4 w-4 text-blue-400" /> Envoyer un message
                                  </DropdownMenuItem>
                                  {client.isSuspended ? (
                                    <DropdownMenuItem onClick={() => { setSelectedClient(client); setActionDialog('reactivate'); }} className="text-slate-300 focus:bg-[#334155] focus:text-white">
                                      <UserCheck className="mr-2 h-4 w-4 text-green-400" /> Réactiver
                                    </DropdownMenuItem>
                                  ) : (
                                    <DropdownMenuItem onClick={() => { setSelectedClient(client); setActionDialog('suspend'); }} className="text-slate-300 focus:bg-[#334155] focus:text-white">
                                      <UserX className="mr-2 h-4 w-4 text-amber-400" /> Suspendre
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => { setSelectedClient(client); setActionDialog('delete'); }} className="text-red-400 focus:bg-[#334155] focus:text-red-400">
                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                              {expandedClient === client.id ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}
                            </div>
                          </TableCell>
                        </TableRow>
                        <AnimatePresence>
                          {expandedClient === client.id && (
                            <TableRow className="border-[#334155]/50">
                              <TableCell colSpan={7} className="bg-[#0f172a]/60 p-5">
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: 'auto' }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="space-y-4"
                                >
                                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-sm">
                                    <div>
                                      <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Mail className="h-3 w-3" /> Email</p>
                                      <p className="font-medium truncate text-slate-200">{client.email}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Phone className="h-3 w-3" /> Téléphone</p>
                                      <p className="font-medium text-slate-200">{client.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><MapPin className="h-3 w-3" /> Ville / Pays</p>
                                      <p className="font-medium text-slate-200">{client.city || 'N/A'}{client.country ? `, ${client.country}` : ''}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><ShoppingCart className="h-3 w-3" /> Commandes</p>
                                      <p className="font-medium text-slate-200">{client.customerOrders?.length || 0}</p>
                                    </div>
                                    <div>
                                      <p className="text-xs text-slate-500 flex items-center gap-1 mb-1"><Calendar className="h-3 w-3" /> Inscription</p>
                                      <p className="font-medium text-slate-200">{formatDate(client.createdAt)}</p>
                                    </div>
                                  </div>
                                  {/* Activity history & total spent */}
                                  <div className="flex items-center gap-4 pt-2 border-t border-[#334155]/50">
                                    <div className="flex items-center gap-2">
                                      <Activity className="h-4 w-4 text-blue-400" />
                                      <span className="text-xs text-slate-400">Total dépensé :</span>
                                      <span className="text-sm font-semibold text-green-400">{formatAmount(totalSpent(client.customerOrders))}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <ShoppingCart className="h-4 w-4 text-blue-400" />
                                      <span className="text-xs text-slate-400">Commandes :</span>
                                      <span className="text-sm font-semibold text-white">{client.customerOrders?.length || 0}</span>
                                    </div>
                                  </div>
                                  {client.customerOrders && client.customerOrders.length > 0 && (
                                    <div className="space-y-1.5 pt-2 border-t border-[#334155]/50">
                                      <p className="text-xs font-medium text-slate-400 mb-2">Historique des commandes récentes</p>
                                      {client.customerOrders.slice(0, 5).map((order) => (
                                        <div key={order.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#1e293b]/80 text-xs">
                                          <span className="text-slate-300">{formatDate(order.createdAt)}</span>
                                          <Badge className={`border-0 text-[9px] ${
                                            order.status === 'DELIVERED' ? 'bg-green-500/20 text-green-400' :
                                            order.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' :
                                            order.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400' :
                                            'bg-blue-500/20 text-blue-400'
                                          }`}>{order.status}</Badge>
                                          <span className="font-medium text-slate-200">{formatAmount(order.totalAmount)}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </motion.div>
                              </TableCell>
                            </TableRow>
                          )}
                        </AnimatePresence>
                      </React.Fragment>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Suspend/Reactivate Dialog */}
        <Dialog open={actionDialog === 'suspend' || actionDialog === 'reactivate'} onOpenChange={() => { setActionDialog(null); setSelectedClient(null); }}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionDialog === 'suspend' ? (
                  <><UserX className="h-5 w-5 text-amber-400" /> Suspendre le client</>
                ) : (
                  <><UserCheck className="h-5 w-5 text-green-400" /> Réactiver le client</>
                )}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {actionDialog === 'suspend'
                  ? `Voulez-vous vraiment suspendre ${selectedClient?.name} ? Son accès sera bloqué.`
                  : `Voulez-vous réactiver ${selectedClient?.name} ? Son accès sera restauré.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setActionDialog(null); setSelectedClient(null); }} className="border-[#334155] text-slate-300 hover:bg-[#334155]">Annuler</Button>
              <Button onClick={handleAction} disabled={actionLoading}
                className={actionDialog === 'suspend' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}>
                {actionLoading ? 'Traitement...' : actionDialog === 'suspend' ? 'Suspendre' : 'Réactiver'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Alert Dialog */}
        <AlertDialog open={actionDialog === 'delete'} onOpenChange={() => { setActionDialog(null); setSelectedClient(null); }}>
          <AlertDialogContent className="bg-[#1e293b] border-[#334155]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-white">
                <ShieldAlert className="h-5 w-5 text-red-400" /> Supprimer définitivement
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                Cette action est irréversible. Toutes les données de <strong className="text-white">{selectedClient?.name}</strong> seront supprimées.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#334155] text-slate-300 border-[#334155] hover:bg-[#475569]">Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleAction} disabled={actionLoading} className="bg-red-600 hover:bg-red-700 text-white">
                {actionLoading ? 'Suppression...' : 'Supprimer définitivement'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Message Dialog */}
        <Dialog open={messageDialog} onOpenChange={setMessageDialog}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Send className="h-5 w-5 text-blue-400" /> Envoyer un message à {selectedClient?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <textarea
                placeholder="Votre message..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                rows={4}
                className="w-full bg-[#0f172a] border border-[#334155] rounded-lg p-3 text-white placeholder:text-slate-500 focus:border-blue-500 focus:outline-none text-sm resize-none"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageDialog(false)} className="border-[#334155] text-slate-300 hover:bg-[#334155]">Annuler</Button>
              <Button onClick={handleSendMessage} disabled={!messageText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white gap-2">
                <Send className="h-4 w-4" /> Envoyer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminSidebar>
  );
}
