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
  QrCode,
  Bell,
} from 'lucide-react';
import ShopQRModal from '@/components/vendor/ShopQRModal';

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
  socials: string | null;
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
  stock?: number;
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
  const [qrModalOpen, setQrModalOpen] = useState(false);

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

              {/* Socials */}
              {(() => {
                let socialsData: { tiktok?: string; instagram?: string; whatsapp?: string } = {};
                try { socialsData = JSON.parse(shop.socials || '{}'); } catch {}
                const hasSocial = socialsData.tiktok || socialsData.instagram || socialsData.whatsapp;
                if (!hasSocial) return null;
                const linkify = (v: string) => v.startsWith('http') ? v : `https://${v}`;
                const formatTikTok = (v: string) => v.includes('tiktok.com') || v.startsWith('http') ? v : `https://tiktok.com/@${v.replace('@','')}`;
                const formatIg = (v: string) => v.includes('instagram.com') || v.startsWith('http') ? v : `https://instagram.com/${v.replace('@','')}`;
                const formatWa = (v: string) => {
                  const digits = v.replace(/[^0-9]/g, '');
                  return digits ? `https://wa.me/${digits}` : v;
                };
                return (
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    {socialsData.tiktok && (
                      <a href={formatTikTok(socialsData.tiktok)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors" title="TikTok">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.9 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.6 0 1.15.18 1.62.5V10.3a6.34 6.34 0 0 0-1.62-.23 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.35 6.34 6.34 0 0 0 6.34-6.35V8.75a8.24 8.24 0 0 0 4.77 1.5v-3.4a4.85 4.85 0 0 1-1.12-.16z"/></svg>
                        <span className="truncate max-w-[120px]">{socialsData.tiktok.replace('https://','').replace('tiktok.com/@','').replace(/\/$/,'')}</span>
                      </a>
                    )}
                    {socialsData.instagram && (
                      <a href={formatIg(socialsData.instagram)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors" title="Instagram">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                        <span className="truncate max-w-[120px]">{socialsData.instagram.replace('https://','').replace('instagram.com/','').replace(/\/$/,'')}</span>
                      </a>
                    )}
                    {socialsData.whatsapp && (
                      <a href={formatWa(socialsData.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-white/70 hover:text-white transition-colors" title="WhatsApp">
                        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                        <span className="truncate max-w-[120px]">{socialsData.whatsapp.replace(/[^0-9]/g,'').replace(/^(\+?)/,'+')}</span>
                      </a>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Actions */}
            <div className="flex gap-2 shrink-0 w-full md:w-auto flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setQrModalOpen(true)}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20 flex-1 md:flex-none"
              >
                <QrCode className="h-4 w-4 mr-1" />
                QR Code
              </Button>
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
            {shop.products.map((product) => {
              const isOutOfStock = product.stock === 0;
              return (
                <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow relative">
                  <div className="relative">
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
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1.5 p-2">
                        <Badge className="bg-red-600 text-white border-0 shadow-lg text-xs">
                          Rupture de stock
                        </Badge>
                        <p className="text-[10px] text-white/80 text-center">Commandes suspendues</p>
                      </div>
                    )}
                  </div>
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
                      {isOutOfStock ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowContactModal(true)}
                          className="h-8 text-xs border-amber-300 text-amber-700 bg-amber-50"
                        >
                          <Bell className="h-3 w-3 mr-1" />
                          Notifier
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setShowContactModal(true)}
                          className="h-8 text-xs"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Commander
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
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

      {/* QR Code Modal */}
      <ShopQRModal
        open={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        shopSlug={shop.slug || shop.id}
        shopName={shop.name}
      />
    </div>
  );
}
