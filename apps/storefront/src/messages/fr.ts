/**
 * French message dictionary (architecture.md §8.4, D12).
 *
 * Chrome and system copy only. Merchandising, product claims, reviews and FAQ answers come from
 * the CMS contract — never from this file.
 */
export const messages = {
  'brand.name': 'Kairos',
  'brand.fullName': 'Kairos Distributions',
  'brand.distributions': 'Distributions',
  'brand.tagline': 'Beauté naturelle pour un quotidien meilleur',

  'a11y.skip': 'Aller au contenu',
  'a11y.loading': 'Chargement',

  'nav.primary': 'Navigation principale',
  'nav.mobile': 'Navigation mobile',
  'nav.menu': 'Menu',
  'nav.closeMenu': 'Fermer le menu',
  'nav.home': 'Accueil',
  'nav.shop': 'Boutique',
  'nav.promotions': 'Promotions',
  'nav.reviews': 'Avis',
  'nav.faq': 'FAQ',
  'nav.contact': 'Contact',
  'nav.account': 'Compte',
  'nav.cart': 'Panier',
  'nav.orders': 'Commandes',
  'nav.search': 'Rechercher',
  'nav.whatsapp': 'WhatsApp',
  'currency.code': 'XOF',
  'currency.label': 'Devise',

  'cart.icon': 'Panier',
  'cart.count': '{count} article(s) dans le panier',

  'home.hero': 'À la une',
  'home.trust': 'Confiance',
  'home.categories': 'Catégories',
  'home.featured': 'Produits phares',
  'home.bestsellers': 'Incontournables',
  'home.reviews': 'Avis vérifiés',
  'home.seeAll': 'Voir tout',
  'home.promo': 'Offres',
  'home.promoCode': 'Code',
  'home.testimonials': 'Témoignages',
  'home.faq': 'Questions fréquentes',

  'empty.hero': 'Aucune bannière n’est publiée pour le moment.',
  'empty.trust': 'Les messages de réassurance seront affichés ici.',
  'empty.categories': 'Aucune catégorie n’est disponible pour le moment.',
  'empty.products': 'Aucun produit n’est disponible pour le moment.',
  'empty.reviews': 'Aucun avis vérifié n’est publié pour le moment.',
  'empty.promo': 'Aucune offre n’est publiée pour le moment.',
  'empty.testimonials': 'Aucun témoignage n’est publié pour le moment.',
  'empty.faq': 'Aucune question n’est publiée pour le moment.',
  'empty.page': 'Cette page n’a pas encore de contenu.',
  'empty.footer': 'Les liens du pied de page seront publiés depuis le contenu.',

  'errors.title': 'Une erreur est survenue',
  'errors.home': 'Le contenu de la page d’accueil est indisponible. Réessayez.',
  'errors.retry': 'Réessayer',
  'errors.notFound': 'Page introuvable',
  'errors.notFoundBody': 'Cette page n’existe pas.',
  'errors.homeUnavailable': 'HOME_CONTENT_UNAVAILABLE',

  'carousel.label': 'Carrousel d’accueil',
  'carousel.previous': 'Diapositive précédente',
  'carousel.next': 'Diapositive suivante',
  'carousel.pause': 'Mettre en pause',
  'carousel.play': 'Lire',
  'carousel.slide': 'Diapositive {page} sur {total}',

  'footer.label': 'Pied de page',
  'footer.legal': 'Informations légales',
  'footer.about': 'À propos',
  'footer.service': 'Service client',
  'footer.delivery': 'Livraison',
  'footer.returns': 'Retours',
  'footer.privacy': 'Confidentialité',
  'footer.terms': 'Conditions générales',
  'footer.contact': 'Nous contacter',
  'footer.faq': 'FAQ',
  'footer.copyright': '© 2024 Kairos Distributions. Tous droits réservés.',
  'footer.social': 'Réseaux sociaux',

  'meta.title': 'Kairos Distributions',
  'meta.description': 'Boutique Kairos Distributions.',

  'pages.shop.title': 'Boutique',
  'pages.cart.title': 'Panier',
  'pages.account.title': 'Compte',
  'pages.orders.title': 'Commandes',
  'pages.about.title': 'À propos',
  'pages.faq.title': 'FAQ',
  'pages.contact.title': 'Contact',
  'pages.delivery.title': 'Livraison',
  'pages.returns.title': 'Retours',
  'pages.privacy.title': 'Confidentialité',
  'pages.terms.title': 'Conditions générales',
  'pages.product.title': 'Produit',
  'pages.category.title': 'Catégorie',

  'reviews.verified': 'Achat vérifié',
  'reviews.rating': 'Note {value} sur 5',
  'reviews.aggregate': '{value}/5 sur plus de {count} avis',
  'reviews.more': '+{count}',

  'product.add': 'Voir {name}',
  'product.stars': '({count})',

  'stock.inStock': 'En stock',
  'stock.out': 'Indisponible',

  'test.badge': 'TEST',
} as const;

export type MessageKey = keyof typeof messages;
