import { money } from '@kairos/types/money';

import type { HomeContent, MediaRef } from './contract';

/**
 * Approved-frame merchandising used when the CMS API is not connected.
 *
 * Copy, photography crops, prices and the aggregate avis bar come from Bob’s homepage
 * references. No review quotes or extra claims are invented. Replace with `GET /v1/content/home`
 * as soon as CMS/catalogue exist.
 */

/** Historical homepage-frame badge. Chrome now uses the real guest-cart count. */
export const VISUAL_DEMO_CART_COUNT = 3;

function media(id: string, url: string, alt: string, width: number, height: number): MediaRef {
  return { id, url, alt, width, height };
}

const HERO_DESKTOP = media(
  'hero-desktop',
  '/media/hero-desktop.jpg',
  'Nature morte de soins botaniques Kairos',
  1420,
  292,
);
const HERO_MOBILE = media(
  'hero-mobile',
  '/media/hero-mobile.jpg',
  'Nature morte de soins botaniques Kairos',
  676,
  336,
);

function heroSlide(id: string, position: number): HomeContent['hero'][number] {
  return {
    id,
    title: 'Une beauté plus naturelle, au quotidien',
    subtitle: 'Des soins, thés et compléments sélectionnés avec soin.',
    ctaLabel: 'Découvrir',
    ctaUrl: '/boutique',
    textPosition: 'LEFT',
    desktopImage: HERO_DESKTOP,
    mobileImage: HERO_MOBILE,
    isActive: true,
    position,
    startsAt: null,
    endsAt: null,
  };
}

function footerLink(id: string, label: string, url: string, position: number) {
  return {
    id,
    label,
    url,
    opensInNewTab: false,
    isActive: true,
    position,
  };
}

export function buildVisualHome(): HomeContent {
  return {
    sections: [
      { key: 'HERO', label: '', isEnabled: true, position: 0 },
      { key: 'CATEGORIES', label: '', isEnabled: true, position: 1 },
      { key: 'PRODUITS_PHARES', label: '', isEnabled: true, position: 2 },
      { key: 'AVIS_VERIFIES', label: '', isEnabled: true, position: 3 },
      { key: 'PROMO_BANNER', label: '', isEnabled: true, position: 4 },
    ],
    hero: [heroSlide('hero-1', 0), heroSlide('hero-2', 1), heroSlide('hero-3', 2)],
    trustBar: [],
    categories: [
      {
        id: 'cat-soins',
        slug: 'beaute-soins',
        name: 'Soins',
        subtitle: 'Peau & Corps',
        image: null,
        position: 0,
      },
      {
        id: 'cat-thes',
        slug: 'thes-infusions',
        name: 'Thés',
        subtitle: 'Bien-être naturel',
        image: null,
        position: 1,
      },
      {
        id: 'cat-capsules',
        slug: 'capsules',
        name: 'Capsules',
        subtitle: 'Vitalité au quotidien',
        image: null,
        position: 2,
      },
      {
        id: 'cat-packs',
        slug: 'packs',
        name: 'Packs',
        subtitle: 'Nos sélections',
        image: null,
        position: 3,
      },
    ],
    featuredProducts: [
      {
        id: 'creme-eclat',
        slug: 'creme-eclat',
        name: 'Crème Éclat',
        subtitle: 'Aloe Vera & Karité',
        variantId: 'creme-eclat-default',
        price: money(12_500),
        compareAtPrice: null,
        image: media(
          'img-creme',
          '/media/product-creme.jpg',
          'Pot de Crème Éclat Kairos',
          166,
          154,
        ),
        rating: 5,
        reviewCount: 124,
        available: true,
      },
      {
        id: 'the-detox',
        slug: 'the-detox',
        name: 'Thé Détox',
        subtitle: 'Moringa & Menthe',
        variantId: 'the-detox-default',
        price: money(7_900),
        compareAtPrice: null,
        image: media('img-the', '/media/product-the.jpg', 'Sachet de Thé Détox Kairos', 162, 154),
        rating: 5,
        reviewCount: 89,
        available: true,
      },
      {
        id: 'capsules-beaute',
        slug: 'capsules-beaute',
        name: 'Capsules Beauté',
        subtitle: 'Cheveux & Ongles',
        variantId: 'capsules-beaute-default',
        price: money(9_900),
        compareAtPrice: null,
        image: media(
          'img-capsules',
          '/media/product-capsules.jpg',
          'Flacon de Capsules Beauté Kairos',
          156,
          154,
        ),
        rating: 5,
        reviewCount: 76,
        available: true,
      },
      {
        id: 'pack-essentiel',
        slug: 'pack-essentiel',
        name: 'Pack Essentiel',
        subtitle: 'Soin · Thé · Capsules',
        variantId: 'pack-essentiel-default',
        price: money(24_900),
        compareAtPrice: null,
        image: media(
          'img-pack',
          '/media/product-pack.jpg',
          'Coffret Pack Essentiel Kairos',
          160,
          154,
        ),
        rating: 5,
        reviewCount: 52,
        available: true,
      },
    ],
    bestsellers: [],
    reviews: [],
    reviewsSummary: {
      headline: 'Avis vérifiés',
      supporting: 'Des centaines de clientes nous font confiance',
      averageRating: 4.8,
      reviewCount: 500,
      additionalCount: 297,
      avatars: [media('avis-avatars', '/media/review-avatars.jpg', '', 150, 72)],
    },
    banners: [
      {
        id: 'promo-welcome',
        title: 'Profitez de',
        highlight: '-10%',
        subtitle: 'sur votre première commande',
        eyebrow: 'Une petite attention pour vous',
        code: 'KAIROS10',
        ctaLabel: 'J’en profite maintenant',
        ctaUrl: '/boutique/promotions',
        image: media('promo-leaf-left', '/media/promo-leaf-left.jpg', '', 154, 92),
        placement: 'HOMEPAGE_MID',
        isActive: true,
        position: 0,
        startsAt: null,
        endsAt: null,
      },
    ],
    testimonials: [],
    faq: [],
    footer: {
      sections: [
        {
          id: 'footer-links',
          title: 'Liens',
          isActive: true,
          position: 0,
          links: [
            footerLink('about', 'À propos', '/a-propos', 0),
            footerLink('service', 'Service client', '/contact', 1),
            footerLink('delivery', 'Livraison', '/livraison', 2),
            footerLink('returns', 'Retours', '/retours', 3),
            footerLink('faq', 'FAQ', '/faq', 4),
            footerLink('contact', 'Nous contacter', '/contact', 5),
          ],
        },
      ],
      social: [
        {
          id: 'facebook',
          platform: 'facebook',
          url: 'https://www.facebook.com/',
          isActive: true,
          position: 0,
        },
        {
          id: 'instagram',
          platform: 'instagram',
          url: 'https://www.instagram.com/',
          isActive: true,
          position: 1,
        },
        {
          id: 'youtube',
          platform: 'youtube',
          url: 'https://www.youtube.com/',
          isActive: true,
          position: 2,
        },
      ],
    },
  };
}
