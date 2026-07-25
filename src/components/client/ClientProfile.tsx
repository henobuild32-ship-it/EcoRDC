'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import { uploadImage } from '@/lib/upload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  ArrowLeft,
  User,
  Camera,
  Save,
  Trash2,
  Loader2,
  Shield,
  Mail,
  Phone,
  MapPin,
  Globe,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  Calendar,
  Bell,
  Heart,
  Store,
  Sparkles,
} from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
};

export default function ClientProfile() {
  const { user, token, setUser, setCurrentView, logout } = useAppStore();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState((user as any)?.address || '');
  const [city, setCity] = useState((user as any)?.city || '');
  const [country, setCountry] = useState((user as any)?.country || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [deleting, setDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email);
      setPhone(user.phone || '');
      setAddress((user as any).address || '');
      setCity((user as any).city || '');
      setCountry((user as any).country || '');
    }
  }, [user]);

  const showMessage = (type: 'success' | 'error', text: string, target?: 'profile' | 'password') => {
    if (target === 'password') {
      setPasswordMessage({ type, text });
    } else {
      setMessage({ type, text });
    }
    setTimeout(() => {
      if (target === 'password') {
        setPasswordMessage(null);
      } else {
        setMessage(null);
      }
    }, 4000);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !token) return;

    // Keep the live preview while we upload (uses base64 locally so the user
    // sees their selection immediately, even before the network round-trip).
    const previewReader = new FileReader();
    previewReader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    previewReader.readAsDataURL(file);

    setUploading(true);
    try {
      // uploadImage tries /api/upload first, then falls back to base64.
      const avatarUrl = await uploadImage(file);

      // Persist the avatar (either the /uploads/... URL or the data URL) to the
      // backend via PUT /api/auth.
      const updateRes = await fetch('/api/auth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ avatar: avatarUrl }),
      });
      if (updateRes.ok) {
        const updatedData = await updateRes.json();
        if (updatedData.user) {
          setUser(updatedData.user, token);
        }
        // Preview no longer needed once the persisted avatar is in state.
        setAvatarPreview(null);
        showMessage('success', 'Photo de profil mise à jour');
      } else {
        showMessage('error', 'Erreur lors de la mise à jour du profil');
      }
    } catch {
      showMessage('error', 'Erreur de connexion');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!token) return;
    if (!name.trim()) {
      showMessage('error', 'Le nom est requis');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      showMessage('error', 'Email invalide');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, phone, address, city, country }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setUser(data.user, token);
        }
        showMessage('success', 'Profil mis à jour avec succès');
      } else {
        const data = await res.json();
        showMessage('error', data.error || 'Erreur lors de la mise à jour');
      }
    } catch {
      showMessage('error', 'Erreur de connexion');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!token) return;

    if (!currentPassword || !newPassword || !confirmPassword) {
      showMessage('error', 'Tous les champs sont requis', 'password');
      return;
    }

    if (newPassword.length < 6) {
      showMessage('error', 'Le nouveau mot de passe doit avoir au moins 6 caractères', 'password');
      return;
    }

    if (newPassword !== confirmPassword) {
      showMessage('error', 'Les mots de passe ne correspondent pas', 'password');
      return;
    }

    setChangingPassword(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (res.ok) {
        showMessage('success', 'Mot de passe modifié avec succès', 'password');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        showMessage('error', data.error || 'Erreur lors du changement de mot de passe', 'password');
      }
    } catch {
      showMessage('error', 'Erreur de connexion', 'password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!token) return;
    setDeleting(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        logout();
        setCurrentView('landing');
      } else {
        showMessage('error', 'Erreur lors de la suppression du compte');
      }
    } catch {
      showMessage('error', 'Erreur de connexion');
    } finally {
      setDeleting(false);
    }
  };

  const MessageBanner = ({
    msg,
  }: {
    msg: { type: 'success' | 'error'; text: string } | null;
  }) => {
    if (!msg) return null;
    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`p-3 rounded-xl text-sm flex items-center gap-2 ${
          msg.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
            : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300 border border-red-200 dark:border-red-800'
        }`}
      >
        {msg.type === 'success' ? (
          <CheckCircle className="h-4 w-4 shrink-0" />
        ) : (
          <AlertCircle className="h-4 w-4 shrink-0" />
        )}
        {msg.text}
      </motion.div>
    );
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentView('client-dashboard')}
          className="shrink-0 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Mon Profil</h1>
          <p className="text-sm text-muted-foreground">Gérez votre compte et vos préférences</p>
        </div>
      </motion.div>

      {/* Profile Header Card */}
      <motion.div variants={itemVariants}>
        <Card className="overflow-hidden shadow-md border-0">
          <div className="h-28 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 relative">
            <div className="absolute inset-0 opacity-10">
              <div className="absolute top-3 right-3 grid grid-cols-4 gap-2">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="h-1.5 w-1.5 rounded-full bg-white" />
                ))}
              </div>
            </div>
          </div>
          <CardContent className="p-6 -mt-14">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-background overflow-hidden ring-4 ring-emerald-100 dark:ring-emerald-900/30">
                  {avatarPreview || user?.avatar ? (
                    <img
                      src={avatarPreview || user?.avatar || ''}
                      alt={user?.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    user?.name?.charAt(0).toUpperCase()
                  )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center cursor-pointer shadow-lg transition-colors"
                  disabled={uploading}
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={uploading}
                />
              </div>

              <div className="text-center sm:text-left flex-1">
                <h2 className="text-xl font-bold">{user?.name}</h2>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
                <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start flex-wrap">
                  <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">
                    <Shield className="h-3 w-3 mr-1" />
                    {user?.role === 'CLIENT' ? 'Client' : user?.role === 'VENDOR' ? 'Vendeur' : 'Admin'}
                  </Badge>
                  {user?.createdAt && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                      <Calendar className="h-3 w-3" />
                      Membre depuis {new Date(user.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
                    </span>
                  )}
                  {user?.isActive && (
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800 text-[10px]">
                      Actif
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={itemVariants}>
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList className="w-full grid grid-cols-3 h-12">
            <TabsTrigger value="profile" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Informations</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">Sécurité</span>
            </TabsTrigger>
            <TabsTrigger value="preferences" className="gap-1.5 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
              <Bell className="h-4 w-4" />
              <span className="hidden sm:inline">Préférences</span>
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5 text-emerald-600" />
                  Informations personnelles
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nom complet</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        placeholder="Votre nom"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        placeholder="votre@email.com"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Téléphone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="pl-10"
                        placeholder="+243 xxx xxx xxx"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Adresse</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="address"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="pl-10"
                        placeholder="Votre adresse"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="city"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="pl-10"
                        placeholder="Votre ville"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="country"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        className="pl-10"
                        placeholder="RDC"
                      />
                    </div>
                  </div>
                </div>

                <MessageBanner msg={message} />

                <Button
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-md"
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
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Lock className="h-5 w-5 text-emerald-600" />
                  Changer le mot de passe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {newPassword && newPassword.length < 6 && (
                    <p className="text-xs text-red-500">Le mot de passe doit avoir au moins 6 caractères</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 pr-10"
                      placeholder="••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-xs text-red-500">Les mots de passe ne correspondent pas</p>
                  )}
                </div>

                <MessageBanner msg={passwordMessage} />

                <Button
                  className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 shadow-md"
                  onClick={handleChangePassword}
                  disabled={changingPassword}
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Modification...
                    </>
                  ) : (
                    <>
                      <Lock className="mr-2 h-4 w-4" />
                      Changer le mot de passe
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="border-red-200 dark:border-red-800/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Zone dangereuse
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  La suppression de votre compte est irréversible. Toutes vos données, commandes et favoris seront définitivement supprimés.
                </p>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20"
                      disabled={deleting}
                    >
                      {deleting ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="mr-2 h-4 w-4" />
                      )}
                      Supprimer mon compte
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Cette action est irréversible. Votre compte, vos commandes, vos favoris et toutes vos données seront définitivement supprimés de nos serveurs.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteAccount}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        Oui, supprimer mon compte
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences" className="space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Heart className="h-5 w-5 text-emerald-600" />
                  Mes favoris & boutiques
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Gérez vos produits favoris et les boutiques que vous suivez.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-5 flex flex-col items-center gap-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
                    onClick={() => setCurrentView('client-favorites')}
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-rose-400 to-rose-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Heart className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold">Mes Favoris</span>
                    <span className="text-xs text-muted-foreground">Produits enregistrés</span>
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-5 flex flex-col items-center gap-2 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all group"
                    onClick={() => setCurrentView('client-followed-shops')}
                  >
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                      <Store className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-semibold">Boutiques suivies</span>
                    <span className="text-xs text-muted-foreground">Vos boutiques préférées</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Bell className="h-5 w-5 text-emerald-600" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Consultez et gérez vos notifications.
                </p>
                <Button
                  variant="outline"
                  className="w-full border-emerald-200 dark:border-emerald-800 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                  onClick={() => setCurrentView('client-notifications')}
                >
                  <Bell className="h-4 w-4 mr-2 text-emerald-600" />
                  Voir toutes les notifications
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-emerald-600" />
                  Informations du compte
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2.5 border-b">
                    <span className="text-sm text-muted-foreground">ID du compte</span>
                    <span className="text-sm font-mono bg-muted/50 px-2 py-0.5 rounded">{user?.id?.slice(0, 12)}...</span>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b">
                    <span className="text-sm text-muted-foreground">Rôle</span>
                    <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 border-0">
                      {user?.role === 'CLIENT' ? 'Client' : user?.role === 'VENDOR' ? 'Vendeur' : 'Admin'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2.5 border-b">
                    <span className="text-sm text-muted-foreground">Statut</span>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 dark:border-emerald-800">
                      {user?.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-sm text-muted-foreground">Date d&apos;inscription</span>
                    <span className="text-sm">
                      {user?.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </motion.div>
    </motion.div>
  );
}
