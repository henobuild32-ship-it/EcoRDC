'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore, type Shop } from '@/lib/store';
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
} from 'lucide-react';
import { toast } from 'sonner';

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

const cities = [
  'Kinshasa', 'Lubumbashi', 'Mbuji-Mayi', 'Kananga', 'Kisangani',
  'Goma', 'Bukavu', 'Tshikapa', 'Kikwit', 'Matadi',
];

export default function VendorShopSettings() {
  const { user, token, setCurrentView } = useAppStore();
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('RDC');
  const [logo, setLogo] = useState<string>('');
  const [coverImage, setCoverImage] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [requestingBadge, setRequestingBadge] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    if (!token) return;
    const fetchShop = async () => {
      try {
        const res = await fetch('/api/shops', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          const myShop = (data.shops || []).find(
            (s: Shop) => s.ownerId === user?.id
          );
          if (myShop) {
            setShop(myShop);
            setName(myShop.name);
            setDescription(myShop.description || '');
            setCategory((myShop as any).category || '');
            setAddress((myShop as any).address || '');
            setCity((myShop as any).city || '');
            setCountry((myShop as any).country || 'RD Congo');
            setLogo(myShop.logo || '');
            setCoverImage(myShop.coverImage || '');
          }
        }
      } catch {
        // silently handle
      } finally {
        setLoading(false);
      }
    };
    fetchShop();
  }, [token, user]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    try {
      // uploadImage tries /api/upload first, then falls back to base64.
      const url = await uploadImage(file);
      setLogo(url);
      toast.success('Logo mis à jour');
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors du téléchargement' });
      toast.error('Erreur lors du téléchargement du logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      // uploadImage tries /api/upload first, then falls back to base64.
      const url = await uploadImage(file);
      setCoverImage(url);
      toast.success('Image de couverture mise à jour');
    } catch {
      setMessage({ type: 'error', text: 'Erreur lors du téléchargement' });
      toast.error('Erreur lors du téléchargement de la couverture');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleSave = async () => {
    if (!token || !shop) return;
    setSaving(true);
    try {
      const res = await fetch('/api/shops', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shopId: shop.id,
          name,
          description,
          logo,
          coverImage,
          category,
          address,
          city,
          country,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setShop(data.shop);
        setMessage({ type: 'success', text: 'Boutique mise à jour avec succès' });
        toast.success('Boutique mise à jour');
      } else {
        const data = await res.json();
        setMessage({ type: 'error', text: data.error || 'Erreur' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Erreur de connexion' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage(null), 3000);
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
      </motion.div>

      {/* Cover Image */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden">
          <div className="h-40 sm:h-56 bg-gradient-to-br from-emerald-400 to-green-600 relative group">
            {coverImage && (
              <img
                src={coverImage}
                alt="Couverture"
                className="w-full h-full object-cover"
              />
            )}
            <label className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
              <div className="text-center text-white">
                {uploadingCover ? (
                  <Loader2 className="h-8 w-8 mx-auto animate-spin" />
                ) : (
                  <>
                    <Camera className="h-8 w-8 mx-auto" />
                    <p className="text-sm mt-1">Changer la couverture</p>
                  </>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleCoverUpload}
                className="hidden"
                disabled={uploadingCover}
              />
            </label>
          </div>
          <CardContent className="p-4">
            <div className="flex items-end gap-4 -mt-12 relative z-10">
              <div className="relative group/logo">
                <div className="h-20 w-20 rounded-2xl bg-white shadow-lg border-2 border-white overflow-hidden">
                  {logo ? (
                    <img
                      src={logo}
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-emerald-50 dark:bg-emerald-900/30">
                      <Store className="h-8 w-8 text-emerald-600" />
                    </div>
                  )}
                </div>
                <label className="absolute inset-0 rounded-2xl flex items-center justify-center bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity cursor-pointer">
                  {uploadingLogo ? (
                    <Loader2 className="h-5 w-5 text-white animate-spin" />
                  ) : (
                    <Camera className="h-5 w-5 text-white" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    disabled={uploadingLogo}
                  />
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Shop Link Preview */}
      <motion.div variants={itemVariants}>
        <Card className="border-emerald-200 dark:border-emerald-800 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-950/30 dark:to-green-950/30">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center shrink-0">
                <ExternalLink className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Lien de votre boutique</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">
                  {shopUrl ? `${shop?.slug}.ecordc` : 'Chargement...'}
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  Redirige vers votre page boutique EcoRDC
                </p>
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

            {/* Address fields */}
            <div className="space-y-4 pt-2 border-t">
              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MapPin className="h-4 w-4" />
                Adresse
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
                    <SelectContent>
                      {cities.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Pays</Label>
                  <Select value={country} onValueChange={setCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="RD Congo">RD Congo</SelectItem>
                    </SelectContent>
                  </Select>
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
    </motion.div>
  );
}
