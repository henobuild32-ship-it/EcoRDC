'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Shield, Lock, AlertTriangle, Terminal, Eye, EyeOff, Timer, Fingerprint } from 'lucide-react';

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 60;

interface MatrixColumn {
  id: number;
  x: number;
  chars: string[];
  speed: number;
  opacity: number;
}

export default function AdminAccess() {
  const { isAdminAccessOpen, setIsAdminAccessOpen, setCurrentView, token, touchAdminActivity, setUser } = useAppStore();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockdownTimer, setLockdownTimer] = useState(0);
  const [matrixColumns, setMatrixColumns] = useState<MatrixColumn[]>([]);
  const [shakeError, setShakeError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lockdownInterval = useRef<NodeJS.Timeout | null>(null);
  const matrixFrameRef = useRef<number>(0);

  // Generate matrix rain columns with blue/cyan
  useEffect(() => {
    if (!isAdminAccessOpen) return;

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&*{}[]<>あいうえおカキクケコ';
    const columns: MatrixColumn[] = Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: (i / 24) * 100,
      chars: Array.from({ length: 15 }, () => chars[Math.floor(Math.random() * chars.length)]),
      speed: 0.5 + Math.random() * 1.5,
      opacity: 0.03 + Math.random() * 0.08,
    }));
    setMatrixColumns(columns);

    const interval = setInterval(() => {
      setMatrixColumns((prev) =>
        prev.map((col) => ({
          ...col,
          chars: col.chars.map(() => chars[Math.floor(Math.random() * chars.length)]),
        }))
      );
    }, 100);

    return () => {
      clearInterval(interval);
      if (matrixFrameRef.current) cancelAnimationFrame(matrixFrameRef.current);
    };
  }, [isAdminAccessOpen]);

  // Lockdown countdown timer
  useEffect(() => {
    if (isLocked && lockdownTimer > 0) {
      lockdownInterval.current = setInterval(() => {
        setLockdownTimer((prev) => {
          if (prev <= 1) {
            setIsLocked(false);
            setFailedAttempts(0);
            setError('');
            if (lockdownInterval.current) clearInterval(lockdownInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => {
        if (lockdownInterval.current) clearInterval(lockdownInterval.current);
      };
    }
  }, [isLocked, lockdownTimer]);

  // Focus input when dialog opens
  useEffect(() => {
    if (isAdminAccessOpen && !isLocked) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isAdminAccessOpen, isLocked]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isAdminAccessOpen) {
      setCode('');
      setError('');
      setFailedAttempts(0);
      setIsLocked(false);
      setLockdownTimer(0);
      setShowPassword(false);
      setShakeError(false);
      if (lockdownInterval.current) clearInterval(lockdownInterval.current);
    }
  }, [isAdminAccessOpen]);

  const triggerErrorShake = () => {
    setShakeError(true);
    setTimeout(() => setShakeError(false), 600);
  };

  const handleVerify = useCallback(async () => {
    if (!code.trim() || isLocked || isVerifying) return;
    setIsVerifying(true);
    setError('');

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ action: 'verify-admin', code }),
      });

      const data = await res.json();

      if (data.verified) {
        setFailedAttempts(0);
        touchAdminActivity(); // Mark admin session as active for inactivity tracking

        // Set the admin user/token in the store so subsequent API calls are authenticated
        if (data.token && data.user) {
          setUser(data.user, data.token);
        }

        setCurrentView('admin-dashboard');
        setIsAdminAccessOpen(false);
        setCode('');

        // Log admin access
        try {
          await fetch('/api/admin', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(data.token ? { Authorization: `Bearer ${data.token}` } : (token ? { Authorization: `Bearer ${token}` } : {})),
            },
            body: JSON.stringify({ action: 'log-admin-access' }),
          });
        } catch {
          /* silently handle */
        }
      } else {
        const newFailedCount = failedAttempts + 1;
        setFailedAttempts(newFailedCount);
        triggerErrorShake();

        if (newFailedCount >= MAX_ATTEMPTS) {
          setIsLocked(true);
          setLockdownTimer(LOCKOUT_DURATION);
          setError(`Trop de tentatives échouées. Réessayez dans ${LOCKOUT_DURATION} secondes.`);
        } else {
          setError(`Code invalide. ${MAX_ATTEMPTS - newFailedCount} tentative(s) restante(s).`);
        }
      }
    } catch {
      setError('Erreur de connexion au serveur');
      triggerErrorShake();
    } finally {
      setIsVerifying(false);
    }
  }, [code, isLocked, isVerifying, failedAttempts, token, setCurrentView, setIsAdminAccessOpen, touchAdminActivity, setUser]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleVerify();
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isAdminAccessOpen} onOpenChange={setIsAdminAccessOpen}>
      <DialogContent className="sm:max-w-md border-blue-500/20 bg-[#0f172a] text-white overflow-hidden">
        {/* Matrix rain background - blue/cyan */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {matrixColumns.map((col) => (
            <div
              key={col.id}
              className="absolute top-0 font-mono text-[10px] leading-[14px] whitespace-pre"
              style={{
                left: `${col.x}%`,
                opacity: col.opacity,
              }}
            >
              {col.chars.map((c, i) => (
                <motion.div
                  key={`${col.id}-${i}`}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: [0, 1, 0.5, 0], y: [0, 14] }}
                  transition={{
                    duration: col.speed,
                    delay: i * 0.05,
                    repeat: Infinity,
                    repeatDelay: Math.random() * 2,
                  }}
                  className={i === 0 ? 'text-cyan-300' : i < 3 ? 'text-blue-300' : 'text-blue-500/70'}
                >
                  {c}
                </motion.div>
              ))}
            </div>
          ))}
          {/* Scanline overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.04) 2px, rgba(0,0,0,0.04) 4px)',
            }}
          />
          {/* Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, transparent 50%, rgba(15,23,42,0.6) 100%)',
            }}
          />
        </div>

        <DialogHeader className="relative z-10">
          <DialogTitle className="flex flex-col items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, repeatDelay: 2 }}
              className="h-14 w-14 rounded-2xl bg-gradient-to-br from-[#3b82f6] to-[#1d4ed8] flex items-center justify-center shadow-lg shadow-blue-500/20"
            >
              <Shield className="h-7 w-7 text-white" />
            </motion.div>
            <span className="bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent font-bold tracking-wider text-xl">
              ACCÈS ADMINISTRATEUR
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="relative z-10 space-y-5 py-4">
          {/* Terminal-style info box */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#020617] border border-blue-500/15 rounded-xl p-4 font-mono text-sm"
          >
            <div className="flex items-center gap-2 text-[#3b82f6] mb-2">
              <Terminal className="h-4 w-4" />
              <span className="text-xs opacity-80">ecordc-admin@server:~$</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Vérification d&apos;identité requise. Entrez le code d&apos;accès
              administrateur pour continuer.
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Fingerprint className="h-3 w-3 text-blue-500/40" />
              <p className="text-[10px] text-blue-500/40">Authentification sécurisée v4.0</p>
            </div>
          </motion.div>

          {/* Password input */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="space-y-3"
          >
            <motion.div
              animate={shakeError ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
              transition={{ duration: 0.5 }}
              className="relative"
            >
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#3b82f6]/60" />
              <Input
                ref={inputRef}
                type={showPassword ? 'text' : 'password'}
                placeholder="Code d'accès secret"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  if (!isLocked) setError('');
                }}
                onKeyDown={handleKeyDown}
                disabled={isLocked}
                className="pl-10 pr-10 bg-[#020617] border-blue-500/25 text-white placeholder:text-slate-600 focus:border-[#3b82f6] focus:ring-[#3b82f6]/20 font-mono tracking-widest h-12 rounded-xl"
                autoFocus
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </motion.div>

            {/* Remaining attempts indicator */}
            {failedAttempts > 0 && !isLocked && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2"
              >
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                      i < failedAttempts ? 'bg-[#dc2626]' : 'bg-slate-700'
                    }`}
                  />
                ))}
                <span className="text-[10px] text-slate-500 ml-1 whitespace-nowrap">
                  {MAX_ATTEMPTS - failedAttempts} restante(s)
                </span>
              </motion.div>
            )}

            {/* Error message with animation */}
            <AnimatePresence>
              {error && !isLocked && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.95 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  className="flex items-center gap-2.5 text-[#dc2626] text-sm bg-[#dc2626]/10 border border-[#dc2626]/25 rounded-xl p-3"
                >
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 0.4 }}
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                  </motion.div>
                  <span className="font-medium">{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Lockdown timer display */}
            <AnimatePresence>
              {isLocked && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                  className="bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-xl p-5 text-center"
                >
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                    className="mx-auto mb-3 w-fit"
                  >
                    <Timer className="h-8 w-8 text-[#dc2626]" />
                  </motion.div>
                  <p className="text-[#dc2626] font-semibold text-sm mb-2">
                    Accès temporairement bloqué
                  </p>
                  <motion.p
                    key={lockdownTimer}
                    initial={{ scale: 1.3, color: '#f87171' }}
                    animate={{ scale: 1, color: '#dc2626' }}
                    transition={{ duration: 0.3 }}
                    className="text-3xl font-mono font-bold text-[#dc2626]"
                  >
                    {formatTimer(lockdownTimer)}
                  </motion.p>
                  <p className="text-[10px] text-[#dc2626]/50 mt-2">
                    Trop de tentatives échouées
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Access button */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <Button
              onClick={handleVerify}
              disabled={isVerifying || !code.trim() || isLocked}
              className="w-full bg-gradient-to-r from-[#3b82f6] to-[#2563eb] hover:from-[#2563eb] hover:to-[#1d4ed8] text-white font-semibold py-6 rounded-xl relative overflow-hidden group disabled:opacity-40 shadow-lg shadow-blue-500/20"
            >
              <span className="relative z-10 flex items-center justify-center gap-2">
                {isVerifying ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    <Shield className="h-5 w-5" />
                    Accéder au panneau
                  </>
                )}
              </span>
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/10 to-blue-400/0"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
              />
            </Button>
          </motion.div>

          {/* Footer info */}
          <div className="flex items-center justify-center gap-3 text-[10px] text-slate-600 font-mono">
            <span className="flex items-center gap-1">
              <Lock className="h-2.5 w-2.5" />
              Accès restreint
            </span>
            <span className="text-slate-700">·</span>
            <span>Tentatives enregistrées</span>
            <span className="text-slate-700">·</span>
            <span>Anti-brute force actif</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
