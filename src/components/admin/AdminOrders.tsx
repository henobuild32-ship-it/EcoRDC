'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { ShoppingCart, Filter, DollarSign, ChevronDown, ChevronUp, Package, Store, Search, ShoppingBag } from 'lucide-react';

interface OrderItem {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  customer: { id: string; name: string; email: string };
  shop: { id: string; name: string };
  items: { id: string; productId: string; quantity: number; price: number; product?: { name: string; image?: string } }[];
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: 'En attente', className: 'bg-amber-500/20 text-amber-400 border border-amber-500/30' },
  CONFIRMED: { label: 'Confirmé', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  PAID: { label: 'Payé', className: 'bg-blue-500/20 text-blue-400 border border-blue-500/30' },
  SHIPPED: { label: 'Expédié', className: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' },
  DELIVERED: { label: 'Livré', className: 'bg-green-500/20 text-green-400 border border-green-500/30' },
  CANCELLED: { label: 'Annulé', className: 'bg-red-500/20 text-red-400 border border-red-500/30' },
};

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function AdminOrders() {
  const { token } = useAppStore();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin?section=all-orders', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) { const data = await res.json(); setOrders(data.orders || []); }
    } catch { /* silently handle */ }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await fetchOrders();
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [fetchOrders]);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'ALL') {
      result = result.filter(o => o.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        o =>
          o.orderNumber.toLowerCase().includes(q) ||
          o.customer?.name?.toLowerCase().includes(q) ||
          o.shop?.name?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, statusFilter, search]);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(amount);

  const totalRevenue = filteredOrders.filter(o => o.status === 'PAID' || o.status === 'DELIVERED').reduce((sum, o) => sum + o.totalAmount, 0);

  return (
    <AdminSidebar>
      <motion.div {...fadeIn} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <ShoppingCart className="h-6 w-6 text-blue-400" /> Toutes les Commandes
            </h1>
            <p className="text-slate-400 text-sm mt-1">{orders.length} commande(s)</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium bg-blue-500/10 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/20">
            <DollarSign className="h-4 w-4" />{formatAmount(totalRevenue)}
          </div>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Rechercher commande, client, boutique..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#1e293b] border-[#334155] text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
          <Filter className="h-4 w-4 text-slate-500 shrink-0 hidden sm:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-[#1e293b] border-[#334155] text-white"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-[#334155]">
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Status Summary */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const count = orders.filter(o => o.status === key).length;
            return (
              <button key={key} onClick={() => setStatusFilter(statusFilter === key ? 'ALL' : key)}
                className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border transition-all ${
                  statusFilter === key ? 'border-blue-500/50 bg-blue-500/10' : 'border-[#334155] hover:bg-[#1e293b]'
                }`}>
                <span className="text-lg font-bold text-white">{count}</span>
                <span className="text-[10px] text-slate-500">{config.label}</span>
              </button>
            );
          })}
        </div>

        {/* Orders Table */}
        <Card className="border border-[#334155] bg-[#1e293b] shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#334155] hover:bg-transparent">
                    <TableHead className="text-slate-400">N°</TableHead>
                    <TableHead className="text-slate-400">Client</TableHead>
                    <TableHead className="hidden sm:table-cell text-slate-400">Boutique</TableHead>
                    <TableHead className="text-slate-400">Montant</TableHead>
                    <TableHead className="text-slate-400">Statut</TableHead>
                    <TableHead className="hidden md:table-cell text-slate-400">Date</TableHead>
                    <TableHead className="w-10 text-slate-400"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-[#334155]/50">
                        {Array.from({ length: 7 }).map((_, j) => <TableCell key={j}><div className="h-4 bg-slate-700 animate-pulse rounded w-20" /></TableCell>)}
                      </TableRow>
                    ))
                  ) : filteredOrders.length === 0 ? (
                    <TableRow className="border-[#334155]/50">
                      <TableCell colSpan={7} className="text-center py-16">
                        <ShoppingBag className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                        <p className="text-slate-500 text-sm">
                          {search || statusFilter !== 'ALL' ? 'Aucune commande trouvée pour ces filtres' : 'Aucune commande enregistrée'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredOrders.map(order => {
                      const cfg = STATUS_CONFIG[order.status] || { label: order.status, className: 'bg-slate-500/20 text-slate-400 border border-slate-500/30' };
                      const isExpanded = expandedOrder === order.id;
                      return (
                        <React.Fragment key={order.id}>
                          <TableRow className="border-[#334155]/50 hover:bg-[#0f172a]/50 cursor-pointer" onClick={() => setExpandedOrder(isExpanded ? null : order.id)}>
                            <TableCell><span className="font-mono text-sm font-medium text-blue-300">{order.orderNumber}</span></TableCell>
                            <TableCell><p className="text-sm font-medium text-slate-200">{order.customer?.name || '—'}</p><p className="text-xs text-slate-500">{order.customer?.email}</p></TableCell>
                            <TableCell className="hidden sm:table-cell"><div className="flex items-center gap-1.5 text-sm text-slate-300"><Store className="h-3.5 w-3.5 text-blue-400" />{order.shop?.name || '—'}</div></TableCell>
                            <TableCell className="font-medium text-sm text-white">{formatAmount(order.totalAmount)}</TableCell>
                            <TableCell><Badge className={`${cfg.className} text-[10px]`}>{cfg.label}</Badge></TableCell>
                            <TableCell className="hidden md:table-cell text-sm text-slate-500">{formatDate(order.createdAt)}</TableCell>
                            <TableCell>{isExpanded ? <ChevronUp className="h-4 w-4 text-slate-500" /> : <ChevronDown className="h-4 w-4 text-slate-500" />}</TableCell>
                          </TableRow>
                          <AnimatePresence>
                            {isExpanded && (
                              <TableRow className="border-[#334155]/50">
                                <TableCell colSpan={7} className="bg-[#0f172a]/60 p-5">
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                  >
                                    <h4 className="text-sm font-medium flex items-center gap-2 text-white mb-3"><Package className="h-4 w-4 text-blue-400" />Articles ({order.items.length})</h4>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                      {order.items.map(item => (
                                        <div key={item.id} className="flex items-center justify-between p-2.5 rounded-lg bg-[#1e293b]/80 text-sm">
                                          <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="h-8 w-8 rounded bg-gradient-to-br from-blue-400/20 to-blue-600/20 flex items-center justify-center shrink-0 overflow-hidden">
                                              {item.product?.image ? <img src={item.product.image} alt="" className="w-full h-full object-cover" /> : <Package className="h-3.5 w-3.5 text-blue-400" />}
                                            </div>
                                            <div className="min-w-0">
                                              <p className="font-medium truncate text-slate-200">{item.product?.name || 'Produit'}</p>
                                              <p className="text-xs text-slate-500">Qté: {item.quantity} × {item.price.toLocaleString('fr-FR')} CDF</p>
                                            </div>
                                          </div>
                                          <p className="font-semibold ml-3 text-xs text-white">{(item.price * item.quantity).toLocaleString('fr-FR')} CDF</p>
                                        </div>
                                      ))}
                                    </div>
                                    {order.notes && <div className="text-sm bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg mt-3 text-amber-300"><span className="text-slate-400 font-medium">Notes: </span>{order.notes}</div>}
                                  </motion.div>
                                </TableCell>
                              </TableRow>
                            )}
                          </AnimatePresence>
                        </React.Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </AdminSidebar>
  );
}
