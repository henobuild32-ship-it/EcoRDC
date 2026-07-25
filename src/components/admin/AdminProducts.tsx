'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Package, Search, Filter, Trash2, EyeOff, Eye, ShoppingCart,
  Image as ImageIcon,
} from 'lucide-react';

interface ProductItem {
  id: string;
  name: string;
  description?: string;
  price: number;
  images: string;
  category?: string;
  stock: number;
  isActive: boolean;
  createdAt: string;
  shop: { id: string; name: string; logo?: string; slug?: string; city?: string };
  shopId: string;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AdminProducts() {
  const { token } = useAppStore();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [deleteTarget, setDeleteTarget] = useState<ProductItem | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchProducts = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });
      if (search) params.set('search', search);
      if (categoryFilter !== 'ALL') params.set('category', categoryFilter);

      // Admin fetches all products (no shopId filter)
      const res = await fetch(`/api/products?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch {
      // silently handle
    }
  }, [token, page, search, categoryFilter]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await fetchProducts();
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [fetchProducts]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchProducts();
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  const categories = useMemo(() => {
    const cats = new Set(products.map(p => p.category).filter(Boolean));
    return Array.from(cats) as string[];
  }, [products]);

  const filtered = useMemo(() => {
    if (categoryFilter === 'ALL') return products;
    return products.filter(p => p.category === categoryFilter);
  }, [products, categoryFilter]);

  const activeCount = filtered.filter(p => p.isActive).length;
  const hiddenCount = filtered.filter(p => !p.isActive).length;

  const handleDelete = async () => {
    if (!deleteTarget || !token) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/products?id=${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setProducts(prev => prev.filter(p => p.id !== deleteTarget.id));
        setDeleteTarget(null);
      }
    } catch {
      // silently handle
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleVisibility = async (product: ProductItem) => {
    if (!token) return;
    setToggling(product.id);
    try {
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: product.id, isActive: !product.isActive }),
      });
      if (res.ok) {
        setProducts(prev =>
          prev.map(p => p.id === product.id ? { ...p, isActive: !p.isActive } : p)
        );
      }
    } catch {
      // silently handle
    } finally {
      setToggling(null);
    }
  };

  const formatPrice = (price: number) =>
    new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(price);

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <AdminSidebar>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <Package className="h-7 w-7 text-blue-400" />
                Gestion des Produits
              </h1>
              <p className="text-slate-400 text-sm mt-1">{total} produit(s) au total</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Row */}
        <motion.div variants={item} className="grid grid-cols-3 gap-3">
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shrink-0">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Total</p>
                <p className="text-xl font-bold text-white">{filtered.length}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center text-white shrink-0">
                <Eye className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Actifs</p>
                <p className="text-xl font-bold text-green-400">{activeCount}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shrink-0">
                <EyeOff className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Masqués</p>
                <p className="text-xl font-bold text-amber-400">{hiddenCount}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Search & Filter */}
        <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Rechercher un produit..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-48 bg-[#1e293b] border-slate-700 text-white">
              <Filter className="h-4 w-4 mr-2 text-slate-500" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Toutes les catégories</SelectItem>
              {categories.map(cat => (
                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </motion.div>

        {/* Products Table */}
        <motion.div variants={item}>
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700/50 hover:bg-transparent">
                      <TableHead className="text-slate-400">Image</TableHead>
                      <TableHead className="text-slate-400">Produit</TableHead>
                      <TableHead className="hidden sm:table-cell text-slate-400">Vendeur</TableHead>
                      <TableHead className="hidden md:table-cell text-slate-400">Boutique</TableHead>
                      <TableHead className="text-slate-400">Prix</TableHead>
                      <TableHead className="hidden lg:table-cell text-slate-400">Catégorie</TableHead>
                      <TableHead className="hidden lg:table-cell text-slate-400">Date</TableHead>
                      <TableHead className="text-slate-400">Statut</TableHead>
                      <TableHead className="text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i} className="border-slate-700/30">
                          {Array.from({ length: 9 }).map((_, j) => (
                            <TableCell key={j}>
                              <div className="h-4 bg-slate-700 animate-pulse rounded w-16" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filtered.length === 0 ? (
                      <TableRow className="border-slate-700/30">
                        <TableCell colSpan={9} className="text-center py-16">
                          <Package className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-500 text-lg font-medium">Aucun produit trouvé</p>
                          <p className="text-slate-600 text-sm mt-1">Les produits apparaîtront ici quand les vendeurs en ajouteront</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map(product => (
                        <TableRow key={product.id} className="border-slate-700/30 hover:bg-slate-800/50">
                          <TableCell>
                            {product.images ? (
                              <img
                                src={product.images.split(',')[0]}
                                alt={product.name}
                                className="h-10 w-10 rounded-lg object-cover border border-slate-700"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-lg bg-slate-700 flex items-center justify-center">
                                <ImageIcon className="h-4 w-4 text-slate-500" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <p className="text-sm font-medium text-white truncate max-w-[180px]">{product.name}</p>
                            <p className="text-xs text-slate-500">Stock: {product.stock}</p>
                          </TableCell>
                          <TableCell className="hidden sm:table-cell">
                            <p className="text-sm text-slate-300 truncate max-w-[120px]">—</p>
                          </TableCell>
                          <TableCell className="hidden md:table-cell">
                            <div className="flex items-center gap-1.5">
                              {product.shop?.logo ? (
                                <img src={product.shop.logo} alt="" className="h-5 w-5 rounded object-cover" />
                              ) : (
                                <div className="h-5 w-5 rounded bg-slate-700 flex items-center justify-center">
                                  <ShoppingCart className="h-3 w-3 text-slate-500" />
                                </div>
                              )}
                              <span className="text-sm text-slate-300 truncate max-w-[100px]">{product.shop?.name || '—'}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-medium text-white">{formatPrice(product.price)}</TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {product.category ? (
                              <Badge className="bg-blue-500/20 text-blue-400 border-0 text-[10px]">{product.category}</Badge>
                            ) : (
                              <span className="text-slate-600 text-xs">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-slate-500">{formatDate(product.createdAt)}</TableCell>
                          <TableCell>
                            {product.isActive ? (
                              <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px]">Actif</Badge>
                            ) : (
                              <Badge className="bg-amber-500/20 text-amber-400 border-0 text-[10px]">Masqué</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-blue-400 hover:bg-blue-500/10"
                                onClick={() => handleToggleVisibility(product)}
                                disabled={toggling === product.id}
                                title={product.isActive ? 'Masquer' : 'Afficher'}
                              >
                                {toggling === product.id ? (
                                  <div className="h-4 w-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                                ) : product.isActive ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                                onClick={() => setDeleteTarget(product)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pagination */}
        {totalPages > 1 && (
          <motion.div variants={item} className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
            >
              Précédent
            </Button>
            <span className="text-sm text-slate-400">
              Page {page} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              className="border-slate-700 text-slate-400 hover:text-white hover:bg-slate-800"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Suivant
            </Button>
          </motion.div>
        )}
      </motion.div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[#1e293b] border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Supprimer le produit</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Êtes-vous sûr de vouloir supprimer <span className="text-white font-medium">{deleteTarget?.name}</span> ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-700 text-slate-300 hover:bg-slate-800">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Suppression...' : 'Supprimer'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminSidebar>
  );
}
