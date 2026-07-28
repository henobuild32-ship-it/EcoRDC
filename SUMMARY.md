# EcoRDC Marketplace — Résumé du travail

## Phases complétées (8/8)

### Phase 1 — Product Detail Page
- `src/components/client/ProductDetail.tsx` — Galerie avec miniatures, zoom, plein écran, prix avec badge promo, badge stock, sélecteur quantité, boutons ajout/favoris/partage/copie lien/signalement, carte boutique infos avec badges/délais/stats, onglets Description/Spécifications/Avis, grille specs, distribution notes étoiles, liste avis avec badge achat vérifié, sections garantie/retour

### Phase 2 — Promotions partout
- `src/components/client/PromoBanner.tsx` — Bannière défilante avec minuterie, produits liés, badge promo
- `src/app/api/promotions/public/route.ts` — Endpoint public promotions actives
- Promotions intégrées dans : Dashboard, Catalogue, Cartes produits boutique, achetez-en-core

### Phase 3 — Panier amélioré
- `src/components/client/ClientCart.tsx` — Logos boutique, badges (Vérifié, Top), livraison par boutique, auto-save debounced, navigation vers /checkout

### Phase 4 — Catalogue global
- `src/components/client/GlobalCatalog.tsx` — Recherche, filtres par catégorie, disponibilité, tri (prix/date/ventes/notes), pagination, cartes produits avec badges promo
- `src/app/api/catalog/route.ts` — Endpoint catalogue avec recherche/filtres/tri/pagination

### Phase 5 — Checkout multi-boutique
- `src/app/api/checkout/route.ts` — Groupe panier par boutique, crée une commande par boutique, lie OrderAddress, incrémente soldCount, décrémente stock, vide panier
- `src/app/api/orders/[id]/route.ts` — Récupération commande individuelle
- `src/components/client/CheckoutPage.tsx` — Flow 3 étapes (adresse/récapitulatif/paiement), groupé par boutique avec logos, modification quantité, calcul livraison, confirmation

### Phase 6 — Avis/Reviews
- `src/app/api/reviews/route.ts` — CRUD complet, badge achat vérifié, unique par user+product
- `src/components/client/ReviewForm.tsx` — Formulaire avec étoiles, commentaire, validation

### Phase 7 — Gestion d'adresses
- `src/app/api/addresses/route.ts` — CRUD avec logique adresse par défaut
- `src/components/client/AddressManager.tsx` — Liste, ajout, édition, suppression avec champs (firstName, lastName, phone, province, city, commune, quartier, avenue, numero, reference, instructions, isDefault)

### Phase 8 — Notifications intelligentes
- `prisma/schema.prisma` — Notification.link (lien profond), Notification.data (JSON métadonnées)
- `src/components/client/NotificationBell.tsx` — Cloche avec compteur, dropdown, icônes par type, marquage lecture, navigation, effacement
- `src/app/api/checkout/route.ts` — Notifications enrichies (vendor + client) avec liens

### Améliorations supplémentaires
- `src/app/api/products/route.ts` — POST/PUT incluent tous les nouveaux champs (compareAtPrice, sku, brand, weight, dimensions, material, origin, video, shortDescription, subcategory)
- `src/components/vendor/VendorAddProduct.tsx` — Formulaire avec section avancée (SKU, marque, poids, dimensions, matière, origine, vidéo)
