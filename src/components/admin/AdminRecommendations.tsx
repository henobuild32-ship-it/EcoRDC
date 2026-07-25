'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Star, CheckCircle, XCircle, Clock, Store, User, Shield, MinusCircle } from 'lucide-react';
import { toast } from 'sonner';

interface PendingShop {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category?: string;
  recommendationStatus: string;
  isRecommended: boolean;
  createdAt: string;
  owner: { id: string; name: string; email: string };
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function AdminRecommendations() {
  const { token } = useAppStore();
  const [shops, setShops] = useState<PendingShop[]>([]);
  const [recommendedShops, setRecommendedShops] = useState<PendingShop[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedShop, setSelectedShop] = useState<PendingShop | null>(null);
  const [actionType, setActionType] = useState<'approve' | 'reject' | 'hold' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchShops = useCallback(async () => {
    if (!token) return;
    try {
      const [pendingRes, allShopsRes] = await Promise.all([
        fetch('/api/admin?section=recommendations', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin?section=all-shops', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setShops(data.shops || []);
      }
      if (allShopsRes.ok) {
        const data = await allShopsRes.json();
        setRecommendedShops((data.shops || []).filter((s: PendingShop) => s.isRecommended));
      }
    } catch { /* silently handle */ }
  }, [token]);

  useEffect(() => {
    fetchShops().then(() => setLoading(false));
  }, [fetchShops]);

  const handleAction = async () => {
    if (!selectedShop || !actionType || !token) return;
    setActionLoading(true);
    try {
      const status = actionType === 'approve' ? 'APPROVED' : actionType === 'reject' ? 'REJECTED' : 'NONE';
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'recommend-shop', shopId: selectedShop.id, status }),
      });
      if (res.ok) {
        toast.success(
          actionType === 'approve' ? 'Boutique recommandée !' :
          actionType === 'reject' ? 'Recommandation refusée' :
          'Recommandation mise en attente'
        );
        await fetchShops();
      } else {
        toast.error('Erreur lors de l\'opération');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(false);
      setSelectedShop(null);
      setActionType(null);
    }
  };

  const handleRevoke = async (shopId: string) => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'recommend-shop', shopId, status: 'NONE' }),
      });
      if (res.ok) {
        toast.success('Recommandation révoquée');
        await fetchShops();
      } else {
        toast.error('Erreur lors de la révocation');
      }
    } catch {
      toast.error('Erreur de connexion');
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <AdminSidebar>
      <motion.div {...fadeIn} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Star className="h-6 w-6 text-amber-400" />
            Gestion des Recommandations
          </h1>
          <p className="text-slate-400 text-sm mt-1">Approuvez ou refusez les demandes de badge de recommandation</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card className="border border-[#334155] bg-[#1e293b]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{shops.length}</p>
                <p className="text-xs text-slate-400">En attente</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-[#334155] bg-[#1e293b]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Star className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{recommendedShops.length}</p>
                <p className="text-xs text-slate-400">Recommandées</p>
              </div>
            </CardContent>
          </Card>
          <Card className="border border-[#334155] bg-[#1e293b]">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                <Shield className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Aperçu du badge</p>
                <div className="mt-1 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-amber-500/20 border border-amber-500/30">
                  <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                  <span className="text-xs text-amber-300 font-medium">Recommandé</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section 1: Demandes en attente */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-300">
            <Clock className="h-4 w-4 text-amber-400" />
            Demandes en attente
          </h3>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-32 bg-slate-700 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : shops.length === 0 ? (
            <Card className="border border-[#334155] bg-[#1e293b]">
              <CardContent className="py-16 text-center">
                <Star className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-500">Aucune demande de recommandation en attente</p>
              </CardContent>
            </Card>
          ) : (
            <AnimatePresence>
              {shops.map((shop) => (
                <motion.div
                  key={shop.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  layout
                >
                  <Card className="border border-[#334155] bg-[#1e293b] hover:border-[#475569] transition-colors">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                            {shop.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-white truncate">{shop.name}</h3>
                              <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] shrink-0">
                                <Clock className="h-3 w-3 mr-0.5" /> En attente
                              </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1.5 text-sm text-slate-400">
                              <span className="flex items-center gap-1">
                                <User className="h-3.5 w-3.5" />
                                {shop.owner.name}
                              </span>
                              <span className="flex items-center gap-1">
                                <Store className="h-3.5 w-3.5" />
                                {shop.owner.email}
                              </span>
                            </div>
                            {shop.description && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{shop.description}</p>
                            )}
                            <p className="text-[10px] text-slate-600 mt-1">Demandé le {formatDate(shop.createdAt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            onClick={() => { setSelectedShop(shop); setActionType('approve'); }}
                            className="bg-green-600 hover:bg-green-700 text-white gap-1.5"
                            size="sm"
                          >
                            <CheckCircle className="h-4 w-4" />
                            Accepter
                          </Button>
                          <Button
                            onClick={() => { setSelectedShop(shop); setActionType('hold'); }}
                            variant="outline"
                            className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-1.5"
                            size="sm"
                          >
                            <MinusCircle className="h-4 w-4" />
                            Mettre en attente
                          </Button>
                          <Button
                            onClick={() => { setSelectedShop(shop); setActionType('reject'); }}
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1.5"
                            size="sm"
                          >
                            <XCircle className="h-4 w-4" />
                            Refuser
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

        {/* Section 2: Boutiques recommandées */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-300">
            <Star className="h-4 w-4 text-amber-400" />
            Boutiques recommandées ({recommendedShops.length})
          </h3>
          {recommendedShops.length === 0 ? (
            <Card className="border border-[#334155] bg-[#1e293b]">
              <CardContent className="py-16 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                <p className="text-slate-500">Aucune boutique recommandée</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recommendedShops
                .sort((a, b) => a.name.localeCompare(b.name))
                .map((shop) => (
                  <Card key={shop.id} className="border border-[#334155] bg-[#1e293b]">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold shrink-0">
                            {shop.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-medium text-sm text-white truncate">{shop.name}</p>
                              {/* Badge Preview */}
                              <div className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/30 border border-amber-400/40 shrink-0">
                                <Star className="h-2.5 w-2.5 text-amber-300 fill-amber-300" />
                                <span className="text-[8px] text-amber-200 font-bold tracking-wide">RECOMMANDÉ</span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400">{shop.owner.name}</p>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 text-[11px] shrink-0"
                          onClick={() => handleRevoke(shop.id)}
                        >
                          Révoquer
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          )}
        </div>

        {/* Badge Preview Card */}
        <Card className="border border-amber-500/20 bg-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-sm text-slate-300 flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-400" /> Aperçu du badge de recommandation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center p-6 bg-[#0f172a] rounded-xl border border-[#334155]">
              <div className="flex flex-col items-center gap-3">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                  <Star className="h-8 w-8 text-white fill-white" />
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/30 to-yellow-500/30 border border-amber-400/40">
                  <Star className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                  <span className="text-sm text-amber-200 font-bold tracking-wide">RECOMMANDÉ</span>
                </div>
                <p className="text-xs text-slate-500 text-center max-w-xs">
                  Ce badge doré sera affiché sur la boutique pour indiquer qu&apos;elle a été vérifiée et recommandée par l&apos;équipe EcoRDC.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Confirmation Dialog */}
        <AlertDialog open={actionType !== null} onOpenChange={() => { setActionType(null); setSelectedShop(null); }}>
          <AlertDialogContent className="bg-[#1e293b] border-[#334155]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-white">
                {actionType === 'approve' ? (
                  <><CheckCircle className="h-5 w-5 text-green-400" /> Accepter la recommandation</>
                ) : actionType === 'hold' ? (
                  <><MinusCircle className="h-5 w-5 text-amber-400" /> Mettre en attente</>
                ) : (
                  <><XCircle className="h-5 w-5 text-red-400" /> Refuser la recommandation</>
                )}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                {actionType === 'approve'
                  ? `Voulez-vous attribuer le badge de recommandation à "${selectedShop?.name}" ? La boutique recevra le badge doré et sera mise en avant.`
                  : actionType === 'hold'
                  ? `Voulez-vous mettre en attente la demande de "${selectedShop?.name}" ? Vous pourrez l'examiner plus tard.`
                  : `Voulez-vous refuser la demande de recommandation de "${selectedShop?.name}" ? Le propriétaire en sera informé.`}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#334155] text-slate-300 border-[#334155] hover:bg-[#475569]">Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleAction}
                disabled={actionLoading}
                className={
                  actionType === 'approve' ? 'bg-green-600 hover:bg-green-700 text-white' :
                  actionType === 'hold' ? 'bg-amber-600 hover:bg-amber-700 text-white' :
                  'bg-red-600 hover:bg-red-700 text-white'
                }
              >
                {actionLoading ? 'Traitement...' :
                actionType === 'approve' ? 'Accepter' :
                actionType === 'hold' ? 'Mettre en attente' :
                'Refuser'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </AdminSidebar>
  );
}
