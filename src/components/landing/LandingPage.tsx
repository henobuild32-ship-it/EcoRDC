'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { useAppStore, type Shop } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Store,
  Package,
  ShoppingCart,
  MessageCircle,
  FileText,
  Search,
  Truck,
  Shield,
  Lock,
  Eye,
  ChevronRight,
  Star,
  Users,
  ArrowRight,
  Zap,
  Globe,
  TrendingUp,
  Heart,
  MapPin,
  ArrowUp,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Quote,
  Download,
  SmartphoneNfc,
  Award,
  Activity,
} from 'lucide-react';

// Animation variants
const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } },
};

// Section wrapper with scroll animation
function AnimatedSection({ children, className = '', id = '' }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.section
      ref={ref}
      id={id}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      variants={staggerContainer}
      className={className}
    >
      {children}
    </motion.section>
  );
}

// Platform Stats
function PlatformStats() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 1.0 }}
      className="mt-16 grid grid-cols-3 gap-8 max-w-lg mx-auto"
    >
      <div className="text-center">
        <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          +100K
        </div>
        <div className="text-sm font-medium text-muted-foreground mt-1">Boutiques</div>
      </div>
      <div className="text-center">
        <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          +10K
        </div>
        <div className="text-sm font-medium text-muted-foreground mt-1">Produits</div>
      </div>
      <div className="text-center">
        <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
          +20K
        </div>
        <div className="text-sm font-medium text-muted-foreground mt-1">Clients</div>
      </div>
    </motion.div>
  );
}

// Popular Shops Section
function PopularShops() {
  const { setCurrentView, setSelectedShop } = useAppStore();
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchShops() {
      try {
        const res = await fetch('/api/shops?recommended=true');
        let list: Shop[] = [];
        if (res.ok) {
          const data = await res.json();
          list = data.shops || [];
        }
        // Fallback: if no recommended shops, fetch all active shops so users always see shops
        if (list.length === 0) {
          const allRes = await fetch('/api/shops');
          if (allRes.ok) {
            const allData = await allRes.json();
            list = allData.shops || [];
          }
        }
        setShops(list);
      } catch {
        // Silently handle
      } finally {
        setLoading(false);
      }
    }
    fetchShops();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-12 w-12 bg-muted rounded-xl mb-4" />
              <div className="h-5 w-2/3 bg-muted rounded mb-2" />
              <div className="h-4 w-1/2 bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (shops.length === 0) {
    return (
      <div className="text-center py-12">
        <Store className="h-16 w-16 mx-auto text-emerald-300 mb-4" />
        <p className="text-muted-foreground text-lg">Aucune boutique disponible pour le moment</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {shops.slice(0, 6).map((shop, index) => (
          <motion.div key={shop.id} variants={scaleIn} custom={index}>
            <Card
              className="group card-hover hover:shadow-lg transition-all duration-300 border-emerald-100 dark:border-emerald-900/30 hover:border-emerald-300 dark:hover:border-emerald-700 cursor-pointer overflow-hidden"
              onClick={() => {
                setSelectedShop(shop);
                setCurrentView('client-product');
              }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-md overflow-hidden">
                    {shop.logo ? (
                      <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                    ) : (
                      shop.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {shop.name}
                    </h3>
                    <p className="text-muted-foreground text-sm line-clamp-2 mt-1">
                      {shop.description || 'Boutique en ligne sur EcoRDC'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 mt-4 flex-wrap">
                  <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0">
                    <Package className="size-3 mr-1" />
                    {shop.products?.length || 0} produit{(shop.products?.length || 0) !== 1 ? 's' : ''}
                  </Badge>
                  {shop.city && (
                    <Badge variant="secondary" className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-0">
                      <MapPin className="size-3 mr-1" />
                      {shop.city}
                    </Badge>
                  )}
                  {shop.isRecommended && (
                    <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0 badge-shimmer">
                      <Star className="size-3 mr-1" />
                      Recommandé
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      <motion.div variants={fadeInUp} className="text-center mt-10">
        <Button
          variant="outline"
          size="lg"
          onClick={() => setCurrentView('client-shop')}
          className="border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 h-12 px-8"
        >
          Voir toutes les boutiques
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </motion.div>
    </>
  );
}

// Decorative section divider
function SectionDivider() {
  return (
    <div className="flex items-center justify-center py-2">
      <div className="flex items-center gap-2">
        <div className="h-1 w-8 rounded-full bg-emerald-200 dark:bg-emerald-800" />
        <div className="h-2 w-2 rounded-full bg-emerald-400" />
        <div className="h-1 w-8 rounded-full bg-emerald-200 dark:bg-emerald-800" />
      </div>
    </div>
  );
}

export default function LandingPage() {
  const { setCurrentView, incrementCartIconTap } = useAppStore();
  const [heroLoaded] = useState(true);

  const handleShopClick = (view: 'login' | 'register') => {
    // Dispatch custom events that AuthModals listens for
    const eventName = view === 'login' ? 'ecordc-show-login' : 'ecordc-show-register';
    window.dispatchEvent(new CustomEvent(eventName));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ===== HERO SECTION ===== */}
      <section className="relative overflow-hidden">
        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-grid pointer-events-none" />

        {/* Secret admin access trigger - discreet but visible decorative cart badge at the top corner */}
        <div
          className="absolute top-5 right-5 sm:top-8 sm:right-8 z-30 select-none group"
          onClick={incrementCartIconTap}
          role="button"
          tabIndex={0}
          aria-label="Décoration"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              incrementCartIconTap();
            }
          }}
        >
          <div className="relative flex items-center justify-center h-11 w-11 sm:h-12 sm:w-12 rounded-full bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50 shadow-sm backdrop-blur-sm transition-all duration-500 group-hover:scale-105 group-hover:bg-emerald-100/90 dark:group-hover:bg-emerald-900/50 group-hover:shadow-md cursor-pointer">
            {/* Subtle pulse ring */}
            <span className="absolute inset-0 rounded-full border border-emerald-300/30 dark:border-emerald-700/40 animate-ping-slow opacity-60" />
            {/* Cart icon - clearly visible */}
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-emerald-600/70 dark:text-emerald-400/80 transition-colors duration-500 group-hover:text-emerald-700 dark:group-hover:text-emerald-300" strokeWidth={1.75} />
            {/* Tiny decorative dot in corner so it looks like a badge */}
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400/80 ring-2 ring-background" />
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-60" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 bg-emerald-100 dark:bg-emerald-900/20 rounded-full blur-3xl opacity-40" />

          {/* Floating animated particles - 10 dots with varying delays */}
          <div className="absolute top-[10%] left-[15%] w-2 h-2 bg-emerald-400 rounded-full animate-float" style={{ animationDelay: '0s', animationDuration: '4s' }} />
          <div className="absolute top-[20%] right-[20%] w-1.5 h-1.5 bg-emerald-300 rounded-full animate-float" style={{ animationDelay: '0.5s', animationDuration: '5s' }} />
          <div className="absolute top-[40%] left-[8%] w-2.5 h-2.5 bg-emerald-500 rounded-full animate-float" style={{ animationDelay: '1s', animationDuration: '3.5s' }} />
          <div className="absolute top-[60%] right-[10%] w-2 h-2 bg-emerald-400 rounded-full animate-float" style={{ animationDelay: '1.5s', animationDuration: '4.5s' }} />
          <div className="absolute top-[75%] left-[25%] w-1.5 h-1.5 bg-emerald-300 rounded-full animate-float" style={{ animationDelay: '2s', animationDuration: '5.5s' }} />
          <div className="absolute top-[15%] left-[50%] w-2 h-2 bg-emerald-500 rounded-full animate-float" style={{ animationDelay: '0.8s', animationDuration: '4.2s' }} />
          <div className="absolute top-[50%] left-[70%] w-1.5 h-1.5 bg-emerald-400 rounded-full animate-float" style={{ animationDelay: '1.3s', animationDuration: '3.8s' }} />
          <div className="absolute top-[30%] right-[35%] w-2.5 h-2.5 bg-emerald-300 rounded-full animate-float" style={{ animationDelay: '2.5s', animationDuration: '4.8s' }} />
          <div className="absolute bottom-[20%] left-[40%] w-1.5 h-1.5 bg-emerald-500 rounded-full animate-float" style={{ animationDelay: '0.3s', animationDuration: '3.2s' }} />
          <div className="absolute top-[85%] right-[25%] w-2 h-2 bg-emerald-400 rounded-full animate-float" style={{ animationDelay: '1.8s', animationDuration: '5.2s' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 sm:pt-28 sm:pb-32">
          <div className="text-center">
            {/* Logo with rotating hexagon behind it */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={heroLoaded ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="mb-8"
            >
              <div className="inline-flex items-center justify-center relative">
                {/* Floating rotating hexagon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="animate-spin-slow opacity-20"
                    width="180"
                    height="180"
                    viewBox="0 0 180 180"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <defs>
                      <linearGradient id="hexGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10B981" />
                        <stop offset="50%" stopColor="#059669" />
                        <stop offset="100%" stopColor="#34D399" />
                      </linearGradient>
                    </defs>
                    <polygon
                      points="90,10 160,50 160,130 90,170 20,130 20,50"
                      stroke="url(#hexGrad)"
                      strokeWidth="2"
                      fill="none"
                    />
                  </svg>
                </div>
                <img
                  src="/ecordc-logo.png"
                  alt="EcoRDC Logo"
                  className="h-24 w-24 sm:h-32 sm:w-32 object-contain drop-shadow-lg relative z-10"
                />
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={heroLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6"
            >
              <span className="text-gradient">
                EcoRDC
              </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={heroLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="text-lg sm:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto mb-10"
            >
              La plateforme e-commerce de référence en RDC. Connectez vendeurs et clients,
              développez votre activité et achetez en toute confiance.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6"
            >
              <Button
                size="lg"
                onClick={() => handleShopClick('login')}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/25 h-12 px-8 text-base glow-emerald"
              >
                Se connecter
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={() => handleShopClick('register')}
                className="w-full sm:w-auto border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 h-12 px-8 text-base"
              >
                Créer un compte
              </Button>
              <Button
                size="lg"
                variant="ghost"
                onClick={() => handleShopClick('register')}
                className="w-full sm:w-auto text-emerald-600 dark:text-emerald-400 h-12 px-8 text-base"
              >
                Commencer
                <ChevronRight className="ml-1 h-5 w-5" />
              </Button>
            </motion.div>

            {/* Separator line */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={heroLoaded ? { opacity: 1, scaleX: 1 } : {}}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex items-center justify-center gap-3 mb-6"
            >
              <div className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-300 dark:to-emerald-700" />
              <span className="text-xs text-muted-foreground uppercase tracking-widest">Télécharger</span>
              <div className="h-px w-16 bg-gradient-to-l from-transparent to-emerald-300 dark:to-emerald-700" />
            </motion.div>

            {/* Download Buttons with device icons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={heroLoaded ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-4"
            >
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-3 h-12 px-6 border-border/60 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                {/* Android robot icon */}
                <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.523 2.225l1.586-1.586a.5.5 0 00-.707-.707L16.695 1.64a8.457 8.457 0 00-4.697-1.414 8.457 8.457 0 00-4.697 1.414L5.594-.068a.5.5 0 00-.707.707L6.473 2.22A8.457 8.457 0 003.5 8.5h17a8.457 8.457 0 00-2.977-6.275zM8.5 6.5a1 1 0 110-2 1 1 0 010 2zm7 0a1 1 0 110-2 1 1 0 010 2zM3.5 10.5v7a1 1 0 001 1h1v3.5a1.5 1.5 0 003 0V18.5h3v3.5a1.5 1.5 0 003 0V18.5h1a1 1 0 001-1v-7h-13zm-2 0a1.5 1.5 0 00-1.5 1.5v5a1.5 1.5 0 003 0v-5a1.5 1.5 0 00-1.5-1.5zm21 0a1.5 1.5 0 00-1.5 1.5v5a1.5 1.5 0 003 0v-5a1.5 1.5 0 00-1.5-1.5z"/>
                </svg>
                <div className="text-left">
                  <div className="text-[10px] leading-tight text-muted-foreground">Télécharger sur</div>
                  <div className="text-sm font-semibold leading-tight">Android</div>
                </div>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto gap-3 h-12 px-6 border-border/60 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                {/* Apple icon */}
                <svg className="h-5 w-5 text-emerald-600" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                </svg>
                <div className="text-left">
                  <div className="text-[10px] leading-tight text-muted-foreground">Télécharger sur</div>
                  <div className="text-sm font-semibold leading-tight">iPhone</div>
                </div>
              </Button>
            </motion.div>

            {/* PWA Installable Badge */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={heroLoaded ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 1.0 }}
              className="flex items-center justify-center gap-2 mb-2"
            >
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 gap-1.5">
                <Download className="size-3" />
                PWA Installable
              </Badge>
              <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 gap-1.5">
                <SmartphoneNfc className="size-3" />
                Hors ligne
              </Badge>
            </motion.div>

            {/* Stats */}
            <PlatformStats />
          </div>
        </div>
      </section>

      <SectionDivider />

      {/* ===== AVANTAGES VENDEURS ===== */}
      <AnimatedSection
        id="vendeurs"
        className="py-24 sm:py-28 bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/20 dark:to-background"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 hover:bg-emerald-100">
              <Store className="size-3.5 mr-1.5" />
              Pour les Vendeurs
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Lancez votre{' '}
              <span className="text-gradient">boutique en ligne</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Créez votre boutique, publiez vos produits et gérez vos commandes en toute simplicité
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Store,
                title: 'Créez votre boutique',
                desc: 'Mettez en ligne votre boutique en quelques minutes avec une interface intuitive et professionnelle.',
                color: 'from-emerald-400 to-emerald-600',
                badge: 'Gratuit',
                step: '01',
              },
              {
                icon: Package,
                title: 'Publiez vos produits',
                desc: 'Ajoutez vos produits avec photos, descriptions et prix. Organisez-les par catégories.',
                color: 'from-green-400 to-green-600',
                step: '02',
              },
              {
                icon: ShoppingCart,
                title: 'Gérez les commandes',
                desc: 'Suivez les commandes en temps réel, confirmez et mettez à jour les statuts facilement.',
                color: 'from-teal-400 to-teal-600',
                step: '03',
              },
              {
                icon: MessageCircle,
                title: 'Messagerie en temps réel',
                desc: 'Communiquez directement avec vos clients pour répondre à leurs questions.',
                color: 'from-emerald-500 to-teal-500',
                step: '04',
              },
              {
                icon: FileText,
                title: 'Générez des factures',
                desc: 'Créez et envoyez des factures professionnelles automatiquement pour chaque commande.',
                color: 'from-green-500 to-emerald-500',
                step: '05',
              },
              {
                icon: TrendingUp,
                title: 'Suivez vos performances',
                desc: 'Tableau de bord avec statistiques détaillées pour optimiser vos ventes.',
                color: 'from-teal-500 to-green-500',
                step: '06',
              },
            ].map((item, index) => (
              <motion.div key={item.title} variants={fadeInUp} custom={index}>
                <Card className="group h-full gradient-border-hover hover:shadow-xl transition-all duration-300 border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800 relative overflow-hidden">
                  {/* Step number overlay */}
                  <div className="absolute top-3 right-3 text-5xl font-black text-emerald-100 dark:text-emerald-900/30 select-none leading-none">
                    {item.step}
                  </div>
                  <CardContent className="p-6">
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-5 shadow-lg icon-pulse group-hover:scale-110 transition-transform duration-300`}
                    >
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h3>
                      {item.badge && (
                        <Badge className="bg-emerald-500 text-white border-0 text-[10px] px-2 py-0">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ===== AVANTAGES CLIENTS ===== */}
      <AnimatedSection
        id="clients"
        className="py-24 sm:py-28"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <Badge className="mb-4 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 border-0 hover:bg-green-100">
              <Users className="size-3.5 mr-1.5" />
              Pour les Clients
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Achetez en toute{' '}
              <span className="text-gradient">confiance</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Parcourez les boutiques, commandez facilement et suivez vos achats en temps réel
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Search,
                title: 'Parcourez les boutiques',
                desc: 'Explorez des centaines de boutiques et trouvez les produits que vous cherchez.',
                color: 'from-emerald-400 to-green-500',
                step: '01',
              },
              {
                icon: ShoppingCart,
                title: 'Commandez facilement',
                desc: 'Ajoutez au panier et commandez en quelques clics. Processus simplifié et rapide.',
                color: 'from-green-400 to-teal-500',
                badge: 'Populaire',
                step: '02',
              },
              {
                icon: MessageCircle,
                title: 'Discutez avec les vendeurs',
                desc: 'Posez vos questions directement aux vendeurs avant d\'acheter.',
                color: 'from-teal-400 to-emerald-500',
                step: '03',
              },
              {
                icon: Truck,
                title: 'Suivez vos commandes',
                desc: 'Suivez l\'état de vos commandes en temps réel de la confirmation à la livraison.',
                color: 'from-emerald-500 to-green-400',
                step: '04',
              },
              {
                icon: FileText,
                title: 'Recevez vos factures',
                desc: 'Accédez à vos factures et reçus à tout moment depuis votre espace.',
                color: 'from-green-500 to-emerald-400',
                step: '05',
              },
              {
                icon: Shield,
                title: 'Achats sécurisés',
                desc: 'Vos données et transactions sont protégées avec les standards de sécurité.',
                color: 'from-teal-500 to-green-400',
                step: '06',
              },
            ].map((item, index) => (
              <motion.div key={item.title} variants={fadeInUp} custom={index}>
                <Card className="group h-full tilt-hover gradient-border-hover hover:shadow-xl transition-all duration-300 border-border/50 hover:border-green-200 dark:hover:border-green-800 relative overflow-hidden">
                  {/* Step number overlay */}
                  <div className="absolute top-3 right-3 text-5xl font-black text-green-100 dark:text-green-900/30 select-none leading-none">
                    {item.step}
                  </div>
                  <CardContent className="p-6">
                    <div
                      className={`h-12 w-12 rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center text-white mb-5 shadow-lg icon-pulse group-hover:scale-110 transition-transform duration-300`}
                    >
                      <item.icon className="h-6 w-6" />
                    </div>
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                        {item.title}
                      </h3>
                      {item.badge && (
                        <Badge className="bg-amber-500 text-white border-0 text-[10px] px-2 py-0 badge-shimmer">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ===== BOUTIQUES POPULAIRES ===== */}
      <AnimatedSection
        id="boutiques"
        className="py-24 sm:py-28 bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/20 dark:to-background"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 hover:bg-emerald-100">
              <Star className="size-3.5 mr-1.5" />
              Boutiques Populaires
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Découvrez nos{' '}
              <span className="text-gradient">boutiques recommandées</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Des boutiques vérifiées et approuvées par notre équipe pour une expérience d&apos;achat optimale
            </p>
          </motion.div>

          <motion.div variants={fadeInUp}>
            <PopularShops />
          </motion.div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ===== SÉCURITÉ ===== */}
      <AnimatedSection
        id="securite"
        className="py-24 sm:py-28"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-16">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 hover:bg-emerald-100">
              <Shield className="size-3.5 mr-1.5" />
              Sécurité
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Votre sécurité est notre{' '}
              <span className="text-gradient">priorité</span>
            </h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Nous utilisons les technologies les plus avancées pour protéger vos données et vos transactions
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Lock,
                title: 'Authentification JWT',
                desc: 'Système d\'authentification sécurisé basé sur les tokens JWT avec expiration automatique et renouvellement.',
                gradient: 'from-emerald-500 to-green-600',
              },
              {
                icon: Shield,
                title: 'Sessions sécurisées',
                desc: 'Sessions chiffrées et protégées contre les attaques CSRF, XSS et les injections. Données isolées par utilisateur.',
                gradient: 'from-green-500 to-teal-600',
              },
              {
                icon: Eye,
                title: 'Protection des données',
                desc: 'Mots de passe hachés avec bcrypt, données sensibles chiffrées et conformité aux standards de sécurité.',
                gradient: 'from-teal-500 to-emerald-600',
              },
            ].map((item, index) => (
              <motion.div key={item.title} variants={fadeInUp} custom={index}>
                <Card className="group h-full text-center card-hover hover:shadow-xl transition-all duration-300 border-border/50 hover:border-emerald-200 dark:hover:border-emerald-800">
                  <CardContent className="p-8">
                    {/* Shield gradient background behind icon */}
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-200/50 to-green-200/50 dark:from-emerald-800/30 dark:to-green-800/30 rounded-full blur-xl scale-150" />
                      <div
                        className={`relative h-16 w-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white mx-auto shadow-lg animate-pulse-glow group-hover:scale-110 transition-transform duration-300`}
                      >
                        <item.icon className="h-8 w-8" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-lg mb-3">{item.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Trust Badges Row */}
          <motion.div variants={fadeInUp} className="mt-12">
            <div className="flex flex-wrap items-center justify-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <Lock className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">SSL</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">RGPD</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">JWT</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <Activity className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">99.9% Uptime</span>
              </div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ===== COMMENT ÇA MARCHE ===== */}
      <AnimatedSection
        id="comment"
        className="py-24 sm:py-28 bg-gradient-to-b from-emerald-50/50 to-background dark:from-emerald-950/20 dark:to-background"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div variants={fadeInUp} className="text-center mb-8">
            <Badge className="mb-4 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0 hover:bg-emerald-100">
              <Zap className="size-3.5 mr-1.5" />
              Comment ça marche
            </Badge>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Simple comme{' '}
              <span className="text-gradient">1, 2, 3</span>
            </h2>
          </motion.div>

          {/* Temps estimé badge */}
          <motion.div variants={fadeInUp} className="flex justify-center mb-12">
            <Badge variant="outline" className="border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 gap-1.5 px-4 py-1.5">
              <Clock className="size-3.5" />
              Temps estimé : 2 minutes
            </Badge>
          </motion.div>

          {/* Progress bar */}
          <motion.div variants={fadeInUp} className="max-w-xs mx-auto mb-12">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
              <span>Étape 1</span>
              <span>Étape 2</span>
              <span>Étape 3</span>
            </div>
            <div className="h-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full progress-fill" />
            </div>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16">
            {/* Client steps */}
            <motion.div variants={fadeInUp}>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 font-medium text-sm mb-3">
                  <Users className="size-4" />
                  Pour les Clients
                </div>
              </div>
              <div className="space-y-6">
                {[
                  {
                    step: '01',
                    title: 'Créez votre compte',
                    desc: 'Inscrivez-vous gratuitement en tant que client et accédez à toutes les boutiques.',
                  },
                  {
                    step: '02',
                    title: 'Parcourez et commandez',
                    desc: 'Trouvez vos produits, ajoutez-les au panier et passez commande en quelques clics.',
                  },
                  {
                    step: '03',
                    title: 'Suivez et recevez',
                    desc: 'Suivez votre commande en temps réel et recevez vos produits avec facture.',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    variants={fadeInUp}
                    custom={index}
                    className="flex gap-5"
                  >
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {item.step}
                      </div>
                      {index < 2 && (
                        <div className="w-0.5 flex-1 min-h-[24px] dotted-connector my-2" />
                      )}
                    </div>
                    <div className="pb-2">
                      <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Vendor steps */}
            <motion.div variants={fadeInUp}>
              <div className="mb-8">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium text-sm mb-3">
                  <Store className="size-4" />
                  Pour les Vendeurs
                </div>
              </div>
              <div className="space-y-6">
                {[
                  {
                    step: '01',
                    title: 'Inscrivez-vous comme vendeur',
                    desc: 'Créez un compte vendeur et votre boutique est automatiquement créée.',
                  },
                  {
                    step: '02',
                    title: 'Ajoutez vos produits',
                    desc: 'Publiez vos produits avec photos, descriptions et prix attractifs.',
                  },
                  {
                    step: '03',
                    title: 'Gérez et vendez',
                    desc: 'Gérez les commandes, communiquez avec les clients et générez des factures.',
                  },
                ].map((item, index) => (
                  <motion.div
                    key={item.step}
                    variants={fadeInUp}
                    custom={index}
                    className="flex gap-5"
                  >
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold shadow-lg">
                        {item.step}
                      </div>
                      {index < 2 && (
                        <div className="w-0.5 flex-1 min-h-[24px] dotted-connector my-2" />
                      )}
                    </div>
                    <div className="pb-2">
                      <h4 className="font-semibold text-lg mb-1">{item.title}</h4>
                      <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ===== CTA SECTION ===== */}
      <AnimatedSection className="py-24 sm:py-28">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            variants={scaleIn}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-600 via-emerald-500 to-green-500" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent)]" />

            {/* Animated particles inside CTA */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-[15%] left-[10%] w-2 h-2 bg-white/20 rounded-full particle" style={{ animationDelay: '0s' }} />
              <div className="absolute top-[40%] right-[15%] w-1.5 h-1.5 bg-white/15 rounded-full particle" style={{ animationDelay: '1s' }} />
              <div className="absolute bottom-[25%] left-[25%] w-2 h-2 bg-white/20 rounded-full particle" style={{ animationDelay: '2s' }} />
              <div className="absolute top-[60%] right-[30%] w-1.5 h-1.5 bg-white/15 rounded-full particle" style={{ animationDelay: '0.5s' }} />
              <div className="absolute bottom-[40%] left-[60%] w-2 h-2 bg-white/20 rounded-full particle" style={{ animationDelay: '1.5s' }} />
              <div className="absolute top-[20%] right-[50%] w-1.5 h-1.5 bg-white/10 rounded-full particle" style={{ animationDelay: '3s' }} />
            </div>

            <div className="relative p-10 sm:p-16 text-center text-white">
              <motion.div variants={fadeInUp}>
                <Award className="h-12 w-12 mx-auto mb-6 opacity-90" />

                {/* Stats counters */}
                <div className="flex items-center justify-center gap-8 mb-8">
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">0+</div>
                    <div className="text-emerald-200 text-xs sm:text-sm">Boutiques</div>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">0+</div>
                    <div className="text-emerald-200 text-xs sm:text-sm">Produits</div>
                  </div>
                  <div className="h-8 w-px bg-white/20" />
                  <div className="text-center">
                    <div className="text-2xl sm:text-3xl font-bold">100%</div>
                    <div className="text-emerald-200 text-xs sm:text-sm">Sécurisé</div>
                  </div>
                </div>

                <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                  Prêt à commencer ?
                </h2>
                <p className="text-emerald-100 text-lg max-w-xl mx-auto mb-8">
                  Rejoignez la communauté EcoRDC et découvrez une nouvelle façon de vendre et d&apos;acheter en RDC
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
                  <Button
                    size="lg"
                    onClick={() => handleShopClick('register')}
                    className="w-full sm:w-auto bg-white text-emerald-700 hover:bg-emerald-50 shadow-lg h-12 px-8 text-base font-semibold"
                  >
                    Créer un compte gratuit
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => handleShopClick('login')}
                    className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 h-12 px-8 text-base"
                  >
                    Se connecter
                  </Button>
                </div>

                {/* Testimonial quotes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto mt-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left">
                    <Quote className="h-4 w-4 text-emerald-200 mb-2" />
                    <p className="text-sm text-emerald-50 mb-2">&ldquo;EcoRDC m&apos;a permis de lancer ma boutique en ligne en quelques minutes. Incroyable !&rdquo;</p>
                    <p className="text-xs text-emerald-200">— Marie K., Kinshasa</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-left">
                    <Quote className="h-4 w-4 text-emerald-200 mb-2" />
                    <p className="text-sm text-emerald-50 mb-2">&ldquo;Je commande mes produits en toute confiance. Le suivi en temps réel est génial !&rdquo;</p>
                    <p className="text-xs text-emerald-200">— Jean P., Lubumbashi</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ===== FOOTER ===== */}
      <footer className="border-t bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Brand */}
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/ecordc-logo.png"
                  alt="EcoRDC"
                  className="h-10 w-10 object-contain"
                />
                <span className="font-bold text-xl text-gradient">
                  EcoRDC
                </span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                La plateforme e-commerce de référence en République Démocratique du Congo 🇨🇩
              </p>
              {/* Social Media Icons */}
              <div className="flex items-center gap-3">
                <a
                  href="#"
                  aria-label="Facebook"
                  className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  <Facebook className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  aria-label="Twitter"
                  className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  aria-label="Instagram"
                  className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  <Instagram className="h-4 w-4" />
                </a>
                <a
                  href="#"
                  aria-label="WhatsApp"
                  className="h-9 w-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                >
                  <MessageCircle className="h-4 w-4" />
                </a>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                Navigation
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Accueil', href: '#' },
                  { label: 'Vendeurs', href: '#vendeurs' },
                  { label: 'Clients', href: '#clients' },
                  { label: 'Boutiques', href: '#boutiques' },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Ressources */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                Ressources
              </h4>
              <ul className="space-y-2.5">
                {[
                  { label: 'Sécurité', href: '#securite' },
                  { label: 'Comment ça marche', href: '#comment' },
                  { label: "Conditions d'utilisation", href: '#conditions' },
                  { label: 'Politique de confidentialité', href: '#confidentialite' },
                ].map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                Contact
              </h4>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Globe className="h-4 w-4 text-emerald-500" />
                  RDC, Kinshasa
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                  support@ecordc
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Copyright &copy; {new Date().getFullYear()} HenoBuild. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                Fait avec
                <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                en RDC 🇨🇩
              </div>
              {/* Back to top button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 gap-1.5 h-8"
              >
                <ArrowUp className="h-3.5 w-3.5" />
                Retour en haut
              </Button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
