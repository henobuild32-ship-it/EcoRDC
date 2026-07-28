'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';
import {
  AlertTriangle,
  Package,
  TrendingDown,
  RefreshCw,
  Edit3,
  CheckCircle2,
  Users,
  Bell,
  ArrowRight,
  Loader2,
  Search,
} from 'lucide-react';

interface StockProduct {
  id: string;
  name: string;
  images: string;
  stock: number;
  interestedClients?: number;
}

interface StockSummary {
  outOfStock: number;
  lowStock: number;
  totalActive: number;
  threshold: number;
}

interface StockAlertPanelProps {
  onEditProduct?: (productId: string) => void;
}

export default function StockAlertPanel({ onEditProduct }: StockAlertPanelProps) {
  const { token, setCurrentView } = useAppStore();
  const [summary, setSummary] = useState<StockSummary | null>(null);
  const [outOfStock, setOutOfStock] = useState<StockProduct[]>([]);
  const [lowStock, setLowStock] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [restockingId, setRestockingId] = useState<string | null>(null);
  const [restockQty, setRestockQty] = useState<Record<string, string>>({});

  const fetchStockAlerts = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/stock/check-alerts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data.summary);
        setOutOfStock(data.outOfStockProducts || []);
        setLowStock(data.lowStockProducts || []);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchStockAlerts();
    // Refresh every 2 minutes
    const interval = setInterval(fetchStockAlerts, 120_000);
    return () => clearInterval(interval);
  }, [fetchStockAlerts]);

  const handleRestock = async (productId: string, productName: string) => {
    const qty = parseInt(restockQty[productId] || '0');
    if (isNaN(qty) || qty <= 0) {
      toast.error('Entrez une quantité valide');
      return;
    }

    setRestockingId(productId);
    try {
      const product = [...outOfStock, ...lowStock].find((p) => p.id === productId);
      const currentStock = product?.stock ?? 0;
      const newStock = currentStock + qty;

      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, stock: newStock }),
      });

      if (res.ok) {
        toast.success(`"${productName}" réapprovisionné ! Nouveau stock : ${newStock}`);
        setRestockQty((prev) => ({ ...prev, [productId]: '' }));
        await fetchStockAlerts();
      } else {
        toast.error('Erreur lors du réapprovisionnement');
      }
    } catch {
      toast.error('Erreur réseau');
    } finally {
      setRestockingId(null);
    }
  };

  if (!summary) {
    return (
      <Card className="border-0 shadow-sm">
        <CardContent className="p-6 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (summary.outOfStock === 0 && summary.lowStock === 0) {
    return (
      <Card className="border-0 shadow-sm border-t-4 border-t-emerald-500">
        <CardContent className="p-5 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
          </div>
          <div>
            <p className="font-semibold text-emerald-700 dark:text-emerald-400">Stocks en bonne santé !</p>
            <p className="text-sm text-muted-foreground">
              Tous vos {summary.totalActive} produits ont un stock suffisant.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchStockAlerts}
            className="ml-auto shrink-0 text-muted-foreground"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-0 shadow-sm border-t-4 border-t-red-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Rupture de stock</p>
                <p className="text-2xl font-bold text-red-600">{summary.outOfStock}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Package className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm border-t-4 border-t-amber-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Stock faible</p>
                <p className="text-2xl font-bold text-amber-600">{summary.lowStock}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm border-t-4 border-t-emerald-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Produits actifs</p>
                <p className="text-2xl font-bold">{summary.totalActive}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm border-t-4 border-t-blue-500">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Seuil alerte</p>
                <p className="text-2xl font-bold text-blue-600">{summary.threshold}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Bell className="h-5 w-5 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Out of stock */}
      {outOfStock.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-red-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <Package className="h-5 w-5" />
              Rupture de stock ({outOfStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {outOfStock.map((product) => {
                const img = product.images?.split(',').filter(Boolean)[0];
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30"
                  >
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-white shrink-0 border border-red-100">
                      {img ? (
                        <img src={img} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-red-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0 text-[10px]">
                          Stock : 0
                        </Badge>
                        {product.interestedClients && product.interestedClients > 0 ? (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                            <Users className="h-3 w-3" />
                            {product.interestedClients} client{product.interestedClients > 1 ? 's' : ''} attendent
                          </span>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        min={1}
                        placeholder="Qté"
                        value={restockQty[product.id] || ''}
                        onChange={(e) => setRestockQty((prev) => ({ ...prev, [product.id]: e.target.value }))}
                        className="w-16 h-8 text-xs text-center"
                      />
                      <Button
                        size="sm"
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2"
                        onClick={() => handleRestock(product.id, product.name)}
                        disabled={restockingId === product.id || !restockQty[product.id]}
                      >
                        {restockingId === product.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      {/* Low stock */}
      {lowStock.length > 0 && (
        <Card className="border-0 shadow-sm border-l-4 border-l-amber-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Stock faible ({lowStock.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AnimatePresence>
              {lowStock.map((product) => {
                const img = product.images?.split(',').filter(Boolean)[0];
                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30"
                  >
                    <div className="h-10 w-10 rounded-lg overflow-hidden bg-white shrink-0 border border-amber-100">
                      {img ? (
                        <img src={img} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="h-5 w-5 text-amber-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0 text-[10px] mt-0.5">
                        {product.stock} unité{product.stock > 1 ? 's' : ''} restante{product.stock > 1 ? 's' : ''}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Input
                        type="number"
                        min={1}
                        placeholder="Qté"
                        value={restockQty[product.id] || ''}
                        onChange={(e) => setRestockQty((prev) => ({ ...prev, [product.id]: e.target.value }))}
                        className="w-16 h-8 text-xs text-center"
                      />
                      <Button
                        size="sm"
                        className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-2"
                        onClick={() => handleRestock(product.id, product.name)}
                        disabled={restockingId === product.id || !restockQty[product.id]}
                      >
                        {restockingId === product.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <RefreshCw className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchStockAlerts}
          className="text-muted-foreground"
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentView('vendor-products')}
          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
        >
          Gérer les produits
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
}
