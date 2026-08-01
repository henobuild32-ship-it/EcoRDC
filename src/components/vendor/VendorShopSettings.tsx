'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type Shop } from '@/lib/store';
import { AFRICAN_COUNTRIES, getCitiesByCountry } from '@/lib/african-countries';
import { uploadImage } from '@/lib/upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  Save,
  Loader2,
  Camera,
  Store,
  Star,
  CheckCircle2,
  Clock,
  XCircle,
  ExternalLink,
  AlertTriangle,
  MapPin,
  Globe,
  Trash2,
  User,
  Mail,
  Phone,
  Copy,
  Check,
  Share2,
  BookOpen,
  Sparkles,
  QrCode,
} from 'lucide-react';
import { toast } from 'sonner';
import { VendorGuide } from '@/components/vendor/VendorGuide';
import ShopQRModal from '@/components/vendor/ShopQRModal';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const shopCategories = [
  'Électronique',
  'Mode & Vêtements',
  'Alimentation',
  'Maison & Déco',
  'Beauté & Santé',
  'Sports & Loisirs',
  'Livres & Médias',
  'Services',
  'Autres',
];

// cities removed — dynamic from AFRICAN_COUNTRIES

export default function VendorShopSettings() {
  const { user, token, setCurrentView, setUser, setShowOnboarding } = useAppStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('RD Congo');
  const [shopPhone, setShopPhone] = useState('');
  const [shopEmail, setShopEmail] = useState('');
  const [commune, setCommune] = useState('');
  const [hours, setHours] = useState('');
  const [socialTiktok, setSocialTiktok] = useState('');
  const [socialInstagram, setSocialInstagram] = useState('');
  const [socialWhatsapp, setSocialWhatsapp] = useState('');
  const [currency, setCurrency] = useState('CDF');

  const [saving, setSaving] = useState(false);

  const [requestingBadge, setRequestingBadge] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);

  // Vendor personal info
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userAddress, setUserAddress] = useState('');
  const [userCity, setUserCity] = useState('');
  const [userCountry, setUserCountry] = useState('RDC');
  const [userAvatar, setUserAvatar] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Restore session from localStorage if store is empty
  useEffect(() => {
    if (!token) {
      const savedToken = localStorage.getItem('ecordc_token');
      const savedUser = localStorage.getItem('ecordc_user');
      if (savedToken && savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          setUser(parsed, savedToken);
        } catch { /* ignore */ }
      }
    }
  }, []);

  const populateShopState = (s: Shop) => {
    setShop(s);
    setName(s.name || '');
    setDescription(s.description || '');
    setCategory(s.category || '');
    setAddress(s.address || user?.address || '');
    setCity(s.city || user?.city || '');
    setCountry(s.country || 'RDC');


    setShopPhone(s.phone || user?.phone || '');
    setUserCountry((user as any)?.country || 'RDC');
    setShopEmail(s.email || user?.email || '');
    setCommune(s.commune || '');
    setHours(s.hours || '');
    try { const p = JSON.parse(s.socials || '{}'); setSocialTiktok(p.tiktok || ''); setSocialInstagram(p.instagram || ''); setSocialWhatsapp(p.whatsapp || ''); } catch { setSocialTiktok(''); setSocialInstagram(''); setSocialWhatsapp(''); }
    setCurrency(s.currency || 'CDF');
  };

  useEffect(() => {
    if (!token) return;

    const fetchShopData = async () => {
      try {
        const res = await fetch('/api/shops?myShop=true', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.shop) {
            populateShopState(data.shop);
            if (user) {
              setUser({ ...user, shop: data.shop }, token);
            }
            return;
          }
        }
      } catch {
        // Fallback to user.shop from store
      } finally {
        setLoading(false);
      }

      if (user?.shop) {
        populateShopState(user.shop as Shop);
        setLoading(false);
      } else {
        setLoading(false);
      }
    };

    fetchShopData();
  }, [token, user?.id]);

  // Sync personal info when user data changes
  useEffect(() => {
    if (user) {
      setUserName(user.name || '');
      setUserEmail(user.email || '');
      setUserPhone(user.phone || '');
      setUserAddress((user as any).address || '');
      setUserCity((user as any).city || '');
      setUserAvatar(user.avatar || '');
    }
  }, [user]);

  
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const url = await uploadImage(file);
      setUserAvatar(url);
      toast.success('Photo de profil mise à jour');
    } catch {
      setProfileMessage({ type: 'error', text: 'Erreur lors du téléchargement de la photo' });
      toast.error('Erreur lors du téléchargement de la photo');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleCopyLink = async () => {
    const targetSlug = shop?.slug || user?.shop?.slug || shop?.id || user?.shop?.id;
    if (!targetSlug) {
      toast.error('Aucun lien de boutique disponible');
      return;
    }
    const url = `${window.location.origin}/shop/${targetSlug}`;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(url);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = url;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopiedLink(true);
      toast.success('Lien copié avec succès !');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      toast.error('Erreur lors de la copie du lien');
    }
  };

  const handleSave = async () => {
    if (!token) {
      setMessage({ type: 'error', text: 'Vous devez être connecté' });
      return;
    }
    const targetShop = shop || (user?.shop as Shop | undefined);
    if (!targetShop) {
      setMessage({ type: 'error', text: 'Aucune boutique trouvée' });
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/shops', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopId: targetShop.id,
          name,
          description,


          category,
          address,
          city,
          country,
          phone: shopPhone,
          email: shopEmail,
          commune,
          hours,
          socials: JSON.stringify({ tiktok: socialTiktok, instagram: socialInstagram, whatsapp: socialWhatsapp }),
          currency,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        populateShopState(data.shop);
        if (user) {
          setUser({ ...user, shop: data.shop }, token);
        }
        setMessage({ type: 'success', text: 'Boutique mise à jour avec succès' });
        toast.success('✅ Boutique mise à jour avec succès');
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Erreur lors de la mise à jour' });
        toast.error(data.error || 'Erreur lors de la mise à jour');
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur de connexion' });
      toast.error('Erreur de connexion');
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleSaveProfile = async () => {
    if (!token) {
      setProfileMessage({ type: 'error', text: 'Vous devez être connecté' });
      return;
    }
    if (!userName.trim()) {
      setProfileMessage({ type: 'error', text: 'Le nom est requis' });
      return;
    }
    setSavingProfile(true);
    setProfileMessage(null);
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: userName,
          email: userEmail,
          phone: userPhone,
          address: userAddress,
          city: userCity,
          country: userCountry,
          avatar: userAvatar || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) setUser(data.user, token);
        setProfileMessage({ type: 'success', text: 'Profil mis à jour' });
        toast.success('Profil mis à jour');
      } else {
        const data = await res.json();
        setProfileMessage({ type: 'error', text: data.error || 'Erreur' });
      }
    } catch {
      setProfileMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setSavingProfile(false);
      setTimeout(() => setProfileMessage(null), 3000);
    }
  };

  const handleRequestBadge = async () => {
    if (!token || !shop) return;
    setRequestingBadge(true);
    try {
      const res = await fetch('/api/shops', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopId: shop.id,
          recommendationRequest: true,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShop(data.shop);
        setMessage({ type: 'success', text: 'Demande de badge envoyée' });
        toast.success('Demande de badge envoyée');
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors de la demande' });
    } finally {
      setRequestingBadge(false);
      setTimeout(() => setMessage(null), 3000);
    }
  };

  const handleDeleteShop = async () => {
    if (!token || !shop) return;
    try {
      const res = await fetch(`/api/shops?id=${shop.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        toast.success('Boutique supprimée');
        setCurrentView('vendor-dashboard');
      } else {
        toast.error('Erreur lors de la suppression');
      }
    } catch {
      toast.error('Erreur de connexion');
    }
    setDeleteDialogOpen(false);
  };

  const recommendationStatusConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    NONE: { label: 'Non demandé', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: Star },
    PENDING: { label: 'En attente', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Clock },
    APPROVED: { label: 'Approuvé', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', icon: CheckCircle2 },
    REJECTED: { label: 'Refusé', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', icon: XCircle },
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  const recStatus = shop?.recommendationStatus || 'NONE';
  const recConfig = recommendationStatusConfig[recStatus] || recommendationStatusConfig.NONE;
  const shopUrl = shop?.slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/shop/${shop.slug}` : '';

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('vendor-dashboard')}
          className="shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Ma Boutique</h1>
          <p className="text-sm text-muted-foreground">
            Gérez les paramètres de votre boutique
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={() => setGuideOpen(true)} className="shrink-0" title="Guide d'utilisation">
          <BookOpen className="h-5 w-5" />
        </Button>
        <Button variant="outline" onClick={() => setShowOnboarding(true)} className="shrink-0 gap-1.5" title="Revoir la présentation de l'application">
          <Sparkles className="h-4 w-4" />
          <span className="hidden sm:inline">Revoir la présentation</span>
        </Button>
      </motion.div>
      <VendorGuide open={guideOpen} onOpenChange={setGuideOpen} />

      {/* Shop Link Preview */}
      <motion.div variants={itemVariants}>
        <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                  <ExternalLink className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Lien de votre boutique</p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                    {shop?.slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/shop/${shop.slug}` : 'Chargement...'}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    Redirige vers votre page boutique EcoRDC
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setQrModalOpen(true)}
                  className="bg-white dark:bg-gray-800 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50"
                >
                  <QrCode className="h-4 w-4 mr-1.5" />
                  QR Code
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopyLink}
                  className="bg-white dark:bg-gray-800 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/50"
                >
                  {copiedLink ? (
                    <>
                      <Check className="h-4 w-4 mr-1 text-emerald-600" />
                      Copié !
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copier le lien
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Shop Info Form */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Store className="h-5 w-5 text-emerald-600" />
              Informations de la boutique
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shop-name">Nom de la boutique</Label>
                <Input
                  id="shop-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom de votre boutique"
                />
              </div>
              <div className="space-y-2">
                <Label>Catégorie</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {shopCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="shop-phone">Téléphone de la boutique</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="shop-phone"
                    value={shopPhone}
                    onChange={(e) => setShopPhone(e.target.value)}
                    placeholder="+243..."
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="shop-email">Email de la boutique</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="shop-email"
                    type="email"
                    value={shopEmail}
                    onChange={(e) => setShopEmail(e.target.value)}
                    placeholder="contact@boutique.com"
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shop-description">Description</Label>
              <Textarea
                id="shop-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décrivez votre boutique..."
                rows={4}
              />
            </div>

            {/* Address & Location */}
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Localisation
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="shop-address">Adresse</Label>
                  <Input
                    id="shop-address"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Ex: 123 Ave. Kasavubu"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ville</Label>
                  <Select value={city} onValueChange={setCity}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {getCitiesByCountry(country).map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="shop-commune">Commune / Quartier</Label>
                  <Input
                    id="shop-commune"
                    value={commune}
                    onChange={(e) => setCommune(e.target.value)}
                    placeholder="Ex: Gombe, Lingwala..."
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Pays</Label>
                  <Select value={country} onValueChange={(v) => { setCountry(v); setCity(''); }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {AFRICAN_COUNTRIES.map((c) => (
                        <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Details & Socials */}
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Clock className="h-4 w-4" />
                Horaires & Devise
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="shop-hours">Horaires d&apos;ouverture</Label>
                  <Input
                    id="shop-hours"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="Ex: Lun-Sam: 8h00 - 18h00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Devise principale</Label>
                  <Select value={currency} onValueChange={setCurrency}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CDF">Franc Congolais (CDF)</SelectItem>
                      <SelectItem value="USD">Dollar Américain (USD)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Réseaux sociaux</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.9 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.6 0 1.15.18 1.62.5V10.3a6.34 6.34 0 0 0-1.62-.23 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.35 6.34 6.34 0 0 0 6.34-6.35V8.75a8.24 8.24 0 0 0 4.77 1.5v-3.4a4.85 4.85 0 0 1-1.12-.16z"/></svg>
                      <Input value={socialTiktok} onChange={(e) => setSocialTiktok(e.target.value)} placeholder="Nom ou lien TikTok" className="h-9 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
                      <Input value={socialInstagram} onChange={(e) => setSocialInstagram(e.target.value)} placeholder="Nom ou lien Instagram" className="h-9 text-sm" />
                    </div>
                    <div className="flex items-center gap-2">
                      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                      <Input value={socialWhatsapp} onChange={(e) => setSocialWhatsapp(e.target.value)} placeholder="Numéro WhatsApp" className="h-9 text-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  message.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                }`}
              >
                {message.text}
              </div>
            )}

            <div className="flex gap-3">
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setCurrentView('vendor-dashboard')}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Personal Info */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5 text-emerald-600" />
              Informations personnelles
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Avatar upload */}
            <div className="flex items-center gap-4">
              <div className="relative group/avatar">
                <div className="h-16 w-16 rounded-full bg-white shadow border-2 border-white overflow-hidden">
                  {userAvatar ? (
                    <img src={userAvatar} alt="Photo" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30">
                      <User className="h-7 w-7 text-emerald-600" />
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                  {uploadingAvatar ? (
                    <Loader2 className="h-4 w-4 text-white animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                </label>
              </div>
              <div>
                <p className="text-sm font-medium">Photo de profil</p>
                <p className="text-xs text-muted-foreground">Survolez pour changer</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-name">Nom complet</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-name"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-email"
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-phone">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-phone"
                    value={userPhone}
                    onChange={(e) => setUserPhone(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="user-address">Adresse</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="user-address"
                    value={userAddress}
                    onChange={(e) => setUserAddress(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ville</Label>
                <Select value={userCity} onValueChange={setUserCity}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {getCitiesByCountry(userCountry).map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Select value={userCountry} onValueChange={(v) => { setUserCountry(v); setUserCity(''); }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {AFRICAN_COUNTRIES.map((c) => (
                      <SelectItem key={c.name} value={c.name}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {profileMessage && (
              <div
                className={`p-3 rounded-lg text-sm ${
                  profileMessage.type === 'success'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300'
                    : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300'
                }`}
              >
                {profileMessage.text}
              </div>
            )}

            <Button
              className="bg-emerald-600 hover:bg-emerald-700"
              onClick={handleSaveProfile}
              disabled={savingProfile}
            >
              {savingProfile ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer le profil
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recommendation Badge */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Badge de recommandation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Le badge de recommandation rassure vos clients sur la qualité de votre
              boutique. Votre demande sera examinée par notre équipe.
            </p>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Statut :</span>
              <Badge className={`text-xs border-0 ${recConfig.color}`}>
                <recConfig.icon className="h-3 w-3 mr-1" />
                {recConfig.label}
              </Badge>
            </div>

            {shop?.isRecommended && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium text-sm">
                    Votre boutique est recommandée !
                  </span>
                </div>
              </div>
            )}

            {recStatus !== 'PENDING' && recStatus !== 'APPROVED' && (
              <Button
                variant="outline"
                className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
                onClick={handleRequestBadge}
                disabled={requestingBadge}
              >
                {requestingBadge ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Star className="mr-2 h-4 w-4" />
                )}
                Demander le badge de recommandation
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Danger Zone */}
      <motion.div variants={itemVariants}>
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Zone dangereuse
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-red-50/50 dark:bg-red-950/20 rounded-xl">
              <div>
                <p className="font-medium text-sm text-red-700 dark:text-red-300">Supprimer la boutique</p>
                <p className="text-xs text-red-600/70 dark:text-red-400/70 mt-0.5">
                  Cette action est irréversible. Tous vos produits et données seront supprimés.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/20"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Supprimer
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Supprimer la boutique
            </AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Toutes les données de votre boutique <strong>{shop?.name}</strong> seront supprimées, y compris vos produits, commandes et factures.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteShop}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Supprimer définitivement
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Shop QR Code Modal */}
      {(shop || user?.shop) && (
        <ShopQRModal
          open={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          shopSlug={shop?.slug || user?.shop?.slug || shop?.id || user?.shop?.id || ''}
          shopName={shop?.name || user?.shop?.name || 'Ma boutique'}
        />
      )}
    </motion.div>
  );
}
