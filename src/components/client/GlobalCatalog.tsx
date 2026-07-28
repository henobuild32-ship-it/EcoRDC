'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  SlidersHorizontal,
  Grid3X3,
  List,
  Star,
  MapPin,
  Store,
  Package,
  ShoppingCart,
  Heart,
  Loader2,
  X,
  ChevronDown,
  Filter,
  Sparkles,
  Clock,
  ArrowUpDown,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CatalogProduct {
  id: string;
  name: string;
  price: number;
  compareAtPrice: number | null;
  images: string;
  stock: number;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  soldCount: number;
  createdAt: string;
  shopId: string;
  shop: {
    id: string;
    name: string;
    logo: string | null;
    city: string | null;
    province: string | null;
    avgRating: number;
    totalReviews: number;
    badges: string;
    deliveryFee: number | null;
    freeDeliveryMin: number | null;
  };
  promotion: { discount: number; endDate: string } | null;
  _count: { reviews: number };
}

const formatPrice = (price: number) => {
  try { return new Intl.NumberFormat('fr-CD', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price) + ' FC'; }
  catch { return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FC'; }
};

export function GlobalCatalog({ onProductClick, onAddToCart }: { onProductClick?: (product: CatalogProduct) => void; onAddToCart?: (productId: string) => void }) {
  const [products, setProducts] = useState<CatalogProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('newest');
  const [availability, setAvailability] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const categories = ['all', 'electronique', 'mode', 'alimentation', 'maison', 'beaute', 'sports', 'livres', 'services', 'autres'];

  useEffect(() => {
    setPage(1);
    setProducts([]);
    fetchProducts(1);
  }, [search, category, sort, availability]);

  const fetchProducts = async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category !== 'all') params.set('category', category);
      params.set('sort', sort);
      if (availability !== 'all') params.set('availability', availability);
      params.set('page', String(p));
      params.set('limit', '20');

      const res = await fetch(`/api/catalog?${params}`);
      if (res.ok) {
        const data = await res.json();
        if (p === 1) setProducts(data.products || []);
        else setProducts((prev) => [...prev, ...(data.products || [])]);
        setHasMore(data.products?.length === 20);
      }
    } catch {} finally { setLoading(false); }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchProducts(next);
  };

  const filtered = products;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6 text-emerald-500" /> Catalogue</h1>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un produit..." className="pl-9 h-9 text-sm" />
            {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="h-4 w-4 text-muted-foreground" /></button>}
          </div>
          <Button variant="outline" size="icon" className="h-9 w-9 lg:hidden" onClick={() => setShowFilters(!showFilters)}><SlidersHorizontal className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Filters sidebar */}
        <div className={`${showFilters ? 'block' : 'hidden'} lg:block w-full lg:w-56 shrink-0 space-y-4`}>
          <Card>
            <CardContent className="p-4 space-y-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Catégorie</p>
                <div className="space-y-1">
                  {categories.map((c) => (
                    <button key={c} onClick={() => setCategory(c)} className={`block w-full text-left text-sm px-2 py-1 rounded transition-colors ${category === c ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 font-medium' : 'text-muted-foreground hover:bg-muted'}`}>
                      {c === 'all' ? 'Toutes' : c.charAt(0).toUpperCase() + c.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Disponibilité</p>
                <Select value={availability} onValueChange={setAvailability}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous</SelectItem>
                    <SelectItem value="in_stock">En stock</SelectItem>
                    <SelectItem value="out_of_stock">Rupture</SelectItem>
                    <SelectItem value="low_stock">Stock faible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Separator />
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Tri</p>
                <Select value={sort} onValueChange={setSort}>
                  <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Nouveautés</SelectItem>
                    <SelectItem value="price_asc">Prix croissant</SelectItem>
                    <SelectItem value="price_desc">Prix décroissant</SelectItem>
                    <SelectItem value="best_sellers">Plus vendus</SelectItem>
                    <SelectItem value="top_rated">Mieux notés</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product grid */}
        <div className="flex-1">
          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden"><div className="aspect-square bg-muted animate-pulse" /><CardContent className="p-3 space-y-2"><div className="h-4 bg-muted rounded animate-pulse" /><div className="h-3 bg-muted rounded w-2/3 animate-pulse" /></CardContent></Card>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Aucun produit trouvé</p>
              {(search || category !== 'all') && <Button variant="link" onClick={() => { setSearch(''); setCategory('all'); }}>Réinitialiser les filtres</Button>}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-muted-foreground">{filtered.length} produit(s)</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {filtered.map((product) => {
                  const discount = product.compareAtPrice && product.compareAtPrice > product.price
                    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100) : 0;
                  const shopBadges = (() => { try { return JSON.parse(product.shop.badges || '[]'); } catch { return []; } })();
                  const isVerified = shopBadges.includes('VERIFIED_SHOP');
                  return (
                    <motion.div key={product.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} layout>
                      <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group" onClick={() => onProductClick?.(product)}>
                        <div className="aspect-square relative bg-muted overflow-hidden">
                          {product.images ? (
                            <img src={product.images.split(',')[0]} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package className="h-10 w-10 text-muted-foreground" /></div>
                          )}
                          {discount > 0 && <Badge className="absolute top-2 left-2 bg-red-500 text-white border-0 text-[10px]">-{discount}%</Badge>}
                          {product.promotion && <Badge className="absolute top-2 right-2 bg-amber-500 text-white border-0 text-[10px]"><Sparkles className="h-3 w-3 mr-0.5" />Promo</Badge>}
                          {product.stock === 0 && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Badge className="bg-red-500 text-white border-0">Rupture</Badge></div>}
                        </div>
                        <CardContent className="p-3 space-y-1.5">
                          <p className="text-xs text-muted-foreground truncate">{product.shop.name}</p>
                          <p className="text-sm font-medium line-clamp-2 leading-tight">{product.name}</p>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-emerald-600 text-sm">{formatPrice(product.price)}</span>
                            {discount > 0 && <span className="text-[10px] text-muted-foreground line-through">{formatPrice(product.compareAtPrice!)}</span>}
                          </div>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            {product.shop.city && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{product.shop.city}</span>}
                            {product._count.reviews > 0 && <span className="flex items-center gap-0.5"><Star className="h-3 w-3 text-yellow-500" />{product.shop.avgRating.toFixed(1)}</span>}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground truncate">{product.shop.name}</span>
                            {isVerified && <span className="text-blue-500 text-[10px]">✓</span>}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
              {hasMore && (
                <div className="text-center mt-6">
                  <Button variant="outline" onClick={loadMore} disabled={loading}>{loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Voir plus</Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
