'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Phone,
  Store,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Camera,
  MapPin,
  ImagePlus,
  Shield,
  Upload,
  PartyPopper,
  Clock,
  CreditCard,
  Wallet,
  Smartphone,
  ExternalLink,
  XCircle,
} from 'lucide-react';

// ---- Countries list ----
const COUNTRIES = [
  'RD Congo',
];

const SHOP_CATEGORIES = [
  { value: 'electronique', label: 'Électronique' },
  { value: 'mode', label: 'Mode & Vêtements' },
  { value: 'alimentation', label: 'Alimentation' },
  { value: 'maison', label: 'Maison & Déco' },
  { value: 'beaute', label: 'Beauté & Santé' },
  { value: 'sports', label: 'Sports & Loisirs' },
  { value: 'livres', label: 'Livres & Médias' },
  { value: 'services', label: 'Services' },
  { value: 'autres', label: 'Autres' },
];

const DRC_CITIES = [
  'Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kananga', 'Kisangani',
  'Goma', 'Bukavu', 'Tshikapa', 'Kikwit', 'Matadi',
  'Mbandaka', 'Likasi', 'Kalemie', 'Uvira', 'Beni',
];

// ---- Password strength ----
function getPasswordStrength(password: string): { score: number; label: string; color: string; textColor: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score: 1, label: 'Très faible', color: 'bg-red-500', textColor: 'text-red-500' };
  if (score === 2) return { score: 2, label: 'Faible', color: 'bg-orange-500', textColor: 'text-orange-500' };
  if (score === 3) return { score: 3, label: 'Moyen', color: 'bg-yellow-500', textColor: 'text-yellow-600' };
  if (score === 4) return { score: 4, label: 'Fort', color: 'bg-emerald-400', textColor: 'text-emerald-500' };
  return { score: 5, label: 'Très fort', color: 'bg-emerald-600', textColor: 'text-emerald-600' };
}

// ---- Step Progress Indicator ----
function StepIndicator({ currentStep, totalSteps, steps }: { currentStep: number; totalSteps: number; steps: { label: string; icon: React.ElementType }[] }) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative">
        {/* Progress line background */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-muted" />
        {/* Progress line fill */}
        <motion.div
          className="absolute top-4 left-0 h-0.5 bg-emerald-500"
          initial={{ width: '0%' }}
          animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
          transition={{ duration: 0.4, ease: 'easeInOut' }}
        />
        {steps.map((step, index) => {
          const stepNum = index + 1;
          const isCompleted = stepNum < currentStep;
          const isCurrent = stepNum === currentStep;
          const Icon = step.icon;
          return (
            <div key={stepNum} className="relative z-10 flex flex-col items-center gap-1.5">
              <motion.div
                initial={false}
                animate={{
                  scale: isCurrent ? 1.1 : 1,
                  backgroundColor: isCompleted ? '#059669' : isCurrent ? '#10b981' : 'hsl(var(--muted))',
                }}
                className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${
                  isCurrent ? 'ring-4 ring-emerald-100 dark:ring-emerald-900/40' : ''
                }`}
              >
                {isCompleted ? (
                  <CheckCircle2 className="h-4 w-4 text-white" />
                ) : (
                  <Icon className={`h-3.5 w-3.5 ${isCurrent ? 'text-white' : 'text-muted-foreground'}`} />
                )}
              </motion.div>
              <span className={`text-[10px] font-medium whitespace-nowrap ${
                isCurrent ? 'text-emerald-600 dark:text-emerald-400' : isCompleted ? 'text-emerald-600' : 'text-muted-foreground'
              }`}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---- Drag & Drop Image Upload ----
function ImageUploadZone({
  label,
  imageUrl,
  onImageSet,
  onImageClear,
  size = 'sm',
}: {
  label: string;
  imageUrl: string;
  onImageSet: (url: string) => void;
  onImageClear: () => void;
  size?: 'sm' | 'lg';
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFile = useCallback(async (file: File) => {
    setUploadError('');
    if (!file.type.startsWith('image/')) {
      setUploadError('Veuillez sélectionner un fichier image (JPG, PNG, WebP, GIF)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('L\'image dépasse la taille maximale de 5 Mo');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        throw new Error('Upload failed');
      }

      const data = await res.json();
      if (data.url) {
        onImageSet(data.url);
      } else {
        throw new Error(data.error || 'Réponse invalide');
      }
    } catch (err) {
      console.error('Upload error:', err);
      // Fallback: convert to base64 data URL so the image still works
      try {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64Url = reader.result as string;
          onImageSet(base64Url);
        };
        reader.onerror = () => {
          setUploadError('Impossible de téléverser l\'image. Veuillez réessayer.');
        };
        reader.readAsDataURL(file);
      } catch {
        setUploadError('Impossible de téléverser l\'image. Veuillez réessayer.');
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [onImageSet]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragOver(false);
  }, []);

  const isLarge = size === 'lg';

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      {imageUrl ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative group inline-block"
        >
          <img
            src={imageUrl}
            alt="Preview"
            className={`${isLarge ? 'h-24 w-24' : 'h-20 w-20'} rounded-xl object-cover border-2 border-emerald-300 dark:border-emerald-700 shadow-sm`}
          />
          <button
            type="button"
            onClick={onImageClear}
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md hover:bg-red-600"
          >
            ×
          </button>
        </motion.div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`${isLarge ? 'h-32' : 'h-24'} rounded-xl border-2 border-dashed cursor-pointer flex flex-col items-center justify-center gap-1.5 transition-all duration-200 ${
            dragOver
              ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 scale-[1.02]'
              : 'border-muted-foreground/30 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-muted/50'
          }`}
        >
          {uploading ? (
            <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
          ) : (
            <>
              {dragOver ? (
                <Upload className="h-6 w-6 text-emerald-500" />
              ) : (
                <ImagePlus className="h-5 w-5 text-muted-foreground" />
              )}
              <div className="text-center">
                <p className="text-xs font-medium text-muted-foreground">
                  {dragOver ? 'Déposez ici' : 'Glisser-déposer ou cliquer'}
                </p>
                <p className="text-[10px] text-muted-foreground/60">JPG, PNG, WebP (max 5MB)</p>
              </div>
            </>
          )}
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      {uploadError && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <span>⚠</span>
          {uploadError}
        </p>
      )}
    </div>
  );
}

// ---- Animated error message ----
function ErrorMessage({ message }: { message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, height: 0 }}
      animate={{ opacity: 1, y: 0, height: 'auto' }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className="flex items-center gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm"
    >
      <AlertCircle className="h-4 w-4 shrink-0" />
      {message}
    </motion.div>
  );
}

// ---- Success Animation ----
function SuccessAnimation({ name, role }: { name: string; role: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 15, stiffness: 200 }}
      className="text-center py-6 space-y-4"
    >
      {/* Confetti-like animation */}
      <div className="relative">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', damping: 12 }}
          className="h-20 w-20 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30"
        >
          <PartyPopper className="h-10 w-10 text-white" />
        </motion.div>
        {/* Animated rings */}
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.5 + i * 0.3, opacity: 0 }}
            transition={{ delay: 0.3 + i * 0.15, duration: 0.8, ease: 'easeOut' }}
            className="absolute inset-0 h-20 w-20 mx-auto rounded-full border-2 border-emerald-400"
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-xl font-bold text-foreground">Bienvenue, {name} !</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Votre compte {role === 'VENDOR' ? 'vendeur' : 'client'} a été créé avec succès
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="flex items-center justify-center gap-2 text-xs text-muted-foreground"
      >
        <Loader2 className="h-3 w-3 animate-spin" />
        <span>Connexion en cours...</span>
      </motion.div>
    </motion.div>
  );
}

// ---- Login Modal ----
function LoginModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { setUser, setCurrentView } = useAppStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Load saved email on mount
  useEffect(() => {
    const saved = localStorage.getItem('ecordc_remember_email');
    if (saved) {
      setEmail(saved);
      setRememberMe(true);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format d\'email invalide');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur de connexion');
        return;
      }

      // Handle remember me
      if (rememberMe) {
        localStorage.setItem('ecordc_remember_email', email);
      } else {
        localStorage.removeItem('ecordc_remember_email');
      }

      setUser(data.user, data.token);

      if (data.user.role === 'ADMIN') {
        setCurrentView('admin-dashboard');
      } else if (data.user.role === 'VENDOR') {
        setCurrentView('vendor-dashboard');
      } else {
        setCurrentView('client-dashboard');
      }

      onOpenChange(false);
      resetForm();
    } catch {
      setError('Erreur de connexion au serveur. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setError('');
    setShowPassword(false);
    setRememberMe(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md overflow-hidden">
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Se connecter</DialogTitle>
              <DialogDescription className="text-sm">Accédez à votre compte EcoRDC</DialogDescription>
            </div>
          </motion.div>
        </DialogHeader>

        <form onSubmit={handleLogin} className="space-y-4 mt-2">
          <AnimatePresence mode="wait">
            {error && <ErrorMessage key={error} message={error} />}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-2"
          >
            <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-email"
                type="email"
                placeholder="votre@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 h-11"
                autoComplete="email"
              />
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-2"
          >
            <Label htmlFor="login-password" className="text-sm font-medium">Mot de passe</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 h-11"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <Checkbox
                id="remember-me"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
              />
              <Label htmlFor="remember-me" className="text-sm text-muted-foreground cursor-pointer">
                Se souvenir de moi
              </Label>
            </div>
            <button
              type="button"
              onClick={() => {
                onOpenChange(false);
                resetForm();
                const event = new CustomEvent('ecordc-show-reset');
                window.dispatchEvent(event);
              }}
              className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
            >
              Mot de passe oublié ?
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 text-sm font-medium shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Se connecter
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </motion.div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---- Register Modal (Multi-step) ----

// Payment method info for vendor registration step 4
interface PaymentMethodInfo {
  id: string;
  label: string;
  group: 'mobile' | 'card';
  icon: string;
  color: string;
}

const DEFAULT_PAYMENT_METHODS: PaymentMethodInfo[] = [
  { id: 'orange_money', label: 'Orange Money', group: 'mobile', icon: 'smartphone', color: 'border-orange-300 bg-orange-50 dark:bg-orange-900/20' },
  { id: 'airtel_money', label: 'Airtel Money', group: 'mobile', icon: 'smartphone', color: 'border-red-300 bg-red-50 dark:bg-red-900/20' },
  { id: 'm_pesa', label: 'M-Pesa', group: 'mobile', icon: 'smartphone', color: 'border-green-300 bg-green-50 dark:bg-green-900/20' },
  { id: 'mtn_money', label: 'MTN MoMo', group: 'mobile', icon: 'smartphone', color: 'border-yellow-300 bg-yellow-50 dark:bg-yellow-900/20' },
  { id: 'moov_money', label: 'Moov Money', group: 'mobile', icon: 'smartphone', color: 'border-blue-300 bg-blue-50 dark:bg-blue-900/20' },
  { id: 'wave', label: 'Wave', group: 'mobile', icon: 'smartphone', color: 'border-cyan-300 bg-cyan-50 dark:bg-cyan-900/20' },
  { id: 'card', label: 'Carte bancaire', group: 'card', icon: 'credit-card', color: 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' },
];

function RegisterModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { setUser, setCurrentView, refreshUser } = useAppStore();
  const [role, setRole] = useState<'CLIENT' | 'VENDOR'>('CLIENT');
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [registeredData, setRegisteredData] = useState<{ user: any; token: string } | null>(null);

  // Vendor payment flow state (Step 4)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodInfo[]>(DEFAULT_PAYMENT_METHODS);
  const [paymentPhoneNumber, setPaymentPhoneNumber] = useState('');
  const [paymentStep, setPaymentStep] = useState<'idle' | 'registering' | 'initiating' | 'checking' | 'success' | 'error'>('idle');
  const [currentPaymentId, setCurrentPaymentId] = useState<string | null>(null);
  const [isSandbox, setIsSandbox] = useState(false);
  const [checkoutUrl, setCheckoutUrl] = useState('');
  const [paymentErrorMessage, setPaymentErrorMessage] = useState('');
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 1: Personal info
  const [name, setName] = useState('');
  const [avatar, setAvatar] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 2: Address
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('RD Congo');

  // Step 3: Shop info (vendor only)
  const [shopName, setShopName] = useState('');
  const [shopLogo, setShopLogo] = useState('');
  const [shopCategory, setShopCategory] = useState('');
  const [shopDescription, setShopDescription] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopCity, setShopCity] = useState('');
  const [shopCountry, setShopCountry] = useState('RD Congo');

  const passwordStrength = getPasswordStrength(password);

  // Fetch payment methods on mount (used for vendor payment step).
  // Falls back to DEFAULT_PAYMENT_METHODS if the API is unavailable.
  useEffect(() => {
    fetch('/api/geniuspay/create-subscription')
      .then(r => r.json())
      .then(data => {
        if (data.paymentMethods && Array.isArray(data.paymentMethods)) {
          // Map API response to local format with colors
          const mapped = data.paymentMethods.map((m: { id: string; label: string; icon: string; group: string }) => {
            const local = DEFAULT_PAYMENT_METHODS.find(p => p.id === m.id);
            return local || { ...m, color: 'border-gray-300 bg-gray-50 dark:bg-gray-900/20' };
          });
          setPaymentMethods(mapped);
        }
      })
      .catch(() => { /* keep default methods */ });
  }, []);

  // Cleanup polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  // Step definitions
  const clientSteps = [
    { label: 'Infos', icon: User },
    { label: 'Adresse', icon: MapPin },
  ];
  const vendorSteps = [
    { label: 'Infos', icon: User },
    { label: 'Adresse', icon: MapPin },
    { label: 'Boutique', icon: Store },
  ];
  const steps = role === 'VENDOR' ? vendorSteps : clientSteps;
  const totalSteps = steps.length;

  // Validate current step
  const validateStep = (step: number): boolean => {
    setError('');
    if (step === 1) {
      if (!name.trim()) { setError('Le nom complet est requis'); return false; }
      if (!email.trim()) { setError('L\'email est requis'); return false; }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) { setError('Format d\'email invalide'); return false; }
      if (!password) { setError('Le mot de passe est requis'); return false; }
      if (password.length < 6) { setError('Le mot de passe doit avoir au moins 6 caractères'); return false; }
      if (password !== confirmPassword) { setError('Les mots de passe ne correspondent pas'); return false; }
    }
    if (step === 3 && role === 'VENDOR') {
      if (!shopName.trim()) { setError('Le nom de la boutique est requis'); return false; }
    }
    if (step === 4 && role === 'VENDOR') {
      // Payment step - no validation needed, just confirmation
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  };

  const handlePrev = () => {
    setError('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    if (isSubmitting) return;
    if (!validateStep(currentStep)) return;

    setIsSubmitting(true);
    setLoading(true);

    try {
      // For vendors on the last step, submit registration directly (no payment)
      if (role === 'VENDOR' && currentStep === totalSteps) {
        await handleVendorRegister();
        return;
      }

      // For clients, register directly
      if (role === 'CLIENT') {
        await handleClientRegister();
      }
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleClientRegister = async () => {
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          avatar: avatar || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          country,
          role: 'CLIENT',
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur d\'inscription');
        return;
      }

      setUser(data.user, data.token);
      setCurrentView('client-dashboard');
      onOpenChange(false);
      resetForm();
    } catch {
      setError('Erreur de connexion au serveur. Veuillez réessayer.');
    }
  };

  const handleVendorRegister = async () => {
    setError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: email.trim().toLowerCase(),
          password,
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          country,
          role: 'VENDOR',
          shopName: shopName.trim(),
          shopLogo: shopLogo || undefined,
          shopCategory: shopCategory || undefined,
          shopDescription: shopDescription.trim() || undefined,
          shopAddress: shopAddress.trim() || undefined,
          shopCity: shopCity.trim() || undefined,
          shopCountry: shopCountry,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur d\'inscription');
        return;
      }

      setUser(data.user, data.token);
      setCurrentView('vendor-dashboard');
      onOpenChange(false);
      resetForm();
    } catch {
      setError('Erreur de connexion au serveur. Veuillez réessayer.');
    }
  };

  const handleVendorPayment = async () => {
    if (!selectedPaymentMethod) {
      setError('Veuillez sélectionner un moyen de paiement');
      return;
    }
    setPaymentLoading(true);
    setError('');
    setPaymentStep('registering');
    try {
      // Step 1: Register the vendor account
      const regRes = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'register',
          email: email.trim(),
          password,
          name: name.trim(),
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          city: city.trim() || undefined,
          country,
          role: 'VENDOR',
          shopName: shopName.trim(),
          shopLogo: shopLogo || undefined,
          shopCategory: shopCategory || undefined,
          shopDescription: shopDescription.trim() || undefined,
          shopAddress: shopAddress.trim() || undefined,
          shopCity: shopCity.trim() || undefined,
          shopCountry: shopCountry,
        }),
      });

      const regData = await regRes.json();

      if (!regRes.ok) {
        setError(regData.error || 'Erreur d\'inscription');
        setPaymentStep('error');
        return;
      }

      // Save registered data
      setRegisteredData({ user: regData.user, token: regData.token });

      // Step 2: Initiate GeniusPay payment
      setPaymentStep('initiating');
      const payRes = await fetch('/api/geniuspay/create-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${regData.token}` },
        body: JSON.stringify({
          type: 'REGISTRATION',
          paymentMethod: selectedPaymentMethod,
          phoneNumber: paymentPhoneNumber.trim() || undefined,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok || !payData.checkoutUrl) {
        setError(payData.error || 'Erreur lors de l\'initialisation du paiement');
        setPaymentStep('error');
        return;
      }

      setCheckoutUrl(payData.checkoutUrl);
      setCurrentPaymentId(payData.paymentId);
      setIsSandbox(!!payData.sandbox);

      // Open GeniusPay checkout page in a new tab
      window.open(payData.checkoutUrl, '_blank', 'noopener,noreferrer');

      // Step 3: Poll for payment status
      setPaymentStep('checking');
      startPaymentPolling(payData.paymentId, regData.token, regData.user, !!payData.sandbox);
    } catch {
      setError('Erreur de connexion au serveur. Veuillez réessayer.');
      setPaymentStep('error');
    } finally {
      setPaymentLoading(false);
    }
  };

  // Poll GeniusPay for payment status every 5 seconds (max 48 attempts = 4 min)
  const startPaymentPolling = (paymentId: string, token: string, user: any, sandbox: boolean) => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    let attempts = 0;
    const maxAttempts = sandbox ? 120 : 48; // 10 min for sandbox (auto-simulate), 4 min for real
    pollingRef.current = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch(`/api/geniuspay/status/${paymentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.status === 'success') {
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
          setPaymentStep('success');
          setPaymentCompleted(true);
          setRegistrationSuccess(true);
          // Auto-login and redirect to dashboard
          setTimeout(() => {
            setUser(user, token);
            refreshUser();
            setCurrentView('vendor-dashboard');
            onOpenChange(false);
            resetForm();
          }, 2000);
        } else if (data.status === 'failed') {
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
          setPaymentErrorMessage('Le paiement a échoué. Veuillez réessayer avec un autre moyen de paiement.');
          setPaymentStep('error');
        }
        if (attempts >= maxAttempts) {
          if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
          // Timeout: still log them in and redirect to subscription page so they can check status
          setPaymentErrorMessage('Le paiement est toujours en cours de vérification. Vous pouvez accéder à votre tableau de bord une fois le paiement confirmé.');
          setUser(user, token);
          setCurrentView('vendor-subscription');
          onOpenChange(false);
        }
      } catch {
        // Silently continue polling on network errors
      }
    }, 5000);
  };

  // Sandbox: simulate a successful payment instantly
  const handleSimulatePayment = async () => {
    if (!currentPaymentId || !registeredData) return;
    try {
      const res = await fetch('/api/geniuspay/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${registeredData.token}` },
        body: JSON.stringify({ paymentId: currentPaymentId, outcome: 'success' }),
      });
      if (res.ok) {
        // The polling will pick up the success status
      }
    } catch {
      // ignore
    }
  };

  const resetForm = () => {
    setRole('CLIENT');
    setCurrentStep(1);
    setName('');
    setAvatar('');
    setEmail('');
    setPhone('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setAddress('');
    setCity('');
    setCountry('RD Congo');
    setShopName('');
    setShopLogo('');
    setShopCategory('');
    setShopDescription('');
    setShopAddress('');
    setShopCity('');
    setShopCountry('RD Congo');
    setError('');
    setLoading(false);
    setIsSubmitting(false);
    setRegistrationSuccess(false);
    setPaymentLoading(false);
    setPaymentCompleted(false);
    setRegisteredData(null);
    // Reset payment flow state
    setSelectedPaymentMethod('');
    setPaymentPhoneNumber('');
    setPaymentStep('idle');
    setCurrentPaymentId(null);
    setIsSandbox(false);
    setCheckoutUrl('');
    setPaymentErrorMessage('');
    if (pollingRef.current) { clearInterval(pollingRef.current); pollingRef.current = null; }
  };

  // Slide animation variants
  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  const [direction, setDirection] = useState(0);

  const goNext = () => {
    setDirection(1);
    handleNext();
  };

  const goPrev = () => {
    setDirection(-1);
    handlePrev();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden p-0">
        <div className="flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="px-6 pt-6 pb-2">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 mb-4"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200 dark:shadow-emerald-900/30">
                <User className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold">Créer un compte</DialogTitle>
                <DialogDescription className="text-sm">Rejoignez la communauté EcoRDC</DialogDescription>
              </div>
            </motion.div>

            {/* Success animation */}
            {registrationSuccess ? (
              <SuccessAnimation name={name} role={role} />
            ) : (
              <>
                {/* Step Indicator */}
                <div className="mb-4 px-2">
                  <StepIndicator currentStep={currentStep} totalSteps={totalSteps} steps={steps} />
                </div>

                {/* Role Selection */}
                <div className="grid grid-cols-2 gap-3 mb-2">
                  <button
                    type="button"
                    onClick={() => { setRole('CLIENT'); setCurrentStep(1); }}
                    className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                      role === 'CLIENT'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md shadow-emerald-100 dark:shadow-emerald-900/20'
                        : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    <ShoppingBag className={`h-5 w-5 ${role === 'CLIENT' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                    <div className="text-left">
                      <span className={`font-medium text-sm block ${role === 'CLIENT' ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>
                        Client
                      </span>
                      <span className="text-[10px] text-muted-foreground">Acheter des produits</span>
                    </div>
                    {role === 'CLIENT' && (
                      <motion.div
                        layoutId="role-check"
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center"
                      >
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </motion.div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRole('VENDOR'); setCurrentStep(1); }}
                    className={`relative flex items-center gap-2.5 p-3 rounded-xl border-2 transition-all duration-200 ${
                      role === 'VENDOR'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 shadow-md shadow-emerald-100 dark:shadow-emerald-900/20'
                        : 'border-border hover:border-emerald-300 dark:hover:border-emerald-700'
                    }`}
                  >
                    <Store className={`h-5 w-5 ${role === 'VENDOR' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`} />
                    <div className="text-left">
                      <span className={`font-medium text-sm block ${role === 'VENDOR' ? 'text-emerald-700 dark:text-emerald-300' : 'text-muted-foreground'}`}>
                        Vendeur
                      </span>
                      <span className="text-[10px] text-muted-foreground">Vendre vos produits</span>
                    </div>
                    {role === 'VENDOR' && (
                      <motion.div
                        layoutId="role-check"
                        className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center"
                      >
                        <CheckCircle2 className="h-3 w-3 text-white" />
                      </motion.div>
                    )}
                  </button>
                </div>

                {/* Error message */}
                <AnimatePresence mode="wait">
                  {error && <ErrorMessage key={error} message={error} />}
                </AnimatePresence>
              </>
            )}
          </div>

          {/* Scrollable content area */}
          {!registrationSuccess && (
            <div className="overflow-y-auto px-6 pb-2 flex-1" style={{ scrollbarWidth: 'thin' }}>
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={currentStep}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="space-y-4 py-2"
                >
                  {currentStep === 1 && (
                    /* ---- Step 1: Personal Info ---- */
                    <>
                      {/* Name */}
                      <div className="space-y-2">
                        <Label htmlFor="reg-name" className="text-sm font-medium">
                          Nom complet <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="reg-name"
                            placeholder="Jean Mukendi"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="pl-10 h-10"
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="space-y-2">
                        <Label htmlFor="reg-email" className="text-sm font-medium">
                          Email <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="reg-email"
                            type="email"
                            placeholder="votre@email.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="pl-10 h-10"
                            autoComplete="email"
                          />
                        </div>
                      </div>

                      {/* Phone with +243 prefix */}
                      <div className="space-y-2">
                        <Label htmlFor="reg-phone" className="text-sm font-medium">Téléphone</Label>
                        <div className="flex gap-2">
                          <div className="flex items-center gap-1.5 px-3 h-10 rounded-md border border-input bg-muted/50 text-sm font-medium text-muted-foreground shrink-0">
                            <Phone className="h-3.5 w-3.5" />
                            +243
                          </div>
                          <Input
                            id="reg-phone"
                            type="tel"
                            placeholder="812 345 678"
                            value={phone}
                            onChange={(e) => {
                              const val = e.target.value.replace(/[^0-9\s]/g, '');
                              setPhone(val);
                            }}
                            className="flex-1 h-10"
                            maxLength={12}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-2">
                        <Label htmlFor="reg-password" className="text-sm font-medium">
                          Mot de passe <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="reg-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Minimum 6 caractères"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="pl-10 pr-10 h-10"
                            autoComplete="new-password"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        {/* Password strength indicator */}
                        {password && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="space-y-1.5"
                          >
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map((i) => (
                                <motion.div
                                  key={i}
                                  initial={{ scaleX: 0 }}
                                  animate={{ scaleX: i <= passwordStrength.score ? 1 : 1 }}
                                  transition={{ delay: i * 0.05, duration: 0.2 }}
                                  className={`h-2 flex-1 rounded-full transition-colors duration-300 origin-left ${
                                    i <= passwordStrength.score ? passwordStrength.color : 'bg-muted'
                                  }`}
                                />
                              ))}
                            </div>
                            <div className="flex items-center justify-between">
                              <p className={`text-xs font-medium ${passwordStrength.textColor}`}>
                                {passwordStrength.label}
                              </p>
                              {passwordStrength.score < 3 && (
                                <p className="text-[10px] text-muted-foreground">
                                  Utilisez des majuscules, chiffres et symboles
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </div>

                      {/* Confirm Password */}
                      <div className="space-y-2">
                        <Label htmlFor="reg-confirm-password" className="text-sm font-medium">
                          Confirmer le mot de passe <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="reg-confirm-password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Retapez votre mot de passe"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-10 pr-10 h-10"
                            autoComplete="new-password"
                          />
                          {confirmPassword && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              {password === confirmPassword ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </div>
                          )}
                        </div>
                        {confirmPassword && password !== confirmPassword && (
                          <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                        )}
                      </div>
                    </>
                  )}

                  {currentStep === 2 && (
                    /* ---- Step 2: Address ---- */
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                          <MapPin className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Adresse de livraison</p>
                          <p className="text-[11px] text-muted-foreground">Où souhaitez-vous recevoir vos commandes ?</p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reg-address" className="text-sm font-medium">Adresse</Label>
                        <Input
                          id="reg-address"
                          placeholder="123 Av. Lumumba, Commune de Gombe"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          className="h-10"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="reg-city" className="text-sm font-medium">Ville</Label>
                          <Select value={city} onValueChange={setCity}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              {DRC_CITIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                              <SelectItem value="Autre">Autre ville</SelectItem>
                            </SelectContent>
                          </Select>
                          {city === 'Autre' && (
                            <Input
                              placeholder="Entrez votre ville"
                              onChange={(e) => setCity(e.target.value)}
                              className="h-9 text-sm"
                            />
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="reg-country" className="text-sm font-medium">Pays</Label>
                          <Select value={country} onValueChange={setCountry}>
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Sélectionner" />
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTRIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      {/* Quick tip */}
                      <div className="flex gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                        <Shield className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <p className="text-xs text-emerald-700 dark:text-emerald-300">
                          Ces informations nous aident à vous proposer des vendeurs proches de chez vous.
                          Vous pourrez les modifier plus tard dans votre profil.
                        </p>
                      </div>
                    </>
                  )}

                  {currentStep === 3 && role === 'VENDOR' && (
                    /* ---- Step 3: Shop Info ---- */
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
                          <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">Informations boutique</p>
                          <p className="text-[11px] text-muted-foreground">Décrivez votre activité commerciale</p>
                        </div>
                      </div>

                      {/* Shop Name */}
                      <div className="space-y-2">
                        <Label htmlFor="reg-shop-name" className="text-sm font-medium">
                          Nom de la boutique <span className="text-red-500">*</span>
                        </Label>
                        <div className="relative">
                          <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="reg-shop-name"
                            placeholder="Ma Boutique"
                            value={shopName}
                            onChange={(e) => setShopName(e.target.value)}
                            className="pl-10 h-10"
                          />
                        </div>
                      </div>

                      {/* Shop Category */}
                      <div className="space-y-2">
                        <Label htmlFor="reg-shop-category" className="text-sm font-medium">Catégorie de la boutique</Label>
                        <Select value={shopCategory} onValueChange={setShopCategory}>
                          <SelectTrigger className="h-10">
                            <SelectValue placeholder="Sélectionner une catégorie" />
                          </SelectTrigger>
                          <SelectContent>
                            {SHOP_CATEGORIES.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Shop Description */}
                      <div className="space-y-2">
                        <Label htmlFor="reg-shop-description" className="text-sm font-medium">Description de la boutique</Label>
                        <Textarea
                          id="reg-shop-description"
                          placeholder="Décrivez votre boutique, vos produits et services..."
                          value={shopDescription}
                          onChange={(e) => setShopDescription(e.target.value)}
                          className="min-h-[80px] text-sm"
                        />
                      </div>

                      {/* Shop Address */}
                      <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-muted/20">
                        <p className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5" />
                          Adresse de la boutique
                        </p>
                        <div className="space-y-2">
                          <Input
                            placeholder="456 Av. Commerce"
                            value={shopAddress}
                            onChange={(e) => setShopAddress(e.target.value)}
                            className="h-9 text-sm"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <Select value={shopCity} onValueChange={setShopCity}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Ville" />
                            </SelectTrigger>
                            <SelectContent>
                              {DRC_CITIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                              <SelectItem value="Autre">Autre ville</SelectItem>
                            </SelectContent>
                          </Select>
                          <Select value={shopCountry} onValueChange={setShopCountry}>
                            <SelectTrigger className="h-9 text-sm">
                              <SelectValue placeholder="Pays" />
                            </SelectTrigger>
                            <SelectContent>
                              {COUNTRIES.map((c) => (
                                <SelectItem key={c} value={c}>{c}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Footer with navigation buttons */}
          {!registrationSuccess && (
            <div className="px-6 pb-6 pt-3 space-y-3">
              <div className="flex gap-3">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goPrev}
                    className="flex-1 h-11"
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Retour
                  </Button>
                )}
                {currentStep < totalSteps ? (
                  <Button
                    type="button"
                    onClick={goNext}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
                  >
                    Suivant
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                ) : (
                  <Button
                    type="button"
                    onClick={handleRegister}
                    disabled={loading}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white h-11 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        Créer mon compte
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </div>
              <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                En créant un compte, vous acceptez nos{' '}
                <span className="text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">conditions d&apos;utilisation</span>{' '}
                et notre{' '}
                <span className="text-emerald-600 dark:text-emerald-400 cursor-pointer hover:underline">politique de confidentialité</span>.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ---- Password Reset Modal ----
function PasswordResetModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Veuillez entrer votre email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Format d\'email invalide');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erreur lors de la demande');
        return;
      }

      setSuccess(true);
    } catch {
      setError('Erreur de connexion au serveur. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setError('');
    setSuccess(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg shadow-amber-200 dark:shadow-amber-900/30">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold">Mot de passe oublié</DialogTitle>
              <DialogDescription className="text-sm">Réinitialisez votre mot de passe</DialogDescription>
            </div>
          </motion.div>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4 space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 12, delay: 0.1 }}
                className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto"
              >
                <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </motion.div>
              <div>
                <h3 className="font-bold text-lg mb-2">Demande envoyée</h3>
                <p className="text-muted-foreground text-sm leading-relaxed max-w-xs mx-auto">
                  Votre demande de réinitialisation sera traitée après validation par un administrateur.
                </p>
              </div>

              {/* Info box about admin validation */}
              <div className="flex gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <p className="text-xs text-amber-700 dark:text-amber-300 text-left">
                  Un administrateur validera votre demande et vous fournira un mot de passe temporaire.
                  Vérifiez votre boîte email régulièrement.
                </p>
              </div>

              <Button
                onClick={() => {
                  onOpenChange(false);
                  resetForm();
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-md"
              >
                Compris
              </Button>
            </motion.div>
          ) : (
            <motion.form
              key="form"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onSubmit={handleReset}
              className="space-y-4 mt-2"
            >
              <AnimatePresence mode="wait">
                {error && <ErrorMessage key={error} message={error} />}
              </AnimatePresence>

              {/* Info text */}
              <div className="flex gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-300 text-left">
                  Entrez votre adresse email. Un administrateur validera votre demande et vous enverra un mot de passe temporaire.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    autoComplete="email"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white h-11 shadow-md shadow-emerald-200 dark:shadow-emerald-900/30"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Envoyer la demande
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </motion.form>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}

// ---- Main AuthModals Component ----
export default function AuthModals() {
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [showReset, setShowReset] = useState(false);

  // Listen for custom events from other components
  useEffect(() => {
    const showLoginHandler = () => {
      setShowRegister(false);
      setShowReset(false);
      setShowLogin(true);
    };
    const showRegisterHandler = () => {
      setShowLogin(false);
      setShowReset(false);
      setShowRegister(true);
    };
    const showResetHandler = () => {
      setShowLogin(false);
      setShowRegister(false);
      setShowReset(true);
    };

    window.addEventListener('ecordc-show-login', showLoginHandler);
    window.addEventListener('ecordc-show-register', showRegisterHandler);
    window.addEventListener('ecordc-show-reset', showResetHandler);

    return () => {
      window.removeEventListener('ecordc-show-login', showLoginHandler);
      window.removeEventListener('ecordc-show-register', showRegisterHandler);
      window.removeEventListener('ecordc-show-reset', showResetHandler);
    };
  }, []);

  return (
    <>
      <LoginModal open={showLogin} onOpenChange={setShowLogin} />
      <RegisterModal open={showRegister} onOpenChange={setShowRegister} />
      <PasswordResetModal open={showReset} onOpenChange={setShowReset} />
    </>
  );
}
