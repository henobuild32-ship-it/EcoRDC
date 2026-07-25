'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Activity, Filter, User, Clock, Search,
} from 'lucide-react';

interface ActivityLog {
  id: string;
  action: string;
  details: string | null;
  createdAt: string;
  user?: { name: string; email: string } | null;
}

const ACTION_LABELS: Record<string, string> = {
  SUSPEND_USER: 'Suspension utilisateur',
  REACTIVATE_USER: 'Réactivation utilisateur',
  DELETE_USER: 'Suppression utilisateur',
  RECOMMEND_SHOP: 'Recommandation boutique',
  RESET_PASSWORD: 'Réinitialisation MDP',
  LOGIN: 'Connexion',
  REGISTER: 'Inscription',
  SEND_MESSAGE: 'Envoi message',
  CREATE_ORDER: 'Création commande',
};

const ACTION_COLORS: Record<string, string> = {
  SUSPEND_USER: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
  REACTIVATE_USER: 'bg-green-500/20 text-green-400 border border-green-500/30',
  DELETE_USER: 'bg-red-500/20 text-red-400 border border-red-500/30',
  RECOMMEND_SHOP: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  RESET_PASSWORD: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  LOGIN: 'bg-green-500/20 text-green-400 border border-green-500/30',
  REGISTER: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  SEND_MESSAGE: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30',
  CREATE_ORDER: 'bg-amber-500/20 text-amber-400 border border-amber-500/30',
};

const PAGE_SIZE = 15;

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function AdminActivity() {
  const { token } = useAppStore();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [searchUser, setSearchUser] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const fetchLogs = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin?section=activity', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
      }
    } catch { /* silently handle */ }
  }, [token]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchLogs().then(() => setLoading(false));
    }, 0);
    return () => clearTimeout(timeout);
  }, [fetchLogs]);

  const filteredLogs = useMemo(() => {
    let result = logs;

    if (actionFilter !== 'ALL') {
      result = result.filter((l) => l.action === actionFilter);
    }

    if (searchUser.trim()) {
      const q = searchUser.toLowerCase();
      result = result.filter(
        (l) =>
          (l.user?.name || '').toLowerCase().includes(q) ||
          (l.user?.email || '').toLowerCase().includes(q)
      );
    }

    if (dateFrom) {
      const from = new Date(dateFrom);
      result = result.filter((l) => new Date(l.createdAt) >= from);
    }

    if (dateTo) {
      const to = new Date(dateTo);
      to.setHours(23, 59, 59, 999);
      result = result.filter((l) => new Date(l.createdAt) <= to);
    }

    return result;
  }, [logs, actionFilter, searchUser, dateFrom, dateTo]);

  const visibleLogs = filteredLogs.slice(0, visibleCount);
  const hasMore = visibleCount < filteredLogs.length;

  const uniqueActions = [...new Set(logs.map((l) => l.action))];

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const hasActiveFilters = actionFilter !== 'ALL' || searchUser.trim() || dateFrom || dateTo;

  // Date range display
  const getDateRangeDisplay = () => {
    if (!dateFrom && !dateTo) return null;
    const fromStr = dateFrom ? new Date(dateFrom).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    const toStr = dateTo ? new Date(dateTo).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
    return `${fromStr} → ${toStr}`;
  };

  return (
    <AdminSidebar>
      <motion.div {...fadeIn} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Activity className="h-6 w-6 text-blue-400" />
              Journal d&apos;Activité
            </h1>
            <p className="text-slate-400 text-sm mt-1">{logs.length} entrée(s) dans le journal</p>
          </div>
          {getDateRangeDisplay() && (
            <Badge className="bg-blue-500/15 text-blue-400 border border-blue-500/30">
              <Clock className="h-3 w-3 mr-1" /> {getDateRangeDisplay()}
            </Badge>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
          <Filter className="h-4 w-4 text-slate-500 shrink-0 hidden sm:block" />
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v); setVisibleCount(PAGE_SIZE); }}>
            <SelectTrigger className="w-56 bg-[#1e293b] border-[#334155] text-white">
              <SelectValue placeholder="Filtrer par action" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-[#334155]">
              <SelectItem value="ALL">Toutes les actions</SelectItem>
              {uniqueActions.map((action) => (
                <SelectItem key={action} value={action}>
                  {ACTION_LABELS[action] || action}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Rechercher par utilisateur..."
              value={searchUser}
              onChange={(e) => { setSearchUser(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="pl-9 w-56 bg-[#1e293b] border-[#334155] text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="w-40 bg-[#1e293b] border-[#334155] text-white"
              placeholder="Du"
            />
            <span className="text-xs text-slate-500">→</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setVisibleCount(PAGE_SIZE); }}
              className="w-40 bg-[#1e293b] border-[#334155] text-white"
              placeholder="Au"
            />
          </div>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActionFilter('ALL');
                setSearchUser('');
                setDateFrom('');
                setDateTo('');
                setVisibleCount(PAGE_SIZE);
              }}
              className="text-xs text-slate-400 hover:text-white hover:bg-[#334155]"
            >
              Réinitialiser filtres
            </Button>
          )}
          <span className="text-sm text-slate-500 ml-auto">
            {filteredLogs.length} résultat(s)
          </span>
        </div>

        {/* Activity Log List */}
        <Card className="border border-[#334155] bg-[#1e293b]">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b border-[#334155] text-slate-400">
                    <th className="h-12 px-4 text-left font-medium">Utilisateur</th>
                    <th className="h-12 px-4 text-left font-medium">Action</th>
                    <th className="h-12 px-4 text-left font-medium hidden md:table-cell">Détails</th>
                    <th className="h-12 px-4 text-left font-medium">Date & Heure</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#334155]/50">
                        {Array.from({ length: 4 }).map((_, j) => (
                          <td key={j} className="p-4"><div className="h-4 bg-slate-700 animate-pulse rounded w-24" /></td>
                        ))}
                      </tr>
                    ))
                  ) : visibleLogs.length === 0 ? (
                    <tr className="border-b border-[#334155]/50">
                      <td colSpan={4} className="text-center py-16">
                        <Activity className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                        <p className="text-slate-500 text-sm">Aucune activité trouvée</p>
                      </td>
                    </tr>
                  ) : (
                    visibleLogs.map((log) => (
                      <tr key={log.id} className="border-b border-[#334155]/50 hover:bg-[#0f172a]/50 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-semibold shrink-0">
                              {log.user?.name?.charAt(0).toUpperCase() || '?'}
                            </div>
                            <span className="text-sm font-medium truncate text-slate-200">{log.user?.name || 'Système'}</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={`${ACTION_COLORS[log.action] || 'bg-slate-500/20 text-slate-400 border border-slate-500/30'} text-[10px]`}>
                            {ACTION_LABELS[log.action] || log.action}
                          </Badge>
                        </td>
                        <td className="p-4 hidden md:table-cell text-sm text-slate-400 max-w-xs truncate">
                          {log.details || '—'}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-1.5 text-sm text-slate-500">
                            <Clock className="h-3.5 w-3.5 shrink-0" />
                            <span className="whitespace-nowrap">{formatDate(log.createdAt)}</span>
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

        {/* Load More Button */}
        {hasMore && (
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={() => setVisibleCount(prev => prev + PAGE_SIZE)}
              className="border-[#334155] text-slate-300 hover:bg-[#334155] hover:text-white"
            >
              Charger plus ({filteredLogs.length - visibleCount} restant(s))
            </Button>
          </div>
        )}
      </motion.div>
    </AdminSidebar>
  );
}
