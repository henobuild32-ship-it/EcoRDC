'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type FollowedShop } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Store as StoreIcon,
  Star,
  UserMinus,
  Package,
  MapPin,
  Tag,
  ExternalLink,
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
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] } },
};

export default function ClientFollowedShops() {
  const { token, setCurrentView, setSelectedShop } = useAppStore();
  const [followedShops, setFollowedShops] = useState<FollowedShop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchFollowedShops = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/followed-shops', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setFollowedShops(data.followedShops || []);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchFollowedShops();
  }, [fetchFollowedShops]);

  const handleUnfollow = async (shopId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/followed-shops?shopId=${shopId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFollowedShops((prev) => prev.filter((f) => f.shopId !== shopId));
      }
    } catch {
      // silently handle
    }
  };

  const handleViewShop = (shop: any) => {
    setSelectedShop(shop);
    setCurrentView('client-product');
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
          <h1 className="text-2xl font-bold">Boutiques suivies</h1>
          <p className="text-sm text-muted-foreground">
            {followedShops.length} boutique{followedShops.length !== 1 ? 's' : ''} suivie{followedShops.length !== 1 ? 's' : ''}
          </p>
        </div>
      </motion.div>

      {/* Followed Shops List */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-24 w-full rounded-lg" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : followedShops.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="border-dashed border-2 border-emerald-200 dark:border-emerald-800">
            <CardContent className="py-20 text-center">
              <div className="h-24 w-24 rounded-full bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center mx-auto">
                <StoreIcon className="h-12 w-12 text-amber-300 dark:text-amber-700" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">Aucune boutique suivie</h3>
              <p className="text-muted-foreground mt-2 max-w-sm mx-auto">
                Suivez vos boutiques préférées pour ne rien manquer de leurs nouveaux produits
              </p>
              <Button
                className="mt-6 bg-emerald-600 hover:bg-emerald-700"
                onClick={() => setCurrentView('client-shop')}
              >
                <StoreIcon className="mr-2 h-4 w-4" />
                Parcourir les boutiques
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {followedShops.map((followed) => {
            const shop = followed.shop;
            if (!shop) return null;
            const productCount = (shop as any)._count?.products ?? shop.products?.length ?? 0;

            return (
              <motion.div key={followed.id} variants={itemVariants}>
                <Card className="overflow-hidden hover:shadow-lg transition-all group border-0 shadow-sm">
                  <div className="h-28 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-500 relative overflow-hidden">
                    {shop.coverImage && (
                      <img
                        src={shop.coverImage}
                        alt={shop.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                    {shop.isRecommended && (
                      <Badge className="absolute top-2 right-2 bg-emerald-500 text-white border-0 badge-shimmer">
                        <Star className="h-3 w-3 mr-1 fill-current" />
                        Recommandée
                      </Badge>
                    )}
                    {(shop as any).category && (
                      <Badge className="absolute top-2 left-2 bg-white/90 dark:bg-black/60 text-foreground border-0 text-[10px]">
                        <Tag className="h-2.5 w-2.5 mr-0.5" />
                        {(shop as any).category}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-xl bg-white shadow-sm border overflow-hidden shrink-0">
                        {shop.logo ? (
                          <img
                            src={shop.logo}
                            alt={shop.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30">
                            <StoreIcon className="h-5 w-5 text-emerald-600" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold truncate group-hover:text-emerald-600 transition-colors">{shop.name}</h3>
                        {shop.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{shop.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-1">
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Package className="h-3 w-3" />
                            {productCount} produit{productCount !== 1 ? 's' : ''}
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
                    <div className="flex gap-2 pt-3 border-t">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-xs"
                        onClick={() => handleViewShop(shop)}
                      >
                        <ExternalLink className="mr-1 h-3 w-3" />
                        Voir la boutique
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800 text-xs"
                        onClick={() => handleUnfollow(shop.id)}
                      >
                        <UserMinus className="mr-1 h-3 w-3" />
                        Ne plus suivre
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
