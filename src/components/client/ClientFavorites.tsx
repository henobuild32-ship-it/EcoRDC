'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type Favorite } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Heart,
  Trash2,
  Package,
  ShoppingCart,
  Store,
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

export default function ClientFavorites() {
  const { token, setCurrentView, setSelectedShop } = useAppStore();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);

  const fetchFavorites = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFavorites(data.favorites || []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const handleRemoveFavorite = async (productId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/favorites?productId=${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFavorites((prev) => prev.filter((f) => f.productId !== productId));
      }
    } catch {
      // silently handle
    }
  };

  const handleAddToCart = async (productId: string) => {
    if (!token) return;
    setAddingToCart(productId);
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId, quantity: 1 }),
      });
    } catch {
      // silently handle
    } finally {
      setAddingToCart(null);
    }
  };

  const handleViewShop = (shop: any) => {
    if (shop) {
      setSelectedShop(shop);
      setCurrentView('client-product');
    }
  };

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
          <h1 className="text-2xl font-bold">Mes Favoris</h1>
          <p className="text-sm text-muted-foreground">
            {favorites.length} produit{favorites.length !== 1 ? 's' : ''} favori{favorites.length !== 1 ? 's' : ''}
          </p>
        </div>
      </motion.div>

      {/* Favorites List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-36 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-9 flex-1" />
                  <Skeleton className="h-9 w-9" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : favorites.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed border-2 border-emerald-200 dark:border-emerald-800">
            <CardContent className="py-20 text-center">
              <div className="h-24 w-24 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto">
                <Heart className="h-12 w-12 text-rose-300 dark:text-rose-700" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Aucun favori</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Ajoutez des produits à vos favoris en cliquant sur le cœur lors de votre navigation
              </p>
              <Button
                className="mt-6 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setCurrentView('client-shop')}
              >
                <Store className="mr-2 h-4 w-4" />
                Parcourir les boutiques
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {favorites.map((favorite) => {
            const product = favorite.product;
            if (!product) return null;
            const images = product.images
              ? (product.images as string).split(',').filter(Boolean)
              : [];

            return (
              <motion.div key={favorite.id} variants={itemVariants}>
                <Card className="overflow-hidden hover:shadow-lg transition-all group border-0 shadow-sm">
                  <div className="aspect-video bg-muted relative overflow-hidden">
                    {images[0] ? (
                      <img
                        src={images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/10 dark:to-green-900/10">
                        <Package className="h-12 w-12 text-emerald-200 dark:text-emerald-800" />
                      </div>
                    )}
                    <button
                      onClick={() => handleRemoveFavorite(product.id)}
                      className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 dark:bg-black/60 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                    >
                      <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                    </button>
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Badge className="bg-red-600 text-white border-0">Rupture de stock</Badge>
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h3 className="font-semibold truncate">{product.name}</h3>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold text-lg mt-1">
                        {product.price.toLocaleString('fr-FR')} CDF
                      </p>
                      {product.shop && (
                        <button
                          onClick={() => handleViewShop(product.shop)}
                          className="text-xs text-muted-foreground hover:text-emerald-600 transition-colors mt-1 flex items-center gap-1"
                        >
                          <Store className="h-3 w-3" />
                          {product.shop.name}
                        </button>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                        disabled={product.stock === 0 || addingToCart === product.id}
                        onClick={() => handleAddToCart(product.id)}
                      >
                        {addingToCart === product.id ? (
                          <span className="flex items-center gap-1">
                            <span className="h-3 w-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Ajout...
                          </span>
                        ) : (
                          <>
                            <ShoppingCart className="mr-1 h-3 w-3" />
                            Ajouter au panier
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
                        onClick={() => handleRemoveFavorite(product.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
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
