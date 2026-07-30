'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RestockSubscribeButton } from '@/components/client/RestockSubscribeButton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Heart,
  Share2,
  Copy,
  Check,
  ShoppingCart,
  Zap,
  Flag,
  Minus,
  Plus,
  Star,
  Store,
  MapPin,
  Package,
  Clock,
  Truck,
  Shield,
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
  MessageCircle,
  ThumbsUp,
  Camera,
  Award,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Image,
  Scale,
  Ruler,
  Weight,
  Globe,
  Calendar,
  BarChart3,
} from 'lucide-react';

interface ProductDetailData {
  id: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  compareAtPrice: number | null;
  sku: string | null;
  category: string | null;
  subcategory: string | null;
  brand: string | null;
  images: string;
  video: string | null;
  stock: number;
  soldCount: number;
  restockDate: string | null;
  weight: number | null;
  weightUnit: string | null;
  dimensions: string | null;
  material: string | null;
  origin: string | null;
  isActive: boolean;
  shopId: string;
  createdAt: string;
  promotion?: { discount: number; endDate: string } | null;
  shop: {
    id: string;
    name: string;
    logo: string | null;
    city: string | null;
    province: string | null;
    badges: string;
    avgRating: number;
    totalReviews: number;
    totalOrders: number;
    responseTime: string | null;
    satisfactionRate: number | null;
    deliveryFee: number | null;
    freeDeliveryMin: number | null;
    warrantyPolicy: string | null;
    returnPolicy: string | null;
    refundPolicy: string | null;
    createdAt: string;
    _count: { products: number; followers: number };
  };
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    images: string | null;
    isVerifiedPurchase: boolean;
    createdAt: string;
    user: { name: string; avatar: string | null };
  }[];
  _count: { reviews: number };
}

const formatPrice = (price: number) => {
  try {
    return new Intl.NumberFormat('fr-CD', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(price) + ' FC';
  } catch {
    return price.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' FC';
  }
};

const daysBetween = (dateStr: string) => {
  const diff = new Date(dateStr).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
};

export function ProductDetail({
  product,
  open,
  onOpenChange,
  onAddToCart,
  onToggleFavorite,
  isFavorite,
  onContactVendor,
  isAuthenticated,
}: {
  product: ProductDetailData;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAddToCart: (productId: string, quantity: number) => void;
  onToggleFavorite: (productId: string) => void;
  isFavorite: boolean;
  onContactVendor: () => void;
  isAuthenticated: boolean;
}) {
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showFullscreen, setShowFullscreen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const scrollRef = useRef<HTMLDivElement>(null);

  const images = product.images ? product.images.split(',').filter(Boolean) : [];
  const discount = product.compareAtPrice && product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;
  const savedAmount = product.compareAtPrice && product.compareAtPrice > product.price
    ? product.compareAtPrice - product.price
    : 0;
  const shopBadges = (() => { try { return JSON.parse(product.shop.badges || '[]'); } catch { return []; } })();
  const isVerified = shopBadges.includes('VERIFIED_SHOP');
  const inStock = product.stock > 0;
  const lowStock = product.stock > 0 && product.stock <= 5;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({ title: product.name, url: window.location.href });
    } else {
      handleCopyLink();
    }
  };

  const stars = (rating: number) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={`h-3.5 w-3.5 ${s <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
      ))}
    </div>
  );

  const avgRating = product.reviews.length > 0
    ? product.reviews.reduce((a, r) => a + r.rating, 0) / product.reviews.length
    : 0;

  const ratingDistribution = [0, 0, 0, 0, 0];
  product.reviews.forEach((r) => { if (r.rating >= 1 && r.rating <= 5) ratingDistribution[r.rating - 1]++; });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] p-0 gap-0 overflow-y-auto">
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Gallery */}
            <div className="space-y-3">
              <div className="relative group aspect-square rounded-xl overflow-hidden bg-muted">
                {images.length > 0 ? (
                  <>
                    <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 cursor-pointer" onClick={() => setShowFullscreen(true)} />
                    {images.length > 1 && (
                      <div className="absolute inset-0 flex items-end justify-center pb-3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <span className="bg-black/50 text-white text-[10px] px-3 py-1 rounded-full flex items-center gap-1"><Image className="h-3 w-3" />{selectedImage + 1}/{images.length}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground"><Package className="h-16 w-16" /></div>
                )}
                <button type="button" onClick={() => setShowFullscreen(true)} className="absolute top-3 right-3 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><Expand className="h-4 w-4" /></button>
                {images.length > 1 && (
                  <>
                    <button type="button" onClick={() => setSelectedImage(Math.max(0, selectedImage - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><ChevronLeft className="h-4 w-4" /></button>
                    <button type="button" onClick={() => setSelectedImage(Math.min(images.length - 1, selectedImage + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-black/40 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"><ChevronRight className="h-4 w-4" /></button>
                  </>
                )}
                {discount > 0 && (
                  <div className="absolute top-3 left-3 flex flex-col gap-1">
                    <Badge className="bg-red-500 text-white border-0 text-xs">{discount}%</Badge>
                  </div>
                )}
                {product.promotion && (
                  <Badge className="absolute top-3 right-12 bg-amber-500 text-white border-0 text-xs flex items-center gap-1"><Sparkles className="h-3 w-3" />Promo</Badge>
                )}
              </div>
              {images.length > 1 && (
                <p className="text-[11px] text-muted-foreground text-center cursor-pointer" onClick={() => setShowFullscreen(true)}>Cliquez sur la photo pour voir les {images.length} photos</p>
              )}
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setSelectedImage(i)} className={`shrink-0 h-16 w-16 rounded-lg overflow-hidden border-2 transition-colors ${i === selectedImage ? 'border-emerald-500' : 'border-transparent'}`}>
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-4">
              {/* Title & SKU */}
              <div>
                <h2 className="text-xl font-bold">{product.name}</h2>
                {product.sku && <p className="text-xs text-muted-foreground mt-1">SKU: {product.sku}</p>}
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  {product.category && <span>{product.category}</span>}
                  {product.subcategory && <><span>•</span><span>{product.subcategory}</span></>}
                  {product.brand && <><span>•</span><span>{product.brand}</span></>}
                </div>
              </div>

              {/* Price */}
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold text-emerald-600">{formatPrice(product.price)}</span>
                {discount > 0 && (
                  <>
                    <span className="text-lg text-muted-foreground line-through">{formatPrice(product.compareAtPrice!)}</span>
                    <Badge className="bg-red-100 text-red-600 border-0">-{discount}%</Badge>
                  </>
                )}
              </div>
              {savedAmount > 0 && <p className="text-sm text-emerald-600">Vous économisez {formatPrice(savedAmount)}</p>}
              {product.promotion && (
                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-3 py-2 rounded-lg">
                  <Sparkles className="h-4 w-4" />
                  <span>Promotion {product.promotion.discount}% — reste {daysBetween(product.promotion.endDate)} jours</span>
                </div>
              )}

              {/* Short description */}
              {product.shortDescription && <p className="text-sm text-muted-foreground">{product.shortDescription}</p>}

              {/* Stock */}
              <div className="flex items-center gap-2">
                {inStock ? (
                  lowStock ? (
                    <><span className="h-2.5 w-2.5 rounded-full bg-yellow-400" /><span className="text-sm text-yellow-600 font-medium">Stock faible — Plus que {product.stock} unités</span></>
                  ) : (
                    <><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /><span className="text-sm text-emerald-600 font-medium">En stock ({product.stock} disponibles)</span></>
                  )
                ) : (
                  <><span className="h-2.5 w-2.5 rounded-full bg-red-500" /><span className="text-sm text-red-600 font-medium">Rupture de stock</span></>
                )}
              </div>
              {product.soldCount > 0 && <p className="text-xs text-muted-foreground">{product.soldCount} vendu(s)</p>}
              {product.restockDate && !inStock && <p className="text-xs text-muted-foreground">Réapprovisionnement prévu le {new Date(product.restockDate).toLocaleDateString('fr-FR')}</p>}
              {!inStock && <RestockSubscribeButton productId={product.id} />}

              <Separator />

              {/* Quantity & Add to cart */}
              <div className="flex items-center gap-4">
                <div className="flex items-center border rounded-lg">
                  <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors"><Minus className="h-4 w-4" /></button>
                  <span className="h-10 px-4 flex items-center text-sm font-medium border-x">{quantity}</span>
                  <button onClick={() => setQuantity(Math.min(product.stock || 99, quantity + 1))} className="h-10 w-10 flex items-center justify-center hover:bg-muted transition-colors"><Plus className="h-4 w-4" /></button>
                </div>
                <div className="flex gap-2 flex-1">
                  <Button onClick={() => onAddToCart(product.id, quantity)} disabled={!inStock} className="flex-1 bg-emerald-600 hover:bg-emerald-700">
                    <ShoppingCart className="h-4 w-4 mr-2" />Ajouter au panier
                  </Button>
                  <Button variant="outline" onClick={() => onToggleFavorite(product.id)} className={isFavorite ? 'text-red-500 border-red-200' : ''}>
                    <Heart className={`h-4 w-4 ${isFavorite ? 'fill-red-500' : ''}`} />
                  </Button>
                  <Button variant="outline" onClick={handleShare}><Share2 className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCopyLink} className="text-xs">
                  {copied ? <><Check className="h-3 w-3 mr-1" />Copié</> : <><Copy className="h-3 w-3 mr-1" />Copier le lien</>}
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowReport(true)} className="text-xs text-red-500">
                  <Flag className="h-3 w-3 mr-1" />Signaler
                </Button>
              </div>

              <Separator />

              {/* Shop info */}
              <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shrink-0">
                  <Store className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm truncate">{product.shop.name}</p>
                    {isVerified && <span title="Boutique vérifiée"><CheckCircle2 className="h-4 w-4 text-blue-500 shrink-0" /></span>}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-muted-foreground">
                    {product.shop.city && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{product.shop.city}</span>}
                    {product.shop._count.products > 0 && <span>{product.shop._count.products} produits</span>}
                    {product.shop.totalOrders > 0 && <span>{product.shop.totalOrders} commandes</span>}
                    {product.shop.responseTime && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{product.shop.responseTime}</span>}
                  </div>
                  <Button size="sm" variant="link" className="h-auto p-0 text-xs text-emerald-600" onClick={onContactVendor}>Voir la boutique →</Button>
                </div>
              </div>

              {/* Delivery */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                {product.shop.deliveryFee !== null && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20">
                    <Truck className="h-4 w-4 text-blue-500 shrink-0" />
                    <span>{product.shop.deliveryFee === 0 ? 'Livraison gratuite' : `Livraison: ${formatPrice(product.shop.deliveryFee)}`}</span>
                  </div>
                )}
                {product.shop.freeDeliveryMin && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-green-50 dark:bg-green-900/20">
                    <Truck className="h-4 w-4 text-green-500 shrink-0" />
                    <span>Gratuite dès {formatPrice(product.shop.freeDeliveryMin)}</span>
                  </div>
                )}
                {(product.shop.warrantyPolicy || product.shop.returnPolicy) && (
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20">
                    <Shield className="h-4 w-4 text-purple-500 shrink-0" />
                    <span>Garantie & Retours</span>
                  </div>
                )}
                <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                  <Award className="h-4 w-4 text-amber-500 shrink-0" />
                  <span>{product.shop.satisfactionRate ? `${product.shop.satisfactionRate}% satisfaction` : 'Qualité garantie'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs: Description / Specs / Reviews */}
          <div className="mt-8">
            <div className="flex gap-1 border-b">
              {(['description', 'specs', 'reviews'] as const).map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
                  {tab === 'description' ? 'Description' : tab === 'specs' ? 'Caractéristiques' : `Avis (${product.reviews.length})`}
                </button>
              ))}
            </div>
            <div className="py-4">
              {activeTab === 'description' && (
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  {product.description ? <p>{product.description}</p> : <p className="text-muted-foreground">Aucune description disponible.</p>}
                  {product.origin && <p className="text-sm text-muted-foreground mt-2"><Globe className="h-3.5 w-3.5 inline mr-1" />Origine : {product.origin}</p>}
                  <p className="text-sm text-muted-foreground"><Calendar className="h-3.5 w-3.5 inline mr-1" />Ajouté le {new Date(product.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
              )}
              {activeTab === 'specs' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { label: 'Marque', value: product.brand, icon: <Award className="h-4 w-4" /> },
                    { label: 'SKU', value: product.sku, icon: <BarChart3 className="h-4 w-4" /> },
                    { label: 'Catégorie', value: product.category, icon: <Package className="h-4 w-4" /> },
                    { label: 'Sous-catégorie', value: product.subcategory, icon: <Package className="h-4 w-4" /> },
                    { label: 'Poids', value: product.weight ? `${product.weight} ${product.weightUnit || 'kg'}` : null, icon: <Weight className="h-4 w-4" /> },
                    { label: 'Dimensions', value: product.dimensions, icon: <Ruler className="h-4 w-4" /> },
                    { label: 'Matière', value: product.material, icon: <Package className="h-4 w-4" /> },
                    { label: 'Origine', value: product.origin, icon: <Globe className="h-4 w-4" /> },
                  ].filter((s) => s.value).map((s) => (
                    <div key={s.label} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                      <span className="text-muted-foreground">{s.icon}</span>
                      <div><p className="text-xs text-muted-foreground">{s.label}</p><p className="text-sm font-medium">{s.value}</p></div>
                    </div>
                  ))}
                </div>
              )}
              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {/* Rating summary */}
                  {product.reviews.length > 0 && (
                    <div className="flex items-center gap-6 p-4 rounded-lg bg-muted/30">
                      <div className="text-center">
                        <p className="text-3xl font-bold">{avgRating.toFixed(1)}</p>
                        <div className="flex justify-center mt-1">{stars(Math.round(avgRating))}</div>
                        <p className="text-xs text-muted-foreground mt-1">{product.reviews.length} avis</p>
                      </div>
                      <div className="flex-1 space-y-1">
                        {[5, 4, 3, 2, 1].map((s) => (
                          <div key={s} className="flex items-center gap-2 text-xs">
                            <span className="w-3">{s}</span>
                            <Star className="h-3 w-3 text-yellow-400 fill-yellow-400" />
                            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                              <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${product.reviews.length > 0 ? (ratingDistribution[s - 1] / product.reviews.length) * 100 : 0}%` }} />
                            </div>
                            <span className="w-8 text-right text-muted-foreground">{ratingDistribution[s - 1]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Review list */}
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {product.reviews.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">Aucun avis pour le moment. Soyez le premier à donner votre avis !</p>
                    ) : (
                      product.reviews.map((review) => (
                        <div key={review.id} className="p-3 rounded-lg border">
                          <div className="flex items-center gap-2 mb-1">
                            <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-medium">{review.user.name.charAt(0).toUpperCase()}</div>
                            <span className="text-sm font-medium">{review.user.name}</span>
                            {review.isVerifiedPurchase && <span title="Achat vérifié"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /></span>}
                            <span className="text-[10px] text-muted-foreground ml-auto">{new Date(review.createdAt).toLocaleDateString('fr-FR')}</span>
                          </div>
                          <div className="flex items-center gap-1 mb-1">{stars(review.rating)}</div>
                          {review.comment && <p className="text-sm">{review.comment}</p>}
                          {review.images && (
                            <div className="flex gap-2 mt-2">
                              {review.images.split(',').filter(Boolean).map((img, i) => (
                                <img key={i} src={img} alt="" className="h-14 w-14 rounded-lg object-cover" />
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Policies */}
          {(product.shop.warrantyPolicy || product.shop.returnPolicy || product.shop.refundPolicy) && (
            <div className="mt-6 p-4 rounded-lg border bg-muted/20">
              <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><Shield className="h-4 w-4 text-purple-500" /> Garantie & Retours</h3>
              <div className="space-y-2 text-sm">
                {product.shop.warrantyPolicy && <div><p className="font-medium text-xs text-muted-foreground">Garantie</p><p>{product.shop.warrantyPolicy}</p></div>}
                {product.shop.returnPolicy && <div><p className="font-medium text-xs text-muted-foreground">Conditions de retour</p><p>{product.shop.returnPolicy}</p></div>}
                {product.shop.refundPolicy && <div><p className="font-medium text-xs text-muted-foreground">Remboursement</p><p>{product.shop.refundPolicy}</p></div>}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Fullscreen image modal */}
      {showFullscreen && images.length > 0 && (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center" onClick={() => setShowFullscreen(false)}>
          <button className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20" onClick={() => setShowFullscreen(false)}><X className="h-5 w-5" /></button>
          <img src={images[selectedImage]} alt={product.name} className="max-h-[90vh] max-w-[90vw] object-contain" onClick={(e) => e.stopPropagation()} />
          {images.length > 1 && (
            <>
              <button onClick={(e) => { e.stopPropagation(); setSelectedImage(Math.max(0, selectedImage - 1)); }} className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={(e) => { e.stopPropagation(); setSelectedImage(Math.min(images.length - 1, selectedImage + 1)); }} className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"><ChevronRight className="h-5 w-5" /></button>
            </>
          )}
        </div>
      )}

      {/* Report dialog */}
      {showReport && (
        <div className="fixed inset-0 z-[110] bg-black/50 flex items-center justify-center p-4" onClick={() => setShowReport(false)}>
          <div className="bg-white dark:bg-gray-950 rounded-xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold mb-2">Signaler un problème</h3>
            <p className="text-sm text-muted-foreground mb-4">Décrivez le problème que vous rencontrez avec ce produit.</p>
            <textarea className="w-full h-24 px-3 py-2 rounded-lg border text-sm" placeholder="Description du problème..." />
            <div className="flex gap-2 mt-4 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowReport(false)}>Annuler</Button>
              <Button size="sm" className="bg-red-500 hover:bg-red-600" onClick={() => setShowReport(false)}>Envoyer</Button>
            </div>
          </div>
        </div>
      )}
    </Dialog>
  );
}
