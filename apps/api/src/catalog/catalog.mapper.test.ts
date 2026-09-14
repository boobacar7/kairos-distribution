import { describe, expect, it } from 'vitest';

import { mapProductDetail, mapProductListItem, type ProductRow } from './catalog.mapper.js';

function product(overrides: Partial<ProductRow> = {}): ProductRow {
  return {
    id: 'p1',
    slug: 'test-creme',
    name: '[TEST] Crème',
    description: 'Description réelle.',
    shortDescription: null,
    benefits: 'Hydrate.',
    ingredients: null,
    usage: '',
    precautions: null,
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    publishedAt: new Date('2026-01-01T00:00:00.000Z'),
    category: { id: 'c1', slug: 'capsules', name: 'Capsules' },
    images: [],
    variants: [
      {
        id: 'v1',
        name: 'Default',
        sku: 'TEST-SKU-1',
        price: 5000,
        compareAtPrice: null,
        weightGrams: null,
        isDefault: true,
        isActive: true,
        deletedAt: null,
        inventoryItem: { trackInventory: true, availableQty: 2 },
      },
    ],
    ...overrides,
  };
}

describe('catalog mapper', () => {
  it('flattens a single-variant product and omits empty narrative fields', () => {
    const detail = mapProductDetail(product());
    expect(detail.variantMode).toBe('SINGLE');
    if (detail.variantMode !== 'SINGLE') throw new Error('expected SINGLE');
    expect(detail.price).toBe(5000);
    expect(detail.variantId).toBe('v1');
    expect(detail.composition).toBeNull();
    expect(detail.usage).toBeNull();
    expect(detail.benefits).toBe('Hydrate.');
    expect(JSON.stringify(detail)).not.toMatch(/"cost"/);
  });

  it('does not treat missing inventory as out of stock on the listing card', () => {
    const item = mapProductListItem(
      product({
        variants: [
          {
            id: 'v1',
            name: 'Default',
            sku: 'TEST-SKU-1',
            price: 5000,
            compareAtPrice: null,
            weightGrams: null,
            isDefault: true,
            isActive: true,
            deletedAt: null,
            inventoryItem: null,
          },
        ],
      }),
    );
    expect(item.availability).toEqual({
      status: 'UNKNOWN',
      purchasable: false,
      issue: 'MISSING_INVENTORY',
    });
  });
});
