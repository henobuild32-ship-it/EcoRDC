'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles, Clock, Tag, Percent, Store, ChevronRight, ArrowRight } from 'lucide-react';

interface Promotion {
  id: string;
  title: string;
  description: string | null;
  discount: number | null;
  startDate: string | null;
  endDate: string | null;
  shop: { id: string; name: string; slug: string; logo: string | null; category: string | null };
  products: { product: { id: string; name: string; price: number; images: string } }[];
}

const formatPrice = (price: number) => {
  try { return new Intl.NumberFormat('fr-CD', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price) + ' FC'; }
  catch { return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FC'; }
};

export function PromoBanner({ onProductClick }: { onProductClick?: (productId: string) => void }) {
  const [promos, setPromos] = useState<Promotion[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/promotions/public');
        if (res.ok) {
          const data = await res.json();
          setPromos(data.promotions || []);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (promos.length <= 1) return;
    const timer = setInterval(() => setCurrent((c) => (c + 1) % promos.length), 5000);
    return () => clearInterval(timer);
  }, [promos.length]);

  if (promos.length === 0) return null;

  const promo = promos[current];

  const remaining = promo.endDate ? Math.max(0, Math.floor((new Date(promo.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <Card className="border-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg overflow-hidden relative">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-2 right-2 grid grid-cols-8 gap-2">
          {Array.from({ length: 40 }).map((_, i) => <div key={i} className="h-1.5 w-1.5 rounded-full bg-white" />)}
        </div>
      </div>
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />
      <CardContent className="p-4 sm:p-5 relative z-10">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <Sparkles className="h-5 w-5 text-yellow-200" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-bold text-sm sm:text-base truncate">{promo.title}</p>
                <Badge className="bg-white/20 text-white border-0 text-[10px] h-5">
                  <Percent className="h-3 w-3 mr-0.5" />{promo.discount}% DE RÉDUCTION
                </Badge>
              </div>
              {promo.description && <p className="text-xs text-amber-100 mt-0.5 truncate">{promo.description}</p>}
              <div className="flex items-center gap-3 mt-1 text-[10px] text-amber-100">
                <span className="flex items-center gap-1"><Store className="h-3 w-3" />{promo.shop.name}</span>
                {remaining > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{remaining} jour{remaining > 1 ? 's' : ''} restant{remaining > 1 ? 's' : ''}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" className="bg-white text-orange-600 hover:bg-amber-50 h-8 text-xs font-semibold shadow-lg" onClick={() => onProductClick?.(promo.products[0]?.product.id)}>
              Voir l'offre <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
        {promo.products.length > 0 && (
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-none">
            {promo.products.slice(0, 5).map(({ product }) => (
              <button key={product.id} onClick={() => onProductClick?.(product.id)} className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 hover:bg-white/20 transition-colors shrink-0 text-left">
                <div className="h-6 w-6 rounded bg-white/20 overflow-hidden shrink-0">
                  {product.images ? <img src={product.images.split(',')[0]} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-white/40 text-[8px]">?</div>}
                </div>
                <div className="min-w-0 max-w-[120px]">
                  <p className="text-[10px] truncate text-white">{product.name}</p>
                  <p className="text-[8px] text-amber-200 font-medium">{formatPrice(product.price)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
      {promos.length > 1 && (
        <div className="absolute bottom-2 right-4 flex gap-1">
          {promos.map((_, i) => (
            <button key={i} onClick={() => setCurrent(i)} className={`h-1.5 rounded-full transition-all ${i === current ? 'w-4 bg-white' : 'w-1.5 bg-white/40'}`} />
          ))}
        </div>
      )}
    </Card>
  );
}
