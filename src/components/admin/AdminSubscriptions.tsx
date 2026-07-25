'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore, type AppView } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  CreditCard,
  AlertTriangle,
  Pause,
  DollarSign,
  Search,
  MoreVertical,
  Gift,
  CalendarPlus,
  RefreshCw,
  Edit3,
  Eye,
  Loader2,
} from 'lucide-react';

/* ───────────────────────── Types ───────────────────────── */

interface VendorInfo {
  id: string;
  name: string;
  email: string;
  isSuspended: boolean;
  isActive: boolean;
  shop?: { id: string; name: string; slug: string } | null;
}

interface Subscription {
  id: string;
  vendorId: string;
  status: string;
  startDate: string | null;
  expiryDate: string | null;
  amount: number;
  freeMonths: number;
  createdAt: string;
  vendor: VendorInfo;
}

interface SubStats {
  active: number;
  expired: number;
  inactive: number;
  monthlyRevenue: number;
}

/* ───────────────── Animated Counter Hook ───────────────── */

function useAnimatedCounter(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    prevTarget.current = target;
    const start = count;
    const diff = target - start;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setCount(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

/* ───────────────── Stat Card Component ───────────────── */

function StatCard({ card }: { card: { label: string; value: number; icon: React.ElementType; gradient: string; isCurrency?: boolean } }) {
  const animatedValue = useAnimatedCounter(card.value);
  return (
    <Card className="overflow-hidden border-0 bg-[#1e293b] shadow-lg shadow-black/20">
      <div className={`h-[2px] bg-gradient-to-r ${card.gradient}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{card.label}</p>
            <p className="text-xl font-bold mt-1.5 tabular-nums text-white tracking-tight">
              {card.isCurrency ? (
                <>
                  {animatedValue.toLocaleString('fr-CD')}{' '}
                  <span className="text-sm font-medium text-slate-400">CDF</span>
                </>
              ) : animatedValue.toLocaleString('fr-CD')}
            </p>
          </div>
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center shadow-lg shrink-0`}>
            <card.icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ───────────────── Framer Motion Variants ───────────────── */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ───────────────── Status Badge ───────────────── */

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    ACTIVE: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    EXPIRED: 'bg-red-500/15 text-red-400 border-red-500/25',
    INACTIVE: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    TRIAL: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  };
  const labels: Record<string, string> = {
    ACTIVE: 'Actif',
    EXPIRED: 'Expiré',
    INACTIVE: 'Inactif',
    TRIAL: 'Essai',
  };
  return (
    <Badge className={`${config[status] || config.INACTIVE} border text-[10px] h-5 px-2 font-medium`}>
      {labels[status] || status}
    </Badge>
  );
}

/* ───────────────── Main Component ───────────────────────── */

export default function AdminSubscriptions() {
  const { token, setCurrentView } = useAppStore();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [stats, setStats] = useState<SubStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Dialogs
  const [grantFreeMonthsOpen, setGrantFreeMonthsOpen] = useState(false);
  const [extendSubOpen, setExtendSubOpen] = useState(false);
  const [changeStatusOpen, setChangeStatusOpen] = useState(false);
  const [selectedSub, setSelectedSub] = useState<Subscription | null>(null);
  const [months, setMonths] = useState(1);
  const [reason, setReason] = useState('');
  const [newStatus, setNewStatus] = useState('ACTIVE');
  const [actionLoading, setActionLoading] = useState(false);

  /* ──── Data fetching ──── */

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({ section: 'subscriptions' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscriptions(data.subscriptions || []);
        if (data.stats) setStats(data.stats);
      }
    } catch { /* silent */ }
  }, [token, statusFilter, search]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    load();
  }, [fetchData]);

  /* ──── Actions ──── */

  const handleGrantFreeMonths = async () => {
    if (!selectedSub || !token) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grant-free-months',
          subscriptionId: selectedSub.id,
          months,
          reason,
        }),
      });
      if (res.ok) {
        await fetchData();
        setGrantFreeMonthsOpen(false);
        setMonths(1);
        setReason('');
        setSelectedSub(null);
      }
    } catch { /* silent */ }
    setActionLoading(false);
  };

  const handleExtendSubscription = async () => {
    if (!selectedSub || !token) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'extend-subscription',
          subscriptionId: selectedSub.id,
          months,
          reason,
        }),
      });
      if (res.ok) {
        await fetchData();
        setExtendSubOpen(false);
        setMonths(1);
        setReason('');
        setSelectedSub(null);
      }
    } catch { /* silent */ }
    setActionLoading(false);
  };

  const handleChangeStatus = async () => {
    if (!selectedSub || !token) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-status',
          subscriptionId: selectedSub.id,
          status: newStatus,
        }),
      });
      if (res.ok) {
        await fetchData();
        setChangeStatusOpen(false);
        setSelectedSub(null);
      }
    } catch { /* silent */ }
    setActionLoading(false);
  };

  const handleReactivate = async (sub: Subscription) => {
    if (!token) return;
    try {
      await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reactivate-vendor', subscriptionId: sub.id }),
      });
      await fetchData();
    } catch { /* silent */ }
  };

  /* ──── Helpers ──── */

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getDaysRemaining = (expiryDate: string | null) => {
    if (!expiryDate) return '—';
    const diff = new Date(expiryDate).getTime() - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    if (days < 0) return <span className="text-red-400">{Math.abs(days)}j dépassés</span>;
    if (days <= 7) return <span className="text-amber-400">{days}j</span>;
    return <span className="text-slate-300">{days}j</span>;
  };

  /* ──── Stat cards ──── */

  const statCards = stats ? [
    { label: 'Abonnements actifs', value: stats.active, icon: CreditCard, gradient: 'from-blue-500 to-blue-700' },
    { label: 'Abonnements expirés', value: stats.expired, icon: AlertTriangle, gradient: 'from-red-500 to-red-700' },
    { label: 'Abonnements inactifs', value: stats.inactive, icon: Pause, gradient: 'from-amber-500 to-amber-700' },
    { label: 'Revenus abonnements ce mois', value: stats.monthlyRevenue, icon: DollarSign, gradient: 'from-green-500 to-green-700', isCurrency: true },
  ] : [];

  /* ───────────────── Loading State ───────────────── */

  if (loading) {
    return (
      <AdminSidebar>
        <div className="space-y-6">
          <div className="h-8 w-64 bg-slate-800 animate-pulse rounded-lg" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-800/80 animate-pulse rounded-xl" />
            ))}
          </div>
          <div className="h-96 bg-slate-800/80 animate-pulse rounded-xl" />
        </div>
      </AdminSidebar>
    );
  }

  /* ───────────────── Render ───────────────── */

  return (
    <AdminSidebar>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">

        {/* ════════ HEADER ════════ */}
        <motion.div variants={item}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                Abonnements
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Gestion des abonnements vendeurs et paiements
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[11px] h-8 text-slate-400 hover:text-white hover:bg-slate-800"
              onClick={fetchData}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              Actualiser
            </Button>
          </div>
        </motion.div>

        {/* ════════ STATS GRID ════════ */}
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          {statCards.map((card) => (
            <StatCard key={card.label} card={card} />
          ))}
        </motion.div>

        {/* ════════ FILTERS ════════ */}
        <motion.div variants={item}>
          <Card className="border-0 bg-[#1e293b] shadow-lg shadow-black/20">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    placeholder="Rechercher par nom ou email vendeur..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-9 text-sm"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48 bg-slate-800 border-slate-700 text-white h-9 text-sm">
                    <SelectValue placeholder="Statut" />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="ALL">Tous les statuts</SelectItem>
                    <SelectItem value="ACTIVE">Actif</SelectItem>
                    <SelectItem value="EXPIRED">Expiré</SelectItem>
                    <SelectItem value="INACTIVE">Inactif</SelectItem>
                    <SelectItem value="TRIAL">Essai</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ════════ SUBSCRIPTIONS TABLE ════════ */}
        <motion.div variants={item}>
          <Card className="border-0 bg-[#1e293b] shadow-lg shadow-black/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-blue-400" />
                </div>
                Liste des abonnements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Vendeur</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Email</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Statut</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Date début</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Expiration</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Jours rest.</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Montant</th>
                      <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptions.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12">
                          <CreditCard className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                          <p className="text-sm text-slate-500">Aucun abonnement trouvé</p>
                          <p className="text-xs text-slate-600 mt-1">Les abonnements apparaîtront ici quand les vendeurs s&apos;inscriront</p>
                        </td>
                      </tr>
                    ) : (
                      subscriptions.map((sub, i) => (
                        <motion.tr
                          key={sub.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="h-8 w-8 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-slate-300">
                                  {sub.vendor.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-slate-200 truncate text-sm">{sub.vendor.name}</p>
                                {sub.vendor.shop && (
                                  <p className="text-[10px] text-slate-500 truncate">{sub.vendor.shop.name}</p>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-xs">{sub.vendor.email}</td>
                          <td className="py-3 px-3">
                            <StatusBadge status={sub.status} />
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-xs">{formatDate(sub.startDate)}</td>
                          <td className="py-3 px-3 text-slate-400 text-xs">{formatDate(sub.expiryDate)}</td>
                          <td className="py-3 px-3 text-xs">{getDaysRemaining(sub.expiryDate)}</td>
                          <td className="py-3 px-3">
                            <span className="text-slate-200 font-medium text-xs">
                              {sub.amount.toLocaleString('fr-CD')} <span className="text-slate-500">CDF</span>
                            </span>
                            {sub.freeMonths > 0 && (
                              <Badge className="ml-1.5 bg-cyan-500/15 text-cyan-400 border border-cyan-500/25 text-[9px] h-4 px-1.5">
                                +{sub.freeMonths} mois offerts
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                <DropdownMenuItem
                                  className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer text-xs"
                                  onClick={() => {
                                    setSelectedSub(sub);
                                    setMonths(1);
                                    setReason('');
                                    setGrantFreeMonthsOpen(true);
                                  }}
                                >
                                  <Gift className="h-3.5 w-3.5 mr-2 text-cyan-400" />
                                  Offrir des mois gratuits
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer text-xs"
                                  onClick={() => {
                                    setSelectedSub(sub);
                                    setMonths(1);
                                    setReason('');
                                    setExtendSubOpen(true);
                                  }}
                                >
                                  <CalendarPlus className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                  Prolonger l&apos;abonnement
                                </DropdownMenuItem>
                                {sub.vendor.isSuspended && (
                                  <DropdownMenuItem
                                    className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer text-xs"
                                    onClick={() => handleReactivate(sub)}
                                  >
                                    <RefreshCw className="h-3.5 w-3.5 mr-2 text-amber-400" />
                                    Réactiver le vendeur
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer text-xs"
                                  onClick={() => {
                                    setSelectedSub(sub);
                                    setNewStatus(sub.status);
                                    setChangeStatusOpen(true);
                                  }}
                                >
                                  <Edit3 className="h-3.5 w-3.5 mr-2 text-violet-400" />
                                  Modifier le statut
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer text-xs"
                                  onClick={() => {
                                    setCurrentView('admin-payments');
                                  }}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-2 text-slate-400" />
                                  Voir les paiements
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ════════ GRANT FREE MONTHS DIALOG ════════ */}
        <Dialog open={grantFreeMonthsOpen} onOpenChange={setGrantFreeMonthsOpen}>
          <DialogContent className="bg-[#1e293b] border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Gift className="h-4 w-4 text-cyan-400" />
                </div>
                Offrir des mois gratuits
              </DialogTitle>
            </DialogHeader>
            {selectedSub && (
              <div className="space-y-4 py-2">
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-300">
                        {selectedSub.vendor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{selectedSub.vendor.name}</p>
                      <p className="text-[11px] text-slate-400">{selectedSub.vendor.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={selectedSub.status} />
                        <span className="text-[10px] text-slate-500">
                          Expire: {formatDate(selectedSub.expiryDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs">Nombre de mois (1-12)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={months}
                    onChange={(e) => setMonths(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="bg-slate-800 border-slate-700 text-white h-9 text-sm"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs">Raison (optionnel)</Label>
                  <Input
                    placeholder="Ex: Promotion de lancement..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white h-9 text-sm"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setGrantFreeMonthsOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Annuler
              </Button>
              <Button
                onClick={handleGrantFreeMonths}
                disabled={actionLoading}
                className="bg-cyan-600 hover:bg-cyan-700 text-white"
              >
                {actionLoading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Accorder
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ════════ EXTEND SUBSCRIPTION DIALOG ════════ */}
        <Dialog open={extendSubOpen} onOpenChange={setExtendSubOpen}>
          <DialogContent className="bg-[#1e293b] border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <CalendarPlus className="h-4 w-4 text-blue-400" />
                </div>
                Prolonger l&apos;abonnement
              </DialogTitle>
            </DialogHeader>
            {selectedSub && (
              <div className="space-y-4 py-2">
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-300">
                        {selectedSub.vendor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{selectedSub.vendor.name}</p>
                      <p className="text-[11px] text-slate-400">{selectedSub.vendor.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={selectedSub.status} />
                        <span className="text-[10px] text-slate-500">
                          Expire: {formatDate(selectedSub.expiryDate)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs">Nombre de mois (1-12)</Label>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={months}
                    onChange={(e) => setMonths(Math.min(12, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="bg-slate-800 border-slate-700 text-white h-9 text-sm"
                  />
                  <p className="text-[10px] text-slate-500">
                    Coût: {(months * selectedSub.amount).toLocaleString('fr-CD')} CDF
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs">Raison (optionnel)</Label>
                  <Input
                    placeholder="Ex: Paiement reçu hors ligne..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="bg-slate-800 border-slate-700 text-white h-9 text-sm"
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setExtendSubOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Annuler
              </Button>
              <Button
                onClick={handleExtendSubscription}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionLoading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Prolonger
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ════════ CHANGE STATUS DIALOG ════════ */}
        <Dialog open={changeStatusOpen} onOpenChange={setChangeStatusOpen}>
          <DialogContent className="bg-[#1e293b] border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <Edit3 className="h-4 w-4 text-violet-400" />
                </div>
                Modifier le statut
              </DialogTitle>
            </DialogHeader>
            {selectedSub && (
              <div className="space-y-4 py-2">
                <div className="p-3 rounded-xl bg-slate-800 border border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center">
                      <span className="text-sm font-bold text-slate-300">
                        {selectedSub.vendor.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-white text-sm">{selectedSub.vendor.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-slate-500">Actuel:</span>
                        <StatusBadge status={selectedSub.status} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300 text-xs">Nouveau statut</Label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="ACTIVE">Actif</SelectItem>
                      <SelectItem value="EXPIRED">Expiré</SelectItem>
                      <SelectItem value="INACTIVE">Inactif</SelectItem>
                    </SelectContent>
                  </Select>
                  {(newStatus === 'INACTIVE' || newStatus === 'EXPIRED') && (
                    <p className="text-[10px] text-amber-400 mt-1">
                      ⚠ Le compte vendeur sera suspendu automatiquement
                    </p>
                  )}
                  {newStatus === 'ACTIVE' && (
                    <p className="text-[10px] text-blue-400 mt-1">
                      ℹ Le compte vendeur sera réactivé automatiquement
                    </p>
                  )}
                </div>
              </div>
            )}
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setChangeStatusOpen(false)}
                className="text-slate-400 hover:text-white hover:bg-slate-800"
              >
                Annuler
              </Button>
              <Button
                onClick={handleChangeStatus}
                disabled={actionLoading}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {actionLoading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
                Modifier
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="h-4" />
      </motion.div>
    </AdminSidebar>
  );
}
