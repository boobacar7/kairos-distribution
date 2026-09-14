import { CATEGORY_SEEDS, TEST_DATA_NAME_PREFIX } from '@kairos/types';
import { money } from '@kairos/types/money';

import type { CategoryCard, FeaturedProduct, HomeContent } from './contract';

function emptyHome(): HomeContent {
  return {
    sections: [],
    hero: [],
    trustBar: [],
    categories: [],
    featuredProducts: [],
    bestsellers: [],
    reviews: [],
    banners: [],
    testimonials: [],
    faq: [],
    footer: { sections: [], social: [] },
  };
}

/**
 * [TEST] catalogue used only in non-production when explicitly enabled.
 * Names are labelled. No claims, ingredients, medical copy, or reviews.
 */
function testCategories(): CategoryCard[] {
  return CATEGORY_SEEDS.map((category, position) => ({
    id: `test-cat-${category.slug}`,
    slug: category.slug,
    name: `${TEST_DATA_NAME_PREFIX} ${category.name}`,
    image: null,
    position,
  }));
}

function testProducts(): FeaturedProduct[] {
  return [
    {
      id: 'test-product-1',
      slug: 'test-produit-1',
      name: `${TEST_DATA_NAME_PREFIX} Produit 1`,
      variantId: 'test-product-1-default',
      price: money(12_500),
      compareAtPrice: null,
      image: null,
      rating: null,
      reviewCount: 0,
      available: true,
    },
    {
      id: 'test-product-2',
      slug: 'test-produit-2',
      name: `${TEST_DATA_NAME_PREFIX} Produit 2`,
      variantId: 'test-product-2-default',
      price: money(8_000),
      compareAtPrice: money(10_000),
      image: null,
      rating: null,
      reviewCount: 0,
      available: true,
    },
  ];
}

export function buildStubHome(options: { useTestCatalogue: boolean }): HomeContent {
  const home = emptyHome();
  if (!options.useTestCatalogue) return home;
  return {
    ...home,
    categories: testCategories(),
    featuredProducts: testProducts(),
  };
}
