'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type CartItem, type Product } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Package,
  ShoppingBag,
  Loader2,
  Store,
  Truck,
  ArrowRight,
  ShoppingBasket,
} from 'lucide-react';

interface GroupedCartItems {
  shopId: string;
  shopName: string;
  items: (CartItem & { product?: Product & { shop?: { id: string; name: string } } })[];
  total: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function ClientCart() {
  const { token, setCurrentView } = useAppStore();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ordering, setOrdering] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/cart', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setCartItems(data.cartItems || []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const groupByShop = (): GroupedCartItems[] => {
    const groups = new Map<string, GroupedCartItems>();
    cartItems.forEach((item) => {
      const shopId = (item.product as any)?.shop?.id || 'unknown';
      const shopName = (item.product as any)?.shop?.name || 'Boutique inconnue';
      if (!groups.has(shopId)) {
        groups.set(shopId, { shopId, shopName, items: [], total: 0 });
      }
      const group = groups.get(shopId)!;
      group.items.push(item);
      group.total += (item.product?.price || 0) * item.quantity;
    });
    return Array.from(groups.values());
  };

  const handleUpdateQuantity = async (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    try {
      const item = cartItems.find((i) => i.id === itemId);
      if (!item?.product) return;

      setCartItems((prev) =>
        prev.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i))
      );

      await fetch('/api/cart?id=' + itemId, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: item.productId,
          quantity: newQuantity,
        }),
      });

      fetchCart();
    } catch {
      fetchCart();
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      setCartItems((prev) => prev.filter((i) => i.id !== itemId));
      await fetch(`/api/cart?id=${itemId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch {
      fetchCart();
    }
  };

  const handleOrder = async (shopId: string) => {
    if (!token) return;
    setOrdering(shopId);
    try {
      const shopItems = cartItems.filter(
        (i) => (i.product as any)?.shop?.id === shopId
      );
      const items = shopItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity,
      }));

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ shopId, items }),
      });

      if (res.ok) {
        fetchCart();
      }
    } catch {
      // silently handle
    } finally {
      setOrdering(null);
    }
  };

  const grouped = groupByShop();
  const grandTotal = grouped.reduce((acc, g) => acc + g.total, 0);
  const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);
  const shippingEstimate = grandTotal > 0 ? (grandTotal > 50000 ? 0 : 2500) : 0;
  const totalWithShipping = grandTotal + shippingEstimate;

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
          <h1 className="text-2xl font-bold">Mon Panier</h1>
          <p className="text-sm text-muted-foreground">
            {totalItems} article{totalItems !== 1 ? 's' : ''} dans {grouped.length} boutique{grouped.length !== 1 ? 's' : ''}
          </p>
        </div>
        {cartItems.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-emerald-600 hover:text-emerald-700"
            onClick={() => setCurrentView('client-shop')}
          >
            <ShoppingBag className="mr-1 h-4 w-4" />
            Continuer mes achats
          </Button>
        )}
      </motion.div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-6 w-1/3 mb-4" />
                {[1, 2].map((j) => (
                  <div key={j} className="flex items-center gap-4 py-3">
                    <Skeleton className="h-16 w-16 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : cartItems.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed border-2 border-emerald-200 dark:border-emerald-800">
            <CardContent className="py-20 text-center">
              <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                <ShoppingBasket className="h-12 w-12 text-emerald-300 dark:text-emerald-700" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Votre panier est vide</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Parcourez les boutiques pour découvrir des produits exceptionnels et ajoutez-les à votre panier
              </p>
              <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setCurrentView('client-shop')}
                >
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  Parcourir les boutiques
                </Button>
                <Button
                  variant="outline"
                  className="border-emerald-200 dark:border-emerald-800 text-emerald-600"
                  onClick={() => setCurrentView('client-favorites')}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Voir mes favoris
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {grouped.map((group) => (
                <motion.div key={group.shopId} variants={itemVariants}>
                  <Card className="shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                          <Store className="h-4 w-4 text-white" />
                        </div>
                        {group.shopName}
                        <Badge variant="outline" className="text-[10px] ml-auto">
                          {group.items.length} article{group.items.length !== 1 ? 's' : ''}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {group.items.map((item) => {
                        const images = item.product?.images
                          ? (item.product.images as string).split(',').filter(Boolean)
                          : [];
                        return (
                          <motion.div
                            key={item.id}
                            layout
                            exit={{ opacity: 0, x: -100 }}
                            className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors"
                          >
                            <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">
                              {images[0] ? (
                                <img
                                  src={images[0]}
                                  alt={item.product?.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10">
                                  <Package className="h-6 w-6 text-emerald-200 dark:text-emerald-800" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm truncate">
                                {item.product?.name || 'Produit'}
                              </h4>
                              <p className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold">
                                {(item.product?.price || 0).toLocaleString('fr-FR')} CDF
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Sous-total : {((item.product?.price || 0) * item.quantity).toLocaleString('fr-FR')} CDF
                              </p>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-emerald-200 dark:border-emerald-800"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <Badge variant="secondary" className="min-w-[32px] justify-center font-semibold">
                                {item.quantity}
                              </Badge>
                              <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 border-emerald-200 dark:border-emerald-800"
                                onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-1"
                                onClick={() => handleRemoveItem(item.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </CardContent>
                    <CardFooter className="flex items-center justify-between pt-2 border-t">
                      <div>
                        <span className="text-sm text-muted-foreground">Total boutique : </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {group.total.toLocaleString('fr-FR')} CDF
                        </span>
                      </div>
                      <Button
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => handleOrder(group.shopId)}
                        disabled={ordering === group.shopId}
                      >
                        {ordering === group.shopId ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Commande en cours...
                          </>
                        ) : (
                          <>
                            <ShoppingBag className="mr-2 h-4 w-4" />
                            Passer la commande
                          </>
                        )}
                      </Button>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Cart Summary Sidebar */}
          <div className="lg:col-span-1">
            <motion.div variants={itemVariants}>
              <Card className="sticky top-24 shadow-sm border-emerald-100 dark:border-emerald-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <ShoppingCart className="h-5 w-5 text-emerald-600" />
                    Résumé du panier
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total ({totalItems} articles)</span>
                    <span className="font-medium">{grandTotal.toLocaleString('fr-FR')} CDF</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      Livraison estimée
                    </span>
                    <span className={`font-medium ${shippingEstimate === 0 ? 'text-emerald-600' : ''}`}>
                      {shippingEstimate === 0 ? 'Gratuite' : `${shippingEstimate.toLocaleString('fr-FR')} CDF`}
                    </span>
                  </div>
                  {shippingEstimate === 0 && grandTotal > 0 && (
                    <p className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded-lg">
                      🎉 Livraison gratuite pour les commandes de plus de 50 000 CDF !
                    </p>
                  )}
                  {shippingEstimate > 0 && grandTotal > 0 && (
                    <p className="text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg">
                      Plus que {(50000 - grandTotal).toLocaleString('fr-FR')} CDF pour la livraison gratuite
                    </p>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                      {totalWithShipping.toLocaleString('fr-FR')} CDF
                    </span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-0">
                  <Button
                    className="w-full bg-emerald-600 hover:bg-emerald-700 h-11"
                    onClick={() => {
                      if (grouped.length === 1) {
                        handleOrder(grouped[0].shopId);
                      }
                    }}
                    disabled={grouped.length > 1 || ordering !== null}
                  >
                    {ordering ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Commande en cours...
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Passer la commande
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                    onClick={() => setCurrentView('client-shop')}
                  >
                    <ShoppingBag className="mr-2 h-4 w-4" />
                    Continuer mes achats
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
