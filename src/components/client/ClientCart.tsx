'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
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
  MapPin,
  Star,
  Sparkles,
  Clock,
} from 'lucide-react';

interface GroupedCartItems {
  shopId: string;
  shopName: string;
  shopLogo: string | null;
  shopBadges: string[];
  deliveryFee: number | null;
  freeDeliveryMin: number | null;
  avgRating: number;
  city: string | null;
  items: (CartItem & { product?: any })[];
  total: number;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

const formatPrice = (price: number) => {
  try { return new Intl.NumberFormat('fr-CD', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price) + ' FC'; }
  catch { return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FC'; }
};

export default function ClientCart() {
  const { token, setCurrentView } = useAppStore();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

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
    } catch {} finally { setLoading(false); }
  }, [token]);

  useEffect(() => { fetchCart(); }, [fetchCart]);

  const debouncedSave = useCallback((itemId: string, productId: string, quantity: number) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSavingId(itemId);
      try {
        await fetch(`/api/cart?id=${itemId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
          body: JSON.stringify({ productId, quantity }),
        });
      } catch {} finally { setSavingId(null); }
    }, 600);
  }, [token]);

  useEffect(() => () => { if (saveTimer.current) clearTimeout(saveTimer.current); }, []);

  const groupByShop = (): GroupedCartItems[] => {
    const groups = new Map<string, GroupedCartItems>();
    cartItems.forEach((item) => {
      const shop = (item.product as any)?.shop;
      const shopId = shop?.id || 'unknown';
      const shopName = shop?.name || 'Boutique inconnue';
      const shopLogo = shop?.logo || null;
      let shopBadges: string[] = [];
      try { shopBadges = JSON.parse(shop?.badges || '[]'); } catch {}
      const deliveryFee = shop?.deliveryFee ?? null;
      const freeDeliveryMin = shop?.freeDeliveryMin ?? null;
      const avgRating = shop?.avgRating ?? 0;
      const city = shop?.city || null;
      if (!groups.has(shopId)) {
        groups.set(shopId, { shopId, shopName, shopLogo, shopBadges, deliveryFee, freeDeliveryMin, avgRating, city, items: [], total: 0 });
      }
      const group = groups.get(shopId)!;
      group.items.push(item);
      group.total += (item.product?.price || 0) * item.quantity;
    });
    return Array.from(groups.values());
  };

  const handleUpdateQuantity = (itemId: string, item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return;
    setCartItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: newQuantity } : i)));
    debouncedSave(itemId, item.productId, newQuantity);
  };

  const handleRemoveItem = async (itemId: string) => {
    setCartItems((prev) => prev.filter((i) => i.id !== itemId));
    try {
      await fetch(`/api/cart?id=${itemId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    } catch { fetchCart(); }
  };

  const handleCheckout = () => {
    setCheckingOut(true);
    window.location.href = '/checkout';
  };

  const grouped = groupByShop();
  const grandTotal = grouped.reduce((acc, g) => acc + g.total, 0);
  const totalItems = cartItems.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setCurrentView('client-dashboard')} className="shrink-0 hover:bg-emerald-50 dark:hover:bg-emerald-900/20">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Mon Panier</h1>
          <p className="text-sm text-muted-foreground">{totalItems} article{totalItems !== 1 ? 's' : ''} dans {grouped.length} boutique{grouped.length !== 1 ? 's' : ''}</p>
        </div>
        {cartItems.length > 0 && (
          <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700" onClick={() => setCurrentView('client-shop')}>
            <ShoppingBag className="mr-1 h-4 w-4" />Continuer mes achats
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
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">Parcourez les boutiques pour découvrir des produits exceptionnels et ajoutez-les à votre panier</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-6 justify-center">
                <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => setCurrentView('client-shop')}>
                  <ShoppingBag className="mr-2 h-4 w-4" />Parcourir les boutiques
                </Button>
                <Button variant="outline" className="border-emerald-200 dark:border-emerald-800 text-emerald-600" onClick={() => setCurrentView('client-favorites')}>
                  <ShoppingCart className="mr-2 h-4 w-4" />Voir mes favoris
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {grouped.map((group) => {
                const isVerified = group.shopBadges.includes('VERIFIED_SHOP');
                const isTopRated = group.shopBadges.includes('TOP_RATED');
                const shipping = (group.freeDeliveryMin && group.total >= group.freeDeliveryMin) ? 0 : (group.deliveryFee || 2500);
                return (
                  <motion.div key={group.shopId} variants={itemVariants}>
                    <Card className="shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0">
                            <Store className="h-4 w-4 text-white" />
                          </div>
                          <span className="truncate">{group.shopName}</span>
                          {isVerified && <Badge className="bg-blue-500 text-white border-0 text-[9px] h-4 px-1">Vérifié</Badge>}
                          {isTopRated && <Badge className="bg-yellow-500 text-white border-0 text-[9px] h-4 px-1">Top</Badge>}
                          {group.city && <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 ml-auto"><MapPin className="h-3 w-3" />{group.city}</span>}
                          <Badge variant="outline" className="text-[10px]">{group.items.length} article{group.items.length !== 1 ? 's' : ''}</Badge>
                        </CardTitle>
                        {group.avgRating > 0 && (
                          <p className="text-[10px] text-muted-foreground ml-10 -mt-1 flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />{group.avgRating.toFixed(1)}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {group.items.map((item) => {
                          const images = item.product?.images ? (item.product.images as string).split(',').filter(Boolean) : [];
                          const discount = (item.product as any)?.compareAtPrice && (item.product as any).compareAtPrice > (item.product?.price || 0)
                            ? Math.round((((item.product as any).compareAtPrice - (item.product?.price || 0)) / (item.product as any).compareAtPrice) * 100) : 0;
                          return (
                            <motion.div key={item.id} layout exit={{ opacity: 0, x: -100 }} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                              <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0 relative">
                                {images[0] ? (
                                  <img src={images[0]} alt={item.product?.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10">
                                    <Package className="h-6 w-6 text-emerald-200 dark:text-emerald-800" />
                                  </div>
                                )}
                                {(item.product as any)?.promotion && <Badge className="absolute top-0.5 right-0.5 bg-amber-500 text-white border-0 text-[8px] h-3.5 px-1"><Sparkles className="h-2 w-2 mr-0.5" />Promo</Badge>}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm truncate">{item.product?.name || 'Produit'}</h4>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-emerald-600 dark:text-emerald-400 text-sm font-semibold">{formatPrice(item.product?.price || 0)}</span>
                                  {discount > 0 && <span className="text-[10px] text-muted-foreground line-through">{formatPrice((item.product as any).compareAtPrice)}</span>}
                                </div>
                                {savingId === item.id && <span className="text-[9px] text-muted-foreground flex items-center gap-1"><Loader2 className="h-2 w-2 animate-spin" />Sauvegarde...</span>}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Button variant="outline" size="icon" className="h-8 w-8 border-emerald-200 dark:border-emerald-800" onClick={() => handleUpdateQuantity(item.id, item, item.quantity - 1)} disabled={item.quantity <= 1}>
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <Badge variant="secondary" className="min-w-[32px] justify-center font-semibold text-xs">{item.quantity}</Badge>
                                <Button variant="outline" size="icon" className="h-8 w-8 border-emerald-200 dark:border-emerald-800" onClick={() => handleUpdateQuantity(item.id, item, item.quantity + 1)}>
                                  <Plus className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 ml-1" onClick={() => handleRemoveItem(item.id)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </motion.div>
                          );
                        })}
                      </CardContent>
                      <CardFooter className="flex items-center justify-between pt-2 border-t">
                        <div className="text-sm">
                          <span className="text-muted-foreground">Sous-total : </span>
                          <span className="font-bold text-emerald-600">{formatPrice(group.total)}</span>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                            <Truck className="h-3 w-3" />Livraison : {shipping === 0 ? 'Gratuite' : formatPrice(shipping)}
                          </p>
                        </div>
                      </CardFooter>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="lg:col-span-1">
            <motion.div variants={itemVariants}>
              <Card className="sticky top-24 shadow-sm border-emerald-100 dark:border-emerald-900">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-emerald-600" />Résumé du panier</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total ({totalItems} articles)</span>
                    <span className="font-medium">{formatPrice(grandTotal)}</span>
                  </div>
                  {grouped.map((g) => {
                    const shipping = (g.freeDeliveryMin && g.total >= g.freeDeliveryMin) ? 0 : (g.deliveryFee || 2500);
                    return (
                      <div key={g.shopId} className="flex items-center justify-between text-[11px] text-muted-foreground pl-2 border-l-2 border-emerald-200">
                        <span className="truncate max-w-[140px]">{g.shopName}</span>
                        <span className={shipping === 0 ? 'text-emerald-600 font-medium' : ''}>{shipping === 0 ? 'Gratuit' : formatPrice(shipping)}</span>
                      </div>
                    );
                  })}
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">{formatPrice(grandTotal + grouped.reduce((a, g) => a + ((g.freeDeliveryMin && g.total >= g.freeDeliveryMin) ? 0 : (g.deliveryFee || 2500)), 0))}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 pt-0">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 h-11" onClick={handleCheckout} disabled={checkingOut}>
                    {checkingOut ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShoppingBag className="mr-2 h-4 w-4" />}
                    Procéder au paiement
                  </Button>
                  <Button variant="outline" className="w-full border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20" onClick={() => setCurrentView('client-shop')}>
                    <ShoppingBag className="mr-2 h-4 w-4" />Continuer mes achats
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
