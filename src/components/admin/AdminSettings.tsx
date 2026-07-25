'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAppStore } from '@/lib/store';
import AdminSidebar from './AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Settings, Globe, Shield, Database, AlertTriangle, Save, Server,
  Bell, MessageSquare, ShoppingCart, Users, Eye, Palette, Mail,
  Lock, Sliders, Upload,
} from 'lucide-react';
import { toast } from 'sonner';

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3 },
};

export default function AdminSettings() {
  const { user } = useAppStore();
  const [saving, setSaving] = useState(false);
  const [dangerDialog, setDangerDialog] = useState<'reset' | 'clear' | null>(null);

  // Platform
  const [platformName, setPlatformName] = useState('EcoRDC');
  const [platformLogo, setPlatformLogo] = useState('');
  const [platformDesc, setPlatformDesc] = useState('Plateforme e-commerce écologique en RDC');

  // Colors
  const [primaryColor, setPrimaryColor] = useState('#3b82f6');
  const [accentColor, setAccentColor] = useState('#f59e0b');

  // Emails
  const [contactEmail, setContactEmail] = useState('contact@ecordc');
  const [supportEmail, setSupportEmail] = useState('support@ecordc');
  const [notificationsEmail, setNotificationsEmail] = useState('notifications@ecordc');

  // Security
  const [sessionTimeout, setSessionTimeout] = useState(30);
  const [maxLoginAttempts, setMaxLoginAttempts] = useState(5);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);

  // Feature toggles
  const [features, setFeatures] = useState({
    allowRegistration: true,
    allowVendorRegistration: true,
    enableMessaging: true,
    enableReviews: true,
    enablePromotions: true,
    requireEmailVerification: false,
  });

  const handleToggleFeature = (key: keyof typeof features) => {
    setFeatures((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 1000));
    toast.success('Paramètres sauvegardés');
    setSaving(false);
  };

  const featureToggles: { key: keyof typeof features; label: string; description: string; icon: React.ElementType }[] = [
    { key: 'allowRegistration', label: 'Inscriptions clients', description: 'Autoriser les nouvelles inscriptions clients', icon: Users },
    { key: 'allowVendorRegistration', label: 'Inscriptions vendeurs', description: 'Autoriser les nouvelles inscriptions vendeurs', icon: Users },
    { key: 'enableMessaging', label: 'Messagerie', description: 'Activer le système de messagerie', icon: MessageSquare },
    { key: 'enableReviews', label: 'Avis clients', description: 'Autoriser les avis sur les produits', icon: Bell },
    { key: 'enablePromotions', label: 'Promotions', description: 'Activer le système de promotions', icon: ShoppingCart },
    { key: 'requireEmailVerification', label: 'Vérification email', description: 'Exiger la vérification par email', icon: Shield },
  ];

  return (
    <AdminSidebar>
      <motion.div {...fadeIn} className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
            <Settings className="h-6 w-6 text-blue-400" />
            Paramètres Système
          </h1>
          <p className="text-slate-400 text-sm mt-1">Configuration et paramètres de la plateforme</p>
        </div>

        {/* a) Plateforme */}
        <Card className="border border-[#334155] bg-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Globe className="h-5 w-5 text-blue-400" />
              Plateforme
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="platform-name" className="text-slate-300">Nom de la plateforme</Label>
                <Input
                  id="platform-name"
                  value={platformName}
                  onChange={(e) => setPlatformName(e.target.value)}
                  className="bg-[#0f172a] border-[#334155] text-white focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="platform-logo" className="text-slate-300">Logo de la plateforme</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="platform-logo"
                    value={platformLogo}
                    onChange={(e) => setPlatformLogo(e.target.value)}
                    placeholder="URL du logo"
                    className="bg-[#0f172a] border-[#334155] text-white focus:border-blue-500"
                  />
                  <Button variant="outline" size="icon" className="shrink-0 border-[#334155] text-slate-400 hover:bg-[#334155] hover:text-white h-10 w-10">
                    <Upload className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="platform-desc" className="text-slate-300">Description</Label>
              <Textarea
                id="platform-desc"
                value={platformDesc}
                onChange={(e) => setPlatformDesc(e.target.value)}
                rows={3}
                className="bg-[#0f172a] border-[#334155] text-white focus:border-blue-500 resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* b) Couleurs */}
        <Card className="border border-[#334155] bg-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Palette className="h-5 w-5 text-blue-400" />
              Couleurs
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color" className="text-slate-300">Couleur principale</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="primary-color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-10 w-10 rounded-lg border border-[#334155] cursor-pointer bg-transparent"
                  />
                  <Input
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="bg-[#0f172a] border-[#334155] text-white focus:border-blue-500 flex-1"
                  />
                </div>
                <div className="h-8 rounded-lg border border-[#334155] mt-2" style={{ backgroundColor: primaryColor }} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accent-color" className="text-slate-300">Couleur d&apos;accent</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="accent-color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="h-10 w-10 rounded-lg border border-[#334155] cursor-pointer bg-transparent"
                  />
                  <Input
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="bg-[#0f172a] border-[#334155] text-white focus:border-blue-500 flex-1"
                  />
                </div>
                <div className="h-8 rounded-lg border border-[#334155] mt-2" style={{ backgroundColor: accentColor }} />
              </div>
            </div>
            {/* Preview boxes */}
            <div className="flex items-center gap-3 pt-2">
              <p className="text-xs text-slate-500">Aperçu :</p>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded" style={{ backgroundColor: primaryColor }} />
                <span className="text-xs text-slate-400">Principale</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded" style={{ backgroundColor: accentColor }} />
                <span className="text-xs text-slate-400">Accent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-red-500" />
                <span className="text-xs text-slate-400">Danger</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-green-500" />
                <span className="text-xs text-slate-400">Succès</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-6 w-6 rounded bg-amber-500" />
                <span className="text-xs text-slate-400">Avertissement</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* c) Emails système */}
        <Card className="border border-[#334155] bg-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Mail className="h-5 w-5 text-blue-400" />
              Emails système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact-email" className="text-slate-300">Email de contact</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  className="bg-[#0f172a] border-[#334155] text-white focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="support-email" className="text-slate-300">Email de support</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="bg-[#0f172a] border-[#334155] text-white focus:border-blue-500"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notif-email" className="text-slate-300">Email de notifications</Label>
                <Input
                  id="notif-email"
                  type="email"
                  value={notificationsEmail}
                  onChange={(e) => setNotificationsEmail(e.target.value)}
                  className="bg-[#0f172a] border-[#334155] text-white focus:border-blue-500"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* d) Sécurité */}
        <Card className="border border-[#334155] bg-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Lock className="h-5 w-5 text-blue-400" />
              Sécurité
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-slate-300">Délai d&apos;expiration de session</Label>
                <Badge variant="outline" className="border-[#334155] text-blue-400">{sessionTimeout} minutes</Badge>
              </div>
              <input
                type="range"
                min="5"
                max="120"
                step="5"
                value={sessionTimeout}
                onChange={(e) => setSessionTimeout(Number(e.target.value))}
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-[#334155] accent-blue-500"
              />
              <div className="flex justify-between text-xs text-slate-600">
                <span>5 min</span>
                <span>120 min</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max-attempts" className="text-slate-300">Tentatives de connexion max</Label>
              <Input
                id="max-attempts"
                type="number"
                min={1}
                max={20}
                value={maxLoginAttempts}
                onChange={(e) => setMaxLoginAttempts(Number(e.target.value))}
                className="bg-[#0f172a] border-[#334155] text-white focus:border-blue-500 w-32"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a]/60 border border-[#334155]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Eye className="h-4 w-4 text-amber-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">Mode maintenance</p>
                  <p className="text-xs text-slate-500">Désactive l&apos;accès public à la plateforme</p>
                </div>
              </div>
              <Switch
                checked={maintenanceMode}
                onCheckedChange={setMaintenanceMode}
              />
            </div>

            {maintenanceMode && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="flex items-center gap-2 text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium text-sm">Mode maintenance activé</span>
                </div>
                <p className="text-xs text-amber-400/70 mt-1">
                  La plateforme est inaccessible au public. Seuls les administrateurs peuvent y accéder.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* e) Notifications */}
        <Card className="border border-[#334155] bg-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Bell className="h-5 w-5 text-blue-400" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a]/60 border border-[#334155]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">Notifications par email</p>
                  <p className="text-xs text-slate-500">Recevoir les alertes par email</p>
                </div>
              </div>
              <Switch
                checked={emailNotifications}
                onCheckedChange={setEmailNotifications}
              />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#0f172a]/60 border border-[#334155]">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
                  <Bell className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <p className="font-medium text-sm text-white">Notifications push</p>
                  <p className="text-xs text-slate-500">Recevoir les alertes push en temps réel</p>
                </div>
              </div>
              <Switch
                checked={pushNotifications}
                onCheckedChange={setPushNotifications}
              />
            </div>
          </CardContent>
        </Card>

        {/* Feature Toggles */}
        <Card className="border border-[#334155] bg-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Sliders className="h-5 w-5 text-blue-400" />
              Fonctionnalités
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {featureToggles.map((toggle, index) => (
              <React.Fragment key={toggle.key}>
                <div className="flex items-center justify-between p-4 rounded-xl hover:bg-[#0f172a]/40 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-[#0f172a]/60 flex items-center justify-center shrink-0">
                      <toggle.icon className="h-4 w-4 text-slate-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-white">{toggle.label}</p>
                      <p className="text-xs text-slate-500">{toggle.description}</p>
                    </div>
                  </div>
                  <Switch
                    checked={features[toggle.key]}
                    onCheckedChange={() => handleToggleFeature(toggle.key)}
                  />
                </div>
                {index < featureToggles.length - 1 && <Separator className="bg-[#334155]/50" />}
              </React.Fragment>
            ))}
          </CardContent>
        </Card>

        {/* System Status */}
        <Card className="border border-[#334155] bg-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-white">
              <Server className="h-5 w-5 text-blue-400" />
              État du système
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Base de données', status: 'Opérationnelle', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
              { label: 'API', status: 'En ligne', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
              { label: 'Stockage fichiers', status: 'Disponible', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
              { label: 'Messagerie temps réel', status: 'Connecté', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-[#0f172a]/40 rounded-lg border border-[#334155]/50">
                <span className="text-sm text-slate-300">{item.label}</span>
                <Badge className={`${item.color} border text-[10px]`}>
                  {item.status}
                </Badge>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 bg-[#0f172a]/40 rounded-lg border border-[#334155]/50">
              <span className="text-sm text-slate-300">Version</span>
              <Badge variant="outline" className="text-[10px] border-[#334155] text-slate-400">v2.4.1</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white gap-2 px-8">
            <Save className="h-4 w-4" />
            {saving ? 'Sauvegarde...' : 'Sauvegarder les paramètres'}
          </Button>
        </div>

        {/* Danger Zone */}
        <Card className="border border-red-500/20 bg-[#1e293b]">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-red-400">
              <AlertTriangle className="h-5 w-5" />
              Zone dangereuse
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
              <div>
                <p className="font-medium text-sm text-red-400">Réinitialiser les données de test</p>
                <p className="text-xs text-red-400/60 mt-0.5">Supprimer toutes les données de test (commandes, messages)</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => setDangerDialog('reset')}
              >
                Réinitialiser
              </Button>
            </div>
            <Separator className="bg-[#334155]/50" />
            <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/10">
              <div>
                <p className="font-medium text-sm text-red-400">Purger toute la base de données</p>
                <p className="text-xs text-red-400/60 mt-0.5">Supprimer TOUTES les données de la plateforme</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10 gap-1"
                onClick={() => setDangerDialog('clear')}
              >
                <Database className="h-4 w-4" />
                Purger
              </Button>
            </div>
          </CardContent>
        </Card>

        <AlertDialog open={dangerDialog !== null} onOpenChange={() => setDangerDialog(null)}>
          <AlertDialogContent className="bg-[#1e293b] border-[#334155]">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 text-white">
                <AlertTriangle className="h-5 w-5 text-red-400" />
                {dangerDialog === 'clear' ? 'Purger la base de données' : 'Réinitialiser les données'}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-slate-400">
                {dangerDialog === 'clear'
                  ? 'Cette action supprimera DÉFINITIVEMENT toutes les données de la plateforme (utilisateurs, boutiques, produits, commandes, messages). Cette action est irréversible.'
                  : 'Cette action supprimera les commandes et messages de test. Les comptes utilisateurs et boutiques seront conservés.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-[#334155] text-slate-300 border-[#334155] hover:bg-[#475569]">Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  toast.info('Fonctionnalité en cours de développement');
                  setDangerDialog(null);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Confirmer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </AdminSidebar>
  );
}
