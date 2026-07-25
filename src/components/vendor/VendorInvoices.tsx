'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
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
  ArrowLeft,
  FileText,
  Download,
  ChevronDown,
  ChevronUp,
  Package,
  User,
  Calendar,
  DollarSign,
  Plus,
  Filter,
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  },
  PAID: {
    label: 'Payée',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  },
  OVERDUE: {
    label: 'En retard',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  },
  CANCELLED: {
    label: 'Annulée',
    color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  },
};

export default function VendorInvoices() {
  const { token, setCurrentView } = useAppStore();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedInvoice, setExpandedInvoice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchInvoices = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/invoices', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data.invoices || []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const filteredInvoices = useMemo(() => {
    if (statusFilter === 'ALL') return invoices;
    return invoices.filter((inv) => inv.status === statusFilter);
  }, [invoices, statusFilter]);

  const handleDownload = (invoice: any) => {
    const order = invoice.order;
    const items = order?.items || [];
    const customer = order?.customer;
    const shop = order?.shop;

    let content = `FACTURE - EcoRDC\n`;
    content += `${'='.repeat(40)}\n\n`;
    content += `N° Facture: ${invoice.invoiceNumber}\n`;
    content += `Date: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}\n`;
    content += `Statut: ${statusConfig[invoice.status]?.label || invoice.status}\n\n`;
    content += `Boutique: ${shop?.name || 'N/A'}\n`;
    content += `Client: ${customer?.name || 'N/A'}\n`;
    content += `Email: ${customer?.email || 'N/A'}\n\n`;
    content += `${'─'.repeat(40)}\n`;
    content += `ARTICLES\n`;
    content += `${'─'.repeat(40)}\n`;

    items.forEach((item: any, i: number) => {
      content += `${i + 1}. ${item.product?.name || 'Produit'}\n`;
      content += `   Qté: ${item.quantity} × ${item.price.toLocaleString('fr-FR')} CDF\n`;
      content += `   Sous-total: ${(item.price * item.quantity).toLocaleString('fr-FR')} CDF\n\n`;
    });

    content += `${'─'.repeat(40)}\n`;
    content += `TOTAL: ${invoice.totalAmount.toLocaleString('fr-FR')} CDF\n`;
    content += `${'='.repeat(40)}\n`;
    content += `\nMerci pour votre confiance !\nEcoRDC - Plateforme e-commerce de la RDC\n`;

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `facture-${invoice.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Summary stats
  const totalAmount = invoices.reduce((a, i) => a + i.totalAmount, 0);
  const paidAmount = invoices.filter(i => i.status === 'PAID').reduce((a, i) => a + i.totalAmount, 0);
  const pendingAmount = invoices.filter(i => i.status === 'PENDING').reduce((a, i) => a + i.totalAmount, 0);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('vendor-dashboard')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Factures</h1>
          <p className="text-sm text-muted-foreground">
            {invoices.length} facture{invoices.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setCurrentView('vendor-orders')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle facture
        </Button>
      </motion.div>

      {/* Summary Cards */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Total
            </p>
            <p className="text-base sm:text-lg font-bold text-emerald-600">
              {totalAmount.toLocaleString('fr-FR')} CDF
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">Payé</p>
            <p className="text-base sm:text-lg font-bold text-green-600">
              {paidAmount.toLocaleString('fr-FR')} CDF
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground">En attente</p>
            <p className="text-base sm:text-lg font-bold text-amber-600">
              {pendingAmount.toLocaleString('fr-FR')} CDF
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Filter */}
      <motion.div variants={itemVariants} className="flex items-center gap-3">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Tous les statuts</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="PAID">Payée</SelectItem>
            <SelectItem value="OVERDUE">En retard</SelectItem>
            <SelectItem value="CANCELLED">Annulée</SelectItem>
          </SelectContent>
        </Select>
        {statusFilter !== 'ALL' && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('ALL')} className="text-xs">
            Réinitialiser
          </Button>
        )}
      </motion.div>

      {/* Invoices List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-5 w-1/3" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredInvoices.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                <FileText className="h-12 w-12 text-emerald-300 dark:text-emerald-700" />
              </div>
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                {statusFilter !== 'ALL' ? 'Aucune facture avec ce statut' : 'Aucune facture'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Créez des factures depuis les commandes
              </p>
              <Button
                className="mt-6 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setCurrentView('vendor-orders')}
              >
                Voir les commandes
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => {
            const config = statusConfig[invoice.status] || statusConfig.PENDING;
            const isExpanded = expandedInvoice === invoice.id;
            const order = invoice.order;
            const items = order?.items || [];
            const customer = order?.customer;
            const shop = order?.shop;

            return (
              <motion.div key={invoice.id} variants={itemVariants}>
                <Card className="overflow-hidden">
                  <CardContent
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedInvoice(isExpanded ? null : invoice.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="h-4 w-4 text-emerald-600 shrink-0" />
                          <h3 className="font-semibold text-sm">
                            {invoice.invoiceNumber}
                          </h3>
                          <Badge className={`text-[10px] border-0 ${config.color}`}>
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {customer?.name || 'Client'} •{' '}
                          {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        <p className="font-bold text-sm">
                          {invoice.totalAmount.toLocaleString('fr-FR')} CDF
                        </p>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(invoice);
                          }}
                        >
                          <Download className="h-4 w-4 text-emerald-600" />
                        </Button>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4">
                          {/* Invoice Preview */}
                          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950/20 dark:to-green-950/20 rounded-xl p-4 border border-emerald-200 dark:border-emerald-800">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <FileText className="h-5 w-5 text-emerald-600" />
                                <span className="font-bold text-emerald-700 dark:text-emerald-300">FACTURE</span>
                              </div>
                              <Badge className={`text-[10px] border-0 ${config.color}`}>
                                {config.label}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                              <div>
                                <p className="text-xs text-muted-foreground">N° Facture</p>
                                <p className="font-medium">{invoice.invoiceNumber}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Date</p>
                                <p className="font-medium">{new Date(invoice.createdAt).toLocaleDateString('fr-FR')}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Client</p>
                                <p className="font-medium">{customer?.name || 'N/A'}</p>
                              </div>
                              <div>
                                <p className="text-xs text-muted-foreground">Commande</p>
                                <p className="font-medium">{order?.orderNumber || 'N/A'}</p>
                              </div>
                            </div>

                            {/* Items */}
                            <div className="space-y-2 mb-4">
                              {items.map((item: any) => (
                                <div key={item.id} className="flex items-center justify-between text-sm bg-white/60 dark:bg-card/60 p-2 rounded-lg">
                                  <span className="truncate flex-1">{item.product?.name || 'Produit'}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {item.quantity} × {item.price.toLocaleString('fr-FR')} CDF
                                  </span>
                                  <span className="font-semibold ml-3">
                                    {(item.price * item.quantity).toLocaleString('fr-FR')} CDF
                                  </span>
                                </div>
                              ))}
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                              <span className="font-medium">Total</span>
                              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                {invoice.totalAmount.toLocaleString('fr-FR')} CDF
                              </span>
                            </div>
                          </div>

                          {/* Download Button */}
                          <Button
                            variant="outline"
                            className="w-full border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(invoice);
                            }}
                          >
                            <Download className="mr-2 h-4 w-4" />
                            Télécharger la facture
                          </Button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
