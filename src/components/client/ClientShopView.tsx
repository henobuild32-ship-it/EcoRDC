'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type Shop, type Product } from '@/lib/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Store as StoreIcon,
  ShoppingCart,
  MessageCircle,
  Star,
  Package,
  Share2,
  Heart,
  UserPlus,
  UserMinus,
  MapPin,
  Tag,
  Link2,
  Phone,
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

export default function ClientShopView() {
  const { selectedShop, token, setCurrentView, setSelectedShop, setChatPartner } = useAppStore();
  const [shop, setShop] = useState<Shop | null>(selectedShop);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(!selectedShop?.products);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [favoriteLoading, setFavoriteLoading] = useState<string | null>(null);
  const [shareNotification, setShareNotification] = useState(false);

  useEffect(() => {
    if (!selectedShop?.slug) return;

    const fetchShop = async () => {
      try {
        const res = await fetch(`/api/shops?slug=${selectedShop.slug}`);
        if (res.ok) {
          const data = await res.json();
          setShop(data.shop);
          setProducts(data.shop?.products || []);
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };

    if (!selectedShop.products || selectedShop.products.length === 0) {
      fetchShop();
    } else {
      setProducts(selectedShop.products);
      setLoading(false);
    }
  }, [selectedShop]);

  const fetchFollowAndFavorites = useCallback(async () => {
    if (!token || !shop) return;
    try {
      const followRes = await fetch('/api/followed-shops', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (followRes.ok) {
        const data = await followRes.json();
        const isShopFollowed = (data.followedShops || []).some(
          (fs: { shopId: string }) => fs.shopId === shop.id
        );
        setIsFollowing(isShopFollowed);
      }

      const favRes = await fetch('/api/favorites', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (favRes.ok) {
        const data = await favRes.json();
        const favSet = new Set<string>(
          (data.favorites || []).map((f: { productId: string }) => f.productId)
        );
        setFavoriteIds(favSet);
      }
    } catch {
      // silently handle
    }
  }, [token, shop]);

  useEffect(() => {
    if (shop && token) {
      fetchFollowAndFavorites();
    }
  }, [shop, token, fetchFollowAndFavorites]);

  const handleAddToCart = async (product: Product) => {
    if (!token) return;
    setAddingToCart(product.id);
    try {
      await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: product.id, quantity: 1 }),
      });
    } catch {
      // silently handle
    } finally {
      setAddingToCart(null);
    }
  };

  const handleContactVendor = () => {
    if (shop?.owner) {
      setChatPartner({
        id: shop.owner.id,
        name: shop.owner.name,
        email: shop.owner.email,
        isActive: true,
        createdAt: '',
      });
      setCurrentView('client-messages');
    }
  };

  const handleToggleFollow = async () => {
    if (!token || !shop) return;
    setFollowLoading(true);
    try {
      if (isFollowing) {
        const res = await fetch(`/api/followed-shops?shopId=${shop.id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setIsFollowing(false);
      } else {
        const res = await fetch('/api/followed-shops', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ shopId: shop.id }),
        });
        if (res.ok) setIsFollowing(true);
      }
    } catch {
      // silently handle
    } finally {
      setFollowLoading(false);
    }
  };

  const handleToggleFavorite = async (productId: string) => {
    if (!token) return;
    setFavoriteLoading(productId);
    try {
      if (favoriteIds.has(productId)) {
        const res = await fetch(`/api/favorites?productId=${productId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            next.delete(productId);
            return next;
          });
        }
      } else {
        const res = await fetch('/api/favorites', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ productId }),
        });
        if (res.ok) {
          setFavoriteIds((prev) => new Set(prev).add(productId));
        }
      }
    } catch {
      // silently handle
    } finally {
      setFavoriteLoading(null);
    }
  };

  const handleShare = () => {
    const shopUrl = `${window.location.origin}/shop/${shop?.slug}`;
    const shareText = `Découvrez ${shop?.name} sur EcoRDC ! ${shopUrl}`;
    if (navigator.share) {
      navigator.share({ title: shop?.name, text: shareText, url: shopUrl }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(shopUrl);
      setShareNotification(true);
      setTimeout(() => setShareNotification(false), 2000);
    }
  };

  if (!shop) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 text-center">
        <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
          <StoreIcon className="h-10 w-10 text-emerald-300 dark:text-emerald-700" />
        </div>
        <p className="mt-4 text-lg font-medium text-muted-foreground">Boutique non trouvée</p>
        <Button
          className="mt-4 bg-emerald-600 hover:bg-emerald-700"
          onClick={() => setCurrentView('client-shop')}
        >
          Retour aux boutiques
        </Button>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* Back Button */}
      <motion.div variants={itemVariants}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCurrentView('client-shop')}
          className="text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux boutiques
        </Button>
      </motion.div>

      {/* Shop Header Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden border-0 shadow-xl">
          <div className="h-44 sm:h-60 bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 relative">
            {shop.coverImage && (
              <img src={shop.coverImage} alt={shop.name} className="w-full h-full object-cover" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            
            {/* Top badges */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {shop.isRecommended && (
                  <Badge className="bg-emerald-500 text-white border-0 badge-shimmer shadow-lg">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Recommandée
                  </Badge>
                )}
                {(shop as any).category && (
                  <Badge className="bg-white/90 dark:bg-black/60 text-foreground border-0 shadow-lg">
                    <Tag className="h-3 w-3 mr-1" />
                    {(shop as any).category}
                  </Badge>
                )}
              </div>
            </div>
            
            {/* Bottom info overlay */}
            <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
              <div className="h-18 w-18 sm:h-22 sm:w-22 rounded-2xl bg-white shadow-xl border-3 border-white overflow-hidden shrink-0" style={{ height: '72px', width: '72px' }}>
                {shop.logo ? (
                  <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-emerald-50">
                    <StoreIcon className="h-8 w-8 text-emerald-600" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold text-white truncate">{shop.name}</h1>
                {shop.description && (
                  <p className="text-white/80 text-sm line-clamp-2 mt-0.5">{shop.description}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5">
                  <p className="text-white/60 text-xs flex items-center gap-1">
                    <Link2 className="h-3 w-3" />
                    eco-rdc.vercel.app/shop/{shop.slug}
                  </p>
                  {(shop as any).city && (
                    <p className="text-white/60 text-xs flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {(shop as any).city}
                    </p>
                  )}
                  <p className="text-white/60 text-xs flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    {products.length} produits
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2 border-t">
            <div className="flex items-center gap-2">
              {token && (
                <Button
                  onClick={handleToggleFollow}
                  variant={isFollowing ? 'outline' : 'default'}
                  size="sm"
                  disabled={followLoading}
                  className={
                    isFollowing
                      ? 'border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }
                >
                  {followLoading ? (
                    <span className="h-3 w-3 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                  ) : isFollowing ? (
                    <UserMinus className="mr-2 h-4 w-4" />
                  ) : (
                    <UserPlus className="mr-2 h-4 w-4" />
                  )}
                  {isFollowing ? 'Ne plus suivre' : 'Suivre cette boutique'}
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                onClick={handleShare}
                variant="outline"
                size="sm"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Partager
              </Button>
              <Button
                onClick={handleContactVendor}
                variant="outline"
                size="sm"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Contacter le vendeur
              </Button>
            </div>
          </CardContent>

          {/* Share notification toast */}
          {shareNotification && (
            <div className="absolute top-4 right-4 bg-emerald-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50 animate-pulse">
              Lien copié !
            </div>
          )}
        </Card>
      </motion.div>

      {/* Products Grid */}
      <motion.div variants={itemVariants} className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-emerald-600" />
            Produits
          </h2>
          <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800">
            {products.length} produit{products.length !== 1 ? 's' : ''}
          </Badge>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <Skeleton className="h-40 rounded-none" />
                <CardContent className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-9 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <div className="h-20 w-20 rounded-full bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center mx-auto">
              <Package className="h-10 w-10 text-emerald-300 dark:text-emerald-700" />
            </div>
            <p className="mt-4 text-lg font-medium text-muted-foreground">Aucun produit disponible</p>
            <p className="text-sm text-muted-foreground mt-1">Cette boutique n&apos;a pas encore ajouté de produits</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => {
              const images = product.images ? product.images.split(',').filter(Boolean) : [];
              const isFav = favoriteIds.has(product.id);
              return (
                <motion.div key={product.id} variants={itemVariants}>
                  <Card className="overflow-hidden hover:shadow-lg transition-all group border-0 shadow-sm">
                    <div className="aspect-square bg-muted relative overflow-hidden">
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
                      {product.stock <= 5 && product.stock > 0 && (
                        <Badge className="absolute top-2 right-2 bg-orange-500 text-white border-0 text-[10px]">
                          Stock limité
                        </Badge>
                      )}
                      {product.stock === 0 && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <Badge className="bg-red-600 text-white border-0">Rupture de stock</Badge>
                        </div>
                      )}
                      {token && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(product.id);
                          }}
                          disabled={favoriteLoading === product.id}
                          className="absolute top-2 left-2 h-8 w-8 rounded-full bg-white/90 dark:bg-black/60 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
                        >
                          {favoriteLoading === product.id ? (
                            <span className="h-3.5 w-3.5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                          ) : (
                            <Heart
                              className={`h-4 w-4 transition-colors ${
                                isFav
                                  ? 'text-red-500 fill-red-500'
                                  : 'text-muted-foreground hover:text-red-400'
                              }`}
                            />
                          )}
                        </button>
                      )}
                      {product.category && (
                        <Badge className="absolute bottom-2 left-2 bg-white/90 dark:bg-black/60 text-foreground border-0 text-[10px]">
                          {product.category}
                        </Badge>
                      )}
                    </div>
                    <CardContent className="p-3 space-y-2">
                      <h3 className="font-medium text-sm line-clamp-2 leading-tight min-h-[2.5rem]">
                        {product.name}
                      </h3>
                      <p className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {product.price.toLocaleString('fr-FR')} CDF
                      </p>
                      <Button
                        size="sm"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-xs"
                        disabled={product.stock === 0 || addingToCart === product.id}
                        onClick={() => handleAddToCart(product)}
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
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
