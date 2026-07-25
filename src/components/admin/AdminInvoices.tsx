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
  FileText, Search, Download, ChevronDown, ChevronUp, DollarSign,
  Clock, CheckCircle, AlertCircle,
} from 'lucide-react';

interface InvoiceItem {
  id: string;
  invoiceNumber: string;
  orderId: string;
  shopId: string;
  customerId: string;
  totalAmount: number;
  status: string;
  createdAt: string;
  order?: {
    id: string;
    orderNumber: string;
    items: { id: string; productId: string; quantity: number; price: number; product?: { name: string; price: number } }[];
    customer?: { id: string; name: string; email: string };
    shop?: { id: string; name: string; logo?: string };
  };
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AdminInvoices() {
  const { token } = useAppStore();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchInvoices = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);

      const res = await fetch(`/api/invoices?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch {
      // silently handle
    }
  }, [token, page, statusFilter]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await fetchInvoices();
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    if (!search) return invoices;
    return invoices.filter(inv =>
      inv.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      inv.order?.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      inv.order?.shop?.name?.toLowerCase().includes(search.toLowerCase())
    );
  }, [invoices, search]);

  const pendingCount = invoices.filter(i => i.status === 'PENDING').length;
  const paidCount = invoices.filter(i => i.status === 'PAID').length;
  const totalRevenue = invoices.filter(i => i.status === 'PAID').reduce((sum, i) => sum + i.totalAmount, 0);

  const handleDownloadPDF = async (invoiceId: string) => {
    if (!token) return;
    setDownloading(invoiceId);
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `facture-${invoiceId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch {
      // silently handle
    } finally {
      setDownloading(null);
    }
  };

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(amount);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  return (
    <AdminSidebar>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <FileText className="h-7 w-7 text-blue-400" />
                Gestion des Factures
              </h1>
              <p className="text-slate-400 text-sm mt-1">{total} facture(s) au total</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-xl font-bold text-white">{invoices.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">En attente</p>
                <p className="text-xl font-bold text-amber-400">{pendingCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shrink-0">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Payées</p>
                <p className="text-xl font-bold text-green-400">{paidCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center text-white shrink-0">
                <DollarSign className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Revenus</p>
                <p className="text-lg font-bold text-cyan-400">{formatAmount(totalRevenue)}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search & Filter */}
        <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Rechercher par N° facture, client, boutique..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="w-48 bg-[#1e293b] border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="PAID">Payée</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Invoices List */}
        <motion.div variants={item} className="space-y-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="border-0 bg-[#1e293b] shadow-lg">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-slate-700 animate-pulse rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-slate-700 animate-pulse rounded w-40" />
                      <div className="h-3 bg-slate-700 animate-pulse rounded w-60" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : filteredInvoices.length === 0 ? (
            <Card className="border-0 bg-[#1e293b] shadow-lg">
              <CardContent className="py-16 text-center">
                <FileText className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-500 text-lg font-medium">Aucune facture trouvée</p>
                <p className="text-slate-600 text-sm mt-1">Les factures apparaîtront ici quand les commandes seront facturées</p>
              </CardContent>
            </Card>
          ) : (
            filteredInvoices.map(invoice => {
              const isExpanded = expandedInvoice === invoice.id;
              return (
                <Card key={invoice.id} className="border-0 bg-[#1e293b] shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-4">
                    <div
                      className="flex items-center gap-4 cursor-pointer"
                      onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                    >
                      {/* Icon */}
                      <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-700/20 flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-blue-400" />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-semibold text-blue-300">{invoice.invoiceNumber}</span>
                          {invoice.status === 'PENDING' ? (
                            <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px]">En attente</Badge>
                          ) : (
                            <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px]">Payée</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
                          <span>{invoice.order?.customer?.name || 'Client'}</span>
                          <span>•</span>
                          <span>{invoice.order?.shop?.name || 'Boutique'}</span>
                          <span className="hidden sm:inline">•</span>
                          <span className="hidden sm:inline">{formatDate(invoice.createdAt)}</span>
                        </div>
                      </div>

                      {/* Amount */}
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-white">{formatAmount(invoice.totalAmount)}</p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                          onClick={(e) => { e.stopPropagation(); handleDownloadPDF(invoice.id); }}
                          disabled={downloading === invoice.id}
                          title="Télécharger PDF"
                        >
                          {downloading === invoice.id ? (
                            <div className="h-4 w-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="h-4 w-4" />
                          )}
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-slate-500" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-slate-500" />
                        )}
                      </div>
                    </div>

                    {/* Expanded Detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-3">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">N° Facture</p>
                                <p className="text-sm font-mono text-white">{invoice.invoiceNumber}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Client</p>
                                <p className="text-sm text-white">{invoice.order?.customer?.name || '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Boutique</p>
                                <p className="text-sm text-white">{invoice.order?.shop?.name || '—'}</p>
                              </div>
                              <div>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Date</p>
                                <p className="text-sm text-white">{formatDate(invoice.createdAt)}</p>
                              </div>
                            </div>

                            {invoice.order?.items && invoice.order.items.length > 0 && (
                              <div>
                                <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  Articles ({invoice.order.items.length})
                                </h4>
                                <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
                                  {invoice.order.items.map((orderItem) => (
                                    <div key={orderItem.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-800/50 text-sm">
                                      <span className="text-slate-300">{orderItem.product?.name || 'Produit'}</span>
                                      <span className="text-slate-500 text-xs">×{orderItem.quantity}</span>
                                      <span className="text-white font-medium text-xs">{formatAmount(orderItem.price * orderItem.quantity)}</span>
                                    </div>
                                  ))}
                                </div>
                                <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-700/50">
                                  <span className="text-sm font-medium text-slate-300">Total</span>
                                  <span className="text-sm font-bold text-white">{formatAmount(invoice.totalAmount)}</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              );
            })
          )}
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div variants={item} className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Précédent
            </Button>
            <span className="text-sm text-slate-400">Page {page} / {totalPages}</span>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Suivant
            </Button>
          </motion.div>
        )}
      </motion.div>
    </AdminSidebar>
  );
}
