'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AddressManager } from '@/components/client/AddressManager';
import {
  ShoppingCart,
  Store,
  MapPin,
  Truck,
  CreditCard,
  CheckCircle2,
  Loader2,
  ChevronLeft,
  Minus,
  Plus,
  Trash2,
  Package,
  Phone,
  User,
  Lock,
  Shield,
  ArrowLeft,
} from 'lucide-react';
import { toast } from 'sonner';

interface CartItemData {
  id: string;
  productId: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    compareAtPrice: number | null;
    images: string;
    stock: number;
    shopId: string;
    shop: { id: string; name: string; logo: string | null; deliveryFee: number | null; freeDeliveryMin: number | null };
  };
}

interface AddressData {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  province: string | null;
  city: string;
  commune: string | null;
  quartier: string | null;
  avenue: string | null;
  numero: string | null;
  reference: string | null;
  instructions: string | null;
  isDefault: boolean;
}

const formatPrice = (price: number) => {
  try { return new Intl.NumberFormat('fr-CD', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price) + ' FC'; }
  catch { return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FC'; }
};

export function CheckoutPage({ onBack }: { onBack: () => void }) {
  const [cartItems, setCartItems] = useState<(CartItemData & { shopTotal?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<AddressData | null>(null);
  const [step, setStep] = useState<'address' | 'review' | 'payment' | 'success'>('address');
  const [processing, setProcessing] = useState(false);
  const [orderResult, setOrderResult] = useState<any[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('ecordc_token') : null;

  useEffect(() => {
    fetchCart();
    fetchDefaultAddress();
  }, []);

  const fetchCart = async () => {
    try {
      const res = await fetch('/api/cart', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setCartItems(await res.json());
    } catch {} finally { setLoading(false); }
  };

  const fetchDefaultAddress = async () => {
    try {
      const res = await fetch('/api/addresses', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const addrs = await res.json();
        const def = addrs.find((a: AddressData) => a.isDefault) || addrs[0];
        if (def) setSelectedAddress(def);
      }
    } catch {}
  };

  const updateQuantity = async (itemId: string, newQty: number) => {
    if (newQty < 1) return;
    try {
      await fetch('/api/cart', { method: 'PUT', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ itemId, quantity: newQty }) });
      fetchCart();
    } catch {}
  };

  const removeItem = async (itemId: string) => {
    try {
      await fetch(`/api/cart?id=${itemId}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
      fetchCart();
    } catch {}
  };

  const groupedByShop = cartItems.reduce<Record<string, CartItemData[]>>((acc, item) => {
    const shopId = item.product.shopId;
    if (!acc[shopId]) acc[shopId] = [];
    acc[shopId].push(item);
    return acc;
  }, {});

  const shopTotals = Object.entries(groupedByShop).map(([shopId, items]) => {
    const subtotal = items.reduce((sum, item) => {
      const price = item.product.compareAtPrice || item.product.price;
      return sum + price * item.quantity;
    }, 0);
    const shop = items[0].product.shop;
    const shipping = shop.deliveryFee || (subtotal >= (shop.freeDeliveryMin || 50000) ? 0 : 2500);
    return { shopId, shop, items, subtotal, shipping, total: subtotal + shipping };
  });

  const grandTotal = shopTotals.reduce((sum, s) => sum + s.total, 0);
  const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  const handlePlaceOrder = async () => {
    if (!selectedAddress) { toast.error('Sélectionnez une adresse de livraison'); return; }
    setProcessing(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ addressId: selectedAddress.id }),
      });
      if (res.ok) {
        const orders = await res.json();
        setOrderResult(orders);
        setStep('success');
        toast.success('Commande passée avec succès !');
      } else {
        const d = await res.json();
        toast.error(d.error || 'Erreur lors de la commande');
      }
    } catch { toast.error('Erreur de connexion'); } finally { setProcessing(false); }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;

  if (step === 'success') {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-10 w-10 text-emerald-500" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Commande confirmée !</h2>
        <p className="text-muted-foreground mb-6">Votre commande a été transmise aux vendeurs. Vous recevrez une notification dès qu&apos;elle sera confirmée.</p>
        <div className="space-y-2 mb-6 text-left">
          {orderResult.map((order: any) => (
            <Card key={order.id}>
              <CardContent className="p-3 flex items-center justify-between">
                <div><p className="font-medium text-sm">{order.orderNumber}</p><p className="text-xs text-muted-foreground">{order.items?.length || 0} article(s) — {formatPrice(order.totalAmount)}</p></div>
                <Badge variant="outline" className="text-emerald-600">En attente</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
        <Button onClick={onBack} className="bg-emerald-600 hover:bg-emerald-700">Retour aux achats</Button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"><ArrowLeft className="h-4 w-4" /> Retour</button>
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2"><ShoppingCart className="h-6 w-6 text-emerald-500" /> Paiement</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* Steps */}
          <div className="flex items-center gap-2 text-sm mb-4">
            {['address', 'review', 'payment'].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-medium ${step === s ? 'bg-emerald-500 text-white' : ['address', 'review', 'payment'].indexOf(step) > i ? 'bg-emerald-100 text-emerald-600' : 'bg-muted text-muted-foreground'}`}>
                  {['address', 'review', 'payment'].indexOf(step) > i ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className={step === s ? 'font-medium' : 'text-muted-foreground'}>{s === 'address' ? 'Adresse' : s === 'review' ? 'Récapitulatif' : 'Paiement'}</span>
                {i < 2 && <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180" />}
              </div>
            ))}
          </div>

          {/* Address step */}
          {step === 'address' && (
            <Card>
              <CardContent className="p-4">
                <AddressManager onSelect={(addr) => setSelectedAddress(addr)} selectedId={selectedAddress?.id} />
                <div className="mt-4 flex justify-end">
                  <Button onClick={() => setStep('review')} disabled={!selectedAddress}>Continuer <ChevronLeft className="h-4 w-4 ml-1 rotate-180" /></Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Review step */}
          {step === 'review' && (
            <div className="space-y-4">
              {/* Selected address summary */}
              {selectedAddress && (
                <Card>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-emerald-500" />
                      <div>
                        <p className="text-sm font-medium">{selectedAddress.firstName} {selectedAddress.lastName}</p>
                        <p className="text-xs text-muted-foreground">{selectedAddress.avenue && `${selectedAddress.avenue}, `}{selectedAddress.city}{selectedAddress.province && `, ${selectedAddress.province}`} — {selectedAddress.phone}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setStep('address')}>Modifier</Button>
                  </CardContent>
                </Card>
              )}

              {/* Cart items grouped by shop */}
              {shopTotals.map(({ shopId, shop, items, subtotal, shipping, total }) => (
                <Card key={shopId}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3 pb-2 border-b">
                      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0">
                        <Store className="h-4 w-4 text-white" />
                      </div>
                      <span className="font-medium text-sm">{shop.name}</span>
                    </div>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                          <div className="h-12 w-12 rounded-lg overflow-hidden bg-muted shrink-0">
                            {item.product.images ? <img src={item.product.images.split(',')[0]} alt={item.product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{item.product.name}</p>
                            <p className="text-xs text-muted-foreground">Qté: {item.quantity} × {formatPrice(item.product.price)}</p>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity - 1)}><Minus className="h-3 w-3" /></Button>
                            <span className="text-sm font-medium w-6 text-center">{item.quantity}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.id, item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-red-500" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                          <span className="text-sm font-medium w-24 text-right">{formatPrice((item.product.compareAtPrice || item.product.price) * item.quantity)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-2 border-t text-xs space-y-1">
                      <div className="flex justify-between"><span>Sous-total</span><span>{formatPrice(subtotal)}</span></div>
                      <div className="flex justify-between"><span>Livraison</span><span>{shipping === 0 ? 'Gratuite' : formatPrice(shipping)}</span></div>
                      <div className="flex justify-between font-medium text-sm"><span>Total boutique</span><span>{formatPrice(total)}</span></div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep('address')}>Retour</Button>
                <Button onClick={() => setStep('payment')} className="bg-emerald-600 hover:bg-emerald-700">Passer au paiement</Button>
              </div>
            </div>
          )}

          {/* Payment step */}
          {step === 'payment' && (
            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-semibold flex items-center gap-2"><Shield className="h-5 w-5 text-emerald-500" /> Confirmer la commande</h3>
                <div className="space-y-2 text-sm">
                  {shopTotals.map(({ shop, items, subtotal, shipping, total }) => (
                    <div key={shop.id} className="flex justify-between items-center py-1">
                      <span className="text-muted-foreground">{shop.name} ({items.length} art.)</span>
                      <span className="font-medium">{formatPrice(total)}</span>
                    </div>
                  ))}
                  <Separator />
                  <div className="flex justify-between text-base font-bold">
                    <span>Total général</span>
                    <span className="text-emerald-600">{formatPrice(grandTotal)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Lock className="h-3 w-3" />Paiement à la livraison — vous payez en recevant vos articles</p>
                </div>
                <div className="flex gap-2 justify-end pt-2">
                  <Button variant="outline" onClick={() => setStep('review')}>Retour</Button>
                  <Button onClick={handlePlaceOrder} disabled={processing} className="bg-emerald-600 hover:bg-emerald-700 min-w-[200px]">
                    {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    {processing ? 'Traitement...' : `Confirmer (${formatPrice(grandTotal)})`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order summary sidebar */}
        <div className="space-y-3">
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">Récapitulatif</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Articles</span><span>{totalItems}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Boutiques</span><span>{shopTotals.length}</span></div>
                <Separator />
                {shopTotals.map(({ shop, shipping }) => (
                  <div key={shop.id} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Livraison {shop.name}</span>
                    <span>{shipping === 0 ? 'Gratuite' : formatPrice(shipping)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-emerald-600">{formatPrice(grandTotal)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-xs text-muted-foreground space-y-2">
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-emerald-500" />Livraison assurée par les vendeurs</div>
              <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-emerald-500" />Paiement sécurisé à la livraison</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" />Produits vérifiés</div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
