'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  KeyRound, Clock, CheckCircle, User, Mail, Shield, RefreshCw, Copy, Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface PasswordReset {
  id: string;
  status: string;
  createdAt: string;
  user: { id: string; name: string; email: string; role: string };
}

function generateTempPassword(length = 10) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function AdminPasswordResets() {
  const { token } = useAppStore();
  const [resets, setResets] = useState<PasswordReset[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReset, setSelectedReset] = useState<PasswordReset | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [generatedPassword, setGeneratedPassword] = useState('');
  const [copied, setCopied] = useState(false);

  const fetchResets = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin?section=password-resets', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setResets(data.resets || []);
      }
    } catch { /* silently handle */ }
  }, [token]);

  useEffect(() => {
    fetchResets().then(() => setLoading(false));
  }, [fetchResets]);

  const handleResetPassword = async () => {
    if (!selectedReset || !newPassword || !token) return;
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'reset-password', resetId: selectedReset.id, newPassword }),
      });
      if (res.ok) {
        toast.success('Mot de passe réinitialisé avec succès');
        setResetDialogOpen(false);
        setSelectedReset(null);
        setNewPassword('');
        setConfirmPassword('');
        setGeneratedPassword('');
        await fetchResets();
      } else {
        toast.error('Erreur lors de la réinitialisation');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefuse = async (reset: PasswordReset) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'refuse-password-reset', resetId: reset.id }),
      });
      if (res.ok) {
        toast.success('Demande refusée');
        await fetchResets();
      } else {
        toast.error('Erreur');
      }
    } catch {
      toast.error('Erreur de connexion');
    }
  };

  const openResetDialog = (reset: PasswordReset) => {
    setSelectedReset(reset);
    const temp = generateTempPassword();
    setGeneratedPassword(temp);
    setNewPassword(temp);
    setConfirmPassword(temp);
    setCopied(false);
    setResetDialogOpen(true);
  };

  const handleGenerateNew = () => {
    const temp = generateTempPassword();
    setGeneratedPassword(temp);
    setNewPassword(temp);
    setConfirmPassword(temp);
    setCopied(false);
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(generatedPassword);
      setCopied(true);
      toast.success('Mot de passe copié');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

  const getRoleLabel = (role: string) => {
    return role === 'VENDOR' ? 'Vendeur' : role === 'ADMIN' ? 'Admin' : 'Client';
  };

  const getRoleBadgeColor = (role: string) => {
    if (role === 'VENDOR') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    if (role === 'ADMIN') return 'bg-red-500/20 text-red-400 border-red-500/30';
    return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
  };

  const pendingCount = resets.filter((r) => r.status === 'PENDING').length;
  const resolvedCount = resets.filter((r) => r.status === 'RESOLVED').length;

  return (
    <AdminSidebar>
      <motion.div {...fadeIn} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <KeyRound className="h-6 w-6 text-blue-400" />
            Réinitialisations de Mot de Passe
          </h1>
          <p className="text-slate-400 text-sm mt-1">Gérez les demandes de réinitialisation de mot de passe</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border border-[#334155] bg-[#1e293b]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{pendingCount}</p>
                <p className="text-xs text-slate-400">En attente</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-[#334155] bg-[#1e293b]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                <CheckCircle className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{resolvedCount}</p>
                <p className="text-xs text-slate-400">Résolues</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-[#334155] bg-[#1e293b]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Génération auto</p>
                <p className="text-xs text-slate-400">Mot de passe temporaire</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Reset Requests List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 bg-slate-700 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : resets.length === 0 ? (
          <Card className="border border-[#334155] bg-[#1e293b]">
            <CardContent className="py-16 text-center">
              <KeyRound className="h-12 w-12 mx-auto text-slate-600 mb-4" />
              <p className="text-slate-500">Aucune demande de réinitialisation en attente</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <AnimatePresence>
              {resets.map((reset) => (
                <motion.div
                  key={reset.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  layout
                >
                  <Card className={`border bg-[#1e293b] transition-colors ${
                    reset.status === 'PENDING'
                      ? 'border-amber-500/30 hover:border-amber-500/50'
                      : 'border-[#334155] hover:border-[#475569]'
                  }`}>
                    <CardContent className="p-4 md:p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`h-11 w-11 rounded-full flex items-center justify-center text-white font-semibold shrink-0 ${
                            reset.status === 'PENDING'
                              ? 'bg-gradient-to-br from-amber-400 to-amber-600'
                              : 'bg-gradient-to-br from-blue-400 to-blue-600'
                          }`}>
                            {reset.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-white truncate">{reset.user.name}</h3>
                              <Badge className={`border text-[10px] ${
                                reset.status === 'PENDING'
                                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                  : 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                              }`}>
                                {reset.status === 'PENDING' ? 'En attente' : 'Résolue'}
                              </Badge>
                              <Badge className={`border text-[9px] ${getRoleBadgeColor(reset.user.role)}`}>
                                {getRoleLabel(reset.user.role)}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-400">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3.5 w-3.5" />
                                {reset.user.email}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-600 mt-1">Demandé le {formatDate(reset.createdAt)}</p>
                          </div>
                        </div>

                        {reset.status === 'PENDING' && (
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              onClick={() => openResetDialog(reset)}
                              className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
                              size="sm"
                            >
                              <KeyRound className="h-4 w-4" />
                              Générer mot de passe
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1.5"
                              onClick={() => handleRefuse(reset)}
                            >
                              Refuser
                            </Button>
                          </div>
                        )}
                        {reset.status === 'RESOLVED' && (
                          <div className="flex items-center gap-1.5 text-blue-400 text-sm shrink-0">
                            <CheckCircle className="h-4 w-4" />
                            Traité
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Reset Password Dialog */}
        <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                Réinitialiser le mot de passe
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Définissez un nouveau mot de passe pour <strong className="text-white">{selectedReset?.user.name}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              {/* User info */}
              <div className="bg-[#0f172a]/60 rounded-lg p-3 flex items-center gap-3 border border-[#334155]">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
                  {selectedReset?.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white">{selectedReset?.user.name}</p>
                  <p className="text-xs text-slate-400">{selectedReset?.user.email}</p>
                </div>
                <Badge className={`border text-[9px] shrink-0 ${getRoleBadgeColor(selectedReset?.user.role || '')}`}>
                  {getRoleLabel(selectedReset?.user.role || '')}
                </Badge>
              </div>

              {/* Generated password - copyable */}
              {generatedPassword && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">Mot de passe temporaire généré</p>
                      <p className="font-mono text-sm font-bold text-blue-300 mt-0.5 select-all">{generatedPassword}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleCopyPassword}
                        className="text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 h-8"
                      >
                        {copied ? <Check className="h-3.5 w-3.5 mr-1" /> : <Copy className="h-3.5 w-3.5 mr-1" />}
                        {copied ? 'Copié' : 'Copier'}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleGenerateNew}
                        className="text-xs text-slate-400 hover:text-slate-300 hover:bg-[#334155] h-8"
                      >
                        <RefreshCw className="h-3.5 w-3.5 mr-1" />
                        Régénérer
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Auto-filled email */}
              {selectedReset?.user.email && (
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-slate-300 text-sm">Email du compte</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    value={selectedReset.user.email}
                    readOnly
                    className="bg-[#0f172a] border-[#334155] text-slate-400 cursor-not-allowed"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-slate-300 text-sm">Nouveau mot de passe</Label>
                <Input
                  id="new-password"
                  type="text"
                  placeholder="Minimum 6 caractères"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-[#0f172a] border-[#334155] text-white focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-slate-300 text-sm">Confirmer le mot de passe</Label>
                <Input
                  id="confirm-password"
                  type="text"
                  placeholder="Confirmez le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-[#0f172a] border-[#334155] text-white focus:border-blue-500"
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-xs text-red-400">Les mots de passe ne correspondent pas</p>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setResetDialogOpen(false)} className="border-[#334155] text-slate-300 hover:bg-[#334155]">Annuler</Button>
              <Button
                onClick={handleResetPassword}
                disabled={actionLoading || !newPassword || newPassword !== confirmPassword || newPassword.length < 6}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminSidebar>
  );
}
