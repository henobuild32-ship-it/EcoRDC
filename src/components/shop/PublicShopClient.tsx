'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Store as StoreIcon,
  MapPin,
  MessageCircle,
  Package,
  Phone,
  Share2,
  Star,
  User,
  Lock,
} from 'lucide-react';

interface ShopData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  coverImage: string | null;
  category: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  isRecommended: boolean;
  isActive: boolean;
  createdAt: string;
  owner: { id: string; name: string; email: string; phone: string | null };
  products: ProductData[];
  _count: { products: number; followers: number };
}

interface ProductData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  image: string | null;
  category: string | null;
  isActive: boolean;
  createdAt: string;
}

const formatPrice = (price: number) => {
  try {
    return new Intl.NumberFormat('fr-CD', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price) + ' FC';
  } catch {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FC';
  }
};

export function PublicShopClient({ shop }: { shop: ShopData }) {
  const [showContactModal, setShowContactModal] = useState(false);
  const [logoError, setLogoError] = useState(false);
  const [productImgErrors, setProductImgErrors] = useState<Set<string>>(new Set());

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: shop.name, url });
      } else if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
    } catch {
      // Silent fail on mobile share cancel
    }
  };

  const handleProductImgError = (id: string) => {
    setProductImgErrors((prev) => new Set(prev).add(id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30">
      {/* Header */}
      <div className="relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            {/* Logo */}
            <div className="shrink-0">
              {shop.logo && !logoError ? (
                <img
                  src={shop.logo}
                  alt={shop.name}
                  onError={() => setLogoError(true)}
                  className="w-20 h-20 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-white/20 shadow-lg"
                />
              ) : (
                <div className="w-20 h-20 md:w-28 md:h-28 rounded-2xl bg-white/20 flex items-center justify-center border-4 border-white/20">
                  <StoreIcon className="h-10 w-10 md:h-14 md:w-14" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl md:text-3xl font-bold truncate">{shop.name}</h1>
                {shop.isRecommended && (
                  <Badge className="bg-yellow-400 text-yellow-900 border-0 shrink-0">
                    <Star className="h-3 w-3 mr-1" /> Recommandée
                  </Badge>
                )}
              </div>

              {shop.description && (
                <p className="text-white/80 text-sm md:text-base mb-3 max-w-xl line-clamp-3">
                  {shop.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3 text-sm text-white/70">
                {shop.category && (
                  <Badge variant="outline" className="border-white/30 text-white">
                    {shop.category}
                  </Badge>
                )}
                {(shop.city || shop.country) && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span className="truncate">{shop.city || shop.country}</span>
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Package className="h-3.5 w-3.5 shrink-0" />
                  {shop._count.products} produit{shop._count.products !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0 w-full md:w-auto">
              <Button
                variant="outline"
                size="sm"
                onClick={handleShare}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 md:flex-none"
              >
                <Share2 className="h-4 w-4 mr-1" />
                Partager
              </Button>
              <Button
                size="sm"
                onClick={() => setShowContactModal(true)}
                className="bg-white text-emerald-600 hover:bg-white/90 flex-1 md:flex-none"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Contacter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Package className="h-5 w-5 text-emerald-500" />
          Produits ({shop.products.length})
        </h2>

        {shop.products.length === 0 ? (
          <Card className="p-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">Aucun produit pour le moment</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shop.products.map((product) => (
              <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {product.image && !productImgErrors.has(product.id) ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    onError={() => handleProductImgError(product.id)}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center">
                    <Package className="h-12 w-12 text-emerald-300" />
                  </div>
                )}
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                    {product.category && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        {product.category}
                      </Badge>
                    )}
                  </div>
                  {product.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                      {formatPrice(product.price)}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowContactModal(true)}
                      className="h-8 text-xs"
                    >
                      <MessageCircle className="h-3 w-3 mr-1" />
                      Commander
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowContactModal(false)}>
          <Card className="max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-center mb-6">
              <div className="h-14 w-14 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-3">
                <MessageCircle className="h-7 w-7 text-emerald-500" />
              </div>
              <h3 className="text-lg font-bold">Contacter {shop.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Pour envoyer un message au vendeur, connectez-vous ou créez un compte client gratuit.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                onClick={() => {
                  window.location.href = '/?contact=' + shop.owner.id;
                }}
              >
                <User className="h-4 w-4 mr-2" />
                Se connecter
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  window.location.href = '/?register-client=1&contact=' + shop.owner.id;
                }}
              >
                <Lock className="h-4 w-4 mr-2" />
                Créer un compte gratuit
              </Button>
            </div>

            {shop.owner.phone && (
              <div className="mt-4 pt-4 border-t text-center">
                <p className="text-xs text-muted-foreground mb-2">Ou appelez directement</p>
                <a
                  href={`tel:${shop.owner.phone}`}
                  className="inline-flex items-center gap-1 text-sm text-emerald-600 hover:underline"
                >
                  <Phone className="h-3.5 w-3.5" />
                  {shop.owner.phone}
                </a>
              </div>
            )}

            <Button
              variant="ghost"
              className="w-full mt-3 text-muted-foreground"
              onClick={() => setShowContactModal(false)}
            >
              Fermer
            </Button>
          </Card>
        </div>
      )}

      {/* Footer */}
      <div className="text-center py-6 text-xs text-muted-foreground border-t">
        Boutique hébergée sur EcoRDC &copy; 2026
      </div>
    </div>
  );
}
