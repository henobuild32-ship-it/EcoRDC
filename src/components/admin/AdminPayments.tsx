'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Banknote,
  DollarSign,
  Clock,
  XCircle,
  Search,
  MoreVertical,
  RefreshCw,
  Loader2,
  Eye,
  Ban,
} from 'lucide-react';

/* ───────────────────────── Types ───────────────────────── */

interface PaymentVendor {
  id: string;
  name: string;
  email: string;
}

interface Payment {
  id: string;
  vendorId: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  paymentMethod: string;
  transactionRef: string | null;
  pawapayStatus: string | null;
  description: string | null;
  createdAt: string;
  vendor: PaymentVendor;
}

interface PaymentStats {
  registrationRevenue: number;
  subscriptionRevenue: number;
  pendingPayments: number;
  failedPayments: number;
}

/* ───────────────── Stat Card Component ───────────────── */

function StatCard({ label, value, icon: Icon, gradient, isCurrency }: { label: string; value: number; icon: React.ElementType; gradient: string; isCurrency?: boolean }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplayValue(Math.round(value * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);

  return (
    <Card className="overflow-hidden border-0 bg-[#1e293b] shadow-lg shadow-black/20">
      <div className={`h-[2px] bg-gradient-to-r ${gradient}`} />
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-[11px] uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
            <p className="text-xl font-bold mt-1.5 tabular-nums text-white tracking-tight">
              {isCurrency ? (
                <>
                  {displayValue.toLocaleString('fr-CD')}{' '}
                  <span className="text-sm font-medium text-slate-400">CDF</span>
                </>
              ) : displayValue.toLocaleString('fr-CD')}
            </p>
          </div>
          <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg shrink-0`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
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

/* ───────────────── Framer Motion Variants ───────────────── */

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ───────────────── Status Badges ───────────────── */

function TypeBadge({ type }: { type: string }) {
  const config: Record<string, string> = {
    REGISTRATION: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    SUBSCRIPTION: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    RENEWAL: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/25',
    PREPAID: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  };
  const labels: Record<string, string> = {
    REGISTRATION: 'Inscription',
    SUBSCRIPTION: 'Abonnement',
    RENEWAL: 'Renouvellement',
    PREPAID: 'Prépayé (Avance)',
  };
  return (
    <Badge className={`${config[type] || 'bg-slate-500/15 text-slate-400 border-slate-500/25'} border text-[10px] h-5 px-2 font-medium`}>
      {labels[type] || type}
    </Badge>
  );
}

function PaymentStatusBadge({ status }: { status: string }) {
  const config: Record<string, string> = {
    COMPLETED: 'bg-green-500/15 text-green-400 border-green-500/25',
    PENDING: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    FAILED: 'bg-red-500/15 text-red-400 border-red-500/25',
    CANCELLED: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
  };
  const labels: Record<string, string> = {
    COMPLETED: 'Complété',
    PENDING: 'En attente',
    FAILED: 'Échoué',
    CANCELLED: 'Annulé',
  };
  return (
    <Badge className={`${config[status] || config.CANCELLED} border text-[10px] h-5 px-2 font-medium`}>
      {labels[status] || status}
    </Badge>
  );
}

function MethodBadge({ method }: { method: string }) {
  const config: Record<string, string> = {
    GENIUSPAY: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    PAWAPAY: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    MANUAL: 'bg-slate-500/15 text-slate-400 border-slate-500/25',
    ADMIN_GRANT: 'bg-violet-500/15 text-violet-400 border-violet-500/25',
  };
  return (
    <Badge className={`${config[method] || config.MANUAL} border text-[10px] h-5 px-2 font-medium`}>
      {method}
    </Badge>
  );
}

/* ───────────────── Main Component ───────────────────────── */

export default function AdminPayments() {
  const { token } = useAppStore();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  /* ──── Data fetching ──── */

  const fetchData = useCallback(async () => {
    if (!token) return;
    try {
      const params = new URLSearchParams({ section: 'payments' });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (typeFilter !== 'ALL') params.set('type', typeFilter);
      if (search) params.set('search', search);
      if (dateFrom) params.set('from', dateFrom);
      if (dateTo) params.set('to', dateTo);

      const res = await fetch(`/api/admin?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPayments(data.payments || []);
        if (data.stats) setStats(data.stats);
      }
    } catch { /* silent */ }
  }, [token, statusFilter, typeFilter, search, dateFrom, dateTo]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchData();
      setLoading(false);
    };
    load();
  }, [fetchData]);

  /* ──── Actions ──── */

  const handleCheckStatus = async (paymentId: string) => {
    if (!token) return;
    setActionLoading(paymentId);
    try {
      await fetch('/api/pawapay', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check-status', paymentId }),
      });
      await fetchData();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  const handleCancelPayment = async (paymentId: string) => {
    if (!token) return;
    setActionLoading(paymentId);
    try {
      await fetch('/api/pawapay', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel-payment', paymentId }),
      });
      await fetchData();
    } catch { /* silent */ }
    setActionLoading(null);
  };

  /* ──── Helpers ──── */

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatPawaPayStatus = (status: string | null) => {
    if (!status) return <span className="text-slate-600 text-[10px]">N/A</span>;
    const colors: Record<string, string> = {
      ACCEPTED: 'text-blue-400',
      COMPLETED: 'text-green-400',
      REJECTED: 'text-red-400',
      SUBMITTED: 'text-amber-400',
    };
    return (
      <span className={`text-[10px] font-medium ${colors[status] || 'text-slate-400'}`}>
        {status}
      </span>
    );
  };

  /* ──── Stat cards ──── */

  const statCards = stats ? [
    { label: 'Revenus inscriptions', value: stats.registrationRevenue, icon: DollarSign, gradient: 'from-blue-500 to-blue-700' },
    { label: 'Revenus abonnements', value: stats.subscriptionRevenue, icon: Banknote, gradient: 'from-cyan-500 to-cyan-700' },
    { label: 'Paiements en attente', value: stats.pendingPayments, icon: Clock, gradient: 'from-amber-500 to-amber-700' },
    { label: 'Paiements échoués', value: stats.failedPayments, icon: XCircle, gradient: 'from-red-500 to-red-700' },
  ] : [];

  /* ───────────────── Loading State ───────────────── */

  if (loading) {
    return (
      <AdminSidebar>
        <div className="space-y-6">
          <div className="h-8 w-56 bg-slate-800 animate-pulse rounded-lg" />
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
                Paiements
              </h1>
              <p className="text-slate-400 text-sm mt-1">
                Transactions et paiements PawaPay
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
            <StatCard
              key={card.label}
              label={card.label}
              value={card.value}
              icon={card.icon}
              gradient={card.gradient}
              isCurrency={card.label.includes('Revenus')}
            />
          ))}
        </motion.div>

        {/* ════════ FILTERS ════════ */}
        <motion.div variants={item}>
          <Card className="border-0 bg-[#1e293b] shadow-lg shadow-black/20">
            <CardContent className="p-4">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input
                      placeholder="Rechercher par nom vendeur..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500 h-9 text-sm"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-44 bg-slate-800 border-slate-700 text-white h-9 text-sm">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="ALL">Tous les statuts</SelectItem>
                      <SelectItem value="PENDING">En attente</SelectItem>
                      <SelectItem value="COMPLETED">Complété</SelectItem>
                      <SelectItem value="FAILED">Échoué</SelectItem>
                      <SelectItem value="CANCELLED">Annulé</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-full sm:w-44 bg-slate-800 border-slate-700 text-white h-9 text-sm">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="ALL">Tous les types</SelectItem>
                      <SelectItem value="REGISTRATION">Inscription</SelectItem>
                      <SelectItem value="SUBSCRIPTION">Abonnement</SelectItem>
                      <SelectItem value="RENEWAL">Renouvellement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 flex gap-3">
                    <div className="flex-1">
                      <Input
                        type="date"
                        placeholder="Du"
                        value={dateFrom}
                        onChange={(e) => setDateFrom(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white h-9 text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <Input
                        type="date"
                        placeholder="Au"
                        value={dateTo}
                        onChange={(e) => setDateTo(e.target.value)}
                        className="bg-slate-800 border-slate-700 text-white h-9 text-sm"
                      />
                    </div>
                  </div>
                  {(dateFrom || dateTo || search || statusFilter !== 'ALL' || typeFilter !== 'ALL') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-[11px] h-9 text-slate-400 hover:text-white hover:bg-slate-800"
                      onClick={() => {
                        setSearch('');
                        setStatusFilter('ALL');
                        setTypeFilter('ALL');
                        setDateFrom('');
                        setDateTo('');
                      }}
                    >
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ════════ PAYMENTS TABLE ════════ */}
        <motion.div variants={item}>
          <Card className="border-0 bg-[#1e293b] shadow-lg shadow-black/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold text-white flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Banknote className="h-4 w-4 text-blue-400" />
                </div>
                Transactions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700/50">
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Vendeur</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Type</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Montant</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Devise</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Méthode</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Référence</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">PawaPay</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Statut</th>
                      <th className="text-left py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Date</th>
                      <th className="text-right py-3 px-3 text-[11px] uppercase tracking-wider text-slate-500 font-semibold">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td colSpan={10} className="text-center py-12">
                          <Banknote className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                          <p className="text-sm text-slate-500">Aucun paiement trouvé</p>
                          <p className="text-xs text-slate-600 mt-1">Les transactions apparaîtront ici quand les paiements seront effectués</p>
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment, i) => (
                        <motion.tr
                          key={payment.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="border-b border-slate-800 hover:bg-slate-800/40 transition-colors"
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center shrink-0">
                                <span className="text-[10px] font-bold text-slate-300">
                                  {payment.vendor.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="text-slate-200 text-xs truncate max-w-[120px]">{payment.vendor.name}</span>
                            </div>
                          </td>
                          <td className="py-3 px-3"><TypeBadge type={payment.type} /></td>
                          <td className="py-3 px-3">
                            <span className="text-slate-200 font-medium text-xs">
                              {payment.amount.toLocaleString('fr-CD')}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 text-xs">{payment.currency}</td>
                          <td className="py-3 px-3"><MethodBadge method={payment.paymentMethod} /></td>
                          <td className="py-3 px-3">
                            <span className="text-[10px] text-slate-500 font-mono truncate max-w-[100px] block">
                              {payment.transactionRef || '—'}
                            </span>
                          </td>
                          <td className="py-3 px-3">{formatPawaPayStatus(payment.pawapayStatus)}</td>
                          <td className="py-3 px-3"><PaymentStatusBadge status={payment.status} /></td>
                          <td className="py-3 px-3 text-slate-400 text-[11px] whitespace-nowrap">{formatDate(payment.createdAt)}</td>
                          <td className="py-3 px-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-slate-400 hover:text-white hover:bg-slate-800"
                                  disabled={actionLoading === payment.id}
                                >
                                  {actionLoading === payment.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <MoreVertical className="h-4 w-4" />
                                  )}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                                <DropdownMenuItem
                                  className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer text-xs"
                                  onClick={() => handleCheckStatus(payment.id)}
                                >
                                  <Eye className="h-3.5 w-3.5 mr-2 text-blue-400" />
                                  Vérifier le statut
                                </DropdownMenuItem>
                                {payment.status === 'PENDING' && (
                                  <DropdownMenuItem
                                    className="text-slate-300 hover:text-white hover:bg-slate-700 cursor-pointer text-xs"
                                    onClick={() => handleCancelPayment(payment.id)}
                                  >
                                    <Ban className="h-3.5 w-3.5 mr-2 text-red-400" />
                                    Annuler
                                  </DropdownMenuItem>
                                )}
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

        <div className="h-4" />
      </motion.div>
    </AdminSidebar>
  );
}
