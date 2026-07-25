'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Order, type OrderItem } from '@/lib/store';
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
  Package,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  FileText,
  Loader2,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  User,
  DollarSign,
  Filter,
  PackageCheck,
  CircleDot,
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

const statusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  PENDING: {
    label: 'En attente',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
    icon: Clock,
  },
  CONFIRMED: {
    label: 'Confirmée',
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    icon: CheckCircle2,
  },
  PAID: {
    label: 'Payée',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    icon: CreditCard,
  },
  SHIPPED: {
    label: 'Expédiée',
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    icon: Truck,
  },
  DELIVERED: {
    label: 'Livrée',
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    icon: CheckCircle2,
  },
  CANCELLED: {
    label: 'Annulée',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    icon: XCircle,
  },
};

// Status action buttons
const statusActions: Record<string, { next: string; label: string; icon: React.ElementType; color: string }[]> = {
  PENDING: [
    { next: 'CONFIRMED', label: 'Confirmer', icon: CheckCircle2, color: 'bg-blue-600 hover:bg-blue-700 text-white' },
  ],
  CONFIRMED: [
    { next: 'PAID', label: 'Marquer payée', icon: CreditCard, color: 'bg-emerald-600 hover:bg-emerald-700 text-white' },
  ],
  PAID: [
    { next: 'SHIPPED', label: 'Préparer', icon: Package, color: 'bg-purple-600 hover:bg-purple-700 text-white' },
  ],
  SHIPPED: [
    { next: 'DELIVERED', label: 'Expédier', icon: Truck, color: 'bg-green-600 hover:bg-green-700 text-white' },
  ],
  DELIVERED: [
    { next: 'DELIVERED', label: 'Livrée', icon: CheckCircle2, color: 'bg-green-600 text-white cursor-default' },
  ],
};

const orderStatuses = ['ALL', 'PENDING', 'CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export default function VendorOrders() {
  const { token, setCurrentView } = useAppStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [creatingInvoice, setCreatingInvoice] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/orders', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data.orders || []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    if (!token) return;
    setUpdatingStatus(orderId);
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId, status }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => (o.id === orderId ? { ...o, status } : o))
        );
      }
    } catch {
      // silently handle
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleCreateInvoice = async (orderId: string) => {
    if (!token) return;
    setCreatingInvoice(orderId);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ orderId }),
      });
      if (res.ok) {
        fetchOrders();
      }
    } catch {
      // silently handle
    } finally {
      setCreatingInvoice(null);
    }
  };

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'ALL') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  // Revenue summary
  const revenueSummary = useMemo(() => {
    const total = orders.reduce((a, o) => a + o.totalAmount, 0);
    const paid = orders.filter(o => ['PAID', 'SHIPPED', 'DELIVERED'].includes(o.status)).reduce((a, o) => a + o.totalAmount, 0);
    const pending = orders.filter(o => o.status === 'PENDING' || o.status === 'CONFIRMED').reduce((a, o) => a + o.totalAmount, 0);
    return { total, paid, pending };
  }, [orders]);

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
          <h1 className="text-2xl font-bold">Commandes</h1>
          <p className="text-sm text-muted-foreground">
            {orders.length} commande{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
      </motion.div>

      {/* Revenue Summary */}
      <motion.div variants={itemVariants} className="grid grid-cols-3 gap-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Revenus totaux
            </p>
            <p className="text-base sm:text-lg font-bold text-emerald-600">
              {revenueSummary.total.toLocaleString('fr-FR')} CDF
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Payé
            </p>
            <p className="text-base sm:text-lg font-bold text-green-600">
              {revenueSummary.paid.toLocaleString('fr-FR')} CDF
            </p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-3 sm:p-4">
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" /> En attente
            </p>
            <p className="text-base sm:text-lg font-bold text-amber-600">
              {revenueSummary.pending.toLocaleString('fr-FR')} CDF
            </p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Filter */}
      <motion.div variants={itemVariants} className="flex items-center gap-3 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
        {orderStatuses.map((status) => {
          const isActive = statusFilter === status;
          const count = status === 'ALL' ? orders.length : orders.filter(o => o.status === status).length;
          const config = status !== 'ALL' ? statusConfig[status] : null;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                isActive
                  ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                  : 'border-border hover:bg-muted/50 text-muted-foreground'
              }`}
            >
              {config && <config.icon className="h-3 w-3" />}
              {status === 'ALL' ? 'Toutes' : config?.label || status}
              <span className={`ml-0.5 text-[10px] ${isActive ? 'text-emerald-600' : 'text-muted-foreground'}`}>
                ({count})
              </span>
            </button>
          );
        })}
      </motion.div>

      {/* Orders */}
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
      ) : filteredOrders.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                <ShoppingCart className="h-12 w-12 text-emerald-300 dark:text-emerald-700" />
              </div>
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                {statusFilter !== 'ALL' ? 'Aucune commande avec ce statut' : 'Aucune commande'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Les commandes de vos clients apparaîtront ici
              </p>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = config.icon;
            const isExpanded = expandedOrder === order.id;
            const hasInvoice = !!(order as any).invoice;
            const actions = statusActions[order.status] || [];

            return (
              <motion.div key={order.id} variants={itemVariants}>
                <Card className="overflow-hidden">
                  <CardContent
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">
                            {order.orderNumber}
                          </h3>
                          <Badge className={`text-[10px] border-0 ${config.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                          {hasInvoice && (
                            <Badge className="text-[10px] bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0">
                              <FileText className="h-3 w-3 mr-1" />
                              Facturée
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          <User className="inline h-3 w-3 mr-1" />
                          {order.customer?.name || 'Client'} •{' '}
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold text-sm">
                          {order.totalAmount.toLocaleString('fr-FR')} CDF
                        </p>
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
                          {/* Order Items */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Articles commandés ({(order.items || []).length})</h4>
                            {(order.items || []).map((item: OrderItem) => (
                              <div
                                key={item.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm"
                              >
                                <div className="flex-1 min-w-0">
                                  <p className="font-medium truncate">
                                    {item.product?.name || 'Produit'}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    Qté : {item.quantity} × {item.price.toLocaleString('fr-FR')} CDF
                                  </p>
                                </div>
                                <p className="font-semibold ml-4">
                                  {(item.price * item.quantity).toLocaleString('fr-FR')} CDF
                                </p>
                              </div>
                            ))}
                          </div>

                          {/* Notes */}
                          {order.notes && (
                            <div className="text-sm bg-amber-50 dark:bg-amber-900/20 p-3 rounded-lg">
                              <span className="text-muted-foreground font-medium">Notes : </span>
                              {order.notes}
                            </div>
                          )}

                          {/* Status Action Buttons */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-3 border-t">
                            <div className="flex items-center gap-2 flex-1 flex-wrap">
                              <span className="text-sm text-muted-foreground shrink-0">Actions :</span>
                              {actions.map((action) => (
                                <Button
                                  key={action.next}
                                  size="sm"
                                  className={`text-xs ${action.color}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(order.id, action.next);
                                  }}
                                  disabled={updatingStatus === order.id}
                                >
                                  <action.icon className="h-3.5 w-3.5 mr-1" />
                                  {action.label}
                                </Button>
                              ))}
                              {order.status !== 'CANCELLED' && order.status !== 'DELIVERED' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="text-xs border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleUpdateStatus(order.id, 'CANCELLED');
                                  }}
                                  disabled={updatingStatus === order.id}
                                >
                                  <XCircle className="h-3.5 w-3.5 mr-1" />
                                  Annuler
                                </Button>
                              )}
                            </div>

                            {/* Create Invoice */}
                            {!hasInvoice && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreateInvoice(order.id);
                                }}
                                disabled={creatingInvoice === order.id}
                              >
                                {creatingInvoice === order.id ? (
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                  <FileText className="mr-2 h-4 w-4" />
                                )}
                                Générer facture
                              </Button>
                            )}
                          </div>
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
