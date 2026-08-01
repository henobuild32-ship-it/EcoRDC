'use client';

import {
  LayoutDashboard,
  Store,
  ShoppingBag,
  ShoppingCart,
  Package,
  CreditCard,
  MessageCircle,
  Heart,
  Bell,
  User,
  Search,
  MapPin,
  ClipboardList,
  Home,
} from 'lucide-react';
import type { OnboardingStep } from '@/components/onboarding/OnboardingWizard';

const StepList = ({ items }: { items: React.ReactNode[] }) => (
  <ol className="space-y-2 list-none">
    {items.map((item, i) => (
      <li key={i} className="flex gap-2.5">
        <span className="mt-0.5 h-5 w-5 shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold flex items-center justify-center">
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

export const clientOnboardingSteps: OnboardingStep[] = [
  {
    id: 'welcome',
    icon: <Home className="h-4 w-4" />,
    title: 'Bienvenue sur EcoRDC',
    subtitle: 'Votre plateforme d\'achat en ligne en République Démocratique du Congo',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          Ce guide vous explique chaque fonctionnalité, du début à la fin. Cliquez sur <strong>Suivant</strong> pour avancer, ou sur <strong>Passer</strong> si vous préférez découvrir par vous-même.
        </p>
        <div className="grid sm:grid-cols-2 gap-3">
          <Info label="Acheter">Parcourez les boutiques, trouvez vos produits préférés et commandez en quelques clics.</Info>
          <Info label="Payer à la livraison">Payez uniquement lorsque vous recevez vos articles. Simple et sécurisé.</Info>
          <Info label="Discuter">Échangez directement avec les vendeurs avant ou après votre commande.</Info>
          <Info label="Suivre">Suivez l\'état de vos commandes à chaque étape, de la confirmation à la livraison.</Info>
        </div>
      </div>
    ),
  },
  {
    id: 'dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
    title: 'Le tableau de bord',
    subtitle: 'Votre page d\'accueil après connexion',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          Dès que vous vous connectez, vous arrivez sur votre tableau de bord. Il vous donne un aperçu de toute votre activité.
        </p>
        <StepList items={[
          <><strong>Message de bienvenue</strong> : personnalisé avec votre nom.</>,
          <><strong>Actions rapides</strong> : raccourcis vers Boutiques, Panier, Messages, Commandes, Favoris et Profil.</>,
          <><strong>Dernières commandes</strong> : vos 3 dernières commandes avec leur statut, et un bouton pour tout voir.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'shops',
    icon: <Store className="h-4 w-4" />,
    title: 'Explorer les boutiques',
    subtitle: 'Trouver une boutique et ses produits',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          La page <strong>Boutiques</strong> liste toutes les boutiques disponibles sur EcoRDC.
        </p>
        <StepList items={[
          <><strong>Recherche</strong> : trouvez une boutique par son nom avec la barre de recherche.</>,
          <><strong>Filtres</strong> : filtrez par catégorie (Alimentation, Mode, Électronique…).</>,
          <><strong>Fiche boutique</strong> : logo, nom, catégorie, ville, note et nombre de produits.</>,
          <><strong>Suivre</strong> : cliquez sur le cœur pour suivre une boutique et recevoir ses nouveautés.</>,
          <><strong>Ouvrir</strong> : cliquez sur la boutique pour voir ses produits.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'shop-page',
    icon: <Store className="h-4 w-4" />,
    title: 'La page d\'une boutique',
    subtitle: 'Ce que vous y trouvez',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          Chaque boutique a une page publique qui présente le vendeur et ses produits.
        </p>
        <StepList items={[
          <><strong>En-tête</strong> : logo, nom, badge « Recommandée » le cas échéant, description, catégorie et localisation.</>,
          <><strong>Réseaux sociaux</strong> : TikTok, Instagram, WhatsApp du vendeur si renseignés.</>,
          <><strong>Bouton Partager</strong> : partagez le lien de la boutique ou copiez-le dans le presse-papier.</>,
          <><strong>Bouton Contacter</strong> : écrivez au vendeur (connexion requise) ou appelez-le si le téléphone est affiché.</>,
          <><strong>Liste des produits</strong> : image, nom, description, prix et catégorie pour chaque article.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'product',
    icon: <Package className="h-4 w-4" />,
    title: 'La fiche produit',
    subtitle: 'Découvrir un produit en détail',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          En cliquant sur un produit, vous ouvrez sa fiche complète.
        </p>
        <StepList items={[
          <><strong>Galerie d\'images</strong> : plusieurs photos du produit.</>,
          <><strong>Prix et réduction</strong> : prix actuel, prix barré et pourcentage de remise le cas échéant.</>,
          <><strong>Description détaillée</strong> : caractéristiques et spécifications.</>,
          <><strong>Stock</strong> : disponibilité du produit.</>,
          <><strong>Bouton Ajouter au panier</strong> : ajoutez le produit à votre panier.</>,
          <><strong>Avis clients</strong> : notez et lisez les avis sur le produit.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'order',
    icon: <ShoppingBag className="h-4 w-4" />,
    title: 'Passer une commande',
    subtitle: 'Le parcours d\'achat étape par étape',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          Voici comment commander sur EcoRDC, du premier clic à la confirmation.
        </p>
        <StepList items={[
          <><strong>1. Ajoutez au panier</strong> : depuis une fiche produit, cliquez sur « Ajouter au panier ».</>,
          <><strong>2. Ouvrez votre panier</strong> : via l\'icône panier, ajustez les quantités (+ / −) ou retirez des articles.</>,
          <><strong>3. Vérifiez le récapitulatif</strong> : chaque boutique affiche son sous-total et ses frais de livraison (gratuite dès un certain montant).</>,
          <><strong>4. Cliquez sur « Procéder au paiement »</strong> : vous arrivez à la page de paiement.</>,
          <><strong>5. Choisissez une adresse de livraison</strong> : sélectionnez une adresse existante ou ajoutez-en une nouvelle.</>,
          <><strong>6. Révisez votre commande</strong> : vérifiez les articles, quantités, adresse et montant total.</>,
          <><strong>7. Confirmez</strong> : le paiement se fait <strong>à la livraison</strong>. La commande est transmise au vendeur.</>,
        ]} />
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 p-3 text-sm">
          <p className="font-semibold text-emerald-700 dark:text-emerald-300 mb-1">À savoir</p>
          <p className="text-muted-foreground">Le vendeur vous contactera pour confirmer la disponibilité, la livraison et le paiement. Vous pouvez aussi lui écrire via la messagerie.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'cart',
    icon: <ShoppingCart className="h-4 w-4" />,
    title: 'Le panier',
    subtitle: 'Gérer vos articles avant l\'achat',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          Le panier regroupe tous les produits que vous voulez acheter, regroupés par boutique.
        </p>
        <StepList items={[
          <><strong>Articles groupés par boutique</strong> : chaque boutique affiche ses articles, son sous-total et ses frais de livraison.</>,
          <><strong>Quantité</strong> : boutons + et − pour ajuster. Le total se met à jour automatiquement.</>,
          <><strong>Supprimer</strong> : l\'icône poubelle retire un article.</>,
          <><strong>Résumé</strong> : nombre d\'articles, sous-total, livraison et montant total.</>,
          <><strong>Continuer mes achats</strong> : revenez à la liste des boutiques sans perdre votre panier.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'orders',
    icon: <ClipboardList className="h-4 w-4" />,
    title: 'Suivre mes commandes',
    subtitle: 'Chaque étape de votre achat',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          La page <strong>Commandes</strong> liste tous vos achats et leur statut en temps réel.
        </p>
        <StepList items={[
          <><strong>En attente</strong> : commande reçue par le vendeur, en cours de traitement.</>,
          <><strong>Confirmée</strong> : le vendeur a validé votre commande.</>,
          <><strong>Expédiée</strong> : votre colis a été envoyé.</>,
          <><strong>Livrée</strong> : vous avez reçu vos articles.</>,
          <><strong>Annulée</strong> : commande annulée (par vous si elle est en attente, ou par le vendeur).</>,
          <><strong>Détails</strong> : cliquez sur une commande pour voir les produits, le montant et contacter le vendeur.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'messages',
    icon: <MessageCircle className="h-4 w-4" />,
    title: 'La messagerie',
    subtitle: 'Échanger avec les vendeurs',
    content: (
      <div className="space-y-3">
        <p className="text-muted-foreground">
          EcoRDC intègre une messagerie pour discuter directement avec les vendeurs.
        </p>
        <StepList items={[
          <><strong>Liste des conversations</strong> : tous vos échanges, avec le nom de la boutique et le dernier message.</>,
          <><strong>Envoyer un message</strong> : écrivez et cliquez sur Envoyer. Les réponses arrivent en temps réel.</>,
          <><strong>Badge de non-lus</strong> : une pastille rouge indique les messages non lus dans la navigation.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'favorites',
    icon: <Heart className="h-4 w-4" />,
    title: 'Favoris & boutiques suivies',
    subtitle: 'Gardez vos coups de cœur',
    content: (
      <div className="space-y-3">
        <StepList items={[
          <><strong>Favoris</strong> : sauvegardez les produits que vous aimez (icône cœur sur la fiche produit). Retrouvez-les dans la page Favoris.</>,
          <><strong>Boutiques suivies</strong> : suivez vos boutiques préférées pour ne rien manquer de leurs nouveautés.</>,
          <><strong>Retirer</strong> : cliquez à nouveau sur le cœur pour retirer un favori ou une boutique suivie.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'profile',
    icon: <User className="h-4 w-4" />,
    title: 'Mon profil',
    subtitle: 'Gérer votre compte',
    content: (
      <div className="space-y-3">
        <StepList items={[
          <><strong>Informations</strong> : modifiez nom, email, téléphone, adresse, ville et pays.</>,
          <><strong>Sécurité</strong> : changez votre mot de passe ou supprimez votre compte.</>,
          <><strong>Préférences</strong> : accès rapide aux favoris, boutiques suivies et notifications.</>,
          <><strong>Guide</strong> : rouvrez ce guide à tout moment depuis le bouton livre en haut de la page Profil.</>,
        ]} />
      </div>
    ),
  },
  {
    id: 'notifications',
    icon: <Bell className="h-4 w-4" />,
    title: 'Notifications & navigation',
    subtitle: 'Rester informé',
    content: (
      <div className="space-y-3">
        <StepList items={[
          <><strong>Notifications</strong> : la cloche en haut à droite vous avertit des réponses des vendeurs et des mises à jour de commandes.</>,
          <><strong>Navigation</strong> : en haut de l\'écran (ou en bas sur mobile) : Accueil, Boutiques, Messages, Commandes, Profil.</>,
          <><strong>Recherche</strong> : <Search className="h-3 w-3 inline" /> permet de chercher des produits et des boutiques partout sur la plateforme.</>,
          <><strong>Déconnexion</strong> : depuis le menu utilisateur, en haut à droite.</>,
        ]} />
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 p-3 text-sm flex items-center gap-2">
          <MapPin className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-muted-foreground">Vous êtes maintenant prêt à faire vos achats sur EcoRDC. Bonne découverte !</p>
        </div>
      </div>
    ),
  },
];
