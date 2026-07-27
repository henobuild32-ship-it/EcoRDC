'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  LayoutDashboard,
  Package,
  ShoppingCart,
  MessageCircle,
  Settings,
  CreditCard,
  FileText,
  Megaphone,
  ChevronRight,
  ChevronDown,
  Store,
  Star,
  User,
  Bell,
  LogOut,
  HelpCircle,
  RefreshCw,
  CalendarDays,
  Zap,
  Sparkles,
  AlertTriangle,
  Trash2,
  Copy,
  ExternalLink,
  X,
  CheckCircle2,
  Clock,
  XCircle,
  Image as ImageIcon,
  Plus,
  Pencil,
  Eye,
  Search,
  Filter,
  ArrowUpDown,
  Truck,
} from 'lucide-react';

interface Section {
  id: string;
  label: string;
  icon: React.ReactNode;
  content: React.ReactNode;
}

const sections: Section[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    icon: <LayoutDashboard className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Le tableau de bord est votre page d&apos;accueil vendeur. Il vous donne un aperçu rapide de votre activité.</p>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Store className="h-4 w-4 text-emerald-500" /> Carte de bienvenue</h4>
          <p className="text-muted-foreground">Affiche votre nom, le nom de votre boutique, et un message de bienvenue. Bouton <strong>Voir ma boutique</strong> pour accéder aux paramètres.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Statistiques</h4>
          <p className="text-muted-foreground">Cartes affichant le nombre de <strong>produits</strong>, <strong>commandes</strong>, <strong>messages</strong> et <strong>abonnés</strong> de votre boutique.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Actions rapides</h4>
          <p className="text-muted-foreground">Grille de raccourcis vers chaque module : Produits, Commandes, Messages, Paramètres boutique, Abonnement, Factures, Promotions.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-blue-500" /> Dernières commandes</h4>
          <p className="text-muted-foreground">Liste des 5 dernières commandes avec statut (En attente, Confirmée, Expédiée, Livrée, Annulée). Bouton <strong>Voir toutes les commandes</strong>.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Bell className="h-4 w-4 text-purple-500" /> Abonnement</h4>
          <p className="text-muted-foreground">Affiche le statut de votre abonnement (Actif, Essai, Expiré) et les jours restants. Bouton pour <strong>gérer l&apos;abonnement</strong>.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'products',
    label: 'Produits',
    icon: <Package className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Gérez tous les produits de votre boutique.</p>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Search className="h-4 w-4 text-gray-500" /> Barre de recherche</h4>
          <p className="text-muted-foreground">Recherchez un produit par son nom. Utile quand vous avez beaucoup de produits.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Filter className="h-4 w-4 text-gray-500" /> Filtres</h4>
          <p className="text-mut ed-foreground">Filtrez les produits par catégorie et par statut (Actif/Inactif).</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><ArrowUpDown className="h-4 w-4 text-gray-500" /> Tri</h4>
          <p className="text-muted-foreground">Triez par date (plus récent/plus ancien), prix (croissant/décroissant) ou nom (A-Z/Z-A).</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Plus className="h-4 w-4 text-emerald-500" /> Bouton Ajouter un produit</h4>
          <p className="text-muted-foreground">Ouvre le formulaire d&apos;ajout de produit avec les champs : <strong>nom, description, prix, catégorie, image</strong>. L&apos;image peut être téléchargée depuis votre appareil.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Pencil className="h-4 w-4 text-blue-500" /> Modifier un produit</h4>
          <p className="text-muted-foreground">Ouvre le même formulaire pré-rempli pour modifier les informations du produit.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Eye className="h-4 w-4 text-gray-500" /> Activer/Désactiver</h4>
          <p className="text-muted-foreground">Bouton pour rendre un produit visible ou masqué sur votre boutique publique.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'orders',
    label: 'Commandes',
    icon: <ShoppingCart className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Consultez et gérez les commandes passées par vos clients.</p>

        <div>
          <h4 className="font-semibold mb-2">Liste des commandes</h4>
          <p className="text-muted-foreground">Chaque commande affiche : <strong>numéro, client, produits, montant total, date, statut</strong>.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-gray-400" /> En attente</span>
          </h4>
          <p className="text-muted-foreground">Commande reçue, en attente de confirmation.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-blue-500" /> Confirmée</span>
          </h4>
          <p className="text-muted-foreground">Vous avez confirmé la commande. Le client est informé.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3 text-yellow-500" /> Expédiée</span>
          </h4>
          <p className="text-muted-foreground">La commande a été envoyée au client.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Livrée</span>
          </h4>
          <p className="text-muted-foreground">Le client a reçu sa commande.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" /> Annulée</span>
          </h4>
          <p className="text-muted-foreground">Commande annulée (par vous ou le client).</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Mettre à jour le statut</h4>
          <p className="text-muted-foreground">Cliquez sur le statut actuel pour voir les options disponibles et faire passer la commande à l&apos;étape suivante.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'messages',
    label: 'Messages',
    icon: <MessageCircle className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Communiquez directement avec vos clients via la messagerie intégrée.</p>

        <div>
          <h4 className="font-semibold mb-2">Liste des conversations</h4>
          <p className="text-muted-foreground">Affiche tous vos échanges avec les clients. Chaque conversation montre le <strong>nom du client</strong> et le <strong>dernier message</strong>.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Notifications de messages</h4>
          <p className="text-muted-foreground">Un badge rouge indique les conversations non lues dans le menu de navigation.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Envoyer un message</h4>
          <p className="text-muted-foreground">Écrivez votre message dans la zone de texte en bas et cliquez sur <strong>Envoyer</strong>. Les réponses arrivent en temps réel.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'settings',
    label: 'Paramètres boutique',
    icon: <Settings className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Gérez tous les paramètres de votre boutique et de votre compte vendeur.</p>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Copy className="h-4 w-4 text-emerald-500" /> Lien de la boutique</h4>
          <p className="text-muted-foreground">Votre lien public unique. Cliquez sur <strong>Copier le lien</strong> pour le partager avec vos clients. Format : <code>eco-rdc.vercel.app/shop/votre-slug</code>.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Store className="h-4 w-4 text-emerald-500" /> Informations boutique</h4>
          <p className="text-muted-foreground">
            <strong>Nom</strong> : Le nom de votre boutique.<br />
            <strong>Catégorie</strong> : Sélectionnez la catégorie principale (Alimentation, Mode, Électronique, etc.).<br />
            <strong>Téléphone / Email</strong> : Coordonnées visibles sur votre boutique.<br />
            <strong>Description</strong> : Présentez votre boutique aux visiteurs.<br />
            <strong>Adresse, Ville, Commune, Pays</strong> : Localisation de votre boutique.<br />
            <strong>Horaires</strong> : Indiquez vos horaires d&apos;ouverture.<br />
            <strong>Devise</strong> : Choisissez entre Franc Congolais (CDF) ou Dollar (USD).
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.9 2.89 2.89 0 0 1-2.88-2.89 2.89 2.89 0 0 1 2.88-2.89c.6 0 1.15.18 1.62.5V10.3a6.34 6.34 0 0 0-1.62-.23 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.35 6.34 6.34 0 0 0 6.34-6.35V8.75a8.24 8.24 0 0 0 4.77 1.5v-3.4a4.85 4.85 0 0 1-1.12-.16z"/></svg>
              TikTok
            </span>
            <span className="inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>
              Instagram
            </span>
            <span className="inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
              WhatsApp
            </span>
          </h4>
          <p className="text-muted-foreground">Trois champs pour ajouter vos réseaux sociaux. Ils apparaîtront sur votre page boutique publique avec les icônes officielles.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><User className="h-4 w-4 text-blue-500" /> Informations personnelles</h4>
          <p className="text-muted-foreground">Modifiez votre <strong>nom, email, téléphone, adresse, ville</strong>. L&apos;avatar peut être changé en cliquant sur l&apos;icône appareil photo.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Star className="h-4 w-4 text-yellow-500" /> Badge de recommandation</h4>
          <p className="text-muted-foreground">Demandez un badge de recommandation pour votre boutique. Statuts possibles : <strong>Non demandé, En attente, Approuvé, Refusé</strong>. Vous serez notifié de la décision.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-red-500" /> Zone dangereuse</h4>
          <p className="text-muted-foreground">Bouton <strong>Supprimer la boutique</strong> : action irréversible qui supprime définitivement votre boutique et tous ses produits. Une confirmation vous est demandée avant la suppression.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2"><strong>Bouton Enregistrer</strong></h4>
          <p className="text-muted-foreground">Présent en bas de la section Informations boutique et de la section Informations personnelles. Cliquez pour sauvegarder vos modifications.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'subscription',
    label: 'Abonnement',
    icon: <CreditCard className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Gérez votre abonnement vendeur pour que votre boutique reste active.</p>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Sparkles className="h-4 w-4 text-purple-500" /> Période d&apos;essai (TRIAL)</h4>
          <p className="text-muted-foreground">À l&apos;inscription, vous bénéficiez de <strong>30 jours d&apos;essai gratuit</strong>. Votre boutique est pleinement fonctionnelle. Un compte à rebours vous montre les jours restants.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Zap className="h-4 w-4 text-amber-500" /> Payer l&apos;abonnement</h4>
          <p className="text-muted-foreground">L&apos;abonnement coûte <strong>10 000 FC (environ 5 USD) pour 31 jours</strong>. Bouton <strong>Activer et payer</strong> ou <strong>Payer l&apos;abonnement</strong> selon votre statut.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><RefreshCw className="h-4 w-4 text-emerald-500" /> Renouvellement</h4>
          <p className="text-muted-foreground">Si votre abonnement expire, votre boutique est masquée. Cliquez sur <strong>Renouveler</strong> dans la page d&apos;abonnement pour la réactiver.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><CalendarDays className="h-4 w-4 text-purple-500" /> Payer en avance</h4>
          <p className="text-muted-foreground">Option pour payer le mois suivant avant la fin de votre période en cours. L&apos;abonnement prépayé s&apos;activera automatiquement.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2"><strong>Moyens de paiement</strong></h4>
          <p className="text-muted-foreground">
            <strong>Tous les moyens</strong> : Choix automatique du meilleur moyen selon votre numéro.<br />
            <strong>Orange Money</strong> : Paiement via Orange Money RDC.<br />
            <strong>Airtel Money</strong> : Paiement via Airtel Money RDC.<br />
            <strong>M-Pesa</strong> : Paiement via Vodacom M-Pesa RDC.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2"><strong>Fenêtre de paiement</strong></h4>
          <p className="text-muted-foreground">Après avoir cliqué sur le bouton de paiement, une fenêtre s&apos;ouvre avec les détails de la transaction. Saisissez votre <strong>numéro de téléphone</strong> si requis et confirmez. Vous recevrez une notification de confirmation sous le numéro renseigné.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2"><strong>Page bloquante</strong></h4>
          <p className="text-muted-foreground">Si votre abonnement expire, vous êtes redirigé vers une page expliquant que votre boutique est inactive. Cliquez sur <strong>Renouveler — Payer l&apos;abonnement</strong> pour reprendre.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'invoices',
    label: 'Factures',
    icon: <FileText className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Consultez l&apos;historique de tous vos paiements d&apos;abonnement.</p>

        <div>
          <h4 className="font-semibold mb-2">Liste des factures</h4>
          <p className="text-muted-foreground">Chaque facture affiche : <strong>numéro de facture, montant payé, date de paiement, période couverte, statut</strong> (Payée, En attente, Échouée, Remboursée).</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Statuts de facture</h4>
          <p className="text-muted-foreground">
            <span className="text-emerald-600">● Payée</span> : Paiement confirmé.<br />
            <span className="text-yellow-600">● En attente</span> : Paiement en cours de traitement.<br />
            <span className="text-red-600">● Échouée</span> : Le paiement a échoué.<br />
            <span className="text-gray-500">● Remboursée</span> : Paiement remboursé.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'promotions',
    label: 'Promotions',
    icon: <Megaphone className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Créez et gérez des promotions pour vos produits afin d&apos;attirer plus de clients.</p>

        <div>
          <h4 className="font-semibold mb-2">Ajouter une promotion</h4>
          <p className="text-muted-foreground">Sélectionnez un produit, définissez un <strong>pourcentage de réduction</strong> et une <strong>date d&apos;expiration</strong>.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Gérer les promotions</h4>
          <p className="text-muted-foreground">Les promotions en cours et passées sont listées. Vous pouvez <strong>supprimer</strong> une promotion active à tout moment.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'navigation',
    label: 'Navigation & Compte',
    icon: <LogOut className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Éléments d&apos;interface générale pour naviguer et gérer votre session.</p>

        <div>
          <h4 className="font-semibold mb-2">Menu de navigation</h4>
          <p className="text-muted-foreground">En haut de l&apos;écran : <strong>Accueil, Boutiques, Messages, Commandes, Profil</strong>. Sur mobile : barre de navigation en bas.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Menu utilisateur</h4>
          <p className="text-muted-foreground">Cliquez sur votre avatar ou nom en haut à droite pour accéder à : <strong>Profil, Paramètres boutique, Abonnement, Factures, Promotions, Déconnexion</strong>.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Bell className="h-4 w-4 text-gray-500" /> Notifications</h4>
          <p className="text-muted-foreground">Cloche en haut à droite : voir vos notifications (nouvelles commandes, messages, mises à jour abonnement).</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4 text-gray-500" /> Guide d&apos;utilisation</h4>
          <p className="text-muted-foreground">Ce guide ! Accessible depuis les <strong>Paramètres boutique</strong> (icône livre en haut à droite).</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><LogOut className="h-4 w-4 text-red-500" /> Déconnexion</h4>
          <p className="text-muted-foreground">Accessible depuis le menu utilisateur. Vous pouvez toujours vous reconnecter avec votre email et mot de passe.</p>
        </div>
      </div>
    ),
  },
];

export function VendorGuide({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [activeSection, setActiveSection] = useState(sections[0].id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0 overflow-hidden">
        <DialogHeader className="p-6 pb-3 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
            <div>
              <DialogTitle className="text-xl">Guide EcoRDC — Vendeur</DialogTitle>
              <DialogDescription>Tout comprendre sur l&apos;interface vendeur</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex flex-col md:flex-row overflow-hidden" style={{ maxHeight: 'calc(85vh - 80px)' }}>
          {/* Sidebar */}
          <div className="md:w-56 shrink-0 border-r overflow-y-auto p-2 bg-muted/30">
            <nav className="space-y-1">
              {sections.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                    activeSection === s.id
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium'
                      : 'text-muted-foreground hover:bg-muted'
                  }`}
                >
                  {s.icon}
                  <span>{s.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {sections.find((s) => s.id === activeSection)?.content}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
