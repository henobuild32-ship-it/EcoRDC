'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  BadgeCheck, PackageCheck, Crown, Star, Store, Search, MapPin,
  Loader2, ChevronLeft, ChevronRight, ShieldCheck, ShieldAlert,
  Users, Heart, ShoppingBag,
} from 'lucide-react';
import { toast } from 'sonner';

type BadgeKey = 'VERIFIED_SHOP' | 'VERIFIED_SUPPLIER' | 'PREMIUM_SUPPLIER' | 'RECOMMENDED_SELLER';

interface ShopOwner {
  id: string;
  name: string;
  email: string;
  isSuspended?: boolean;
}

interface ShopItem {
  id: string;
  name: string;
  slug?: string;
  logo?: string | null;
  city?: string | null;
  category?: string | null;
  isActive: boolean;
  badges?: string | null;
  createdAt: string;
  owner: ShopOwner;
  _count: { products: number; followers: number; orders: number };
}

interface VerificationStats {
  total: number;
  verified: number;
  unverified: number;
  badgeCounts: Record<BadgeKey, number>;
}

interface BadgeConfig {
  key: BadgeKey;
  label: string;
  icon: React.ElementType;
  gradient: string;
  active: string;
  inactive: string;
}

const BADGES: BadgeConfig[] = [
  {
    key: 'VERIFIED_SHOP',
    label: 'Boutique Vérifiée',
    icon: BadgeCheck,
    gradient: 'from-blue-500 to-blue-700',
    active: 'bg-gradient-to-r from-blue-500 to-blue-700 text-white border-blue-400 shadow-md shadow-blue-900/40',
    inactive: 'bg-slate-800/60 text-slate-500 border-slate-700 hover:border-blue-500/40 hover:text-blue-300',
  },
  {
    key: 'VERIFIED_SUPPLIER',
    label: 'Fournisseur Vérifié',
    icon: PackageCheck,
    gradient: 'from-cyan-500 to-cyan-700',
    active: 'bg-gradient-to-r from-cyan-500 to-cyan-700 text-white border-cyan-400 shadow-md shadow-cyan-900/40',
    inactive: 'bg-slate-800/60 text-slate-500 border-slate-700 hover:border-cyan-500/40 hover:text-cyan-300',
  },
  {
    key: 'PREMIUM_SUPPLIER',
    label: 'Fournisseur Premium',
    icon: Crown,
    gradient: 'from-purple-500 to-purple-700',
    active: 'bg-gradient-to-r from-purple-500 to-purple-700 text-white border-purple-400 shadow-md shadow-purple-900/40',
    inactive: 'bg-slate-800/60 text-slate-500 border-slate-700 hover:border-purple-500/40 hover:text-purple-300',
  },
  {
    key: 'RECOMMENDED_SELLER',
    label: 'Vendeur Recommandé',
    icon: Star,
    gradient: 'from-amber-500 to-amber-700',
    active: 'bg-gradient-to-r from-amber-500 to-amber-700 text-white border-amber-400 shadow-md shadow-amber-900/40',
    inactive: 'bg-slate-800/60 text-slate-500 border-slate-700 hover:border-amber-500/40 hover:text-amber-300',
  },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

const parseBadges = (raw?: string | null): BadgeKey[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as BadgeKey[];
  } catch {
    // ignore
  }
  return [];
};

export default function AdminVerification() {
  const { token } = useAppStore();
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [stats, setStats] = useState<VerificationStats>({
    total: 0,
    verified: 0,
    unverified: 0,
    badgeCounts: {
      VERIFIED_SHOP: 0,
      VERIFIED_SUPPLIER: 0,
      PREMIUM_SUPPLIER: 0,
      RECOMMENDED_SELLER: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'VERIFIED' | 'UNVERIFIED'>('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchShops = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        section: 'verifications',
        page: page.toString(),
        limit: '20',
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops || []);
        setStats({
          total: data.stats?.total ?? 0,
          verified: data.stats?.verified ?? 0,
          unverified: data.stats?.unverified ?? 0,
          badgeCounts: {
            VERIFIED_SHOP: data.stats?.badgeCounts?.VERIFIED_SHOP ?? 0,
            VERIFIED_SUPPLIER: data.stats?.badgeCounts?.VERIFIED_SUPPLIER ?? 0,
            PREMIUM_SUPPLIER: data.stats?.badgeCounts?.PREMIUM_SUPPLIER ?? 0,
            RECOMMENDED_SELLER: data.stats?.badgeCounts?.RECOMMENDED_SELLER ?? 0,
          },
        });
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token, page, search]);

  useEffect(() => {
    fetchShops();
  }, [fetchShops]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchShops();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, fetchShops]);

  const toggleBadge = async (shop: ShopItem, badge: BadgeKey, label: string) => {
    if (!token) return;
    const toggleKey = `${shop.id}:${badge}`;
    setToggling(toggleKey);
    const currentBadges = parseBadges(shop.badges);
    const willAdd = !currentBadges.includes(badge);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'toggle-shop-badge', shopId: shop.id, badge }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        const newBadges = Array.isArray(data.badges) ? (data.badges as BadgeKey[]) : null;
        setShops(prev =>
          prev.map(s => {
            if (s.id !== shop.id) return s;
            const updated = newBadges
              ? newBadges
              : willAdd
                ? Array.from(new Set([...currentBadges, badge]))
                : currentBadges.filter(b => b !== badge);
            return { ...s, badges: JSON.stringify(updated) };
          })
        );
        toast.success(
          willAdd
            ? `Badge « ${label} » attribué à ${shop.name}`
            : `Badge « ${label} » retiré de ${shop.name}`
        );
        // Refresh stats silently
        fetchShops();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Erreur lors de la mise à jour du badge');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setToggling(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const filteredShops = shops.filter((s) => {
    if (filter === 'ALL') return true;
    const has = parseBadges(s.badges).length > 0;
    return filter === 'VERIFIED' ? has : !has;
  });

  const statCards = [
    {
      key: 'total', label: 'Total boutiques', value: stats.total,
      icon: Store, gradient: 'from-slate-500 to-slate-700',
    },
    {
      key: 'verified', label: 'Boutiques vérifiées', value: stats.verified,
      icon: ShieldCheck, gradient: 'from-green-500 to-green-700',
    },
    {
      key: 'unverified', label: 'Non vérifiées', value: stats.unverified,
      icon: ShieldAlert, gradient: 'from-slate-500 to-slate-700',
    },
    {
      key: 'VERIFIED_SHOP', label: 'Boutique Vérifiée', value: stats.badgeCounts.VERIFIED_SHOP,
      icon: BadgeCheck, gradient: 'from-blue-500 to-blue-700',
    },
    {
      key: 'VERIFIED_SUPPLIER', label: 'Fournisseur Vérifié', value: stats.badgeCounts.VERIFIED_SUPPLIER,
      icon: PackageCheck, gradient: 'from-cyan-500 to-cyan-700',
    },
    {
      key: 'PREMIUM_SUPPLIER', label: 'Fournisseur Premium', value: stats.badgeCounts.PREMIUM_SUPPLIER,
      icon: Crown, gradient: 'from-purple-500 to-purple-700',
    },
    {
      key: 'RECOMMENDED_SELLER', label: 'Vendeur Recommandé', value: stats.badgeCounts.RECOMMENDED_SELLER,
      icon: Star, gradient: 'from-amber-500 to-amber-700',
    },
  ];

  const filterButtons: { value: typeof filter; label: string }[] = [
    { value: 'ALL', label: 'Toutes' },
    { value: 'VERIFIED', label: 'Vérifiées uniquement' },
    { value: 'UNVERIFIED', label: 'Non vérifiées' },
  ];

  return (
    <AdminSidebar>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item}>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-blue-400" />
            Vérification des Boutiques
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Attribuez et retirez les badges de vérification
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
          {statCards.map(card => {
            const Icon = card.icon;
            return (
              <Card key={card.key} className="border border-slate-700/50 bg-[#1e293b] shadow-lg">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] text-slate-400 truncate leading-tight">{card.label}</p>
                    <p className="text-xl font-bold text-white">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Search + Filter */}
        <motion.div variants={item} className="flex flex-col sm:flex-row gap-3 sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <Input
              placeholder="Rechercher une boutique, un vendeur, une ville..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {filterButtons.map(btn => (
              <Button
                key={btn.value}
                variant={filter === btn.value ? 'default' : 'outline'}
                size="sm"
                className={
                  filter === btn.value
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
                }
                onClick={() => setFilter(btn.value)}
              >
                {btn.label}
              </Button>
            ))}
          </div>
        </motion.div>

        {/* Shops Table */}
        <motion.div variants={item}>
          <Card className="border border-slate-700/50 bg-[#1e293b] shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700/50 hover:bg-transparent">
                      <TableHead className="text-slate-400">Boutique</TableHead>
                      <TableHead className="hidden md:table-cell text-slate-400">Vendeur</TableHead>
                      <TableHead className="hidden lg:table-cell text-slate-400">Badges actuels</TableHead>
                      <TableHead className="hidden sm:table-cell text-slate-400 text-center">Produits</TableHead>
                      <TableHead className="hidden sm:table-cell text-slate-400 text-center">Abonnés</TableHead>
                      <TableHead className="hidden md:table-cell text-slate-400 text-center">Commandes</TableHead>
                      <TableHead className="text-slate-400">Statut</TableHead>
                      <TableHead className="text-slate-400 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 6 }).map((_, i) => (
                        <TableRow key={i} className="border-slate-700/30">
                          {Array.from({ length: 8 }).map((_, j) => (
                            <TableCell key={j}>
                              <div className="h-4 bg-slate-700/60 animate-pulse rounded w-16" />
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filteredShops.length === 0 ? (
                      <TableRow className="border-slate-700/30">
                        <TableCell colSpan={8} className="text-center py-16">
                          <Store className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400 text-lg font-medium">Aucune boutique trouvée</p>
                          <p className="text-slate-600 text-sm mt-1">
                            {search || filter !== 'ALL'
                              ? 'Aucun résultat pour ces filtres'
                              : 'Les boutiques apparaîtront ici'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredShops.map(shop => {
                        const shopBadges = parseBadges(shop.badges);
                        return (
                          <TableRow key={shop.id} className="border-slate-700/30 hover:bg-slate-800/40">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden border border-slate-700">
                                  {shop.logo ? (
                                    <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" />
                                  ) : (
                                    shop.name.charAt(0).toUpperCase()
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-white truncate max-w-[160px]">{shop.name}</p>
                                  <p className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <MapPin className="h-2.5 w-2.5" />
                                    {shop.city || '—'}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <p className="text-sm text-slate-200 truncate max-w-[140px]">{shop.owner?.name || '—'}</p>
                              <p className="text-[10px] text-slate-500 truncate max-w-[140px]">{shop.owner?.email}</p>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell">
                              <div className="flex items-center gap-1.5">
                                {BADGES.map(b => {
                                  const Icon = b.icon;
                                  const active = shopBadges.includes(b.key);
                                  return (
                                    <div
                                      key={b.key}
                                      title={`${b.label}${active ? ' (actif)' : ' (inactif)'}`}
                                      className={`h-7 w-7 rounded-md flex items-center justify-center border ${
                                        active
                                          ? `bg-gradient-to-br ${b.gradient} text-white border-white/20`
                                          : 'bg-slate-800/60 text-slate-600 border-slate-700'
                                      }`}
                                    >
                                      <Icon className="h-3.5 w-3.5" />
                                    </div>
                                  );
                                })}
                              </div>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-center">
                              <span className="inline-flex items-center gap-1 text-sm text-slate-300">
                                <ShoppingBag className="h-3 w-3 text-slate-500" />
                                {shop._count?.products ?? 0}
                              </span>
                            </TableCell>
                            <TableCell className="hidden sm:table-cell text-center">
                              <span className="inline-flex items-center gap-1 text-sm text-slate-300">
                                <Heart className="h-3 w-3 text-slate-500" />
                                {shop._count?.followers ?? 0}
                              </span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-center">
                              <span className="inline-flex items-center gap-1 text-sm text-slate-300">
                                <Users className="h-3 w-3 text-slate-500" />
                                {shop._count?.orders ?? 0}
                              </span>
                            </TableCell>
                            <TableCell>
                              {shop.isActive ? (
                                <Badge className="bg-green-500/15 text-green-300 border border-green-500/30 text-[10px]">
                                  Active
                                </Badge>
                              ) : (
                                <Badge className="bg-red-500/15 text-red-300 border border-red-500/30 text-[10px]">
                                  Suspendue
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex flex-wrap items-center justify-end gap-1.5">
                                {BADGES.map(b => {
                                  const Icon = b.icon;
                                  const active = shopBadges.includes(b.key);
                                  const toggleKey = `${shop.id}:${b.key}`;
                                  const isBusy = toggling === toggleKey;
                                  return (
                                    <Button
                                      key={b.key}
                                      type="button"
                                      size="sm"
                                      className={`h-7 px-2 text-[10px] font-medium border transition-all ${
                                        active ? b.active : b.inactive
                                      }`}
                                      onClick={() => toggleBadge(shop, b.key, b.label)}
                                      disabled={isBusy}
                                      title={`${b.label} — ${active ? 'Retirer' : 'Attribuer'}`}
                                    >
                                      {isBusy ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <Icon className="h-3 w-3 mr-1" />
                                      )}
                                      <span className="hidden xl:inline">{b.label}</span>
                                      <span className="xl:hidden">{b.label.split(' ')[0]}</span>
                                    </Button>
                                  );
                                })}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Pagination */}
        <motion.div variants={item} className="flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
            disabled={page <= 1 || loading}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Précédent
          </Button>
          <span className="text-sm text-slate-400">
            Page {page} sur {totalPages} {total > 0 && <span className="text-slate-600">· {total} boutique(s)</span>}
          </span>
          <Button
            variant="outline"
            size="sm"
            className="border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
            disabled={page >= totalPages || loading}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          >
            Suivant
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </motion.div>
      </motion.div>
    </AdminSidebar>
  );
}
