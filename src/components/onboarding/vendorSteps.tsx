'use client';

import {
  LayoutDashboard,
  Package,
  Plus,
  ShoppingBag,
  MessageCircle,
  Settings,
  CreditCard,
  FileText,
  Megaphone,
  Store,
  Bell,
  ClipboardList,
  Sparkles,
  Eye,
  Wallet,
} from 'lucide-react';
import type { OnboardingStep } from '@/components/onboarding/OnboardingWizard';

const StepList = ({ items }: { items: React.ReactNode[] }) => (
  <ol className="space-y-2 list-none">
    {items.map((item, i) => (
      <li key={i} className="flex gap-2.5">
        <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 text-[11px] font-bold flex items-center justify-center">
          {i + 1}
        </span>
        <span>{item}</span>
      </li>
    ))}
  </ol>
);

const Info = ({ label, children }: { label: React.ReactNode; children: React.ReactNode }) => (
  <div className="rounded-lg border bg-muted/20 p-3">
    <p className="font-semibold text-sm mb-1">{label}</p>
    <p className="text-muted-foreground">{children}</p>
  </div>
);

export const vendorOnboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    icon: <Store className="h-4 w-4" />,
    title: 'Bienvenue sur EcoRDC',
    subtitle: 'Votre boutique en ligne en RDC',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          Ce guide vous explique chaque fonctionnalité vendeur, du début à la fin. Cliquez sur <strong>Suivant</strong> pour avancer, ou <strong>Passer</strong> pour découvrir par vous-même.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Info label="Vendez vos produits">Publiez vos articles avec photos, prix et description. Ils sont visibles par tous les clients.</Info>
          <Info label="Gérez vos commandes">Recevez, confirmez, expédiez et livrez les commandes de vos clients.</Info>
          <Info label="Abonnement simple">30 jours d\'essai offerts, puis un abonnement pour garder votre boutique active.</Info>
          <Info label="Discutez avec vos clients">Messagerie intégrée pour répondre rapidement et fidéliser.</Info>
        </div>
      </div>
    ),
  },
  {
    id: 'subscription',
    icon: <CreditCard className="h-4 w-4" />,
    title: 'L\'abonnement vendeur',
    subtitle: 'Pour que votre boutique reste active',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          À l\'inscription, vous bénéficiez d\'une <strong>période d\'essai de 30 jours</strong>. Votre boutique est pleinement fonctionnelle pendant ce temps.
        </p>
        <StepList items={[
          <><strong>Après l\'essai</strong> : pour continuer, souscrivez à l\'abonnement (10 000 FC ≈ 31 jours).</>,
          <><strong>Paiement</strong> : Orange Money, Airtel Money, M-Pesa ou carte bancaire via GeniusPay.</>,
          <><strong>Renouvellement</strong> : renouvelez avant l\'expiration pour ne jamais interrompre votre boutique.</>,
          <><strong>Si votre abonnement expire</strong> : votre boutique est masquée jusqu\'au paiement. La page Abonnement vous explique comment reprendre.</>,
        ]} />
        <div className="rounded-lg bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 p-3 text-sm">
          <p className="font-semibold text-violet-700 dark:text-violet-300 mb-1 flex items-center gap-1.5"><Sparkles className="h-4 w-4" /> Statuts</p>
          <p className="text-muted-foreground">Essai (TRIAL), Actif (ACTIVE) ou Expiré (EXPIRED). Le statut s\'affiche sur votre tableau de bord.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    title: 'Le tableau de bord',
    subtitle: 'Votre vue d\'ensemble',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          Votre page d\'accueil vendeur donne un aperçu rapide de votre activité.
        </p>
        <StepList items={[
          <><strong>Carte de bienvenue</strong> : votre nom, votre boutique, et un bouton « Voir ma boutique ».</>,
          <><strong>Statistiques</strong> : nombre de produits, commandes, messages et abonnés.</>,
          <><strong>Actions rapides</strong> : raccourcis vers chaque module (Produits, Commandes, Messages, Paramètres, Abonnement, Factures, Promotions).</>,
          <><strong>Dernières commandes</strong> : vos 5 dernières commandes avec leur statut.</>,
          <><strong>Abonnement</strong> : statut (Actif, Essai, Expiré) et jours restants.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'publish',
    icon: <Plus className="h-4 w-4" />,
    title: 'Publier un produit',
    subtitle: 'Le cœur de votre boutique — étape par étape',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          C\'est ici que vous rendez vos produits visibles par les clients. Suivez ces étapes :
        </p>
        <StepList items={[
          <><strong>Ouvrez « Mes produits »</strong> : dans le menu vendeur, cliquez sur Produits.</>,
          <><strong>Cliquez sur « Ajouter un produit »</strong> : le bouton en haut de la liste.</>,
          <><strong>Remplissez le formulaire</strong> : nom du produit (obligatoire) et prix en CDF (obligatoire).</>,
          <><strong>Complétez</strong> : description, catégorie, sous-catégorie, marque, stock et images (jusqu\'à 30 photos).</>,
          <><strong>Champs avancés (optionnel)</strong> : SKU, poids, dimensions, matière, origine, lien vidéo.</>,
          <><strong>Vérifiez le statut</strong> : l\'interrupteur « Publié » en haut de la fiche est activé par défaut.</>,
          <><strong>Cliquez sur « Publier »</strong> : le bouton vert en bas du formulaire. Votre produit est maintenant visible !</>,
        ]} />
        <div className="rounded-lg bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 p-3 text-sm">
          <p className="font-semibold text-violet-700 dark:text-violet-300 mb-1 flex items-center gap-1.5"><Eye className="h-4 w-4" /> Bon à savoir</p>
          <p className="text-muted-foreground">Vous pouvez aussi enregistrer un produit en brouillon (non visible) et le publier plus tard. Un produit publié apparaît immédiatement sur votre page boutique publique.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'manage-products',
    icon: <Package className="h-4 w-4" />,
    title: 'Gérer mes produits',
    subtitle: 'Liste, recherche, modification',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          La page « Mes produits » vous permet de gérer tout votre catalogue.
        </p>
        <StepList items={[
          <><strong>Recherche</strong> : trouvez un produit par son nom.</>,
          <><strong>Filtres</strong> : par catégorie et par statut (Actif/Inactif).</>,
          <><strong>Tri</strong> : par date, prix ou nom.</>,
          <><strong>Modifier</strong> : le crayon ouvre le formulaire pré-rempli.</>,
          <><strong>Activer / Désactiver</strong> : l\'interrupteur rend un produit visible ou masqué.</>,
          <><strong>Statistiques</strong> : chaque produit affiche son prix, son stock et son état.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'orders',
    icon: <ShoppingBag className="h-4 w-4" />,
    title: 'Gérer les commandes',
    subtitle: 'De la réception à la livraison',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          Les commandes arrivent dans l\'espace vendeur dès qu\'un client valide son achat.
        </p>
        <StepList items={[
          <><strong>En attente</strong> : nouvelle commande reçue. À confirmer.</>,
          <><strong>Confirmée</strong> : vous validez la commande ; le client en est informé.</>,
          <><strong>Expédiée</strong> : vous indiquez que le colis est parti.</>,
          <><strong>Livrée</strong> : le client a reçu ses articles. Une facture est générée automatiquement.</>,
          <><strong>Annulée</strong> : commande annulée (le stock est remis à disposition).</>,
          <><strong>Mettre à jour</strong> : cliquez sur le statut actuel pour passer à l\'étape suivante.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'messages',
    icon: <MessageCircle className="h-4 w-4" />,
    title: 'La messagerie',
    subtitle: 'Répondre à vos clients',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          La messagerie intégrée vous permet de discuter avec vos clients et prospects.
        </p>
        <StepList items={[
          <><strong>Conversations</strong> : chaque échange affiche le client et le dernier message.</>,
          <><strong>Badge de non-lus</strong> : une pastille rouge vous signale les nouveaux messages.</>,
          <><strong>Réponses en temps réel</strong> : envoyez un message, le client le reçoit instantanément.</>,
          <><strong>Clients intéressés</strong> : même sans commande, un client peut vous contacter depuis votre boutique.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'settings',
    icon: <Settings className="h-4 w-4" />,
    title: 'Paramètres de la boutique',
    subtitle: 'Personnaliser et gérer votre boutique',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          Cette page centralise tout ce qui concerne votre boutique et votre compte.
        </p>
        <StepList items={[
          <><strong>Lien de la boutique</strong> : copiez et partagez votre lien public unique.</>,
          <><strong>Informations boutique</strong> : nom, catégorie, téléphone, email, description, adresse, horaires, devise.</>,
          <><strong>Réseaux sociaux</strong> : TikTok, Instagram, WhatsApp visibles sur votre page publique.</>,
          <><strong>Informations personnelles</strong> : nom, email, téléphone, avatar.</>,
          <><strong>Badge de recommandation</strong> : demandez à être recommandé par EcoRDC (statuts : demandé, en attente, approuvé, refusé).</>,
          <><strong>QR code</strong> : générez le QR code de votre boutique pour le partager facilement.</>,
          <><strong>Zone dangereuse</strong> : suppression définitive de la boutique (avec confirmation).</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'promotions',
    icon: <Megaphone className="h-4 w-4" />,
    title: 'Les promotions',
    subtitle: 'Attirer plus de clients',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          Créez des offres spéciales pour booster vos ventes.
        </p>
        <StepList items={[
          <><strong>Ajouter une promotion</strong> : choisissez un produit, un pourcentage de réduction et une date d\'expiration.</>,
          <><strong>Visibilité</strong> : les produits en promo affichent un badge et un prix barré.</>,
          <><strong>Gestion</strong> : consultez les promotions en cours et passées, supprimez-les à tout moment.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'invoices',
    icon: <FileText className="h-4 w-4" />,
    title: 'Factures & abonnement',
    subtitle: 'Suivre vos paiements',
    content: (
      <div className="space-y-3">
        <StepList items={[
          <><strong>Factures</strong> : l\'historique de vos paiements d\'abonnement (numéro, montant, date, statut : payée, en attente, échouée).</>,
          <><strong>Abonnement</strong> : gérez l\'essai, le paiement et le renouvellement de votre boutique.</>,
          <><strong>Payer en avance</strong> : payez le mois suivant avant la fin de votre période en cours.</>,
          <><strong>Page bloquante</strong> : si l\'abonnement expire, vous êtes redirigé vers la page de renouvellement.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'dashboard-notifications',
    icon: <Bell className="h-4 w-4" />,
    title: 'Notifications & astuces',
    subtitle: 'Ne manquez rien',
    content: (
      <div className="space-y-3">
        <StepList items={[
          <><strong>Notifications</strong> : la cloche vous alerte sur les nouvelles commandes, messages et mises à jour d\'abonnement.</>,
          <><strong>Stock</strong> : un panneau vous avertit des produits en rupture ou en stock faible.</>,
          <><strong>Guide</strong> : rouvrez ce guide à tout moment depuis les Paramètres boutique (bouton livre).</>,
          <><strong>Conseil</strong> : ajoutez de belles photos et des descriptions précises pour vendre plus vite.</>,
        ]} />
        <div className="rounded-lg bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800 p-3 text-sm flex items-center gap-2">
          <Wallet className="h-4 w-4 text-violet-600 shrink-0" />
          <p className="text-muted-foreground">Votre boutique est prête. Publiez votre premier produit et lancez vos ventes sur EcoRDC !</p>
        </div>
      </div>
    ),
  },
];
