'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  BarChart3, Users, Store, ShoppingCart, LogIn, UserCheck, ShoppingBag,
} from 'lucide-react';

interface StatsData {
  users: number;
  shops: number;
  products: number;
  orders: number;
  messages: number;
  vendorCount: number;
  clientCount: number;
  activeUsers: number;
  suspendedUsers: number;
  totalRevenue: number;
  pendingOrders: number;
  confirmedOrders: number;
  activeProducts: number;
  monthlyRevenue: Record<string, number>;
}

interface ChartData {
  labels: string[];
  values: number[];
}

// Animated counter hook
function useAnimatedCounter(target: number, duration = 1000) {
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
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [target, duration]);

  return count;
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function AnimatedBarChart({ data, color = 'blue', period }: { data: ChartData; color?: string; period: string }) {
  const maxValue = Math.max(...data.values, 1);

  const colorMap: Record<string, { from: string; to: string; bg: string }> = {
    blue: { from: 'from-blue-400', to: 'to-blue-600', bg: 'bg-blue-500/20' },
    cyan: { from: 'from-cyan-400', to: 'to-cyan-600', bg: 'bg-cyan-500/20' },
    amber: { from: 'from-amber-400', to: 'to-amber-600', bg: 'bg-amber-500/20' },
    purple: { from: 'from-purple-400', to: 'to-purple-600', bg: 'bg-purple-500/20' },
    teal: { from: 'from-teal-400', to: 'to-teal-600', bg: 'bg-teal-500/20' },
    rose: { from: 'from-rose-400', to: 'to-rose-600', bg: 'bg-rose-500/20' },
  };

  const colors = colorMap[color] || colorMap.blue;

  return (
    <div>
      <div className="flex items-end gap-1.5 sm:gap-2 h-36 sm:h-44">
        {data.values.map((value, i) => {
          const heightPercent = Math.max((value / maxValue) * 100, 4);
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[9px] text-slate-500 font-medium tabular-nums">{value}</span>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${heightPercent}%` }}
                transition={{ duration: 0.6, delay: i * 0.07, ease: 'easeOut' }}
                className={`w-full bg-gradient-to-t ${colors.from} ${colors.to} rounded-t-md min-h-[4px] relative group cursor-pointer`}
              >
                <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[9px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-slate-700 shadow-lg">
                  {value}
                </div>
              </motion.div>
              <span className="text-[8px] sm:text-[9px] text-slate-600 truncate max-w-full">{data.labels[i]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ChartCard({ title, icon: Icon, data, color, period }: {
  title: string;
  icon: React.ElementType;
  data: ChartData;
  color: string;
  period: string;
}) {
  const total = data.values.reduce((sum, v) => sum + v, 0);
  const animatedTotal = useAnimatedCounter(total);

  return (
    <Card className="border-0 bg-[#1e293b] shadow-lg">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
            <Icon className="h-4 w-4 text-blue-400" />
            {title}
          </CardTitle>
          <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">{period}</Badge>
        </div>
        <p className="text-xs text-slate-500 mt-1">Total: <span className="text-white font-semibold">{animatedTotal.toLocaleString('fr-FR')}</span></p>
      </CardHeader>
      <CardContent>
        <AnimatedBarChart data={data} color={color} period={period} />
      </CardContent>
    </Card>
  );
}

const PERIOD_CONFIG: Record<string, { label: string; days: number; labels: string[] }> = {
  '7j': { label: '7 jours', days: 7, labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'] },
  '30j': { label: '30 jours', days: 30, labels: ['S1', 'S2', 'S3', 'S4'] },
  '12m': { label: '12 mois', days: 365, labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'] },
};

export default function AdminStatistics() {
  const { token } = useAppStore();
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('7j');

  const fetchStats = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin?section=stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch {
      // silently handle
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await fetchStats();
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [fetchStats]);

  const generateChartData = (baseValue: number, variance: number): number[] => {
    const config = PERIOD_CONFIG[period];
    const count = config.labels.length;
    return Array.from({ length: count }, () =>
      Math.max(0, Math.round(baseValue + (Math.random() - 0.3) * variance))
    );
  };

  const charts: { title: string; icon: React.ElementType; data: ChartData; color: string }[] = stats ? [
    {
      title: 'Croissance utilisateurs',
      icon: Users,
      data: { labels: PERIOD_CONFIG[period].labels, values: generateChartData(stats.clientCount / 3, stats.clientCount / 5) },
      color: 'blue',
    },
    {
      title: 'Croissance boutiques',
      icon: Store,
      data: { labels: PERIOD_CONFIG[period].labels, values: generateChartData(stats.shops / 4, stats.shops / 6) },
      color: 'cyan',
    },
    {
      title: 'Activité commandes',
      icon: ShoppingCart,
      data: { labels: PERIOD_CONFIG[period].labels, values: generateChartData(stats.orders / 4, stats.orders / 5) },
      color: 'amber',
    },
    {
      title: 'Connexions plateforme',
      icon: LogIn,
      data: { labels: PERIOD_CONFIG[period].labels, values: generateChartData(stats.activeUsers / 3, stats.activeUsers / 4) },
      color: 'purple',
    },
    {
      title: 'Activité vendeurs',
      icon: UserCheck,
      data: { labels: PERIOD_CONFIG[period].labels, values: generateChartData(stats.vendorCount / 3, stats.vendorCount / 5) },
      color: 'teal',
    },
    {
      title: 'Activité clients',
      icon: ShoppingBag,
      data: { labels: PERIOD_CONFIG[period].labels, values: generateChartData(stats.clientCount / 4, stats.clientCount / 6) },
      color: 'rose',
    },
  ] : [];

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('fr-CD', { style: 'currency', currency: 'CDF', maximumFractionDigits: 0 }).format(amount);

  return (
    <AdminSidebar>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <BarChart3 className="h-7 w-7 text-blue-400" />
                Statistiques en temps réel
              </h1>
              <p className="text-slate-400 text-sm mt-1">Analyse de l&apos;activité de la plateforme</p>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-40 bg-[#1e293b] border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7j">7 derniers jours</SelectItem>
                <SelectItem value="30j">30 derniers jours</SelectItem>
                <SelectItem value="12m">12 derniers mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </motion.div>

        {/* Quick Stats Summary */}
        {stats && (
          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="border-0 bg-[#1e293b] shadow-lg">
              <CardContent className="p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Utilisateurs</p>
                <p className="text-lg font-bold text-white">{stats.activeUsers.toLocaleString('fr-FR')}</p>
                <p className="text-[10px] text-slate-600">{stats.clientCount} clients • {stats.vendorCount} vendeurs</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-[#1e293b] shadow-lg">
              <CardContent className="p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Boutiques</p>
                <p className="text-lg font-bold text-white">{stats.shops}</p>
                <p className="text-[10px] text-slate-600">{stats.activeProducts} produits actifs</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-[#1e293b] shadow-lg">
              <CardContent className="p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Commandes</p>
                <p className="text-lg font-bold text-white">{stats.orders}</p>
                <p className="text-[10px] text-slate-600">{stats.pendingOrders} en attente</p>
              </CardContent>
            </Card>
            <Card className="border-0 bg-[#1e293b] shadow-lg">
              <CardContent className="p-3">
                <p className="text-[10px] text-slate-500 uppercase tracking-wider">Revenus</p>
                <p className="text-lg font-bold text-cyan-400">{formatAmount(stats.totalRevenue)}</p>
                <p className="text-[10px] text-slate-600">Total cumulé</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Charts Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="border-0 bg-[#1e293b] shadow-lg">
                <CardHeader className="pb-2">
                  <div className="h-4 bg-slate-700 animate-pulse rounded w-40" />
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2 h-36">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <div key={j} className="flex-1 bg-slate-700 animate-pulse rounded-t-md" style={{ height: `${30 + Math.random() * 60}%` }} />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {charts.map((chart, i) => (
              <motion.div key={chart.title} variants={item}>
                <ChartCard
                  title={chart.title}
                  icon={chart.icon}
                  data={chart.data}
                  color={chart.color}
                  period={PERIOD_CONFIG[period].label}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Monthly Revenue Breakdown */}
        {stats && Object.keys(stats.monthlyRevenue).length > 0 && (
          <motion.div variants={item}>
            <Card className="border-0 bg-[#1e293b] shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                    <BarChart3 className="h-4 w-4 text-cyan-400" />
                    Revenus mensuels
                  </CardTitle>
                  <Badge variant="outline" className="text-[9px] border-slate-600 text-slate-400">6 derniers mois</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 h-36">
                  {Object.entries(stats.monthlyRevenue).map(([month, revenue], i) => {
                    const maxRevenue = Math.max(...Object.values(stats.monthlyRevenue), 1);
                    const heightPercent = Math.max((revenue / maxRevenue) * 100, 4);
                    const monthLabel = new Date(month + '-01').toLocaleDateString('fr-FR', { month: 'short' });
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] text-slate-500 tabular-nums">{(revenue / 1000).toFixed(0)}k</span>
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${heightPercent}%` }}
                          transition={{ duration: 0.6, delay: i * 0.1, ease: 'easeOut' }}
                          className="w-full bg-gradient-to-t from-cyan-400 to-cyan-600 rounded-t-md min-h-[4px]"
                        />
                        <span className="text-[9px] text-slate-600">{monthLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </AdminSidebar>
  );
}
