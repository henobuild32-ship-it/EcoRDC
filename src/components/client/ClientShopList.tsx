'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type Shop } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Search,
  Store as StoreIcon,
  Star,
  Package,
  ArrowLeft,
  LayoutGrid,
  List,
  MapPin,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

type ViewMode = 'grid' | 'list';
type SortMode = 'name' | 'products' | 'recommended';

export default function ClientShopList() {
  const { token, setCurrentView, setSelectedShop } = useAppStore();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortMode, setSortMode] = useState<SortMode>('recommended');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [cityFilter, setCityFilter] = useState<string>('all');

  useEffect(() => {
    const fetchShops = async () => {
      try {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        const res = await fetch(`/api/shops?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setShops(data.shops || []);
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    const debounce = setTimeout(fetchShops, 300);
    return () => clearTimeout(debounce);
  }, [search, token]);

  const handleShopClick = (shop: Shop) => {
    setSelectedShop(shop);
    setCurrentView('client-product');
  };

  // Extract unique categories and cities
  const categories = useMemo(() => {
    const cats = new Set<string>();
    shops.forEach((s) => { if ((s as any).category) cats.add((s as any).category); });
    return Array.from(cats);
  }, [shops]);

  const cities = useMemo(() => {
    const cts = new Set<string>();
    shops.forEach((s) => { if ((s as any).city) cts.add((s as any).city); });
    return Array.from(cts);
  }, [shops]);

  // Filter and sort
  const filteredShops = useMemo(() => {
    let result = [...shops];
    if (categoryFilter !== 'all') {
      result = result.filter((s) => (s as any).category === categoryFilter);
    }
    if (cityFilter !== 'all') {
      result = result.filter((s) => (s as any).city === cityFilter);
    }
    switch (sortMode) {
      case 'name':
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'products':
        result.sort((a, b) => (b.products?.length || 0) - (a.products?.length || 0));
        break;
      case 'recommended':
      default:
        // Recommended first, then alphabetical
        result.sort((a, b) => {
          if (a.isRecommended && !b.isRecommended) return -1;
          if (!a.isRecommended && b.isRecommended) return 1;
          return a.name.localeCompare(b.name);
        });
        break;
    }
    return result;
  }, [shops, categoryFilter, cityFilter, sortMode]);

  const recommended = filteredShops.filter((s) => s.isRecommended);
  const others = filteredShops.filter((s) => !s.isRecommended);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
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
          <h1 className="text-2xl font-bold">Boutiques</h1>
          <p className="text-sm text-muted-foreground">
            Découvrez les meilleures boutiques de la RDC • {filteredShops.length} boutique{filteredShops.length !== 1 ? 's' : ''}
          </p>
        </div>
      </motion.div>

      {/* Search & Filters Bar */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une boutique..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 border-emerald-200 dark:border-emerald-800 focus-visible:ring-emerald-500"
            />
          </div>
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className={`h-8 w-8 ${viewMode === 'grid' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className={`h-8 w-8 ${viewMode === 'list' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap gap-2 items-center">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          {categories.length > 0 && (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <Tag className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes catégories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {cities.length > 0 && (
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <MapPin className="h-3.5 w-3.5 mr-1 text-muted-foreground" />
                <SelectValue placeholder="Ville" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes villes</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>{city}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Select value={sortMode} onValueChange={(v) => setSortMode(v as SortMode)}>
            <SelectTrigger className="w-[160px] h-9 text-xs">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommandées d&apos;abord</SelectItem>
              <SelectItem value="name">Nom (A-Z)</SelectItem>
              <SelectItem value="products">Nb. produits</SelectItem>
            </SelectContent>
          </Select>
          {(categoryFilter !== 'all' || cityFilter !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-9 text-emerald-600 hover:text-emerald-700"
              onClick={() => {
                setCategoryFilter('all');
                setCityFilter('all');
              }}
            >
              Réinitialiser les filtres
            </Button>
          )}
        </div>
      </motion.div>

      {/* Recommended Shops */}
      {recommended.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-emerald-500 fill-emerald-500" />
            <h2 className="text-lg font-semibold">Boutiques recommandées</h2>
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-[10px]">
              {recommended.length}
            </Badge>
          </div>
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {recommended.map((shop, index) =>
              viewMode === 'grid' ? (
                <motion.div key={shop.id} variants={itemVariants} custom={index}>
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all hover:border-emerald-200 dark:hover:border-emerald-800 overflow-hidden group"
                    onClick={() => handleShopClick(shop)}
                  >
                    <div className="h-32 bg-gradient-to-br from-emerald-400 to-green-500 relative">
                      {shop.coverImage && (
                        <img src={shop.coverImage} alt={shop.name} className="w-full h-full object-cover" />
                      )}
                      <Badge className="absolute top-3 right-3 bg-emerald-600 text-white border-0 badge-shimmer">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Recommandée
                      </Badge>
                      {(shop as any).category && (
                        <Badge className="absolute top-3 left-3 bg-white/90 dark:bg-black/60 text-foreground border-0 text-[10px]">
                          <Tag className="h-2.5 w-2.5 mr-0.5" />
                          {(shop as any).category}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white shadow-md border overflow-hidden shrink-0">
                          {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30">
                              <StoreIcon className="h-6 w-6 text-emerald-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate group-hover:text-emerald-600 transition-colors">{shop.name}</h3>
                          {shop.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{shop.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Package className="h-3 w-3" />
                              {shop.products?.length || 0} produits
                            </p>
                            {(shop as any).city && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />
                                {(shop as any).city}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div key={shop.id} variants={itemVariants} custom={index}>
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all hover:border-emerald-200 dark:hover:border-emerald-800 overflow-hidden group"
                    onClick={() => handleShopClick(shop)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-white shadow-md border overflow-hidden shrink-0">
                        {shop.logo ? (
                          <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30">
                            <StoreIcon className="h-6 w-6 text-emerald-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold truncate group-hover:text-emerald-600 transition-colors">{shop.name}</h3>
                          <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 text-[10px] shrink-0">
                            <Star className="h-2.5 w-2.5 mr-0.5 fill-current" />
                            Recommandée
                          </Badge>
                        </div>
                        {shop.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{shop.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Package className="h-3 w-3" />{shop.products?.length || 0} produits
                          </p>
                          {(shop as any).city && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{(shop as any).city}
                            </p>
                          )}
                          {(shop as any).category && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Tag className="h-3 w-3" />{(shop as any).category}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleShopClick(shop); }}
                      >
                        Visiter
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            )}
          </div>
        </motion.div>
      )}

      {/* Other Shops */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center gap-2">
          <StoreIcon className="h-5 w-5 text-emerald-600" />
          <h2 className="text-lg font-semibold">
            {recommended.length > 0 ? 'Autres boutiques' : 'Toutes les boutiques'}
          </h2>
          {others.length > 0 && (
            <Badge variant="outline" className="text-[10px]">{others.length}</Badge>
          )}
        </div>
        {loading ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                {viewMode === 'grid' ? (
                  <>
                    <Skeleton className="h-24 rounded-none" />
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/4" />
                          <Skeleton className="h-3 w-full" />
                        </div>
                      </div>
                    </CardContent>
                  </>
                ) : (
                  <CardContent className="p-4 flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-2/3" />
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        ) : others.length === 0 && recommended.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
              <StoreIcon className="h-10 w-10 text-emerald-300 dark:text-emerald-700" />
            </div>
            <p className="mt-4 text-lg font-medium text-muted-foreground">Aucune boutique trouvée</p>
            {search && (
              <Button
                variant="outline"
                className="mt-3 border-emerald-200 dark:border-emerald-800 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                onClick={() => setSearch('')}
              >
                Effacer la recherche
              </Button>
            )}
          </div>
        ) : others.length === 0 ? null : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
            {others.map((shop, index) =>
              viewMode === 'grid' ? (
                <motion.div key={shop.id} variants={itemVariants} custom={index}>
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all hover:border-emerald-200 dark:hover:border-emerald-800 overflow-hidden group"
                    onClick={() => handleShopClick(shop)}
                  >
                    <div className="h-24 bg-gradient-to-br from-muted to-muted/50 relative">
                      {shop.coverImage && (
                        <img src={shop.coverImage} alt={shop.name} className="w-full h-full object-cover" />
                      )}
                      {(shop as any).category && (
                        <Badge className="absolute top-2 left-2 bg-white/90 dark:bg-black/60 text-foreground border-0 text-[10px]">
                          <Tag className="h-2.5 w-2.5 mr-0.5" />
                          {(shop as any).category}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white shadow-sm border overflow-hidden shrink-0">
                          {shop.logo ? (
                            <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30">
                              <StoreIcon className="h-6 w-6 text-emerald-600" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold truncate group-hover:text-emerald-600 transition-colors">{shop.name}</h3>
                          {shop.description && (
                            <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{shop.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Package className="h-3 w-3" />{shop.products?.length || 0} produits
                            </p>
                            {(shop as any).city && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <MapPin className="h-3 w-3" />{(shop as any).city}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div key={shop.id} variants={itemVariants} custom={index}>
                  <Card
                    className="cursor-pointer hover:shadow-lg transition-all hover:border-emerald-200 dark:hover:border-emerald-800 overflow-hidden group"
                    onClick={() => handleShopClick(shop)}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="h-14 w-14 rounded-xl bg-white shadow-sm border overflow-hidden shrink-0">
                        {shop.logo ? (
                          <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30">
                            <StoreIcon className="h-6 w-6 text-emerald-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate group-hover:text-emerald-600 transition-colors">{shop.name}</h3>
                        {shop.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{shop.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Package className="h-3 w-3" />{shop.products?.length || 0} produits
                          </p>
                          {(shop as any).city && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <MapPin className="h-3 w-3" />{(shop as any).city}
                            </p>
                          )}
                          {(shop as any).category && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Tag className="h-3 w-3" />{(shop as any).category}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                        onClick={(e) => { e.stopPropagation(); handleShopClick(shop); }}
                      >
                        Visiter
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
