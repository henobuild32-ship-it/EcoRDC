'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import {
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@/components/ui/tabs';
import {
  Store, Search, MoreHorizontal, UserCheck, UserX, Trash2, ShieldAlert,
  Mail, Calendar, ShoppingBag, CheckCircle, Send, Package,
  Star, Phone, Eye, Gift, BadgeCheck, PackageCheck, Crown, Clock,
  CreditCard, Activity, Wallet, MapPin, Ban, RotateCcw, AlertTriangle,
  UserPlus, KeyRound, Copy, EyeOff, RefreshCw, Image as ImageIcon, CheckCircle2, Info,
} from 'lucide-react';
import { toast } from 'sonner';

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
  city?: string | null;
  country?: string | null;
  isActive: boolean;
  isSuspended: boolean;
  createdAt: string;
  shop?: {
    id: string;
    name: string;
    logo?: string | null;
    isRecommended: boolean;
    isActive?: boolean;
    category?: string | null;
    description?: string | null;
    city?: string | null;
    badges?: string | null;
    suspensionType?: 'TEMPORARY' | 'PERMANENT' | null;
    suspensionReason?: string | null;
    suspendedUntil?: string | null;
    _count?: { products: number; orders?: number; followers?: number };
  } | null;
  subscription?: {
    id: string;
    status: string;
    startDate?: string | null;
    expiryDate?: string | null;
    amount?: number;
    freeMonths?: number;
  } | null;
}

interface ActivityLogEntry {
  id: string;
  action: string;
  details?: string | null;
  createdAt: string;
}

interface PaymentEntry {
  id: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  paymentMethod: string;
  description?: string | null;
  createdAt: string;
}

interface OrderEntry {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  customer?: { id: string; name: string; email: string };
}

interface VendorDetails {
  vendor: Vendor & {
    address?: string | null;
    shop?: Vendor['shop'] & {
      slug?: string;
      address?: string | null;
      country?: string | null;
      suspensionComment?: string | null;
      suspendedAt?: string | null;
      createdAt?: string;
      updatedAt?: string;
      _count?: { products: number; orders?: number; followers?: number };
    };
    activityLogs?: ActivityLogEntry[];
    payments?: PaymentEntry[];
  };
  recentOrders?: OrderEntry[];
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function AdminVendors() {
  const { token } = useAppStore();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [actionDialog, setActionDialog] = useState<'suspend' | 'reactivate' | 'approve' | 'delete' | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [messageDialog, setMessageDialog] = useState(false);
  const [messageText, setMessageText] = useState('');

  // Free shop grant dialog state
  const [freeShopDialog, setFreeShopDialog] = useState(false);
  const [freeShopDuration, setFreeShopDuration] = useState('7');
  const [freeShopCustom, setFreeShopCustom] = useState('');
  const [freeShopReason, setFreeShopReason] = useState('');

  // Suspend shop dialog state (rich dialog with motif + comment)
  const [suspendShopDialog, setSuspendShopDialog] = useState(false);
  const [suspendType, setSuspendType] = useState<'TEMPORARY' | 'PERMANENT'>('TEMPORARY');
  const [suspendDuration, setSuspendDuration] = useState('7');
  const [suspendCustom, setSuspendCustom] = useState('');
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendComment, setSuspendComment] = useState('');

  // Vendor details drawer state
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [vendorDetails, setVendorDetails] = useState<VendorDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Create vendor dialog state (admin creates a brand-new vendor account)
  const [createVendorDialog, setCreateVendorDialog] = useState(false);
  const [createStep, setCreateStep] = useState<'form' | 'success'>('form');
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    city: '',
    country: 'RDC',
    shopName: '',
    shopCategory: '',
    shopDescription: '',
    avatar: '' as string, // base64 data URL
  });
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [createTrialDays, setCreateTrialDays] = useState('7');
  const [createCustomDays, setCreateCustomDays] = useState('');
  const [createReason, setCreateReason] = useState('');
  const [createdResult, setCreatedResult] = useState<{
    vendor: { id: string; name: string; email: string; phone?: string | null };
    shop: { id: string; name: string; slug: string };
    temporaryPassword: string;
    passwordWasGenerated: boolean;
    trialDays: number;
    permanent?: boolean;
    trialExpiryDate: string;
  } | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchVendors = useCallback(async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/admin?section=vendors', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVendors(data.vendors || []);
      }
    } catch { /* silently handle */ }
  }, [token]);

  useEffect(() => {
    fetchVendors().then(() => setLoading(false));
  }, [fetchVendors]);

  useEffect(() => {
    const q = search.toLowerCase();
    let result = vendors.filter(
      (v) =>
        v.name.toLowerCase().includes(q) ||
        v.email.toLowerCase().includes(q) ||
        (v.shop?.name || '').toLowerCase().includes(q)
    );
    if (statusFilter === 'active') {
      result = result.filter(v => v.isActive && !v.isSuspended);
    } else if (statusFilter === 'suspended') {
      result = result.filter(v => v.isSuspended);
    } else if (statusFilter === 'pending') {
      result = result.filter(v => !v.isActive && !v.isSuspended);
    }
    setFilteredVendors(result);
  }, [vendors, search, statusFilter]);

  const handleAction = async () => {
    if (!selectedVendor || !actionDialog || !token) return;
    setActionLoading(true);
    try {
      const actionMap: Record<string, string> = {
        suspend: 'suspend-user',
        reactivate: 'reactivate-user',
        delete: 'delete-user',
        approve: 'reactivate-user',
      };
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: actionMap[actionDialog], userId: selectedVendor.id }),
      });
      if (res.ok) {
        toast.success(
          actionDialog === 'suspend' ? 'Vendeur suspendu' :
          actionDialog === 'reactivate' ? 'Vendeur réactivé' :
          actionDialog === 'approve' ? 'Vendeur approuvé' : 'Vendeur supprimé'
        );
        await fetchVendors();
      } else {
        toast.error('Erreur lors de l\'opération');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(false);
      setActionDialog(null);
      setSelectedVendor(null);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedVendor || !messageText.trim() || !token) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'send-private-message', targetId: selectedVendor.id, title: 'Message administrateur', message: messageText }),
      });
      if (res.ok) {
        toast.success('Message envoyé');
        setMessageDialog(false);
        setMessageText('');
      }
    } catch {
      toast.error('Erreur de connexion');
    }
  };

  // Generate a secure random password for the create-vendor form
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCreateForm((f) => ({ ...f, password: pwd }));
    setShowCreatePassword(true);
    toast.success('Mot de passe généré');
  };

  // Copy helper for the success dialog
  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field);
      toast.success('Copié dans le presse-papiers');
      setTimeout(() => setCopiedField(null), 2000);
    });
  };

  // Reset the create-vendor form to its initial state
  const resetCreateForm = () => {
    setCreateForm({
      name: '', email: '', password: '', phone: '', city: '', country: 'RDC',
      shopName: '', shopCategory: '', shopDescription: '', avatar: '',
    });
    setCreateTrialDays('7');
    setCreateCustomDays('');
    setCreateReason('');
    setShowCreatePassword(false);
    setCreatedResult(null);
    setCreateStep('form');
  };

  const handleCreateVendor = async () => {
    if (!token) return;

    // Validation
    if (!createForm.name.trim() || createForm.name.trim().length < 2) {
      toast.error('Le nom est requis (2 caractères minimum)');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createForm.email.trim())) {
      toast.error('Format d\'email invalide');
      return;
    }
    if (!createForm.shopName.trim() || createForm.shopName.trim().length < 2) {
      toast.error('Le nom de la boutique est requis');
      return;
    }
    if (createForm.password && createForm.password.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    const isPermanent = createTrialDays === 'PERMANENT';
    const days: number | 'PERMANENT' = isPermanent
      ? 'PERMANENT'
      : createTrialDays === 'custom'
        ? parseInt(createCustomDays, 10)
        : parseInt(createTrialDays, 10);
    if (!isPermanent && (!days || (typeof days === 'number' && days < 1))) {
      toast.error('Durée d\'essai invalide');
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'create-vendor',
          name: createForm.name.trim(),
          email: createForm.email.trim(),
          password: createForm.password || undefined,
          phone: createForm.phone.trim() || undefined,
          city: createForm.city.trim() || undefined,
          country: createForm.country.trim() || undefined,
          avatar: createForm.avatar || undefined,
          shopName: createForm.shopName.trim(),
          shopCategory: createForm.shopCategory.trim() || undefined,
          shopDescription: createForm.shopDescription.trim() || undefined,
          durationDays: days,
          reason: createReason.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || 'Erreur lors de la création du compte');
        return;
      }

      setCreatedResult(data);
      setCreateStep('success');
      toast.success(
        data.permanent
          ? `Compte vendeur créé pour ${data.vendor.name} — Accès PERMANENT 🎉`
          : `Compte vendeur créé pour ${data.vendor.name}`
      );
      await fetchVendors();
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  const handleGrantFreeShop = async () => {
    if (!selectedVendor || !token) return;
    const isPermanent = freeShopDuration === 'PERMANENT';
    let days: number | string;
    if (isPermanent) {
      days = 'PERMANENT';
    } else if (freeShopDuration === 'custom') {
      days = parseInt(freeShopCustom, 10);
    } else {
      days = parseInt(freeShopDuration, 10);
    }
    if (!isPermanent && (!days || (days as number) < 1)) {
      toast.error('Durée invalide');
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'grant-free-shop',
          vendorId: selectedVendor.id,
          durationDays: days,
          reason: freeShopReason.trim() || undefined,
        }),
      });
      if (res.ok) {
        toast.success(isPermanent
          ? 'Boutique attribuée gratuitement (PERMANENT)'
          : `Boutique attribuée gratuitement pour ${days} jours`);
        setFreeShopDialog(false);
        setFreeShopReason('');
        setFreeShopCustom('');
        setFreeShopDuration('7');
        setSelectedVendor(null);
        await fetchVendors();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Erreur lors de l\'attribution');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSuspendShop = async () => {
    if (!selectedVendor?.shop || !token) return;
    if (!suspendReason) {
      toast.error('Veuillez sélectionner un motif');
      return;
    }
    if (!suspendComment.trim()) {
      toast.error('Veuillez ajouter un commentaire détaillé');
      return;
    }
    let durationDays: number | undefined;
    if (suspendType === 'TEMPORARY') {
      durationDays = suspendDuration === 'custom' ? parseInt(suspendCustom, 10) : parseInt(suspendDuration, 10);
      if (!durationDays || durationDays < 1) {
        toast.error('Durée de suspension invalide');
        return;
      }
    }
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: 'suspend-shop',
          shopId: selectedVendor.shop.id,
          suspensionType: suspendType,
          reason: suspendReason,
          comment: suspendComment.trim(),
          durationDays,
        }),
      });
      if (res.ok) {
        toast.success('Boutique suspendue');
        setSuspendShopDialog(false);
        setSuspendType('TEMPORARY');
        setSuspendDuration('7');
        setSuspendCustom('');
        setSuspendReason('');
        setSuspendComment('');
        setSelectedVendor(null);
        await fetchVendors();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Erreur lors de la suspension');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspendShop = async (vendor: Vendor) => {
    if (!vendor.shop || !token) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: 'unsuspend-shop', shopId: vendor.shop.id }),
      });
      if (res.ok) {
        toast.success('Boutique réactivée');
        await fetchVendors();
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.error || 'Erreur lors de la réactivation');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setActionLoading(false);
    }
  };

  const fetchVendorDetails = async (vendorId: string) => {
    if (!token) return;
    setDetailsLoading(true);
    setVendorDetails(null);
    setDetailsOpen(true);
    try {
      const res = await fetch(`/api/admin?section=vendor-details&vendorId=${vendorId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVendorDetails(data as VendorDetails);
      } else {
        toast.error('Erreur lors du chargement des détails');
      }
    } catch {
      toast.error('Erreur de connexion');
    } finally {
      setDetailsLoading(false);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });

  const getStatusBadge = (v: Vendor) => {
    if (v.isSuspended) return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]">Suspendu</Badge>;
    if (!v.isActive) return <Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px]">En attente</Badge>;
    return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[10px]">Actif</Badge>;
  };

  const formatLongDate = (dateStr?: string | null) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return '—';
    }
  };

  const parseBadges = (b?: string | null): string[] => {
    if (!b) return [];
    try {
      const parsed = JSON.parse(b);
      return Array.isArray(parsed) ? parsed.filter((x: unknown) => typeof x === 'string') : [];
    } catch {
      return [];
    }
  };

  const renderShopBadge = (badge: string, keyPrefix = '') => {
    switch (badge) {
      case 'VERIFIED_SHOP':
        return (
          <Badge key={`${keyPrefix}verified-shop`} className="bg-blue-500/15 text-blue-300 border border-blue-500/30 text-[9px] px-1.5 h-4 gap-0.5">
            <BadgeCheck className="h-2.5 w-2.5" /> Vérifiée
          </Badge>
        );
      case 'VERIFIED_SUPPLIER':
        return (
          <Badge key={`${keyPrefix}verified-supplier`} className="bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 text-[9px] px-1.5 h-4 gap-0.5">
            <PackageCheck className="h-2.5 w-2.5" /> Fournisseur
          </Badge>
        );
      case 'PREMIUM_SUPPLIER':
        return (
          <Badge key={`${keyPrefix}premium-supplier`} className="bg-purple-500/15 text-purple-300 border border-purple-500/30 text-[9px] px-1.5 h-4 gap-0.5">
            <Crown className="h-2.5 w-2.5" /> Premium
          </Badge>
        );
      case 'RECOMMENDED_SELLER':
        return (
          <Badge key={`${keyPrefix}recommended-seller`} className="bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[9px] px-1.5 h-4 gap-0.5">
            <Star className="h-2.5 w-2.5" /> Recommandé
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSubscriptionStatusBadge = (sub?: Vendor['subscription'] | null) => {
    if (!sub) return <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/30 text-[9px]">INACTIF</Badge>;
    switch (sub.status) {
      case 'ACTIVE':
        return <Badge className="bg-green-500/20 text-green-400 border border-green-500/30 text-[9px]">ACTIF</Badge>;
      case 'EXPIRED':
        return <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[9px]">EXPIRÉ</Badge>;
      case 'TRIAL':
        return <Badge className="bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 text-[9px]">ESSAI</Badge>;
      case 'PERMANENT':
        return <Badge className="bg-gradient-to-r from-purple-500/25 to-amber-500/25 text-purple-200 border border-purple-500/40 text-[9px]">PERMANENT ⭐</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border border-slate-500/30 text-[9px]">INACTIF</Badge>;
    }
  };

  const activeCount = vendors.filter(v => v.isActive && !v.isSuspended).length;
  const pendingCount = vendors.filter(v => !v.isActive && !v.isSuspended).length;

  return (
    <AdminSidebar>
      <motion.div {...fadeIn} className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
              <Store className="h-6 w-6 text-blue-400" />
              Gestion des Vendeurs
            </h1>
            <p className="text-slate-400 text-sm mt-1">{vendors.length} vendeur(s) enregistré(s)</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Badge className="bg-green-500/15 text-green-400 border border-green-500/30">
              {activeCount} actifs
            </Badge>
            <Badge className="bg-amber-500/15 text-amber-400 border border-amber-500/30">
              {pendingCount} en attente
            </Badge>
            <Button
              onClick={() => { resetCreateForm(); setCreateVendorDialog(true); }}
              className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2 shadow-md"
            >
              <UserPlus className="h-4 w-4" /> Créer un compte vendeur
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input
              placeholder="Rechercher un vendeur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-[#1e293b] border-[#334155] text-white placeholder:text-slate-500 focus:border-blue-500"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-44 bg-[#1e293b] border-[#334155] text-white">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e293b] border-[#334155]">
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="suspended">Suspendu</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Vendor Table */}
        <Card className="border border-[#334155] bg-[#1e293b] shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#334155] hover:bg-transparent">
                    <TableHead className="text-slate-400">Vendeur</TableHead>
                    <TableHead className="hidden md:table-cell text-slate-400">Email</TableHead>
                    <TableHead className="hidden lg:table-cell text-slate-400">Téléphone</TableHead>
                    <TableHead className="hidden sm:table-cell text-slate-400">Boutique</TableHead>
                    <TableHead className="hidden xl:table-cell text-slate-400">Abonnement</TableHead>
                    <TableHead className="text-slate-400">Statut</TableHead>
                    <TableHead className="hidden lg:table-cell text-slate-400">Inscription</TableHead>
                    <TableHead className="w-24 text-slate-400">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i} className="border-[#334155]/50">
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><div className="h-4 bg-slate-700 animate-pulse rounded w-20" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredVendors.length === 0 ? (
                    <TableRow className="border-[#334155]/50">
                      <TableCell colSpan={8} className="text-center py-16">
                        <Store className="h-12 w-12 mx-auto text-slate-600 mb-3" />
                        <p className="text-slate-500 text-sm">
                          {search || statusFilter !== 'ALL' ? 'Aucun vendeur trouvé pour ces filtres' : 'Aucun vendeur enregistré'}
                        </p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVendors.map((vendor) => {
                      const badges = vendor.shop ? parseBadges(vendor.shop.badges) : [];
                      const shopSuspended = !!(vendor.shop && vendor.shop.suspensionType);
                      return (
                        <TableRow
                          key={vendor.id}
                          className="border-[#334155]/50 hover:bg-[#0f172a]/50 cursor-pointer"
                          onClick={() => fetchVendorDetails(vendor.id)}
                        >
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0 overflow-hidden">
                                {vendor.avatar ? (
                                  <img src={vendor.avatar} alt={vendor.name} className="w-full h-full object-cover" />
                                ) : (
                                  vendor.name.charAt(0).toUpperCase()
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate text-slate-200">{vendor.name}</p>
                                <p className="text-xs text-slate-500 truncate md:hidden">{vendor.email}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="hidden md:table-cell text-sm text-slate-400">{vendor.email}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-slate-400">{vendor.phone || '—'}</TableCell>
                          <TableCell className="hidden sm:table-cell">
                            {vendor.shop ? (
                              <div className="flex flex-col gap-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  {vendor.shop.logo ? (
                                    <img src={vendor.shop.logo} alt="" className="h-4 w-4 rounded shrink-0" />
                                  ) : (
                                    <ShoppingBag className="h-3.5 w-3.5 text-blue-400 shrink-0" />
                                  )}
                                  <span className="text-sm text-slate-300 truncate">{vendor.shop.name}</span>
                                  {shopSuspended && (
                                    <Badge className="h-4 text-[8px] bg-red-500/20 text-red-400 border border-red-500/30 px-1 gap-0.5">
                                      <Ban className="h-2.5 w-2.5" />
                                    </Badge>
                                  )}
                                </div>
                                {badges.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {badges.map((b) => renderShopBadge(b, vendor.id))}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">—</span>
                            )}
                          </TableCell>
                          <TableCell className="hidden xl:table-cell">
                            {vendor.subscription ? (
                              <div className="flex flex-col gap-1 min-w-[140px]">
                                {getSubscriptionStatusBadge(vendor.subscription)}
                                <div className="flex items-center gap-1 text-[10px] text-slate-500">
                                  <Calendar className="h-2.5 w-2.5" />
                                  <span>{formatLongDate(vendor.subscription.startDate)}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[10px]">
                                  <Clock className="h-2.5 w-2.5 text-slate-500" />
                                  <span className={vendor.subscription.status === 'ACTIVE' ? 'text-amber-400' : 'text-slate-500'}>
                                    {formatLongDate(vendor.subscription.expiryDate)}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-500">—</span>
                            )}
                          </TableCell>
                          <TableCell>{getStatusBadge(vendor)}</TableCell>
                          <TableCell className="hidden lg:table-cell text-sm text-slate-500">{formatDate(vendor.createdAt)}</TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-400 hover:text-cyan-300 hover:bg-[#334155]"
                                onClick={() => fetchVendorDetails(vendor.id)}
                                title="Voir détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-[#334155]">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1e293b] border-[#334155] min-w-[220px]">
                                  <DropdownMenuItem onClick={() => fetchVendorDetails(vendor.id)} className="text-slate-300 focus:bg-[#334155] focus:text-white">
                                    <Eye className="mr-2 h-4 w-4 text-cyan-400" /> Voir détails
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedVendor(vendor); setMessageDialog(true); }} className="text-slate-300 focus:bg-[#334155] focus:text-white">
                                    <Send className="mr-2 h-4 w-4 text-blue-400" /> Envoyer un message
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => { setSelectedVendor(vendor); setFreeShopDialog(true); }} className="text-slate-300 focus:bg-[#334155] focus:text-white">
                                    <Gift className="mr-2 h-4 w-4 text-emerald-400" /> Attribution gratuite
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator className="bg-[#334155]" />
                                  {vendor.shop && shopSuspended ? (
                                    <DropdownMenuItem
                                      onClick={() => handleUnsuspendShop(vendor)}
                                      disabled={actionLoading}
                                      className="text-green-400 focus:bg-[#334155] focus:text-green-400"
                                    >
                                      <RotateCcw className="mr-2 h-4 w-4" /> Réactiver la boutique
                                    </DropdownMenuItem>
                                  ) : vendor.shop ? (
                                    <DropdownMenuItem
                                      onClick={() => { setSelectedVendor(vendor); setSuspendShopDialog(true); }}
                                      className="text-amber-400 focus:bg-[#334155] focus:text-amber-400"
                                    >
                                      <ShieldAlert className="mr-2 h-4 w-4" /> Suspendre la boutique
                                    </DropdownMenuItem>
                                  ) : null}
                                  {!vendor.shop && !vendor.isActive && (
                                    <DropdownMenuItem onClick={() => { setSelectedVendor(vendor); setActionDialog('approve'); }} className="text-slate-300 focus:bg-[#334155] focus:text-white">
                                      <CheckCircle className="mr-2 h-4 w-4 text-green-400" /> Approuver
                                    </DropdownMenuItem>
                                  )}
                                  {!vendor.shop && vendor.isSuspended && (
                                    <DropdownMenuItem onClick={() => { setSelectedVendor(vendor); setActionDialog('reactivate'); }} className="text-slate-300 focus:bg-[#334155] focus:text-white">
                                      <UserCheck className="mr-2 h-4 w-4 text-green-400" /> Réactiver le compte
                                    </DropdownMenuItem>
                                  )}
                                  {!vendor.shop && vendor.isActive && !vendor.isSuspended && (
                                    <DropdownMenuItem onClick={() => { setSelectedVendor(vendor); setActionDialog('suspend'); }} className="text-slate-300 focus:bg-[#334155] focus:text-white">
                                      <UserX className="mr-2 h-4 w-4 text-amber-400" /> Suspendre le compte
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuSeparator className="bg-[#334155]" />
                                  <DropdownMenuItem onClick={() => { setSelectedVendor(vendor); setActionDialog('delete'); }} className="text-red-400 focus:bg-[#334155] focus:text-red-400">
                                    <Trash2 className="mr-2 h-4 w-4" /> Supprimer
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
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

        {/* Suspend/Reactivate/Approve Dialog */}
        <Dialog open={actionDialog === 'suspend' || actionDialog === 'reactivate' || actionDialog === 'approve'} onOpenChange={() => { setActionDialog(null); setSelectedVendor(null); }}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {actionDialog === 'suspend' ? <><UserX className="h-5 w-5 text-amber-400" /> Suspendre</> :
                actionDialog === 'approve' ? <><CheckCircle className="h-5 w-5 text-green-400" /> Approuver</> :
                <><UserCheck className="h-5 w-5 text-green-400" /> Réactiver</>}
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                {actionDialog === 'suspend' ? `Suspendre ${selectedVendor?.name} ? Son accès sera bloqué.` :
                actionDialog === 'approve' ? `Approuver ${selectedVendor?.name} ? Son compte sera activé.` :
                `Réactiver ${selectedVendor?.name} ? Son accès sera restauré.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setActionDialog(null); setSelectedVendor(null); }} className="border-[#334155] text-slate-300 hover:bg-[#334155]">Annuler</Button>
              <Button onClick={handleAction} disabled={actionLoading}
                className={actionDialog === 'suspend' ? 'bg-amber-600 hover:bg-amber-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}>
                {actionLoading ? 'Traitement...' : 'Confirmer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <AlertDialog open={actionDialog === 'delete'} onOpenChange={() => { setActionDialog(null); setSelectedVendor(null); }}>
          <AlertDialogContent className="bg-[#1e293b] border-[#334155]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-white"><ShieldAlert className="h-5 w-5 text-red-400" /> Supprimer</AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">Supprimer définitivement <strong className="text-white">{selectedVendor?.name}</strong> et toutes ses données ?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#334155] text-slate-300 border-[#334155] hover:bg-[#475569]">Annuler</AlertDialogCancel>
              <AlertDialogAction onClick={handleAction} disabled={actionLoading} className="bg-red-600 hover:bg-red-700 text-white">
                {actionLoading ? 'Suppression...' : 'Supprimer'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={messageDialog} onOpenChange={setMessageDialog}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-white">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-blue-400" /> Message à {selectedVendor?.name}</DialogTitle>
            </DialogHeader>
            <Textarea placeholder="Votre message..." value={messageText} onChange={(e) => setMessageText(e.target.value)} rows={4}
              className="bg-[#0f172a] border border-[#334155] text-white placeholder:text-slate-500 focus:border-blue-500 resize-none" />
            <DialogFooter>
              <Button variant="outline" onClick={() => setMessageDialog(false)} className="border-[#334155] text-slate-300 hover:bg-[#334155]">Annuler</Button>
              <Button onClick={handleSendMessage} disabled={!messageText.trim()} className="bg-blue-600 hover:bg-blue-700 text-white gap-2"><Send className="h-4 w-4" /> Envoyer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Free Shop Grant Dialog */}
        <Dialog open={freeShopDialog} onOpenChange={(open) => { setFreeShopDialog(open); if (!open) setSelectedVendor(null); }}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Gift className="h-5 w-5 text-emerald-400" /> Attribution gratuite de boutique
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Vendeur : <span className="text-white font-medium">{selectedVendor?.name}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Durée d'accès gratuit</Label>
                <Select value={freeShopDuration} onValueChange={setFreeShopDuration}>
                  <SelectTrigger className="bg-[#0f172a] border-[#334155] text-white">
                    <SelectValue placeholder="Choisir la durée" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-[#334155]">
                    <SelectItem value="7">7 jours</SelectItem>
                    <SelectItem value="15">15 jours</SelectItem>
                    <SelectItem value="30">30 jours</SelectItem>
                    <SelectItem value="60">60 jours</SelectItem>
                    <SelectItem value="90">90 jours</SelectItem>
                    <SelectItem value="custom">Durée personnalisée</SelectItem>
                    <SelectItem value="PERMANENT">Permanent (gratuit à vie) ⭐</SelectItem>
                  </SelectContent>
                </Select>
                {freeShopDuration === 'custom' && (
                  <Input
                    type="number"
                    min={1}
                    placeholder="Nombre de jours"
                    value={freeShopCustom}
                    onChange={(e) => setFreeShopCustom(e.target.value)}
                    className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-emerald-500"
                  />
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Motif (optionnel)</Label>
                <Textarea
                  placeholder="Raison de l'attribution gratuite..."
                  value={freeShopReason}
                  onChange={(e) => setFreeShopReason(e.target.value)}
                  rows={3}
                  className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-emerald-500 resize-none"
                />
              </div>
              <div className={`flex gap-2 items-start p-3 rounded-lg border ${freeShopDuration === 'PERMANENT' ? 'bg-purple-500/10 border-purple-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
                <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${freeShopDuration === 'PERMANENT' ? 'text-purple-400' : 'text-emerald-400'}`} />
                <p className={`text-xs ${freeShopDuration === 'PERMANENT' ? 'text-purple-200/80' : 'text-emerald-200/80'}`}>
                  {freeShopDuration === 'PERMANENT'
                    ? 'Attribution PERMANENTE : ce vendeur aura un accès gratuit à vie à sa boutique. Il ne paiera jamais d\'abonnement.'
                    : 'Pendant cette période, aucun paiement n\'est demandé. À l\'expiration, le vendeur devra souscrire à l\'abonnement standard (10 000 FC/mois).'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setFreeShopDialog(false); setSelectedVendor(null); }} className="border-[#334155] text-slate-300 hover:bg-[#334155]">Annuler</Button>
              <Button
                onClick={handleGrantFreeShop}
                disabled={actionLoading || (freeShopDuration === 'custom' && !freeShopCustom)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                <Gift className="h-4 w-4" /> {actionLoading ? 'Attribution...' : 'Attribuer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Suspend Shop Dialog (with motif + comment) */}
        <Dialog open={suspendShopDialog} onOpenChange={(open) => { setSuspendShopDialog(open); if (!open) setSelectedVendor(null); }}>
          <DialogContent className="bg-[#1e293b] border-[#334155] text-white max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-amber-400" /> Suspension de boutique
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Boutique : <span className="text-white font-medium">{selectedVendor?.shop?.name}</span> — Vendeur : <span className="text-white font-medium">{selectedVendor?.name}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Type de suspension</Label>
                <Select value={suspendType} onValueChange={(v) => setSuspendType(v as 'TEMPORARY' | 'PERMANENT')}>
                  <SelectTrigger className="bg-[#0f172a] border-[#334155] text-white">
                    <SelectValue placeholder="Type de suspension" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-[#334155]">
                    <SelectItem value="TEMPORARY">Temporaire</SelectItem>
                    <SelectItem value="PERMANENT">Définitif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {suspendType === 'TEMPORARY' && (
                <div className="space-y-2">
                  <Label className="text-slate-300 text-sm">Durée de suspension</Label>
                  <Select value={suspendDuration} onValueChange={setSuspendDuration}>
                    <SelectTrigger className="bg-[#0f172a] border-[#334155] text-white">
                      <SelectValue placeholder="Durée" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-[#334155]">
                      <SelectItem value="7">7 jours</SelectItem>
                      <SelectItem value="15">15 jours</SelectItem>
                      <SelectItem value="30">30 jours</SelectItem>
                      <SelectItem value="60">60 jours</SelectItem>
                      <SelectItem value="90">90 jours</SelectItem>
                      <SelectItem value="custom">Durée personnalisée</SelectItem>
                    </SelectContent>
                  </Select>
                  {suspendDuration === 'custom' && (
                    <Input
                      type="number"
                      min={1}
                      placeholder="Nombre de jours"
                      value={suspendCustom}
                      onChange={(e) => setSuspendCustom(e.target.value)}
                      className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-amber-500"
                    />
                  )}
                </div>
              )}
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Motif <span className="text-red-400">*</span></Label>
                <Select value={suspendReason} onValueChange={setSuspendReason}>
                  <SelectTrigger className="bg-[#0f172a] border-[#334155] text-white">
                    <SelectValue placeholder="Sélectionner un motif" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e293b] border-[#334155]">
                    <SelectItem value="Contenu inapproprié">Contenu inapproprié</SelectItem>
                    <SelectItem value="Fraude">Fraude</SelectItem>
                    <SelectItem value="Spam">Spam</SelectItem>
                    <SelectItem value="Contrefaçon">Contrefaçon</SelectItem>
                    <SelectItem value="Non-respect des conditions">Non-respect des conditions</SelectItem>
                    <SelectItem value="Autre">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300 text-sm">Commentaire détaillé <span className="text-red-400">*</span></Label>
                <Textarea
                  placeholder="Expliquez en détail la raison de la suspension..."
                  value={suspendComment}
                  onChange={(e) => setSuspendComment(e.target.value)}
                  rows={4}
                  className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-amber-500 resize-none"
                />
              </div>
              {suspendType === 'PERMANENT' && (
                <div className="flex gap-2 items-start p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-red-200/80">
                    La suspension définitive est irréversible. Le compte vendeur sera désactivé et tous les produits masqués.
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setSuspendShopDialog(false); setSelectedVendor(null); }} className="border-[#334155] text-slate-300 hover:bg-[#334155]">Annuler</Button>
              <Button
                onClick={handleSuspendShop}
                disabled={actionLoading || !suspendReason || !suspendComment.trim() || (suspendType === 'TEMPORARY' && suspendDuration === 'custom' && !suspendCustom)}
                className={suspendType === 'PERMANENT' ? 'bg-red-600 hover:bg-red-700 text-white gap-2' : 'bg-amber-600 hover:bg-amber-700 text-white gap-2'}
              >
                <ShieldAlert className="h-4 w-4" /> {actionLoading ? 'Suspension...' : 'Confirmer la suspension'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Vendor Details Sheet */}
        <Sheet open={detailsOpen} onOpenChange={(open) => { setDetailsOpen(open); if (!open) { setVendorDetails(null); setDetailsLoading(false); } }}>
          <SheetContent side="right" className="bg-[#0f172a] border-[#334155] text-white w-full sm:max-w-2xl overflow-y-auto">
            <SheetHeader className="border-b border-[#334155] pb-4">
              <SheetTitle className="flex items-center gap-2 text-white">
                <Store className="h-5 w-5 text-blue-400" /> Détails du vendeur
              </SheetTitle>
              <SheetDescription className="text-slate-400">
                Informations complètes, abonnement, activité et historique.
              </SheetDescription>
            </SheetHeader>
            {detailsLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-16 bg-slate-700/50 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : vendorDetails?.vendor ? (
              <div className="p-4 space-y-5">
                {/* Vendor identity */}
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold shrink-0 overflow-hidden">
                    {vendorDetails.vendor.avatar ? (
                      <img src={vendorDetails.vendor.avatar} alt={vendorDetails.vendor.name} className="w-full h-full object-cover" />
                    ) : (
                      vendorDetails.vendor.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-semibold text-white truncate">{vendorDetails.vendor.name}</h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      {getStatusBadge(vendorDetails.vendor)}
                      {getSubscriptionStatusBadge(vendorDetails.vendor.subscription)}
                    </div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-1 text-xs">
                      <span className="flex items-center gap-1.5 text-slate-400"><Mail className="h-3 w-3" /> {vendorDetails.vendor.email}</span>
                      {vendorDetails.vendor.phone && <span className="flex items-center gap-1.5 text-slate-400"><Phone className="h-3 w-3" /> {vendorDetails.vendor.phone}</span>}
                      {(vendorDetails.vendor.city || vendorDetails.vendor.country) && (
                        <span className="flex items-center gap-1.5 text-slate-400"><MapPin className="h-3 w-3" /> {[vendorDetails.vendor.city, vendorDetails.vendor.country].filter(Boolean).join(', ')}</span>
                      )}
                      <span className="flex items-center gap-1.5 text-slate-400"><Calendar className="h-3 w-3" /> Inscrit le {formatLongDate(vendorDetails.vendor.createdAt)}</span>
                    </div>
                  </div>
                </div>

                <Tabs defaultValue="shop" className="w-full">
                  <TabsList className="bg-[#1e293b] border border-[#334155] w-full justify-start overflow-x-auto h-auto">
                    <TabsTrigger value="shop" className="data-[state=active]:bg-[#334155] data-[state=active]:text-white text-slate-400">
                      <Store className="h-3.5 w-3.5 mr-1" /> Boutique
                    </TabsTrigger>
                    <TabsTrigger value="subscription" className="data-[state=active]:bg-[#334155] data-[state=active]:text-white text-slate-400">
                      <CreditCard className="h-3.5 w-3.5 mr-1" /> Abonnement
                    </TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-[#334155] data-[state=active]:text-white text-slate-400">
                      <Activity className="h-3.5 w-3.5 mr-1" /> Activité
                    </TabsTrigger>
                    <TabsTrigger value="payments" className="data-[state=active]:bg-[#334155] data-[state=active]:text-white text-slate-400">
                      <Wallet className="h-3.5 w-3.5 mr-1" /> Paiements
                    </TabsTrigger>
                    <TabsTrigger value="orders" className="data-[state=active]:bg-[#334155] data-[state=active]:text-white text-slate-400">
                      <ShoppingBag className="h-3.5 w-3.5 mr-1" /> Commandes
                    </TabsTrigger>
                  </TabsList>

                  {/* Shop tab */}
                  <TabsContent value="shop" className="mt-3">
                    {vendorDetails.vendor.shop ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1e293b] border border-[#334155]">
                          {vendorDetails.vendor.shop.logo ? (
                            <img src={vendorDetails.vendor.shop.logo} alt="" className="h-10 w-10 rounded-lg object-cover" />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-[#334155] flex items-center justify-center">
                              <ShoppingBag className="h-5 w-5 text-blue-400" />
                            </div>
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="font-medium text-white truncate">{vendorDetails.vendor.shop.name}</p>
                            <p className="text-xs text-slate-500">{vendorDetails.vendor.shop.category || 'Sans catégorie'}</p>
                          </div>
                          {vendorDetails.vendor.shop.suspensionType && (
                            <Badge className="bg-red-500/20 text-red-400 border border-red-500/30 text-[10px]">
                              {vendorDetails.vendor.shop.suspensionType === 'PERMANENT' ? 'Suspendue (Définitif)' : 'Suspendue (Temporaire)'}
                            </Badge>
                          )}
                        </div>
                        {vendorDetails.vendor.shop.description && (
                          <p className="text-xs text-slate-400 bg-[#1e293b]/60 p-3 rounded-lg border border-[#334155]/50">
                            {vendorDetails.vendor.shop.description}
                          </p>
                        )}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                          <div className="p-2 rounded bg-[#1e293b]/60 border border-[#334155]/50">
                            <p className="text-slate-500">Produits</p>
                            <p className="font-medium text-white flex items-center gap-1"><Package className="h-3 w-3 text-blue-400" /> {vendorDetails.vendor.shop._count?.products || 0}</p>
                          </div>
                          <div className="p-2 rounded bg-[#1e293b]/60 border border-[#334155]/50">
                            <p className="text-slate-500">Commandes</p>
                            <p className="font-medium text-white flex items-center gap-1"><ShoppingBag className="h-3 w-3 text-blue-400" /> {vendorDetails.vendor.shop._count?.orders || 0}</p>
                          </div>
                          <div className="p-2 rounded bg-[#1e293b]/60 border border-[#334155]/50">
                            <p className="text-slate-500">Abonnés</p>
                            <p className="font-medium text-white flex items-center gap-1"><Star className="h-3 w-3 text-amber-400" /> {vendorDetails.vendor.shop._count?.followers || 0}</p>
                          </div>
                        </div>
                        {parseBadges(vendorDetails.vendor.shop.badges).length > 0 && (
                          <div className="p-3 rounded-lg bg-[#1e293b] border border-[#334155]">
                            <p className="text-xs text-slate-500 mb-2">Badges</p>
                            <div className="flex flex-wrap gap-1.5">
                              {parseBadges(vendorDetails.vendor.shop.badges).map((b) => renderShopBadge(b, 'details'))}
                            </div>
                          </div>
                        )}
                        {vendorDetails.vendor.shop.suspensionType && (
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 space-y-2">
                            <p className="text-xs font-semibold text-red-300 flex items-center gap-1.5"><Ban className="h-3.5 w-3.5" /> Informations de suspension</p>
                            <div className="text-xs text-slate-300 space-y-1">
                              <p><span className="text-slate-500">Type :</span> {vendorDetails.vendor.shop.suspensionType === 'PERMANENT' ? 'Définitif' : 'Temporaire'}</p>
                              <p><span className="text-slate-500">Motif :</span> {vendorDetails.vendor.shop.suspensionReason || '—'}</p>
                              {vendorDetails.vendor.shop.suspensionComment && (
                                <p><span className="text-slate-500">Commentaire :</span> {vendorDetails.vendor.shop.suspensionComment}</p>
                              )}
                              {vendorDetails.vendor.shop.suspendedUntil && (
                                <p><span className="text-slate-500">Jusqu'au :</span> {formatLongDate(vendorDetails.vendor.shop.suspendedUntil)}</p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        <Store className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                        Aucune boutique associée
                      </div>
                    )}
                  </TabsContent>

                  {/* Subscription tab */}
                  <TabsContent value="subscription" className="mt-3">
                    {vendorDetails.vendor.subscription ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-[#1e293b] border border-[#334155]">
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-sm text-slate-400">Statut</p>
                            {getSubscriptionStatusBadge(vendorDetails.vendor.subscription)}
                          </div>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div>
                              <p className="text-slate-500 flex items-center gap-1 mb-0.5"><Calendar className="h-3 w-3" /> Date d'abonnement</p>
                              <p className="font-medium text-white">{formatLongDate(vendorDetails.vendor.subscription.startDate)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 flex items-center gap-1 mb-0.5"><Clock className="h-3 w-3" /> Date d'expiration</p>
                              <p className="font-medium text-white">{formatLongDate(vendorDetails.vendor.subscription.expiryDate)}</p>
                            </div>
                            <div>
                              <p className="text-slate-500 flex items-center gap-1 mb-0.5"><CreditCard className="h-3 w-3" /> Montant</p>
                              <p className="font-medium text-white">{vendorDetails.vendor.subscription.amount || 0} FC</p>
                            </div>
                            <div>
                              <p className="text-slate-500 flex items-center gap-1 mb-0.5"><Gift className="h-3 w-3" /> Mois gratuits</p>
                              <p className="font-medium text-white">{vendorDetails.vendor.subscription.freeMonths || 0}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        <CreditCard className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                        Aucun abonnement
                      </div>
                    )}
                  </TabsContent>

                  {/* Activity tab */}
                  <TabsContent value="activity" className="mt-3">
                    {vendorDetails.vendor.activityLogs && vendorDetails.vendor.activityLogs.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {vendorDetails.vendor.activityLogs.slice(0, 10).map((log) => (
                          <div key={log.id} className="p-2.5 rounded-lg bg-[#1e293b]/60 border border-[#334155]/50">
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs font-medium text-slate-200 truncate">{log.action.replace(/_/g, ' ')}</p>
                              <span className="text-[10px] text-slate-500 shrink-0">{formatLongDate(log.createdAt)}</span>
                            </div>
                            {log.details && <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{log.details}</p>}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        <Activity className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                        Aucune activité récente
                      </div>
                    )}
                  </TabsContent>

                  {/* Payments tab */}
                  <TabsContent value="payments" className="mt-3">
                    {vendorDetails.vendor.payments && vendorDetails.vendor.payments.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {vendorDetails.vendor.payments.slice(0, 5).map((p) => (
                          <div key={p.id} className="p-2.5 rounded-lg bg-[#1e293b]/60 border border-[#334155]/50 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-200">{p.amount} {p.currency}</p>
                              <p className="text-[10px] text-slate-500 truncate">{p.description || p.type}</p>
                              <p className="text-[10px] text-slate-600">{formatLongDate(p.createdAt)}</p>
                            </div>
                            <Badge className={
                              p.status === 'COMPLETED' ? 'bg-green-500/20 text-green-400 border border-green-500/30 text-[9px]' :
                              p.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px]' :
                              'bg-red-500/20 text-red-400 border border-red-500/30 text-[9px]'
                            }>
                              {p.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        <Wallet className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                        Aucun paiement récent
                      </div>
                    )}
                  </TabsContent>

                  {/* Orders tab */}
                  <TabsContent value="orders" className="mt-3">
                    {vendorDetails.recentOrders && vendorDetails.recentOrders.length > 0 ? (
                      <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                        {vendorDetails.recentOrders.slice(0, 5).map((o) => (
                          <div key={o.id} className="p-2.5 rounded-lg bg-[#1e293b]/60 border border-[#334155]/50 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <p className="text-xs font-medium text-slate-200">{o.orderNumber}</p>
                              <p className="text-[10px] text-slate-500 truncate">{o.customer?.name || 'Client'} • {o.totalAmount} FC</p>
                              <p className="text-[10px] text-slate-600">{formatLongDate(o.createdAt)}</p>
                            </div>
                            <Badge className={
                              o.status === 'DELIVERED' || o.status === 'PAID' ? 'bg-green-500/20 text-green-400 border border-green-500/30 text-[9px]' :
                              o.status === 'PENDING' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[9px]' :
                              o.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400 border border-red-500/30 text-[9px]' :
                              'bg-blue-500/20 text-blue-300 border border-blue-500/30 text-[9px]'
                            }>
                              {o.status}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500 text-sm">
                        <ShoppingBag className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                        Aucune commande récente
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-500 text-sm">
                <ShieldAlert className="h-10 w-10 mx-auto mb-2 text-slate-600" />
                Aucune donnée disponible
              </div>
            )}
          </SheetContent>
        </Sheet>

        {/* ===== Create Vendor Dialog ===== */}
        {/* Admin creates a brand-new vendor account: name, email, password, photo, shop, trial duration.
            After creation, a success step shows the credentials (copiable) since no email service exists. */}
        <Dialog
          open={createVendorDialog}
          onOpenChange={(open) => {
            setCreateVendorDialog(open);
            if (!open) resetCreateForm();
          }}
        >
          <DialogContent className="bg-[#1e293b] border-[#334155] text-white max-w-2xl max-h-[90vh] overflow-y-auto">
            {createStep === 'form' ? (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-xl">
                    <span className="flex items-center justify-center h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600">
                      <UserPlus className="h-5 w-5 text-white" />
                    </span>
                    Créer un compte vendeur
                  </DialogTitle>
                  <DialogDescription className="text-slate-400">
                    Créez un compte vendeur avec boutique et période d'essai. Le vendeur pourra se connecter avec ces identifiants.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                  {/* Name + Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">
                        Nom complet <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        placeholder="Ex: Jean Mukendi"
                        value={createForm.name}
                        onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                        className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">
                        Adresse email <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        type="email"
                        placeholder="vendeur@email.com"
                        value={createForm.email}
                        onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))}
                        className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">
                      Mot de passe <span className="text-slate-500 text-xs font-normal">(laisser vide pour générer automatiquement)</span>
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          type={showCreatePassword ? 'text' : 'password'}
                          placeholder="Mot de passe du vendeur"
                          value={createForm.password}
                          onChange={(e) => setCreateForm((f) => ({ ...f, password: e.target.value }))}
                          className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-emerald-500 pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowCreatePassword((s) => !s)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                          aria-label={showCreatePassword ? 'Masquer' : 'Afficher'}
                        >
                          {showCreatePassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={generateRandomPassword}
                        className="border-[#334155] text-slate-300 hover:bg-[#334155] gap-2 shrink-0"
                        title="Générer un mot de passe aléatoire"
                      >
                        <RefreshCw className="h-4 w-4" /> Générer
                      </Button>
                    </div>
                    <p className="text-xs text-slate-500">Minimum 6 caractères. Le vendeur pourra le changer après connexion.</p>
                  </div>

                  {/* Phone + City */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">Téléphone</Label>
                      <Input
                        placeholder="+243 ..."
                        value={createForm.phone}
                        onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))}
                        className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">Ville</Label>
                      <Input
                        placeholder="Ex: Kinshasa"
                        value={createForm.city}
                        onChange={(e) => setCreateForm((f) => ({ ...f, city: e.target.value }))}
                        className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-px flex-1 bg-[#334155]" />
                    <span className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Store className="h-3 w-3" /> Informations boutique
                    </span>
                    <div className="h-px flex-1 bg-[#334155]" />
                  </div>

                  {/* Shop name + category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">
                        Nom de la boutique <span className="text-red-400">*</span>
                      </Label>
                      <Input
                        placeholder="Ex: Boutique Mukendi"
                        value={createForm.shopName}
                        onChange={(e) => setCreateForm((f) => ({ ...f, shopName: e.target.value }))}
                        className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-emerald-500"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-300 text-sm">Catégorie</Label>
                      <Select
                        value={createForm.shopCategory}
                        onValueChange={(v) => setCreateForm((f) => ({ ...f, shopCategory: v }))}
                      >
                        <SelectTrigger className="bg-[#0f172a] border-[#334155] text-white">
                          <SelectValue placeholder="Choisir..." />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e293b] border-[#334155]">
                          <SelectItem value="ALIMENTATION">Alimentation</SelectItem>
                          <SelectItem value="ELECTRONIQUE">Électronique</SelectItem>
                          <SelectItem value="MODE">Mode & Vêtements</SelectItem>
                          <SelectItem value="BEAUTE">Beauté & Cosmétiques</SelectItem>
                          <SelectItem value="MAISON">Maison & Déco</SelectItem>
                          <SelectItem value="SERVICES">Services</SelectItem>
                          <SelectItem value="AUTRE">Autre</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Shop description */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">Description de la boutique</Label>
                    <Textarea
                      placeholder="Décrivez la boutique en quelques mots..."
                      value={createForm.shopDescription}
                      onChange={(e) => setCreateForm((f) => ({ ...f, shopDescription: e.target.value }))}
                      rows={2}
                      className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-emerald-500 resize-none"
                    />
                  </div>

                  {/* Divider */}
                  <div className="flex items-center gap-3 pt-2">
                    <div className="h-px flex-1 bg-[#334155]" />
                    <span className="text-xs text-slate-500 uppercase tracking-wider flex items-center gap-1">
                      <Clock className="h-3 w-3" /> Période d'essai gratuit
                    </span>
                    <div className="h-px flex-1 bg-[#334155]" />
                  </div>

                  {/* Trial duration */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">Durée de l'essai gratuit</Label>
                    <div className="flex gap-2 flex-wrap">
                      {['7', '15', '30', '60', '90'].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setCreateTrialDays(d)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                            createTrialDays === d
                              ? 'bg-emerald-600 text-white border border-emerald-500 shadow-md'
                              : 'bg-[#0f172a] text-slate-300 border border-[#334155] hover:border-emerald-500/50'
                          }`}
                        >
                          {d} jours
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setCreateTrialDays('custom')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          createTrialDays === 'custom'
                            ? 'bg-emerald-600 text-white border border-emerald-500 shadow-md'
                            : 'bg-[#0f172a] text-slate-300 border border-[#334155] hover:border-emerald-500/50'
                        }`}
                      >
                        Personnalisé
                      </button>
                      <button
                        type="button"
                        onClick={() => setCreateTrialDays('PERMANENT')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          createTrialDays === 'PERMANENT'
                            ? 'bg-gradient-to-r from-purple-600 to-amber-600 text-white border border-purple-500 shadow-md'
                            : 'bg-[#0f172a] text-slate-300 border border-[#334155] hover:border-purple-500/50'
                        }`}
                      >
                        Permanent ⭐
                      </button>
                    </div>
                    {createTrialDays === 'custom' && (
                      <Input
                        type="number"
                        min={1}
                        max={365}
                        placeholder="Nombre de jours (1-365)"
                        value={createCustomDays}
                        onChange={(e) => setCreateCustomDays(e.target.value)}
                        className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-emerald-500 mt-2"
                      />
                    )}
                  </div>

                  {/* Reason */}
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 text-sm">Motif de création (optionnel)</Label>
                    <Input
                      placeholder="Ex: Nouveau partenaire commercial..."
                      value={createReason}
                      onChange={(e) => setCreateReason(e.target.value)}
                      className="bg-[#0f172a] border-[#334155] text-white placeholder:text-slate-500 focus:border-emerald-500"
                    />
                  </div>

                  {/* Info banner */}
                  <div className="flex gap-2.5 items-start p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                    <Info className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-emerald-200/80 leading-relaxed">
                      Le vendeur recevra une notification de bienvenue et pourra se connecter immédiatement avec son email et son mot de passe.
                      Pendant la période d'essai, aucun paiement n'est requis. À l'expiration, le vendeur devra souscrire à l'abonnement standard
                      de <span className="font-semibold text-emerald-300">10 000 FC/mois</span> pour continuer à vendre.
                    </p>
                  </div>
                </div>

                <DialogFooter className="gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCreateVendorDialog(false)}
                    className="border-[#334155] text-slate-300 hover:bg-[#334155]"
                  >
                    Annuler
                  </Button>
                  <Button
                    onClick={handleCreateVendor}
                    disabled={actionLoading || !createForm.name.trim() || !createForm.email.trim() || !createForm.shopName.trim()}
                    className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    {actionLoading ? 'Création en cours...' : 'Créer le compte'}
                  </Button>
                </DialogFooter>
              </>
            ) : (
              /* ===== Success step: show credentials ===== */
              createdResult && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl">
                      <span className={`flex items-center justify-center h-9 w-9 rounded-lg border ${
                        createdResult.permanent
                          ? 'bg-gradient-to-br from-purple-500/30 to-amber-500/30 border-purple-500/50'
                          : 'bg-green-500/20 border-green-500/40'
                      }`}>
                        {createdResult.permanent
                          ? <Crown className="h-5 w-5 text-purple-300" />
                          : <CheckCircle2 className="h-5 w-5 text-green-400" />}
                      </span>
                      {createdResult.permanent ? 'Compte vendeur créé — Accès permanent !' : 'Compte vendeur créé !'}
                    </DialogTitle>
                    <DialogDescription className="text-slate-400">
                      Transmettez ces identifiants au vendeur de manière sécurisée (en personne, par téléphone ou SMS).
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-2">
                    {/* Vendor summary card */}
                    <div className={`flex items-center gap-3 p-4 rounded-lg bg-[#0f172a] border ${
                      createdResult.permanent ? 'border-purple-500/40' : 'border-[#334155]'
                    }`}>
                      {createForm.avatar ? (
                        <img src={createForm.avatar} alt={createdResult.vendor.name} className="h-14 w-14 rounded-full object-cover border-2 border-emerald-500/50" />
                      ) : (
                        <div className={`h-14 w-14 rounded-full flex items-center justify-center text-white text-lg font-bold ${
                          createdResult.permanent
                            ? 'bg-gradient-to-br from-purple-500 to-amber-600'
                            : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                        }`}>
                          {createdResult.vendor.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-white truncate">{createdResult.vendor.name}</p>
                        <p className="text-sm text-slate-400 truncate">{createdResult.shop.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          {createdResult.permanent ? (
                            <Badge className="bg-gradient-to-r from-purple-500/25 to-amber-500/25 text-purple-200 border border-purple-500/50 text-xs gap-0.5">
                              <Crown className="h-3 w-3" /> Accès permanent à vie
                            </Badge>
                          ) : (
                            <>
                              <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-xs">
                                <Clock className="h-3 w-3 mr-1" /> Essai {createdResult.trialDays}j
                              </Badge>
                              <span className="text-xs text-slate-500">
                                jusqu'au {new Date(createdResult.trialExpiryDate).toLocaleDateString('fr-FR')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Credentials — copyable */}
                    <div className="space-y-2.5">
                      <p className="text-sm font-medium text-slate-300 flex items-center gap-1.5">
                        <KeyRound className="h-4 w-4 text-amber-400" /> Identifiants de connexion
                      </p>

                      {/* Email row */}
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[#0f172a] border border-[#334155]">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-slate-500 uppercase tracking-wider">Email</p>
                          <p className="text-sm text-white font-mono truncate">{createdResult.vendor.email}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(createdResult.vendor.email, 'email')}
                          className="text-slate-400 hover:text-white hover:bg-[#334155] gap-1.5 shrink-0"
                        >
                          {copiedField === 'email' ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                          {copiedField === 'email' ? 'Copié' : 'Copier'}
                        </Button>
                      </div>

                      {/* Password row */}
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-amber-400/70 uppercase tracking-wider">
                            Mot de passe {createdResult.passwordWasGenerated && '(généré automatiquement)'}
                          </p>
                          <p className="text-sm text-white font-mono truncate">{createdResult.temporaryPassword}</p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyToClipboard(createdResult.temporaryPassword, 'password')}
                          className="text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 gap-1.5 shrink-0"
                        >
                          {copiedField === 'password' ? <CheckCircle className="h-4 w-4 text-green-400" /> : <Copy className="h-4 w-4" />}
                          {copiedField === 'password' ? 'Copié' : 'Copier'}
                        </Button>
                      </div>
                    </div>

                    {/* Warning banner */}
                    <div className={`flex gap-2.5 items-start p-3 rounded-lg border ${
                      createdResult.permanent
                        ? 'bg-purple-500/10 border-purple-500/30'
                        : 'bg-amber-500/10 border-amber-500/30'
                    }`}>
                      <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${
                        createdResult.permanent ? 'text-purple-400' : 'text-amber-400'
                      }`} />
                      <div className={`text-xs leading-relaxed ${
                        createdResult.permanent ? 'text-purple-200/90' : 'text-amber-200/90'
                      }`}>
                        <p className="font-semibold mb-1">Important :</p>
                        <ul className="list-disc list-inside space-y-0.5">
                          <li>Ces identifiants ne seront plus affichés ensuite — copiez-les maintenant.</li>
                          <li>Le vendeur peut se connecter via le bouton « Connexion » sur la page d'accueil.</li>
                          {createdResult.permanent ? (
                            <li>Il bénéficie d'un <span className="font-semibold">accès PERMANENT et gratuit à vie</span> — il ne paiera jamais d'abonnement.</li>
                          ) : (
                            <li>Après la période d'essai de {createdResult.trialDays} jours, il devra payer 10 000 FC/mois.</li>
                          )}
                          <li>Le vendeur pourra changer son mot de passe et sa photo depuis son profil.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <DialogFooter className="gap-2">
                    <Button
                      onClick={() => {
                        setCreateVendorDialog(false);
                        resetCreateForm();
                      }}
                      className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white gap-2"
                    >
                      <CheckCircle2 className="h-4 w-4" /> Terminer
                    </Button>
                  </DialogFooter>
                </>
              )
            )}
          </DialogContent>
        </Dialog>
      </motion.div>
    </AdminSidebar>
  );
}
