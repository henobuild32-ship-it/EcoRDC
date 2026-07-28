'use client';

import React, { useEffect, useState, useMemo } from 'react';
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
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  XCircle,
  CreditCard,
  Download,
  Filter,
  FileText,
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
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

const statusSteps = ['PENDING', 'CONFIRMED', 'PAID', 'SHIPPED', 'DELIVERED'];

export default function ClientOrders() {
  const { token, setCurrentView } = useAppStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    if (!token) return;
    const fetchOrders = async () => {
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
    };
    fetchOrders();
  }, [token]);

  const toggleExpand = (orderId: string) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const getStatusIndex = (status: string) => statusSteps.indexOf(status);

  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  const handleDownloadInvoice = (orderId: string) => {
    window.open(`/api/invoices/${orderId}`, '_blank');
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('client-dashboard')}
          className="shrink-0 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Mes Commandes</h1>
          <p className="text-sm text-muted-foreground">
            Suivez l&apos;état de vos commandes • {orders.length} commande{orders.length !== 1 ? 's' : ''}
          </p>
        </div>
      </motion.div>

      {/* Status Filter */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 flex-wrap">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-9 text-xs">
            <SelectValue placeholder="Filtrer par statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            <SelectItem value="PENDING">En attente</SelectItem>
            <SelectItem value="CONFIRMED">Confirmée</SelectItem>
            <SelectItem value="PAID">Payée</SelectItem>
            <SelectItem value="SHIPPED">Expédiée</SelectItem>
            <SelectItem value="DELIVERED">Livrée</SelectItem>
            <SelectItem value="CANCELLED">Annulée</SelectItem>
          </SelectContent>
        </Select>
        {statusFilter !== 'all' && (
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-emerald-600 hover:text-emerald-700"
            onClick={() => setStatusFilter('all')}
          >
            Réinitialiser
          </Button>
        )}
      </motion.div>

      {/* Orders List */}
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
          <Card className="border-dashed border-2 border-emerald-200 dark:border-emerald-800">
            <CardContent className="py-20 text-center">
              <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                <ShoppingBag className="h-10 w-10 text-emerald-300 dark:text-emerald-700" />
              </div>
              <h3 className="mt-4 text-xl font-semibold">
                {statusFilter !== 'all' ? 'Aucune commande avec ce statut' : 'Aucune commande'}
              </h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                {statusFilter !== 'all' 
                  ? 'Essayez un autre filtre ou consultez toutes vos commandes'
                  : 'Vos commandes apparaîtront ici après un achat'}
              </p>
              {statusFilter !== 'all' ? (
                <Button
                  variant="outline"
                  className="mt-4 border-emerald-200 dark:border-emerald-800 text-emerald-600"
                  onClick={() => setStatusFilter('all')}
                >
                  Voir toutes les commandes
                </Button>
              ) : (
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setCurrentView('client-shop')}
                >
                  Parcourir les boutiques
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const config = statusConfig[order.status] || statusConfig.PENDING;
            const StatusIcon = config.icon;
            const isExpanded = expandedOrder === order.id;

            return (
              <motion.div key={order.id} variants={itemVariants}>
                <Card className="overflow-hidden shadow-sm">
                  <CardContent
                    className="p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => toggleExpand(order.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm">
                            {order.orderNumber}
                          </h3>
                          <Badge className={`text-[10px] border-0 ${config.color}`}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {order.shop?.name || 'Boutique'} •{' '}
                          {new Date(order.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {(order.items || []).length} article{(order.items || []).length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
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
                          {/* Status Timeline */}
                          {order.status !== 'CANCELLED' && (
                            <div className="bg-muted/30 rounded-xl p-4">
                              <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                <Truck className="h-4 w-4 text-emerald-600" />
                                Suivi de commande
                              </h4>
                              <div className="flex items-center gap-1 px-2">
                                {statusSteps.map((step, i) => {
                                  const stepConfig = statusConfig[step];
                                  const currentIndex = getStatusIndex(order.status);
                                  const isCompleted = i <= currentIndex;
                                  const isCurrent = step === order.status;

                                  return (
                                    <React.Fragment key={step}>
                                      <div className="flex flex-col items-center gap-1.5">
                                        <div
                                          className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-semibold transition-all ${
                                            isCompleted
                                              ? 'bg-emerald-500 text-white shadow-md'
                                              : 'bg-muted text-muted-foreground'
                                          } ${isCurrent ? 'ring-2 ring-emerald-300 ring-offset-2 dark:ring-offset-card' : ''}`}
                                        >
                                          {isCompleted ? (
                                            <CheckCircle2 className="h-3.5 w-3.5" />
                                          ) : (
                                            i + 1
                                          )}
                                        </div>
                                        <span className={`text-[9px] text-center leading-tight ${isCompleted ? 'text-emerald-600 font-medium' : 'text-muted-foreground'}`}>
                                          {stepConfig.label}
                                        </span>
                                      </div>
                                      {i < statusSteps.length - 1 && (
                                        <div
                                          className={`flex-1 h-0.5 rounded-full mt-3 ${
                                            i < currentIndex
                                              ? 'bg-emerald-500'
                                              : 'bg-muted'
                                          }`}
                                        />
                                      )}
                                    </React.Fragment>
                                  );
                                })}
                              </div>
                            </div>
                          )}

                          {/* Order Items */}
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium">Articles commandés</h4>
                            {(order.items || []).map((item: OrderItem) => {
                              const images = item.product?.images
                                ? (item.product.images as string).split(',').filter(Boolean)
                                : [];
                              return (
                                <div
                                  key={item.id}
                                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/20 text-sm"
                                >
                                  <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                                    {images[0] ? (
                                      <img src={images[0]} alt={item.product?.name} className="w-full h-full object-cover" />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Package className="h-5 w-5 text-muted-foreground/30" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{item.product?.name || 'Produit'}</p>
                                    <p className="text-xs text-muted-foreground">
                                      Quantité : {item.quantity} × {item.price.toLocaleString('fr-FR')} CDF
                                    </p>
                                  </div>
                                  <p className="font-semibold ml-4 shrink-0">
                                    {(item.price * item.quantity).toLocaleString('fr-FR')} CDF
                                  </p>
                                </div>
                              );
                            })}
                          </div>

                          {/* Order Actions */}
                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="text-sm">
                              <span className="text-muted-foreground">Total : </span>
                              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {order.totalAmount.toLocaleString('fr-FR')} CDF
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDownloadInvoice(order.id);
                                }}
                              >
                                <Download className="mr-1.5 h-3.5 w-3.5" />
                                Facture
                              </Button>
                            </div>
                          </div>

                          {order.notes && (
                            <div className="text-sm bg-muted/20 p-3 rounded-lg">
                              <span className="text-muted-foreground font-medium">Notes : </span>
                              {order.notes}
                            </div>
                          )}
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
