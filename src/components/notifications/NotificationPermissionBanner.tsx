'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Sparkles, X, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotificationPermissionBanner() {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);

    // If default (not requested yet) and not manually dismissed in this session
    if (Notification.permission === 'default') {
      const isDismissed = sessionStorage.getItem('notif_banner_dismissed') === 'true';
      if (!isDismissed) {
        // Show after 2 seconds for a non-intrusive experience
        const timer = setTimeout(() => setIsVisible(true), 2000);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) return;

    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      setIsVisible(false);

      if (res === 'granted') {
        new Notification('Notifications activées ! 🎉', {
          body: 'Vous recevrez désormais les alertes en temps réel sur les nouveaux produits et promotions d\'EcoRDC.',
          icon: '/ecordc-logo.png',
        });
      }
    } catch (err) {
      console.error('Error requesting notification permission:', err);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setDismissed(true);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('notif_banner_dismissed', 'true');
    }
  };

  if (!isVisible || permission !== 'default' || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="fixed top-20 right-4 left-4 md:left-auto md:right-6 z-50 md:max-w-md bg-gradient-to-r from-emerald-900/95 via-teal-900/95 to-slate-900/95 backdrop-blur-md text-white p-4 rounded-2xl shadow-2xl border border-emerald-500/30"
      >
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0 text-emerald-400 animate-pulse">
            <Bell className="h-5 w-5" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-emerald-300 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-emerald-400" />
                Activez les Notifications EcoRDC
              </h4>
            </div>
            <p className="text-xs text-emerald-100/80 leading-relaxed">
              Soyez averti instantanément lorsqu'une boutique publie un nouveau produit, des promotions exclusives ou réapprovisionne votre article favori !
            </p>

            <div className="pt-2 flex items-center gap-2">
              <Button
                size="sm"
                onClick={requestPermission}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium text-xs h-8 px-3 rounded-lg shadow-lg shadow-emerald-500/20"
              >
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                Autoriser les notifications
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
                className="text-xs text-emerald-300 hover:text-white hover:bg-white/10 h-8 px-2.5 rounded-lg"
              >
                Plus tard
              </Button>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="text-emerald-400/70 hover:text-white p-1 transition-colors"
            title="Fermer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
