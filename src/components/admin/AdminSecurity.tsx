'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Shield, AlertTriangle, Ban, Unlock, Lock, Activity, Eye,
  ShieldAlert, LogIn, MonitorSmartphone, Search, Plus,
} from 'lucide-react';

interface LoginAttempt {
  id: string;
  ip: string;
  email: string;
  status: 'success' | 'failed';
  timestamp: string;
}

interface BlockedIP {
  id: string;
  ip: string;
  reason: string;
  dateBlocked: string;
}

interface SecurityAlert {
  id: string;
  type: string;
  message: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface SecurityLog {
  id: string;
  action: string;
  details: string;
  timestamp: string;
  user?: string;
}

interface SecurityData {
  failedLogins: number;
  activeSessions: number;
  blockedIPs: number;
  alerts: number;
  loginAttempts: LoginAttempt[];
  blockedIPList: BlockedIP[];
  securityLogs: SecurityLog[];
  securityAlerts: SecurityAlert[];
}

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function AdminSecurity() {
  const { token } = useAppStore();
  const [data, setData] = useState<SecurityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [blockUserEmail, setBlockUserEmail] = useState('');
  const [blockIP, setBlockIP] = useState('');
  const [blockIPReason, setBlockIPReason] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchSecurityData = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin?section=security', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        setData(result.security || null);
      }
    } catch {
      // silently handle - use demo data
    }
  }, [token]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      await fetchSecurityData();
      if (!cancelled) setLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [fetchSecurityData]);

  const handleBlockUser = async () => {
    if (!blockUserEmail.trim() || !token) return;
    setProcessing('block-user');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'suspend-user', userId: blockUserEmail, reason: 'Blocage administrateur - sécurité' }),
      });
      if (res.ok) {
        setBlockUserEmail('');
        fetchSecurityData();
      }
    } catch {
      // silently handle
    } finally {
      setProcessing(null);
    }
  };

  const handleUnblockIP = async (ipId: string) => {
    setProcessing(ipId);
    // Simulated - in production this would call an API
    setTimeout(() => {
      if (data) {
        setData({
          ...data,
          blockedIPList: data.blockedIPList.filter(ip => ip.id !== ipId),
          blockedIPs: data.blockedIPs - 1,
        });
      }
      setProcessing(null);
    }, 500);
  };

  const handleBlockIP = async () => {
    if (!blockIP.trim() || !token) return;
    setProcessing('block-ip');
    // Simulated - in production this would call an API
    setTimeout(() => {
      if (data) {
        setData({
          ...data,
          blockedIPList: [
            { id: Date.now().toString(), ip: blockIP, reason: blockIPReason || 'Blocage manuel', dateBlocked: new Date().toISOString() },
            ...data.blockedIPList,
          ],
          blockedIPs: data.blockedIPs + 1,
        });
      }
      setBlockIP('');
      setBlockIPReason('');
      setProcessing(null);
    }, 500);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400';
      case 'high': return 'bg-orange-500/20 text-orange-400';
      case 'medium': return 'bg-amber-500/20 text-amber-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const getSeverityLabel = (severity: string) => {
    switch (severity) {
      case 'critical': return 'Critique';
      case 'high': return 'Élevée';
      case 'medium': return 'Moyenne';
      case 'low': return 'Basse';
      default: return severity;
    }
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      LOGIN: 'bg-cyan-500/20 text-cyan-400',
      REGISTER: 'bg-teal-500/20 text-teal-400',
      SUSPEND_USER: 'bg-amber-500/20 text-amber-400',
      BLOCK_IP: 'bg-red-500/20 text-red-400',
      ALERT: 'bg-orange-500/20 text-orange-400',
    };
    return colors[action] || 'bg-slate-500/20 text-slate-400';
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

  // Demo data for when API doesn't return security section
  const demoData: SecurityData = data || {
    failedLogins: 0,
    activeSessions: 0,
    blockedIPs: 0,
    alerts: 0,
    loginAttempts: [],
    blockedIPList: [],
    securityLogs: [],
    securityAlerts: [],
  };

  return (
    <AdminSidebar>
      <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={item}>
          <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
            <Shield className="h-7 w-7 text-blue-400" />
            Sécurité
          </h1>
          <p className="text-slate-400 text-sm mt-1">Surveillance et protection de la plateforme</p>
        </motion.div>

        {/* Overview Cards */}
        <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Tentatives échouées</p>
                <p className="text-xl font-bold text-red-400">{demoData.failedLogins}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white shrink-0">
                <MonitorSmartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Sessions actives</p>
                <p className="text-xl font-bold text-blue-400">{demoData.activeSessions}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-white shrink-0">
                <Ban className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">IPs bloquées</p>
                <p className="text-xl font-bold text-amber-400">{demoData.blockedIPs}</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-red-600 to-red-700 flex items-center justify-center text-white shrink-0">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs text-slate-400">Alertes sécurité</p>
                <p className="text-xl font-bold text-red-400">{demoData.alerts}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Login Attempts Table */}
        <motion.div variants={item}>
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                <LogIn className="h-4 w-4 text-blue-400" />
                Tentatives de connexion
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="h-10 bg-slate-800 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : demoData.loginAttempts.length === 0 ? (
                <div className="text-center py-8">
                  <LogIn className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Aucune tentative de connexion enregistrée</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-slate-700/50 hover:bg-transparent">
                        <TableHead className="text-slate-400">Adresse IP</TableHead>
                        <TableHead className="text-slate-400">Email</TableHead>
                        <TableHead className="text-slate-400">Statut</TableHead>
                        <TableHead className="text-slate-400">Date</TableHead>
                        <TableHead className="text-slate-400 text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demoData.loginAttempts.map(attempt => (
                        <TableRow key={attempt.id} className="border-slate-700/30">
                          <TableCell className="font-mono text-sm text-slate-300">{attempt.ip}</TableCell>
                          <TableCell className="text-sm text-slate-300">{attempt.email}</TableCell>
                          <TableCell>
                            {attempt.status === 'success' ? (
                              <Badge className="bg-green-500/20 text-green-400 border-0 text-[10px]">Réussie</Badge>
                            ) : (
                              <Badge className="bg-red-500/20 text-red-400 border-0 text-[10px]">Échouée</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500">{formatDate(attempt.timestamp)}</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm" className="h-7 text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10">
                              <Ban className="h-3 w-3 mr-1" /> Bloquer IP
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Blocked IPs */}
        <motion.div variants={item}>
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                <Ban className="h-4 w-4 text-amber-400" />
                IPs bloquées
              </CardTitle>
            </CardHeader>
            <CardContent>
              {demoData.blockedIPList.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Aucune IP bloquée</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto scrollbar-thin">
                  {demoData.blockedIPList.map(blocked => (
                    <div key={blocked.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium text-white">{blocked.ip}</span>
                          <Badge className="bg-red-500/20 text-red-400 border-0 text-[9px]">Bloquée</Badge>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{blocked.reason} • {formatDate(blocked.dateBlocked)}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs text-green-400 hover:text-green-300 hover:bg-green-500/10 shrink-0"
                        onClick={() => handleUnblockIP(blocked.id)}
                        disabled={processing === blocked.id}
                      >
                        <Unlock className="h-3 w-3 mr-1" />
                        Débloquer
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Block User & Block IP Forms */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                <Lock className="h-4 w-4 text-red-400" />
                Blocage utilisateur
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Email de l'utilisateur"
                  value={blockUserEmail}
                  onChange={(e) => setBlockUserEmail(e.target.value)}
                  className="flex-1 bg-[#0f172a] border-slate-700 text-white placeholder:text-slate-500"
                />
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white shrink-0"
                  onClick={handleBlockUser}
                  disabled={!blockUserEmail.trim() || processing === 'block-user'}
                >
                  {processing === 'block-user' ? (
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Ban className="h-4 w-4 mr-1" /> Bloquer</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-slate-600 mt-2">Suspend le compte de l&apos;utilisateur immédiatement</p>
            </CardContent>
          </Card>

          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                <Ban className="h-4 w-4 text-amber-400" />
                Blocage IP
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Adresse IP (ex: 192.168.1.1)"
                    value={blockIP}
                    onChange={(e) => setBlockIP(e.target.value)}
                    className="flex-1 bg-[#0f172a] border-slate-700 text-white placeholder:text-slate-500"
                  />
                  <Button
                    className="bg-amber-600 hover:bg-amber-700 text-white shrink-0"
                    onClick={handleBlockIP}
                    disabled={!blockIP.trim() || processing === 'block-ip'}
                  >
                    {processing === 'block-ip' ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <><Plus className="h-4 w-4 mr-1" /> Bloquer</>
                    )}
                  </Button>
                </div>
                <Input
                  placeholder="Raison du blocage (optionnel)"
                  value={blockIPReason}
                  onChange={(e) => setBlockIPReason(e.target.value)}
                  className="bg-[#0f172a] border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Logs */}
        <motion.div variants={item}>
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                <Activity className="h-4 w-4 text-blue-400" />
                Logs de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-10 bg-slate-800 animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : demoData.securityLogs.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Aucun log de sécurité</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                  {demoData.securityLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50">
                      <Badge className={`${getActionColor(log.action)} border-0 text-[9px] h-5 shrink-0 mt-0.5`}>
                        {log.action}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300">{log.details}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-slate-500">{formatDate(log.timestamp)}</span>
                          {log.user && <span className="text-[10px] text-slate-600">par {log.user}</span>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Security Alerts */}
        <motion.div variants={item}>
          <Card className="border-0 bg-[#1e293b] shadow-lg">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-white">
                <ShieldAlert className="h-4 w-4 text-red-400" />
                Alertes de sécurité
              </CardTitle>
            </CardHeader>
            <CardContent>
              {demoData.securityAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <Shield className="h-10 w-10 text-slate-700 mx-auto mb-2" />
                  <p className="text-slate-500 text-sm">Aucune alerte de sécurité active</p>
                  <p className="text-slate-600 text-xs mt-1">La plateforme est sécurisée</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                  {demoData.securityAlerts.map(alert => (
                    <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/50 border-l-2 border-red-500/50">
                      <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${
                        alert.severity === 'critical' ? 'text-red-400' :
                        alert.severity === 'high' ? 'text-orange-400' :
                        alert.severity === 'medium' ? 'text-amber-400' : 'text-blue-400'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-300">{alert.message}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge className={`${getSeverityColor(alert.severity)} border-0 text-[9px] h-5`}>
                            {getSeverityLabel(alert.severity)}
                          </Badge>
                          <span className="text-[10px] text-slate-500">{formatDate(alert.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </motion.div>
    </AdminSidebar>
  );
}
