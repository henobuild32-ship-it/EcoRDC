'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Flag, Package, Store, User, MessageCircle, Search, Filter,
  Clock, CheckCircle2, XCircle, AlertTriangle, Loader2, Eye,
  ChevronLeft, ChevronRight, Gavel,
} from 'lucide-react';
import { toast } from 'sonner';

type ReportType = 'PRODUCT' | 'SHOP' | 'USER' | 'COMPLAINT';
type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'DISMISSED';
type ReportPriority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

interface Reporter {
  id: string;
  name: string;
  email: string;
  avatar?: string | null;
}

interface ResolvedBy {
  id: string;
  name: string;
}

interface ReportItem {
  id: string;
  type: ReportType;
  reporterId: string;
  targetId: string;
  reason: string;
  description?: string | null;
  status: ReportStatus;
  priority: ReportPriority;
  adminResponse?: string | null;
  resolvedById?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  reporter: Reporter;
  resolvedBy?: ResolvedBy | null;
}

interface ReportStats {
  pending: number;
  reviewing: number;
  resolved: number;
  dismissed: number;
  urgent: number;
  total: number;
}

const TYPE_CONFIG: Record<ReportType, { icon: React.ElementType; label: string; color: string }> = {
  PRODUCT: { icon: Package, label: 'Produit', color: 'bg-violet-500/15 text-violet-300 border-violet-500/30' },
  SHOP: { icon: Store, label: 'Boutique', color: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30' },
  USER: { icon: User, label: 'Utilisateur', color: 'bg-blue-500/15 text-blue-300 border-blue-500/30' },
  COMPLAINT: { icon: MessageCircle, label: 'Plainte', color: 'bg-rose-500/15 text-rose-300 border-rose-500/30' },
};

const PRIORITY_CONFIG: Record<ReportPriority, { label: string; className: string }> = {
  LOW: { label: 'Basse', className: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  NORMAL: { label: 'Normale', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  HIGH: { label: 'Haute', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  URGENT: { label: 'Urgente', className: 'bg-red-500/20 text-red-300 border-red-500/30 animate-pulse' },
};

const STATUS_CONFIG: Record<ReportStatus, { label: string; className: string }> = {
  PENDING: { label: 'En attente', className: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  REVIEWING: { label: 'En cours', className: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  RESOLVED: { label: 'Résolu', className: 'bg-green-500/20 text-green-300 border-green-500/30' },
  DISMISSED: { label: 'Classé', className: 'bg-slate-500/20 text-slate-400 border-slate-500/30' },
};

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function AdminReports() {
  const { token } = useAppStore();
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [stats, setStats] = useState<ReportStats>({
    pending: 0, reviewing: 0, resolved: 0, dismissed: 0, urgent: 0, total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [resolveTarget, setResolveTarget] = useState<ReportItem | null>(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchReports = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        section: 'reports',
        status: statusFilter,
        type: typeFilter,
        priority: priorityFilter,
        page: page.toString(),
        limit: '20',
      });
      if (search.trim()) params.set('search', search.trim());

      const res = await fetch(`/api/admin?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
        setStats(data.stats || {
          pending: 0, reviewing: 0, resolved: 0, dismissed: 0, urgent: 0, total: 0,
        });
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || 0);
      }
    } catch {
      // silently handle
    } finally {
      setLoading(false);
    }
  }, [token, statusFilter, typeFilter, priorityFilter, page, search]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchReports();
    }, 400);
    return () => clearTimeout(timer);
  }, [search, fetchReports]);

  const updateReportLocally = (id: string, patch: Partial<ReportItem>) => {
    setReports(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
    setStats(prev => ({ ...prev })); // stats will be refreshed on next fetch
  };

  const takeCharge = async (report: ReportItem) => {
    if (!token) return;
    setBusyId(report.id);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'resolve-report',
          reportId: report.id,
          status: 'REVIEWING',
        }),
      });
      if (res.ok) {
        toast.success('Signalement pris en charge');
        updateReportLocally(report.id, { status: 'REVIEWING' });
        // Refresh to get updated stats
        fetchReports();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Erreur lors de la prise en charge');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setBusyId(null);
    }
  };

  const openResolveDialog = (report: ReportItem) => {
    setResolveTarget(report);
    setAdminResponse(report.adminResponse || '');
  };

  const handleResolve = async () => {
    if (!resolveTarget || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'resolve-report',
          reportId: resolveTarget.id,
          status: 'RESOLVED',
          adminResponse: adminResponse.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success('Signalement résolu');
        updateReportLocally(resolveTarget.id, {
          status: 'RESOLVED',
          adminResponse: adminResponse.trim() || null,
        });
        setResolveTarget(null);
        setAdminResponse('');
        fetchReports();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Erreur lors de la résolution');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDismiss = async () => {
    if (!resolveTarget || !token) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'resolve-report',
          reportId: resolveTarget.id,
          status: 'DISMISSED',
          adminResponse: adminResponse.trim() || null,
        }),
      });
      if (res.ok) {
        toast.success('Signalement classé sans suite');
        updateReportLocally(resolveTarget.id, {
          status: 'DISMISSED',
          adminResponse: adminResponse.trim() || null,
        });
        setResolveTarget(null);
        setAdminResponse('');
        fetchReports();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Erreur lors du classement');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });

  const statCards = [
    {
      key: 'pending', label: 'En attente', value: stats.pending,
      icon: Clock, gradient: 'from-amber-500 to-amber-600',
    },
    {
      key: 'reviewing', label: 'En cours', value: stats.reviewing,
      icon: Loader2, gradient: 'from-blue-500 to-blue-600',
    },
    {
      key: 'resolved', label: 'Résolus', value: stats.resolved,
      icon: CheckCircle2, gradient: 'from-green-500 to-green-600',
    },
    {
      key: 'urgent', label: 'Urgents', value: stats.urgent,
      icon: AlertTriangle, gradient: 'from-red-500 to-red-600',
    },
  ];

  return (
    <AdminSidebar>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item}>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Flag className="h-7 w-7 text-rose-400" />
            Gestion des Signalements
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Traitez les plaintes, signalements de produits, vendeurs et utilisateurs
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={item} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {statCards.map(card => {
            const Icon = card.icon;
            return (
              <Card key={card.key} className="border border-slate-700/50 bg-[#1e293b] shadow-lg">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center text-white shrink-0`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-slate-400 truncate">{card.label}</p>
                    <p className="text-xl font-bold text-white">{card.value}</p>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </motion.div>

        {/* Filters */}
        <motion.div variants={item} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative sm:col-span-2 lg:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
            <Input
              placeholder="Rechercher un signalement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#1e293b] border-slate-700 text-white placeholder:text-slate-500 focus:border-rose-500"
            />
          </div>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="bg-[#1e293b] border-slate-700 text-white">
              <Filter className="h-4 w-4 mr-2 text-slate-500" />
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-slate-700">
              <SelectItem value="ALL">Tous les types</SelectItem>
              <SelectItem value="PRODUCT">Produits</SelectItem>
              <SelectItem value="SHOP">Boutiques</SelectItem>
              <SelectItem value="USER">Utilisateurs</SelectItem>
              <SelectItem value="COMPLAINT">Plaintes</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
            <SelectTrigger className="bg-[#1e293b] border-slate-700 text-white">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-slate-700">
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="PENDING">En attente</SelectItem>
              <SelectItem value="REVIEWING">En cours</SelectItem>
              <SelectItem value="RESOLVED">Résolus</SelectItem>
              <SelectItem value="DISMISSED">Classés sans suite</SelectItem>
            </SelectContent>
          </Select>
          <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(1); }}>
            <SelectTrigger className="bg-[#1e293b] border-slate-700 text-white">
              <SelectValue placeholder="Priorité" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-slate-700">
              <SelectItem value="ALL">Toutes priorités</SelectItem>
              <SelectItem value="LOW">Basse</SelectItem>
              <SelectItem value="NORMAL">Normale</SelectItem>
              <SelectItem value="HIGH">Haute</SelectItem>
              <SelectItem value="URGENT">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </motion.div>

        {/* Reports Table */}
        <motion.div variants={item}>
          <Card className="border border-slate-700/50 bg-[#1e293b] shadow-lg">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-slate-700/50 hover:bg-transparent">
                      <TableHead className="text-slate-400">Type</TableHead>
                      <TableHead className="text-slate-400">Raison</TableHead>
                      <TableHead className="hidden md:table-cell text-slate-400">Description</TableHead>
                      <TableHead className="text-slate-400">Signalé par</TableHead>
                      <TableHead className="text-slate-400">Priorité</TableHead>
                      <TableHead className="text-slate-400">Statut</TableHead>
                      <TableHead className="hidden lg:table-cell text-slate-400">Date</TableHead>
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
                    ) : reports.length === 0 ? (
                      <TableRow className="border-slate-700/30">
                        <TableCell colSpan={8} className="text-center py-16">
                          <Flag className="h-12 w-12 text-slate-600 mx-auto mb-3" />
                          <p className="text-slate-400 text-lg font-medium">Aucun signalement trouvé</p>
                          <p className="text-slate-600 text-sm mt-1">
                            {search || typeFilter !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL'
                              ? 'Aucun résultat pour ces filtres'
                              : 'Les signalements apparaîtront ici'}
                          </p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      reports.map(report => {
                        const typeCfg = TYPE_CONFIG[report.type] || TYPE_CONFIG.COMPLAINT;
                        const priorityCfg = PRIORITY_CONFIG[report.priority] || PRIORITY_CONFIG.NORMAL;
                        const statusCfg = STATUS_CONFIG[report.status] || STATUS_CONFIG.PENDING;
                        const TypeIcon = typeCfg.icon;
                        const isBusy = busyId === report.id;
                        const isClosed = report.status === 'RESOLVED' || report.status === 'DISMISSED';
                        return (
                          <TableRow key={report.id} className="border-slate-700/30 hover:bg-slate-800/40">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className={`h-8 w-8 rounded-lg flex items-center justify-center border ${typeCfg.color}`}>
                                  <TypeIcon className="h-4 w-4" />
                                </div>
                                <span className="text-xs text-slate-300 hidden sm:inline">{typeCfg.label}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="text-sm font-medium text-white max-w-[160px] truncate">{report.reason}</p>
                              <span className="text-[10px] text-slate-500 uppercase tracking-wide">{report.type}</span>
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <p className="text-xs text-slate-400 max-w-[220px] truncate">
                                {report.description || <span className="text-slate-600">—</span>}
                              </p>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {report.reporter?.avatar ? (
                                  <img
                                    src={report.reporter.avatar}
                                    alt={report.reporter.name}
                                    className="h-7 w-7 rounded-full object-cover border border-slate-700 shrink-0"
                                  />
                                ) : (
                                  <div className="h-7 w-7 rounded-full bg-slate-700 flex items-center justify-center text-xs text-slate-300 shrink-0">
                                    {report.reporter?.name?.charAt(0).toUpperCase() || '?'}
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm text-slate-200 truncate max-w-[120px]">{report.reporter?.name || '—'}</p>
                                  <p className="text-[10px] text-slate-500 truncate max-w-[120px]">{report.reporter?.email}</p>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${priorityCfg.className}`}>
                                {priorityCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={`text-[10px] ${statusCfg.className}`}>
                                {statusCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden lg:table-cell text-sm text-slate-400">
                              {formatDate(report.createdAt)}
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1 flex-wrap">
                                {report.status === 'PENDING' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[11px] text-blue-300 hover:text-blue-200 hover:bg-blue-500/10"
                                    onClick={() => takeCharge(report)}
                                    disabled={isBusy}
                                  >
                                    {isBusy ? (
                                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                    ) : (
                                      <Gavel className="h-3 w-3 mr-1" />
                                    )}
                                    Prendre en charge
                                  </Button>
                                )}
                                {!isClosed && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[11px] text-green-300 hover:text-green-200 hover:bg-green-500/10"
                                    onClick={() => openResolveDialog(report)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Résoudre
                                  </Button>
                                )}
                                {isClosed && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-[11px] text-slate-400 hover:text-slate-200 hover:bg-slate-700/40"
                                    onClick={() => openResolveDialog(report)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Détails
                                  </Button>
                                )}
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
            Page {page} sur {totalPages} {total > 0 && <span className="text-slate-600">· {total} signalement(s)</span>}
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

      {/* Resolve / Dismiss Dialog */}
      <Dialog
        open={!!resolveTarget}
        onOpenChange={(open) => {
          if (!open) {
            setResolveTarget(null);
            setAdminResponse('');
          }
        }}
      >
        <DialogContent className="bg-[#1e293b] border-slate-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-white">
              <Gavel className="h-5 w-5 text-rose-400" />
              Traitement du signalement
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Examinez les détails et choisissez une action définitive.
            </DialogDescription>
          </DialogHeader>

          {resolveTarget && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-[#0f172a]/60 border border-slate-700/50 p-3">
                  <p className="text-[10px] uppercase text-slate-500 mb-1">Type</p>
                  <div className="flex items-center gap-2">
                    {(() => {
                      const cfg = TYPE_CONFIG[resolveTarget.type] || TYPE_CONFIG.COMPLAINT;
                      const Icon = cfg.icon;
                      return (
                        <>
                          <Icon className="h-4 w-4 text-slate-300" />
                          <span className="text-slate-200">{cfg.label}</span>
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="rounded-lg bg-[#0f172a]/60 border border-slate-700/50 p-3">
                  <p className="text-[10px] uppercase text-slate-500 mb-1">Priorité</p>
                  <Badge
                    variant="outline"
                    className={`text-[10px] ${PRIORITY_CONFIG[resolveTarget.priority]?.className || ''}`}
                  >
                    {PRIORITY_CONFIG[resolveTarget.priority]?.label || resolveTarget.priority}
                  </Badge>
                </div>
              </div>

              <div className="rounded-lg bg-[#0f172a]/60 border border-slate-700/50 p-3">
                <p className="text-[10px] uppercase text-slate-500 mb-1">Raison</p>
                <p className="text-sm text-white font-medium">{resolveTarget.reason}</p>
              </div>

              {resolveTarget.description && (
                <div className="rounded-lg bg-[#0f172a]/60 border border-slate-700/50 p-3">
                  <p className="text-[10px] uppercase text-slate-500 mb-1">Description</p>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap">{resolveTarget.description}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-[#0f172a]/60 border border-slate-700/50 p-3">
                  <p className="text-[10px] uppercase text-slate-500 mb-1">Signalé par</p>
                  <p className="text-slate-200">{resolveTarget.reporter?.name || '—'}</p>
                  <p className="text-xs text-slate-500">{resolveTarget.reporter?.email}</p>
                </div>
                <div className="rounded-lg bg-[#0f172a]/60 border border-slate-700/50 p-3">
                  <p className="text-[10px] uppercase text-slate-500 mb-1">Date</p>
                  <p className="text-slate-200">{formatDate(resolveTarget.createdAt)}</p>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 mb-1.5 block">
                  Réponse administrative
                </label>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Expliquez la décision ou les actions entreprises..."
                  rows={4}
                  className="bg-[#0f172a] border-slate-700 text-white placeholder:text-slate-500 focus:border-rose-500 resize-none"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              className="border-slate-700 text-slate-300 hover:bg-slate-800"
              onClick={() => {
                setResolveTarget(null);
                setAdminResponse('');
              }}
              disabled={submitting}
            >
              <XCircle className="h-4 w-4 mr-1" />
              Annuler
            </Button>
            <Button
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              onClick={handleDismiss}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <XCircle className="h-4 w-4 mr-1" />}
              Classer sans suite
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={handleResolve}
              disabled={submitting}
            >
              {submitting ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
              Résoudre
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminSidebar>
  );
}
