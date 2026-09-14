import { describe, expect, it } from 'vitest';

import { prepareAddToCart } from './cart-seam';
import { boutiqueHref } from './href';
import { productJsonLd } from './json-ld';

describe('prepareAddToCart', () => {
  it('adds a valid variant to the guest cart', () => {
    expect(prepareAddToCart({ variantId: 'v1', quantity: 2 })).toEqual({
      ok: true,
      itemCount: 2,
      items: [{ variantId: 'v1', quantity: 2 }],
    });
  });

  it('rejects an invalid quantity', () => {
    expect(prepareAddToCart({ variantId: 'v1', quantity: 0 }).code).toBe('INVALID_INTENT');
  });
});

describe('boutiqueHref', () => {
  const query = {
    page: 2,
    limit: 24,
    sort: 'price_asc' as const,
    availability: 'in_stock' as const,
    q: 'creme',
    category: 'capsules',
  };

  it('keeps filters in the query string so results are shareable', () => {
    expect(boutiqueHref(query, { categorySlug: 'capsules' })).toBe(
      '/boutique/capsules?q=creme&availability=in_stock&sort=price_asc&page=2',
    );
  });

  it('can drop the category for the all-catalogue view', () => {
    expect(boutiqueHref(query, { categorySlug: null, page: 1 })).toBe(
      '/boutique?q=creme&availability=in_stock&sort=price_asc',
    );
  });
});

describe('productJsonLd', () => {
  it('emits Product structured data from real fields only', () => {
    const jsonLd = productJsonLd(
      {
        id: 'p1',
        slug: 'test-creme',
        name: '[TEST] Crème',
        shortDescription: null,
        category: { id: 'c1', slug: 'capsules', name: 'Capsules' },
        image: null,
        variantMode: 'SINGLE',
        currency: 'XOF',
        variantId: 'v1',
        sku: 'TEST-SKU-1',
        price: 5000,
        compareAtPrice: null,
        weightGrams: null,
        availability: { status: 'IN_STOCK', purchasable: true, issue: null },
        description: 'Description réelle.',
        benefits: null,
        composition: null,
        usage: null,
        precautions: null,
        images: [],
        seoTitle: null,
        seoDescription: null,
        canonicalUrl: null,
        publishedAt: null,
      },
      'http://127.0.0.1:3000/produit/test-creme',
    );
    expect(jsonLd['@type']).toBe('Product');
    expect(jsonLd).not.toHaveProperty('aggregateRating');
    expect(jsonLd).not.toHaveProperty('review');
    expect(JSON.stringify(jsonLd)).not.toMatch(/cost/i);
    expect((jsonLd.offers as { price: number }).price).toBe(5000);
  });
});
