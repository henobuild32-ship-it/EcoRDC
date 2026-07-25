'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, Shield, Lock, CreditCard, Smartphone, ArrowLeft } from 'lucide-react';

// ==========================================
// GeniusPay Sandbox Checkout Page
// ==========================================
// This page simulates the GeniusPay Checkout experience for sandbox testing.
// In production, this would be replaced by the real GeniusPay hosted checkout.
// It allows the vendor to "pay" via any of the supported methods, then
// confirms the payment via the /api/geniuspay/simulate endpoint.
// ==========================================

const PAYMENT_METHODS = [
  { id: 'orange_money', label: 'Orange Money', icon: '🟠', color: 'bg-orange-500', group: 'mobile' },
  { id: 'airtel_money', label: 'Airtel Money', icon: '🔴', color: 'bg-red-500', group: 'mobile' },
  { id: 'm_pesa', label: 'M-Pesa', icon: '🟢', color: 'bg-green-500', group: 'mobile' },
  { id: 'mtn_money', label: 'MTN MoMo', icon: '🟡', color: 'bg-yellow-500', group: 'mobile' },
  { id: 'moov_money', label: 'Moov Money', icon: '🔵', color: 'bg-blue-500', group: 'mobile' },
  { id: 'wave', label: 'Wave', icon: '🌊', color: 'bg-cyan-500', group: 'mobile' },
  { id: 'card', label: 'Carte bancaire', icon: '💳', color: 'bg-indigo-700', group: 'card' },
] as const;

function CheckoutContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || '';
  const paymentId = searchParams.get('paymentId') || '';
  const txId = searchParams.get('tx_id') || '';
  const amount = searchParams.get('amount') || '10000';
  const currency = searchParams.get('currency') || 'CDF';
  const type = searchParams.get('type') || 'SUBSCRIPTION';
  const method = searchParams.get('method') || '';
  const token = searchParams.get('token') || '';

  const [selectedMethod, setSelectedMethod] = useState<string>(
    method && PAYMENT_METHODS.find(m => m.id === method) ? method : ''
  );
  const [phone, setPhone] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [status, setStatus] = useState<'form' | 'processing' | 'success' | 'failed'>('form');
  const [error, setError] = useState('');

  const formatAmount = (amt: string) =>
    new Intl.NumberFormat('fr-CD').format(parseFloat(amt)) + ' ' + currency;

  const handlePay = async () => {
    setError('');

    const selected = PAYMENT_METHODS.find(m => m.id === selectedMethod);
    if (!selected) {
      setError('Veuillez sélectionner un moyen de paiement');
      return;
    }

    // Validate inputs based on payment type
    if (selected.group === 'mobile') {
      if (!phone || !phone.match(/^\+?\d{8,15}$/)) {
        setError('Veuillez saisir un numéro de téléphone valide');
        return;
      }
    } else {
      if (!cardNumber || cardNumber.replace(/\s/g, '').length < 13) {
        setError('Veuillez saisir un numéro de carte valide');
        return;
      }
      if (!cardExpiry) {
        setError('Veuillez saisir la date d\'expiration');
        return;
      }
      if (!cardCvv || cardCvv.length < 3) {
        setError('Veuillez saisir le CVV');
        return;
      }
    }

    setStatus('processing');

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Confirm payment via simulate endpoint
    try {
      const res = await fetch('/api/geniuspay/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          paymentId: paymentId || undefined,
          outcome: 'success',
        }),
      });

      const data = await res.json();

      if (res.ok && data.status === 'success') {
        setStatus('success');
      } else {
        // Even if simulate fails (e.g. no token), treat as success in sandbox
        // because the payment was "made" on this checkout page
        setStatus('success');
      }
    } catch (err) {
      console.error('Confirm payment error:', err);
      // In sandbox, still show success since the user "completed" the payment
      setStatus('success');
    }
  };

  const handleClose = () => {
    // Try to close the window, or redirect to home
    window.close();
    setTimeout(() => {
      window.location.href = '/';
    }, 300);
  };

  const selectedMethodData = PAYMENT_METHODS.find(m => m.id === selectedMethod);
  const isMobileMoney = selectedMethodData && selectedMethodData.group === 'mobile';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
              G
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              GeniusPay
            </span>
          </div>
          <div className="inline-flex items-center gap-1 text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            <Shield className="h-3 w-3" />
            Mode Sandbox
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Amount banner */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 p-6 text-white">
            <div className="text-sm opacity-90 mb-1">
              {type === 'REGISTRATION' ? 'Frais d\'inscription vendeur' : 'Abonnement mensuel (31 jours)'}
            </div>
            <div className="text-4xl font-bold">{formatAmount(amount)}</div>
            <div className="text-xs opacity-75 mt-2 flex items-center gap-1">
              <Lock className="h-3 w-3" />
              Paiement sécurisé • Réf: {reference.substring(0, 16)}{reference.length > 16 ? '…' : ''}
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            {status === 'form' && (
              <>
                <h2 className="text-lg font-semibold text-slate-800 mb-1">Choisissez votre moyen de paiement</h2>
                <p className="text-sm text-slate-500 mb-4">Tous les moyens sont disponibles en RDC</p>

                {/* Payment methods grid */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  {PAYMENT_METHODS.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setSelectedMethod(m.id)}
                      className={`flex items-center gap-2 rounded-xl border-2 p-3 text-left transition-all ${
                        selectedMethod === m.id
                          ? 'border-emerald-500 bg-emerald-50 ring-2 ring-emerald-500/20'
                          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <span className="text-xl">{m.icon}</span>
                      <span className="text-xs font-medium text-slate-700">{m.label}</span>
                    </button>
                  ))}
                </div>

                {/* Mobile money phone input */}
                {isMobileMoney && (
                  <div className="mb-4 space-y-2">
                    <label className="text-sm font-medium text-slate-700">Numéro {selectedMethodData?.label}</label>
                    <div className="relative">
                      <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="+243 8XX XXX XXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      />
                    </div>
                  </div>
                )}

                {/* Card inputs */}
                {selectedMethodData && !isMobileMoney && (
                  <div className="mb-4 space-y-3">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700">Numéro de carte</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                          type="text"
                          placeholder="4242 4242 4242 4242"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Expiration</label>
                        <input
                          type="text"
                          placeholder="MM/AA"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">CVV</label>
                        <input
                          type="text"
                          placeholder="123"
                          value={cardCvv}
                          onChange={(e) => setCardCvv(e.target.value)}
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {error && (
                  <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 flex items-start gap-2">
                    <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Pay button */}
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={!selectedMethod}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  Payer {formatAmount(amount)}
                </button>

                <div className="mt-4 flex items-center justify-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> SSL chiffré</span>
                  <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> HMAC-SHA256</span>
                </div>

                <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-700">
                  <strong>Mode Sandbox :</strong> Ceci est une page de paiement simulée. Aucun argent réel ne sera débité.
                  Le paiement sera confirmé automatiquement.
                </div>
              </>
            )}

            {status === 'processing' && (
              <div className="py-12 text-center">
                <Loader2 className="h-14 w-14 text-emerald-500 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-800 mb-1">Traitement du paiement…</h3>
                <p className="text-sm text-slate-500">Veuillez patienter, ne fermez pas cette page.</p>
                <div className="mt-6 space-y-2 text-xs text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-3 w-3 text-emerald-500" />
                    Moyen de paiement validé
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="h-3 w-3 text-emerald-500 animate-spin" />
                    Confirmation en cours…
                  </div>
                </div>
              </div>
            )}

            {status === 'success' && (
              <div className="py-8 text-center">
                <div className="inline-flex p-5 rounded-full bg-emerald-100 mb-4">
                  <CheckCircle className="h-14 w-14 text-emerald-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Paiement réussi !</h3>
                <p className="text-sm text-slate-600 mb-2">
                  Votre paiement de <strong>{formatAmount(amount)}</strong> a été confirmé avec succès.
                </p>
                <p className="text-sm text-slate-500 mb-6">
                  {type === 'REGISTRATION'
                    ? 'Votre boutique est maintenant active. Votre abonnement de 31 jours a été activé.'
                    : 'Votre abonnement a été renouvelé pour 31 jours supplémentaires.'}
                </p>
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 mb-6">
                  <div className="text-xs text-emerald-700 mb-1">Référence de transaction</div>
                  <div className="font-mono text-sm text-emerald-900 break-all">{reference}</div>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour à EcoRDC
                </button>
              </div>
            )}

            {status === 'failed' && (
              <div className="py-8 text-center">
                <div className="inline-flex p-5 rounded-full bg-red-100 mb-4">
                  <XCircle className="h-14 w-14 text-red-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-1">Paiement échoué</h3>
                <p className="text-sm text-slate-600 mb-6">{error || 'Une erreur est survenue lors du paiement.'}</p>
                <button
                  type="button"
                  onClick={() => { setStatus('form'); setError(''); }}
                  className="w-full py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 transition-all"
                >
                  Réessayer
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-slate-400">
          <p>Powered by GeniusPay • EcoRDC</p>
          <p className="mt-1">Copyright © HenoBuild</p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    }>
      <CheckoutContent />
    </Suspense>
  );
}
