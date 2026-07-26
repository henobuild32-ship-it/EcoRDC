'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  ShoppingBag, Search, Star, Package, Trash2, MapPin,
  UserCheck, UserX, Eye, Phone, Mail, Clock, Globe,
  Edit3, X, Save,
} from 'lucide-react';
import { toast } from 'sonner';

interface ShopItem {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  category?: string;
  city?: string;
  country?: string;
  phone?: string;
  email?: string;
  commune?: string;
  hours?: string;
  socials?: string;
  currency?: string;
  isRecommended: boolean;
  recommendationStatus: string;
  isActive: boolean;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  products: { id: string }[];
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function AdminShops() {
  const { token } = useAppStore();
  const [shops, setShops] = useState<ShopItem[]>([]);
  const [filteredShops, setFilteredShops] = useState<ShopItem[]>([]);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [recommendedFilter, setRecommendedFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState<'name' | 'recommended'>('recommended');
  const [loading, setLoading] = useState(true);
  const [toggleLoading, setToggleLoading] = useState<string | null>(null);
  const [deleteShop, setDeleteShop] = useState<ShopItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editShop, setEditShop] = useState<ShopItem | null>(null);
  const [editData, setEditData] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchShops = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin?section=all-shops&limit=5000', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setShops(data.shops || []);
        setLastUpdated(new Date());
      }
    } catch { /* silently handle */ }
  }, [token]);

  useEffect(() => {
    fetchShops().then(() => setLoading(false));
    const interval = setInterval(() => {
      fetchShops();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchShops]);

  const categories = useMemo(() => {
    const cats = [...new Set(shops.map(s => s.category).filter(Boolean))];
    return cats.sort();
  }, [shops]);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = shops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.owner.name.toLowerCase().includes(q) ||
        (s.category || '').toLowerCase().includes(q) ||
        (s.city || '').toLowerCase().includes(q)
    );
    if (categoryFilter !== 'ALL') {
      result = result.filter(s => s.category === categoryFilter);
    }
    if (recommendedFilter === 'recommended') {
      result = result.filter(s => s.isRecommended);
    } else if (recommendedFilter === 'not-recommended') {
      result = result.filter(s => !s.isRecommended);
    }
    if (sortOrder === 'recommended') {
      result.sort((a, b) => (b.isRecommended ? 1 : 0) - (a.isRecommended ? 1 : 0) || a.name.localeCompare(b.name));
    } else {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }
    setFilteredShops(result);
  }, [shops, search, categoryFilter, recommendedFilter, sortOrder]);

  const toggleRecommendation = async (shop: ShopItem) => {
    if (!token) return;
    setToggleLoading(shop.id);
    try {
      const newStatus = shop.isRecommended ? 'NONE' : 'APPROVED';
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'recommend-shop', shopId: shop.id, status: newStatus }),
      });
      if (res.ok) {
        toast.success(shop.isRecommended ? 'Recommandation retirée' : 'Boutique recommandée');
        await fetchShops();
      } else {
        toast.error('Erreur lors de l\'opération');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setToggleLoading(null);
    }
  };

  const handleDeleteShop = async () => {
    if (!deleteShop || !token) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/shops?id=${deleteShop.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Boutique supprimée');
        await fetchShops();
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setDeleteLoading(false);
      setDeleteShop(null);
    }
  };

  const handleToggleActive = async (shop: ShopItem) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: shop.isActive ? 'delete-shop' : 'reactivate-shop', shopId: shop.id }),
      });
      if (res.ok) {
        toast.success(shop.isActive ? 'Boutique suspendue' : 'Boutique réactivée');
        await fetchShops();
      } else {
        toast.error('Erreur');
      }
    } catch {
      toast.error('Erreur de connexion');
    }
  };

  const openEdit = (shop: ShopItem) => {
    setEditShop(shop);
    setEditData({
      name: shop.name || '',
      description: shop.description || '',
      category: shop.category || '',
      address: (shop as any).address || '',
      city: shop.city || '',
      country: shop.country || '',
      phone: shop.phone || '',
      email: shop.email || '',
      commune: shop.commune || '',
      hours: shop.hours || '',
      socials: shop.socials || '',
      currency: shop.currency || 'CDF',
    });
  };

  const handleEditSave = async () => {
    if (!editShop || !token) return;
    setSaving(true);
    try {
      const res = await fetch('/api/shops', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ shopId: editShop.id, ...editData }),
      });
      if (res.ok) {
        toast.success('Boutique mise à jour');
        setEditShop(null);
        await fetchShops();
      } else {
        const data = await res.json();
        toast.error(data.error || 'Erreur');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const getRecommendationBadge = (shop: ShopItem) => {
    if (shop.isRecommended) return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]"><Star className="h-3 w-3 mr-0.5" /> Recommandée</Badge>;
    if (shop.recommendationStatus === 'PENDING') return <Badge className="bg-blue-500/20 text-blue-400 border border-blue-500/30 text-[10px]">En attente</Badge>;
    if (shop.recommendationStatus === 'REJECTED') return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]">Refusée</Badge>;
    return <Badge variant="outline" className="text-[10px] border-[#334155] text-slate-400">Standard</Badge>;
  };

  const recommendedCount = shops.filter(s => s.isRecommended).length;

  return (
    <AdminSidebar>
      <motion.div {...fadeIn} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <ShoppingBag className="h-6 w-6 text-blue-400" />
              Gestion des Boutiques
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-400 text-sm">
                <strong className="text-white">{shops.length}</strong> boutique(s) · {recommendedCount} recommandée(s)
              </p>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full text-xs font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>En temps réel</span>
                {lastUpdated && (
                  <span className="text-[10px] text-emerald-300/70">
                    • {lastUpdated.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-[#1e293b] border-[#334155] text-white placeholder:text-slate-500 focus:border-blue-500" />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-44 bg-[#1e293b] border-[#334155] text-white">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-[#334155]">
              <SelectItem value="ALL">Toutes catégories</SelectItem>
              {categories.map(cat => <SelectItem key={cat} value={cat || ''}>{cat}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={recommendedFilter} onValueChange={setRecommendedFilter}>
            <SelectTrigger className="w-44 bg-[#1e293b] border-[#334155] text-white">
              <SelectValue placeholder="Recommandation" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-[#334155]">
              <SelectItem value="ALL">Toutes</SelectItem>
              <SelectItem value="recommended">Recommandées</SelectItem>
              <SelectItem value="not-recommended">Non recommandées</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as 'name' | 'recommended')}>
            <SelectTrigger className="w-40 bg-[#1e293b] border-[#334155] text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-[#334155]">
              <SelectItem value="recommended">Recommandées d'abord</SelectItem>
              <SelectItem value="name">Alphabétique</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Shop Table */}
        <Card className="border border-[#334155] bg-[#1e293b] shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b border-[#334155] text-slate-400">
                    <th className="h-12 px-4 text-left font-medium">Boutique</th>
                    <th className="h-12 px-4 text-left font-medium hidden sm:table-cell">Propriétaire</th>
                    <th className="h-12 px-4 text-left font-medium hidden md:table-cell">Catégorie</th>
                    <th className="h-12 px-4 text-left font-medium hidden md:table-cell">Ville</th>
                    <th className="h-12 px-4 text-left font-medium hidden md:table-cell">Produits</th>
                    <th className="h-12 px-4 text-left font-medium">Badge</th>
                    <th className="h-12 px-4 text-left font-medium w-56">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#334155]/50">
                        {Array.from({ length: 7 }).map((_, j) => (
                          <td key={j} className="p-4"><div className="h-4 bg-slate-700 animate-pulse rounded w-20" /></td>
                        ))}
                      </tr>
                    ))
                  ) : filteredShops.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-16">
                        <ShoppingBag className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                        <p className="text-slate-500 text-sm">
                          {search || categoryFilter !== 'ALL' || recommendedFilter !== 'ALL' ? 'Aucune boutique trouvée pour ces filtres' : 'Aucune boutique enregistrée'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredShops.map((shop) => (
                      <tr key={shop.id} className="border-b border-[#334155]/50 hover:bg-[#0f172a]/50">
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden">
                              {shop.logo ? <img src={shop.logo} alt={shop.name} className="w-full h-full object-cover" /> : shop.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-sm truncate text-slate-200">{shop.name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 hidden sm:table-cell text-sm text-slate-400">{shop.owner.name}</td>
                        <td className="p-4 hidden md:table-cell">
                          {shop.category ? <Badge className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30">{shop.category}</Badge> : <span className="text-sm text-slate-500">—</span>}
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <span className="text-sm text-slate-400 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-500" />{shop.city || shop.commune || '—'}
                          </span>
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          <div className="flex items-center gap-1.5 text-sm text-slate-300">
                            <Package className="h-3.5 w-3.5 text-slate-500" />{shop.products.length}
                          </div>
                        </td>
                        <td className="p-4">{getRecommendationBadge(shop)}</td>
                        <td className="p-4">
                          <div className="flex items-center gap-1 flex-wrap">
                            <Button variant="ghost" size="sm" className="h-7 text-[11px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10" onClick={() => openEdit(shop)}>
                              <Eye className="h-3 w-3 mr-1" />Détails
                            </Button>
                            <Button variant={shop.isRecommended ? 'outline' : 'default'} size="sm"
                              className={`h-7 text-[11px] ${shop.isRecommended ? 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                              onClick={() => toggleRecommendation(shop)} disabled={toggleLoading === shop.id}>
                              <Star className="h-3 w-3 mr-1" />{shop.isRecommended ? 'Retirer' : 'Recommander'}
                            </Button>
                            <Button variant="ghost" size="sm" className={`h-7 text-[11px] ${shop.isActive ? 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10' : 'text-green-400 hover:text-green-300 hover:bg-green-500/10'}`} onClick={() => handleToggleActive(shop)}>
                              {shop.isActive ? <><UserX className="h-3 w-3 mr-1" />Suspendre</> : <><UserCheck className="h-3 w-3 mr-1" />Réactiver</>}
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 text-slate-400 hover:text-red-400 hover:bg-red-500/10 p-0" onClick={() => setDeleteShop(shop)}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Shop Edit Dialog */}
        <Dialog open={!!editShop} onOpenChange={() => setEditShop(null)}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-white max-w-lg max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-white">
                <Edit3 className="h-5 w-5 text-blue-400" /> Modifier {editShop?.name}
              </DialogTitle>
            </DialogHeader>
            {editShop && (
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Nom</label>
                    <Input value={editData.name} onChange={(e) => setEditData(p => ({ ...p, name: e.target.value }))} className="bg-[#0f172a] border-[#334155] text-white h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Catégorie</label>
                    <Input value={editData.category} onChange={(e) => setEditData(p => ({ ...p, category: e.target.value }))} className="bg-[#0f172a] border-[#334155] text-white h-9 text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Description</label>
                  <Textarea value={editData.description} onChange={(e) => setEditData(p => ({ ...p, description: e.target.value }))} className="bg-[#0f172a] border-[#334155] text-white text-sm min-h-[60px]" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400"><Phone className="h-3 w-3 inline mr-1" />Téléphone</label>
                    <Input value={editData.phone} onChange={(e) => setEditData(p => ({ ...p, phone: e.target.value }))} className="bg-[#0f172a] border-[#334155] text-white h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400"><Mail className="h-3 w-3 inline mr-1" />Email</label>
                    <Input value={editData.email} onChange={(e) => setEditData(p => ({ ...p, email: e.target.value }))} className="bg-[#0f172a] border-[#334155] text-white h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400"><MapPin className="h-3 w-3 inline mr-1" />Adresse</label>
                    <Input value={editData.address} onChange={(e) => setEditData(p => ({ ...p, address: e.target.value }))} className="bg-[#0f172a] border-[#334155] text-white h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Ville</label>
                    <Input value={editData.city} onChange={(e) => setEditData(p => ({ ...p, city: e.target.value }))} className="bg-[#0f172a] border-[#334155] text-white h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Commune / Quartier</label>
                    <Input value={editData.commune} onChange={(e) => setEditData(p => ({ ...p, commune: e.target.value }))} className="bg-[#0f172a] border-[#334155] text-white h-9 text-sm" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400">Pays</label>
                    <Input value={editData.country} onChange={(e) => setEditData(p => ({ ...p, country: e.target.value }))} className="bg-[#0f172a] border-[#334155] text-white h-9 text-sm" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400"><Clock className="h-3 w-3 inline mr-1" />Horaires</label>
                    <Input value={editData.hours} onChange={(e) => setEditData(p => ({ ...p, hours: e.target.value }))} className="bg-[#0f172a] border-[#334155] text-white h-9 text-sm" placeholder="Lun-Sam: 8h-18h" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs text-slate-400"><Globe className="h-3 w-3 inline mr-1" />Devise</label>
                    <Select value={editData.currency} onValueChange={(v) => setEditData(p => ({ ...p, currency: v }))}>
                      <SelectTrigger className="bg-[#0f172a] border-[#334155] text-white h-9 text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e293b] border-[#334155]">
                        <SelectItem value="CDF">CDF</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-slate-400">Réseaux sociaux / Liens</label>
                  <Input value={editData.socials} onChange={(e) => setEditData(p => ({ ...p, socials: e.target.value }))} className="bg-[#0f172a] border-[#334155] text-white h-9 text-sm" />
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" className="border-[#334155] text-slate-300 hover:bg-[#334155]" onClick={() => setEditShop(null)}>
                    <X className="h-4 w-4 mr-1" /> Annuler
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleEditSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-1" /> {saving ? 'Sauvegarde...' : 'Enregistrer'}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={!!deleteShop} onOpenChange={() => setDeleteShop(null)}>
          <AlertDialogContent className="bg-[#1e293b] border-[#334155]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-white"><Trash2 className="h-5 w-5 text-red-400" /> Supprimer la boutique</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                La boutique <strong className="text-white">{deleteShop?.name}</strong> et ses produits seront désactivés.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#334155] text-slate-300 border-[#334155] hover:bg-[#475569]">Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteShop} disabled={deleteLoading} className="bg-red-600 hover:bg-red-700 text-white">
                {deleteLoading ? 'Suppression...' : 'Désactiver'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </AdminSidebar>
  );
}
