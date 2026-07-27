'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreditCard,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Smartphone,
  XCircle,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Shield,
  CalendarDays,
  Zap,
  PartyPopper,
  Loader2,
  Phone,
  ArrowRight,
  Info,
  DollarSign,
  ExternalLink,
  Crown,
  Sparkles,
  Lock,
  TrendingUp,
  HeadphonesIcon,
  BarChart3,
  Store,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface SubscriptionData {
  id: string;
  status: 'INACTIVE' | 'ACTIVE' | 'EXPIRED' | 'TRIAL';
  startDate: string | null;
  expiryDate: string | null;
  prepaidExpiryDate: string | null;
  hasPrepaid: boolean;
  amount: number;
  freeMonths: number;
  createdAt: string;
  daysRemaining: number;
  totalDaysInPeriod: number;
  payments: PaymentData[];
}

interface PaymentData {
  id: string;
  amount: number;
  currency: string;
  type: string;
  status: string;
  paymentMethod: string;
  transactionRef: string | null;
  description: string | null;
  createdAt: string;
}

interface PaymentMethodInfo {
  id: string;
  label: string;
  icon: string;
  group: 'mobile' | 'card';
  color: string;
}

const PAYMENT_METHODS: PaymentMethodInfo[] = [
  { id: 'ALL', label: 'Tous les moyens', icon: '💚', group: 'all', color: 'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20' },
  { id: 'orange_money', label: 'Orange Money', icon: '🟠', group: 'mobile', color: 'border-orange-400 bg-orange-50 dark:bg-orange-950/20' },
  { id: 'airtel_money', label: 'Airtel Money', icon: '🔴', group: 'mobile', color: 'border-red-400 bg-red-50 dark:bg-red-950/20' },
  { id: 'm_pesa', label: 'M-Pesa', icon: '🟢', group: 'mobile', color: 'border-green-400 bg-green-50 dark:bg-green-950/20' },
  { id: 'mtn_money', label: 'MTN MoMo', icon: '🟡', group: 'mobile', color: 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20' },
  { id: 'moov_money', label: 'Moov Money', icon: '🔵', group: 'mobile', color: 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' },
  { id: 'wave', label: 'Wave', icon: '🌊', group: 'mobile', color: 'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20' },
  { id: 'card', label: 'Carte bancaire', icon: '💳', group: 'card', color: 'border-indigo-400 bg-indigo-50 dark:bg-indigo-950/20' },
];

const PREMIUM_BENEFITS = [
  { icon: Store, title: 'Boutique en ligne', desc: 'Vendez vos produits 24h/24 sur toute la RDC' },
  { icon: TrendingUp, title: 'Tableau de bord des ventes', desc: 'Statistiques détaillées et suivi en temps réel' },
  { icon: BarChart3, title: 'Gestion des commandes', desc: 'Gérez et suivez toutes vos commandes' },
  { icon: HeadphonesIcon, title: 'Support prioritaire', desc: 'Assistance dédiée vendeur 7j/7' },
  { icon: Shield, title: 'Paiements sécurisés', desc: 'Transactions protégées via GeniusPay' },
  { icon: Sparkles, title: 'Mises en avant', desc: 'Visibilité accrue pour vos produits' },
];

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('fr-CD', { style: 'decimal' }).format(amount) + ' FC';

const formatDate = (dateStr: string | null) => {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  ACTIVE: {
    label: 'Abonnement actif',
    color: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700',
    icon: CheckCircle,
  },
  EXPIRED: {
    label: 'Abonnement expiré',
    color: 'text-red-700 dark:text-red-300',
    bg: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700',
    icon: AlertTriangle,
  },
  INACTIVE: {
    label: 'Abonnement inactif',
    color: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700',
    icon: Clock,
  },
  TRIAL: {
    label: 'Période d\'essai',
    color: 'text-blue-700 dark:text-blue-300',
    bg: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700',
    icon: Zap,
  },
};

const paymentStatusColors: Record<string, string> = {
  COMPLETED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  CANCELLED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-300',
};

const paymentStatusLabels: Record<string, string> = {
  COMPLETED: 'Complété',
  PENDING: 'En attente',
  FAILED: 'Échoué',
  CANCELLED: 'Annulé',
};

const paymentTypeLabels: Record<string, string> = {
  REGISTRATION: 'Inscription',
  SUBSCRIPTION: 'Abonnement',
  RENEWAL: 'Renouvellement',
  PREPAID: 'Prépayé (mois suivant)',
};

const paymentMethodLabels: Record<string, string> = {
  PAWAPAY: 'PawaPay',
  GENIUSPAY: 'GeniusPay',
  MANUAL: 'Manuel',
  ADMIN_GRANT: 'Admin',
};

// Circular progress component
function CircularProgress({ value, max, size = 120, strokeWidth = 8 }: { value: number; max: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = max > 0 ? Math.min(value / max, 1) : 0;
  const offset = circumference - progress * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-muted/30"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          className="text-emerald-500"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{value}</span>
        <span className="text-xs text-muted-foreground">jours restants</span>
      </div>
    </div>
  );
}

export default function VendorSubscription() {
  const { token, user, setCurrentView, refreshUser } = useAppStore();
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [paymentType, setPaymentType] = useState<'REGISTRATION' | 'SUBSCRIPTION' | 'PREPAID'>('SUBSCRIPTION');
  const [paymentStep, setPaymentStep] = useState<'form' | 'processing' | 'checking' | 'success' | 'error'>('form');
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [currentPaymentId, setCurrentPaymentId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [paymentMethodsInfo, setPaymentMethodsInfo] = useState<PaymentMethodInfo[]>(PAYMENT_METHODS);
  const [isSandbox, setIsSandbox] = useState(false);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const paymentsPerPage = 5;

  const fetchSubscription = useCallback(async () => {
    if (!token) return;
    try {
      setRefreshing(true);
      const res = await fetch('/api/subscriptions', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSubscription(data.subscription || data);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Fetch payment methods from API
  useEffect(() => {
    fetch('/api/geniuspay/create-subscription')
      .then(res => res.json())
      .then(data => {
        if (data.paymentMethods && Array.isArray(data.paymentMethods)) {
          // Map API response to local format with colors
          const mapped = data.paymentMethods.map((m: { id: string; label: string; icon: string; group: string }) => {
            const local = PAYMENT_METHODS.find(p => p.id === m.id);
            return local || { ...m, color: 'border-gray-300 bg-gray-50 dark:bg-gray-900/20' };
          });
          setPaymentMethodsInfo(mapped);
        }
      })
      .catch(() => {
        // Keep default methods
      });
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  const handleOpenPaymentDialog = (type: 'REGISTRATION' | 'SUBSCRIPTION' | 'PREPAID') => {
    setPaymentType(type);
    setPaymentStep('form');
    setSelectedMethod('');
    setPhoneNumber('');
    setErrorMessage('');
    setCheckoutUrl('');
    setCurrentPaymentId('');
    setPaymentDialogOpen(true);
  };

  const handleCreatePayment = async () => {
    if (!token) return;
    if (!selectedMethod) {
      setErrorMessage('Veuillez sélectionner un moyen de paiement');
      return;
    }

    const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);

    // Phone number required for mobile money (not for 'ALL' checkout mode)
    if (selectedMethod !== 'ALL' && method?.group === 'mobile' && !phoneNumber) {
      setErrorMessage('Veuillez saisir votre numéro de téléphone mobile money');
      return;
    }

    if (phoneNumber && !phoneNumber.match(/^\+243\d{9}$/)) {
      setErrorMessage('Numéro de téléphone invalide (format: +243 suivi de 9 chiffres)');
      return;
    }

    setPaymentStep('processing');
    setErrorMessage('');

    try {
      const res = await fetch('/api/geniuspay/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: paymentType,
          paymentMethod: selectedMethod,
          phoneNumber: phoneNumber || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Erreur lors de la création du paiement');
        setPaymentStep('error');
        return;
      }

      setCheckoutUrl(data.checkoutUrl);
      setCurrentPaymentId(data.paymentId);
      setIsSandbox(!!data.sandbox);

      // Open GeniusPay checkout page in a new tab.
      // In sandbox mode, this opens our local GeniusPay-style checkout page
      // where the vendor completes the payment. In production, this opens the
      // real GeniusPay hosted checkout.
      if (data.checkoutUrl) {
        window.open(data.checkoutUrl, '_blank', 'noopener,noreferrer');
      }

      // Move to checking step and start polling for status updates.
      // The polling detects when the payment is confirmed (either by the
      // checkout page calling /simulate, or by the GeniusPay webhook).
      setPaymentStep('checking');
      startPolling(data.paymentId, data.sandbox);
    } catch (err) {
      console.error('Error creating payment:', err);
      setErrorMessage('Erreur de connexion. Veuillez réessayer.');
      setPaymentStep('error');
    }
  };

  const startPolling = (paymentId: string, sandbox: boolean) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    let attempts = 0;
    const maxAttempts = sandbox ? 120 : 48; // 2 min for sandbox auto-simulate, 4 min polling

    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/geniuspay/status/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();

        if (data.status === 'success') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setPaymentStep('success');
          fetchSubscription();
          refreshUser();
        } else if (data.status === 'failed') {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setErrorMessage('Le paiement a échoué. Veuillez réessayer avec un autre moyen.');
          setPaymentStep('error');
        }

        if (attempts >= maxAttempts) {
          if (pollingRef.current) clearInterval(pollingRef.current);
          setErrorMessage('Le paiement est toujours en attente. Vous pouvez vérifier le statut plus tard.');
          setPaymentStep('error');
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    }, 5000);
  };

  // Sandbox simulation: confirm payment
  const handleSimulateSuccess = async () => {
    if (!currentPaymentId || !token) return;
    try {
      const res = await fetch('/api/geniuspay/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentId: currentPaymentId, outcome: 'success' }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setPaymentStep('success');
        fetchSubscription();
        refreshUser();
      } else {
        setErrorMessage(data.error || 'Erreur lors de la simulation');
        setPaymentStep('error');
      }
    } catch (err) {
      console.error('Simulate error:', err);
      setErrorMessage('Erreur lors de la simulation');
      setPaymentStep('error');
    }
  };

  // Sandbox simulation: fail payment
  const handleSimulateFailure = async () => {
    if (!currentPaymentId || !token) return;
    try {
      const res = await fetch('/api/geniuspay/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentId: currentPaymentId, outcome: 'failed' }),
      });
      const data = await res.json();
      if (res.ok) {
        if (pollingRef.current) clearInterval(pollingRef.current);
        setErrorMessage('Paiement simulé comme échoué.');
        setPaymentStep('error');
      }
    } catch (err) {
      console.error('Simulate fail error:', err);
    }
  };

  const handleClosePaymentDialog = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setPaymentDialogOpen(false);
    setPaymentStep('form');
    setSelectedMethod('');
    setPhoneNumber('');
    setErrorMessage('');
    setIsSandbox(false);
  };

  const paginatedPayments = subscription?.payments
    ? subscription.payments.slice((currentPage - 1) * paymentsPerPage, currentPage * paymentsPerPage)
    : [];
  const totalPages = subscription?.payments
    ? Math.ceil(subscription.payments.length / paymentsPerPage)
    : 1;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-emerald-50/30 dark:from-slate-950 dark:to-emerald-950/20 p-4 md:p-6">
        <div className="mx-auto max-w-5xl space-y-4">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  const statusInfo = subscription ? statusConfig[subscription.status] || statusConfig.INACTIVE : statusConfig.INACTIVE;
  const StatusIcon = statusInfo.icon;
  const needsRegistration = !subscription || subscription.status === 'INACTIVE';
  const needsRenewal = subscription?.status === 'EXPIRED';
  const isActive = subscription?.status === 'ACTIVE' || subscription?.status === 'TRIAL';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/20 to-teal-50/30 dark:from-slate-950 dark:via-slate-900 dark:to-emerald-950/20 p-4 md:p-6 pb-24">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-5xl space-y-6"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Crown className="h-8 w-8 text-emerald-500" />
              Abonnement Premium
            </h1>
            <p className="text-muted-foreground mt-1">
              Gérez votre abonnement vendeur et vos paiements via GeniusPay
            </p>
          </div>
          <Button variant="outline" onClick={fetchSubscription} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </motion.div>

        {/* Subscription Status Card */}
        <motion.div variants={itemVariants}>
          <Card className={`border-2 ${statusInfo.bg}`}>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${statusInfo.bg} ${statusInfo.color}`}>
                    <StatusIcon className="h-8 w-8" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl">{statusInfo.label}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {subscription?.status === 'TRIAL' && subscription?.expiryDate && (
                        <>Période d'essai — Expire le {formatDate(subscription.expiryDate)} • {subscription.daysRemaining} jours restants</>
                      )}
                      {isActive && subscription?.expiryDate && (
                        <>Expire le {formatDate(subscription.expiryDate)} • {subscription.daysRemaining} jours restants</>
                      )}
                      {needsRegistration && 'Activez votre abonnement pour accéder à votre tableau de bord'}
                      {needsRenewal && 'Votre abonnement a expiré. Renouvelez pour continuer à vendre.'}
                    </p>
                  </div>
                </div>
                {isActive && (
                  <CircularProgress
                    value={subscription?.daysRemaining || 0}
                    max={subscription?.totalDaysInPeriod || 30}
                    size={100}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="rounded-lg bg-white/60 dark:bg-slate-900/40 p-4 border">
                  <div className="text-xs text-muted-foreground mb-1">Montant mensuel</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {formatAmount(subscription?.amount || 10000)}
                  </div>
                  <div className="text-xs text-muted-foreground">par mois (31 jours)</div>
                </div>
                <div className="rounded-lg bg-white/60 dark:bg-slate-900/40 p-4 border">
                  <div className="text-xs text-muted-foreground mb-1">Date de début</div>
                  <div className="text-lg font-semibold">{formatDate(subscription?.startDate || null)}</div>
                </div>
                <div className="rounded-lg bg-white/60 dark:bg-slate-900/40 p-4 border">
                  <div className="text-xs text-muted-foreground mb-1">Date d'expiration</div>
                  <div className="text-lg font-semibold">{formatDate(subscription?.expiryDate || null)}</div>
                </div>
              </div>

              {needsRegistration && (
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  onClick={() => handleOpenPaymentDialog('REGISTRATION')}
                >
                  <Zap className="h-5 w-5 mr-2" />
                  Payer l'inscription (10 000 FC) & activer mon abonnement
                </Button>
              )}
              {needsRenewal && (
                <Button
                  size="lg"
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
                  onClick={() => handleOpenPaymentDialog('SUBSCRIPTION')}
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Renouveler — Payer l'abonnement 10 000 FC / 31 jours
                </Button>
              )}
              {isActive && (
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Afficher le statut du prépaiement si existant */}
                  {subscription?.hasPrepaid && subscription.prepaidExpiryDate && (
                    <div className="w-full p-3 rounded-lg bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border border-purple-200 dark:border-purple-800">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="h-4 w-4 text-purple-500" />
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                          Abonnement prépayé en attente
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        S'activera automatiquement le {formatDate(subscription.expiryDate)} •
                        Expire le {formatDate(subscription.prepaidExpiryDate)}
                      </p>
                    </div>
                  )}

                  {/* Bouton pour payer en avance - seulement si pas déjà prépayé */}
                  {!subscription?.hasPrepaid && (
                    <Button
                      variant="outline"
                      className="flex-1 border-purple-400 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                      onClick={() => handleOpenPaymentDialog('PREPAID')}
                    >
                      <CalendarDays className="h-4 w-4 mr-2" />
                      {subscription?.status === 'TRIAL' ? 'Payer maintenant (début après essai)' : 'Payer le mois suivant en avance'}
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    className="flex-1 border-emerald-400 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                    onClick={() => handleOpenPaymentDialog('SUBSCRIPTION')}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    {subscription?.status === 'TRIAL' ? 'Payer l\'abonnement' : 'Renouveler'}
                  </Button>
                  <Button
                    variant="default"
                    className="flex-1"
                    onClick={() => setCurrentView('vendor-dashboard')}
                  >
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Accéder à mon tableau de bord
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Premium Benefits */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-500" />
                Avantages de l'abonnement Premium
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {PREMIUM_BENEFITS.map((benefit) => {
                  const Icon = benefit.icon;
                  return (
                    <div
                      key={benefit.title}
                      className="rounded-lg border bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 w-fit mb-3">
                        <Icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <h3 className="font-semibold text-sm">{benefit.title}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{benefit.desc}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Methods Showcase */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-emerald-500" />
                Moyens de paiement supportés
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Paiement sécurisé via GeniusPay Checkout. La RDC est pleinement prise en charge.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {paymentMethodsInfo.map((method) => (
                  <div
                    key={method.id}
                    className={`rounded-lg border-2 p-3 text-center transition-all hover:scale-105 ${method.color}`}
                  >
                    <div className="text-2xl mb-1">{method.icon}</div>
                    <div className="text-xs font-medium">{method.label}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Lock className="h-3 w-3" />
                Transactions chiffrées et sécurisées par HMAC-SHA256
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment History */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-emerald-500" />
                Historique des paiements
              </CardTitle>
            </CardHeader>
            <CardContent>
              {subscription?.payments && subscription.payments.length > 0 ? (
                <>
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Montant</TableHead>
                          <TableHead>Méthode</TableHead>
                          <TableHead>Référence</TableHead>
                          <TableHead>Statut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell className="text-xs">
                              {new Date(payment.createdAt).toLocaleDateString('fr-FR', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </TableCell>
                            <TableCell className="text-sm">
                              <Badge variant="outline">{paymentTypeLabels[payment.type] || payment.type}</Badge>
                            </TableCell>
                            <TableCell className="font-medium text-sm">
                              {formatAmount(payment.amount)}
                            </TableCell>
                            <TableCell className="text-xs">
                              {paymentMethodLabels[payment.paymentMethod] || payment.paymentMethod}
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground font-mono">
                              {payment.transactionRef ? payment.transactionRef.substring(0, 18) + '…' : '—'}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColors[payment.status] || ''}`}>
                                {paymentStatusLabels[payment.status] || payment.status}
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center justify-between mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {currentPage} sur {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex p-4 rounded-full bg-muted mb-3">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">Aucun paiement pour le moment</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Vos transactions GeniusPay apparaîtront ici
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* FAQ */}
        <motion.div variants={itemVariants}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HelpCircle className="h-5 w-5 text-emerald-500" />
                Questions fréquentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Accordion type="single" collapsible>
                <AccordionItem value="q1">
                  <AccordionTrigger>Comment fonctionne l'abonnement ?</AccordionTrigger>
                  <AccordionContent>
                    L'abonnement Premium coûte 10 000 FC pour 31 jours. Après le paiement via GeniusPay,
                    votre abonnement est activé immédiatement et vous donne accès à votre tableau de bord vendeur.
                    À l'expiration, vous devez renouveler manuellement.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q2">
                  <AccordionTrigger>Quels moyens de paiement puis-je utiliser ?</AccordionTrigger>
                  <AccordionContent>
                    GeniusPay supporte Orange Money, Airtel Money, M-Pesa, MTN MoMo, Moov Money, Wave,
                    ainsi que les cartes Visa et Mastercard. Tous ces moyens sont disponibles en RDC.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q3">
                  <AccordionTrigger>Que se passe-t-il à l'expiration ?</AccordionTrigger>
                  <AccordionContent>
                    Lorsque votre abonnement expire, votre accès au tableau de bord est suspendu.
                    Vos produits et commandes restent conservés. Renouvelez simplement votre abonnement
                    pour retrouver l'accès à votre boutique.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q4">
                  <AccordionTrigger>Le paiement est-il sécurisé ?</AccordionTrigger>
                  <AccordionContent>
                    Oui, tous les paiements sont traités via GeniusPay Checkout avec un chiffrement SSL.
                    Les webhooks sont vérifiés par signature HMAC-SHA256 et aucune donnée bancaire
                    n'est stockée sur nos serveurs.
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="q5">
                  <AccordionTrigger>Puis-je obtenir un remboursement ?</AccordionTrigger>
                  <AccordionContent>
                    Les paiements d'abonnement sont non remboursables. Si vous rencontrez un problème
                    technique, contactez le support via la messagerie pour obtenir de l'aide.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </motion.div>

        {/* Security note */}
        <motion.div variants={itemVariants} className="text-center text-xs text-muted-foreground pb-4">
          <Shield className="h-4 w-4 inline mr-1" />
          Paiements traités par GeniusPay • Copyright © HenoBuild
        </motion.div>
      </motion.div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={(open) => { if (!open) handleClosePaymentDialog(); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-emerald-500" />
              {paymentType === 'REGISTRATION'
                ? 'Inscription Vendeur'
                : paymentType === 'PREPAID'
                  ? 'Paiement en avance'
                  : 'Renouvellement d\'abonnement'}
            </DialogTitle>
            <DialogDescription>
              {paymentType === 'REGISTRATION'
                ? 'Payez les frais d\'inscription de 10 000 FC pour activer votre boutique.'
                : paymentType === 'PREPAID'
                  ? subscription?.status === 'TRIAL'
                    ? 'Payez votre abonnement maintenant. Il débutera automatiquement après la fin de votre période d\'essai gratuite.'
                    : 'Payez votre abonnement du mois suivant en avance. Il sera activé automatiquement à l\'expiration de votre abonnement actuel.'
                  : subscription?.status === 'TRIAL'
                    ? 'Payez votre abonnement maintenant. Il débutera après la fin de votre période d\'essai.'
                    : 'Payer l\'abonnement pour 31 jours supplémentaires.'}
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {paymentStep === 'form' && (
              <motion.div
                key="form"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Amount summary */}
                <div className="rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm text-muted-foreground">Montant à payer</div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                        {formatAmount(10000)}
                      </div>
                    </div>
                    <CalendarDays className="h-8 w-8 text-emerald-500" />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">Durée: 31 jours</div>
                </div>

                {/* Payment method selection */}
                <div>
                  <label className="text-sm font-medium mb-2 block">Choisissez un moyen de paiement</label>
                  <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                    {paymentMethodsInfo.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedMethod(method.id)}
                        className={`flex items-center gap-2 rounded-lg border-2 p-3 text-left transition-all ${
                          selectedMethod === method.id
                            ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 ring-2 ring-emerald-500/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <span className="text-xl">{method.icon}</span>
                        <span className="text-sm font-medium">{method.label}</span>
                        {selectedMethod === method.id && (
                          <CheckCircle className="h-4 w-4 text-emerald-500 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Phone number (for mobile money, not ALL checkout mode) */}
                {selectedMethod && selectedMethod !== 'ALL' && PAYMENT_METHODS.find(m => m.id === selectedMethod)?.group === 'mobile' && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <label className="text-sm font-medium">Numéro de téléphone mobile money</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="tel"
                        placeholder="+243 8XX XXX XXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Numéro enregistré avec votre compte mobile money
                    </p>
                  </motion.div>
                )}

                {errorMessage && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-3 text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/30 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                  <Info className="h-4 w-4 flex-shrink-0 text-blue-500" />
                  <span>
                    {selectedMethod === 'ALL'
                      ? 'Vous serez redirigé vers GeniusPay Checkout pour choisir votre moyen de paiement et finaliser le paiement de manière sécurisée.'
                      : 'Vous serez redirigé vers GeniusPay Checkout pour finaliser le paiement de manière sécurisée.'}
                  </span>
                </div>
              </motion.div>
            )}

            {paymentStep === 'processing' && (
              <motion.div
                key="processing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-12 flex flex-col items-center justify-center"
              >
                <Loader2 className="h-12 w-12 text-emerald-500 animate-spin mb-4" />
                <p className="text-lg font-medium">Création du paiement…</p>
                <p className="text-sm text-muted-foreground mt-1">Veuillez patienter</p>
              </motion.div>
            )}

            {paymentStep === 'checking' && (
              <motion.div
                key="checking"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 space-y-4"
              >
                <div className="text-center">
                  <div className="inline-flex p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                    <Loader2 className="h-10 w-10 text-emerald-500 animate-spin" />
                  </div>
                  <p className="text-lg font-medium">En attente de confirmation…</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Finalisez votre paiement dans la fenêtre GeniusPay.
                  </p>
                </div>

                {checkoutUrl && (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => window.open(checkoutUrl, '_blank', 'noopener,noreferrer')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Rouvrir GeniusPay Checkout
                  </Button>
                )}

                {/* Sandbox simulation buttons - only in sandbox mode */}
                {isSandbox && (
                  <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium text-amber-700 dark:text-amber-300">
                        Mode Sandbox — Simulation
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      Simulez le résultat du paiement pour tester le flux complet.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                        onClick={handleSimulateSuccess}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Simuler succès
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                        onClick={handleSimulateFailure}
                      >
                        <XCircle className="h-4 w-4 mr-1" />
                        Simuler échec
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Vérification automatique toutes les 5 secondes
                </div>
              </motion.div>
            )}

            {paymentStep === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="py-8 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.2 }}
                  className="inline-flex p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4"
                >
                  <PartyPopper className="h-12 w-12 text-emerald-500" />
                </motion.div>
                <h3 className="text-xl font-bold mb-1">Paiement confirmé !</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {paymentType === 'REGISTRATION'
                    ? 'Votre boutique est maintenant active. Votre abonnement est valable 31 jours.'
                    : paymentType === 'PREPAID'
                      ? 'Votre abonnement prépayé a été enregistré. Il sera activé automatiquement à l\'expiration de votre abonnement actuel.'
                      : 'Votre abonnement a été renouvelé pour 31 jours supplémentaires.'}
                </p>
                <Button
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                  onClick={() => {
                    handleClosePaymentDialog();
                    setCurrentView('vendor-dashboard');
                  }}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Accéder à mon tableau de bord
                </Button>
              </motion.div>
            )}

            {paymentStep === 'error' && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="py-8 text-center"
              >
                <div className="inline-flex p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                  <XCircle className="h-12 w-12 text-red-500" />
                </div>
                <h3 className="text-xl font-bold mb-1">Paiement échoué</h3>
                <p className="text-sm text-muted-foreground mb-4">{errorMessage}</p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setPaymentStep('form')}
                  >
                    Réessayer
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={handleClosePaymentDialog}
                  >
                    Fermer
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {paymentStep === 'form' && (
            <DialogFooter>
              <Button variant="outline" onClick={handleClosePaymentDialog}>
                Annuler
              </Button>
              <Button
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
                onClick={handleCreatePayment}
                disabled={!selectedMethod}
              >
                <Lock className="h-4 w-4 mr-2" />
                Payer {formatAmount(10000)}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
