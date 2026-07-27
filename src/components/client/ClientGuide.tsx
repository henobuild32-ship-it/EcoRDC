'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  BookOpen,
  LayoutDashboard,
  Store,
  ShoppingBag,
  ShoppingCart,
  MessageCircle,
  User,
  Heart,
  Bell,
  LogOut,
  HelpCircle,
  MapPin,
  Share2,
  Star,
  Search,
  Filter,
  Lock,
  Phone,
  Eye,
  CreditCard,
  CheckCircle2,
  XCircle,
  Clock,
  Truck,
  Plus,
  Minus,
  Trash2,
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
        <p className="text-muted-foreground">Votre page d&apos;accueil client. Elle vous donne un aperçu de votre activité sur EcoRDC.</p>

        <div>
          <h4 className="font-semibold mb-2">Bienvenue</h4>
          <p className="text-muted-foreground">Message de bienvenue personnalisé avec votre nom.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Store className="h-4 w-4 text-emerald-500" /> Actions rapides</h4>
          <p className="text-muted-foreground">Raccourcis vers : <strong>Boutiques, Panier, Messages, Commandes, Favoris, Profil</strong>.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-blue-500" /> Dernières commandes</h4>
          <p className="text-muted-foreground">Affiche vos 3 dernières commandes avec leur statut. Bouton <strong>Voir toutes mes commandes</strong>.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'shops',
    label: 'Boutiques',
    icon: <Store className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">探索z et découvrez toutes les boutiques disponibles sur EcoRDC.</p>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Search className="h-4 w-4 text-gray-500" /> Recherche</h4>
          <p className="text-muted-foreground">Barre de recherche pour trouver une boutique par son nom.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Filter className="h-4 w-4 text-gray-500" /> Filtres</h4>
          <p className="text-muted-foreground">Filtrez les boutiques par catégorie (Alimentation, Mode, Électronique, etc.).</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Liste des boutiques</h4>
          <p className="text-muted-foreground">Chaque boutique affiche son <strong>logo, nom, catégorie, ville, note et nombre de produits</strong>. Cliquez sur une boutique pour voir ses produits.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Heart className="h-4 w-4 text-red-500" /> Suivre une boutique</h4>
          <p className="text-muted-foreground">Cliquez sur l&apos;icône cœur pour suivre une boutique et recevoir ses actualités.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'shop-page',
    label: 'Page boutique',
    icon: <Eye className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Page publique d&apos;une boutique visible par tous les visiteurs.</p>

        <div>
          <h4 className="font-semibold mb-2">En-tête de la boutique</h4>
          <p className="text-muted-foreground">
            <strong>Logo</strong> : Image de la boutique.<br />
            <strong>Nom</strong> : Nom de la boutique.<br />
            <strong>Badge Recommandée</strong> : Si la boutique est recommandée par EcoRDC.<br />
            <strong>Description</strong> : Présentation du vendeur.<br />
            <strong>Catégorie, Localisation</strong> : Informations générales.<br />
            <strong>Nombre de produits</strong> : Total des produits disponibles.
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
          <p className="text-muted-foreground">Si le vendeur a renseigné ses réseaux sociaux, ils apparaissent sous la description avec les icônes officielles. Cliquez pour ouvrir le lien.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Share2 className="h-4 w-4 text-gray-500" /> Bouton Partager</h4>
          <p className="text-muted-foreground">Partagez le lien de la boutique via les applications de votre téléphone ou copiez le lien dans le presse-papier.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><MessageCircle className="h-4 w-4 text-emerald-500" /> Bouton Contacter</h4>
          <p className="text-muted-foreground">Ouvre une fenêtre pour vous connecter ou créer un compte afin d&apos;envoyer un message au vendeur. Si le vendeur a un téléphone, il est aussi affiché.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Liste des produits</h4>
          <p className="text-muted-foreground">Grille de produits avec <strong>image, nom, description, prix, catégorie</strong>. Bouton <strong>Commander</strong> pour contacter le vendeur à propos de ce produit.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'cart',
    label: 'Panier',
    icon: <ShoppingCart className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Gérez vos articles avant de passer commande.</p>

        <div>
          <h4 className="font-semibold mb-2">Liste des articles</h4>
          <p className="text-muted-foreground">Chaque article affiche : <strong>image, nom du produit, nom de la boutique, prix unitaire, quantité, sous-total</strong>.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Plus className="h-4 w-4 text-emerald-500" /><Minus className="h-4 w-4 text-red-500" /> Quantité</h4>
          <p className="text-muted-foreground">Boutons + et - pour ajuster la quantité. Le sous-total se met à jour automatiquement.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Trash2 className="h-4 w-4 text-red-500" /> Supprimer</h4>
          <p className="text-muted-foreground">Icône poubelle pour retirer un article du panier.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Résumé</h4>
          <p className="text-muted-foreground">Affiche le <strong>nombre total d&apos;articles</strong> et le <strong>montant total</strong> de la commande.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><ShoppingBag className="h-4 w-4 text-emerald-500" /> Bouton Commander</h4>
          <p className="text-muted-foreground">Ouvre une fenêtre de confirmation avec le récapitulatif. Vous pouvez ajouter un <strong>message au vendeur</strong>. Confirmez pour envoyer la commande. Le vendeur vous contactera pour la suite.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'orders',
    label: 'Commandes',
    icon: <ShoppingBag className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Suivez l&apos;état de toutes vos commandes passées.</p>

        <div>
          <h4 className="font-semibold mb-2">Statuts de commande</h4>
          <p className="text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3 text-gray-500" /> En attente</span> : Commande reçue par le vendeur.<br />
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-blue-500" /> Confirmée</span> : Le vendeur a confirmé.<br />
            <span className="inline-flex items-center gap-1"><Truck className="h-3 w-3 text-yellow-500" /> Expédiée</span> : La commande a été envoyée.<br />
            <span className="inline-flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> Livrée</span> : Commande reçue.<br />
            <span className="inline-flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" /> Annulée</span> : Commande annulée.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Détails</h4>
          <p className="text-muted-foreground">Chaque commande affiche : <strong>numéro, boutique, produits, montant total, date, statut</strong>. Cliquez sur une commande pour voir plus de détails.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Contacter le vendeur</h4>
          <p className="text-muted-foreground">Depuis les détails d&apos;une commande, vous pouvez envoyer un message au vendeur pour suivre votre commande.</p>
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
        <p className="text-muted-foreground">Échangez directement avec les vendeurs via la messagerie intégrée.</p>

        <div>
          <h4 className="font-semibold mb-2">Liste des conversations</h4>
          <p className="text-muted-foreground">Tous vos échanges avec les vendeurs. Chaque conversation montre le <strong>nom de la boutique</strong> et le <strong>dernier message</strong>.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Envoyer un message</h4>
          <p className="text-muted-foreground">Écrivez votre message et cliquez sur <strong>Envoyer</strong>. Le vendeur vous répondra directement ici.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'profile',
    label: 'Profil',
    icon: <User className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Gérez votre compte client et vos préférences.</p>

        <div>
          <h4 className="font-semibold mb-2">Onglet Informations</h4>
          <p className="text-muted-foreground">Modifiez votre <strong>nom, email, téléphone, adresse, ville, pays</strong>. Cliquez sur <strong>Enregistrer</strong> pour sauvegarder.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Onglet Sécurité</h4>
          <p className="text-muted-foreground">
            <strong>Changer le mot de passe</strong> : Saisissez l&apos;ancien et le nouveau mot de passe.<br />
            <strong>Supprimer le compte</strong> : Action irréversible. Confirmation requise.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Onglet Préférences</h4>
          <p className="text-muted-foreground">Liens rapides vers : <strong>Favoris, Boutiques suivies, Notifications</strong>. Affiche aussi les informations de votre compte (membre depuis, email).</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><HelpCircle className="h-4 w-4 text-gray-500" /> Guide d&apos;utilisation</h4>
          <p className="text-muted-foreground">Ce guide ! Accessible depuis votre <strong>Profil</strong> (icône livre en haut à droite).</p>
        </div>
      </div>
    ),
  },
  {
    id: 'favorites',
    label: 'Favoris',
    icon: <Heart className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Retrouvez tous les produits que vous avez aimés.</p>

        <div>
          <h4 className="font-semibold mb-2">Liste des favoris</h4>
          <p className="text-muted-foreground">Chaque produit favori affiche : <strong>image, nom, prix, boutique</strong>. Cliquez sur le cœur pour retirer des favoris.</p>
        </div>
      </div>
    ),
  },
  {
    id: 'followed',
    label: 'Boutiques suivies',
    icon: <Store className="h-4 w-4" />,
    content: (
      <div className="space-y-4 text-sm">
        <p className="text-muted-foreground">Liste des boutiques que vous suivez pour ne rien manquer de leurs nouveautés.</p>

        <div>
          <h4 className="font-semibold mb-2">Liste des boutiques</h4>
          <p className="text-muted-foreground">Chaque boutique suivie affiche : <strong>logo, nom, catégorie, nombre de produits</strong>. Bouton <strong>Voir la boutique</strong> pour explorer ses produits.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Ne plus suivre</h4>
          <p className="text-muted-foreground">Cliquez sur l&apos;icône cœur pour ne plus suivre une boutique.</p>
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
        <p className="text-muted-foreground">Éléments d&apos;interface générale pour naviguer et gérer votre session client.</p>

        <div>
          <h4 className="font-semibold mb-2">Menu de navigation</h4>
          <p className="text-muted-foreground">En haut : <strong>Accueil, Boutiques, Messages, Commandes, Profil</strong>. Sur mobile : barre de navigation en bas de l&apos;écran.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Menu utilisateur</h4>
          <p className="text-muted-foreground">Cliquez sur votre avatar ou nom en haut à droite pour accéder à : <strong>Profil, Panier, Favoris, Boutiques suivies, Déconnexion</strong>.</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><Bell className="h-4 w-4 text-gray-500" /> Notifications</h4>
          <p className="text-muted-foreground">Cloche en haut à droite : voir vos notifications (réponses des vendeurs, mises à jour de commandes).</p>
        </div>

        <div>
          <h4 className="font-semibold mb-2 flex items-center gap-2"><LogOut className="h-4 w-4 text-red-500" /> Déconnexion</h4>
          <p className="text-muted-foreground">Accessible depuis le menu utilisateur.</p>
        </div>
      </div>
    ),
  },
];

export function ClientGuide({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
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
              <DialogTitle className="text-xl">Guide EcoRDC — Client</DialogTitle>
              <DialogDescription>Tout comprendre sur l&apos;interface client</DialogDescription>
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
