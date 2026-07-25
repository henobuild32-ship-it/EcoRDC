'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type Product } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  Plus,
  Package,
  Edit,
  Trash2,
  Search,
  Filter,
  LayoutGrid,
  List,
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

const categories = [
  'Toutes',
  'Électronique',
  'Mode & Vêtements',
  'Alimentation',
  'Maison & Déco',
  'Beauté & Santé',
  'Sports & Loisirs',
  'Livres & Médias',
  'Autres',
];

function getStockBadge(stock: number) {
  if (stock === 0)
    return <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-0 text-[10px]">Rupture</Badge>;
  if (stock <= 5)
    return <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0 text-[10px]">Stock faible</Badge>;
  return <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0 text-[10px]">En stock</Badge>;
}

export default function VendorProducts() {
  const { token, setCurrentView, setSelectedProduct } = useAppStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Toutes');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleToggleActive = async (product: Product) => {
    if (!token) return;
    setTogglingId(product.id);
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          productId: product.id,
          isActive: !product.isActive,
        }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) =>
            p.id === product.id ? { ...p, isActive: !p.isActive } : p
          )
        );
      }
    } catch {
      // silently handle
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/products?id=${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch {
      // silently handle
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setCurrentView('vendor-edit-product');
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = categoryFilter === 'Toutes' || p.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, categoryFilter]);

  // Stats
  const totalProducts = products.length;
  const activeProducts = products.filter(p => p.isActive).length;
  const outOfStock = products.filter(p => p.stock === 0).length;
  const lowStock = products.filter(p => p.stock > 0 && p.stock <= 5).length;

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
          onClick={() => setCurrentView('vendor-dashboard')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Mes Produits</h1>
          <p className="text-sm text-muted-foreground">
            {products.length} produit{products.length !== 1 ? 's' : ''} · {activeProducts} actif{activeProducts !== 1 ? 's' : ''}
          </p>
        </div>
        <Button
          className="bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setCurrentView('vendor-add-product')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </motion.div>

      {/* Stats summary */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-lg font-bold">{totalProducts}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Actifs</p>
            <p className="text-lg font-bold text-green-600">{activeProducts}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-amber-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Stock faible</p>
            <p className="text-lg font-bold text-amber-600">{lowStock}</p>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-red-500">
          <CardContent className="p-3">
            <p className="text-xs text-muted-foreground">Rupture</p>
            <p className="text-lg font-bold text-red-600">{outOfStock}</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un produit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground shrink-0" />
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-lg overflow-hidden">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="icon"
              className={`h-9 w-9 rounded-none ${viewMode === 'grid' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="icon"
              className={`h-9 w-9 rounded-none ${viewMode === 'list' ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : ''}`}
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Products */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-32 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed">
            <CardContent className="py-16 text-center">
              <div className="h-24 w-24 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
                <Package className="h-12 w-12 text-emerald-300 dark:text-emerald-700" />
              </div>
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                {search || categoryFilter !== 'Toutes' ? 'Aucun produit trouvé' : 'Aucun produit'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                {search || categoryFilter !== 'Toutes'
                  ? 'Essayez un autre filtre ou terme de recherche'
                  : 'Ajoutez votre premier produit pour commencer à vendre'}
              </p>
              {!search && categoryFilter === 'Toutes' && (
                <Button
                  className="mt-6 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setCurrentView('vendor-add-product')}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter un produit
                </Button>
              )}
            </CardContent>
          </Card>
        </motion.div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => {
            const images = product.images
              ? (product.images as string).split(',').filter(Boolean)
              : [];
            return (
              <motion.div key={product.id} variants={itemVariants}>
                <Card className="overflow-hidden group hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {images[0] ? (
                      <img
                        src={images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground/20" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex flex-col gap-1">
                      <Badge
                        className={`text-[10px] border-0 ${
                          product.isActive
                            ? 'bg-emerald-500 text-white'
                            : 'bg-gray-500 text-white'
                        }`}
                      >
                        {product.isActive ? 'Actif' : 'Inactif'}
                      </Badge>
                    </div>
                    <div className="absolute top-2 left-2">
                      {getStockBadge(product.stock)}
                    </div>
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg">
                          {product.price.toLocaleString('fr-FR')} CDF
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Stock: {product.stock}
                        </p>
                      </div>
                      {product.category && (
                        <Badge variant="secondary" className="mt-1.5 text-[10px]">
                          {product.category}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => handleToggleActive(product)}
                          disabled={togglingId === product.id}
                        />
                        <span className="text-xs text-muted-foreground">
                          {product.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEdit(product)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      ) : (
        /* List view */
        <div className="space-y-3">
          {filteredProducts.map((product) => {
            const images = product.images
              ? (product.images as string).split(',').filter(Boolean)
              : [];
            return (
              <motion.div key={product.id} variants={itemVariants}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-lg bg-muted overflow-hidden shrink-0">
                        {images[0] ? (
                          <img src={images[0]} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground/30" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-semibold text-sm truncate">{product.name}</h3>
                          {product.category && (
                            <Badge variant="secondary" className="text-[10px]">{product.category}</Badge>
                          )}
                          {getStockBadge(product.stock)}
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                            {product.price.toLocaleString('fr-FR')} CDF
                          </p>
                          <p className="text-xs text-muted-foreground">Stock: {product.stock}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Switch
                          checked={product.isActive}
                          onCheckedChange={() => handleToggleActive(product)}
                          disabled={togglingId === product.id}
                        />
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(product)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          onClick={() => handleDelete(product.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
