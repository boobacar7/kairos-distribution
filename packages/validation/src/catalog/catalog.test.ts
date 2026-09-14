import { describe, expect, it } from 'vitest';

import {
  parseProductListQuery,
  productDetailResponseSchema,
  productListResponseSchema,
} from './index.js';

describe('parseProductListQuery', () => {
  it('applies defaults and treats an empty query as no search', () => {
    expect(parseProductListQuery({})).toEqual({
      page: 1,
      limit: 24,
      availability: 'all',
      sort: 'default',
    });
    expect(parseProductListQuery({ q: '   ', category: '', sort: '' }).q).toBeUndefined();
  });

  it('accepts search, category, availability, price bounds and sort', () => {
    expect(
      parseProductListQuery({
        q: 'capsule',
        category: 'capsules',
        availability: 'in_stock',
        minPrice: '1000',
        maxPrice: '9000',
        sort: 'price_asc',
        page: '2',
        limit: '12',
      }),
    ).toEqual({
      q: 'capsule',
      category: 'capsules',
      availability: 'in_stock',
      minPrice: 1000,
      maxPrice: 9000,
      sort: 'price_asc',
      page: 2,
      limit: 12,
    });
  });

  it('rejects an oversized page size and an invalid slug', () => {
    expect(parseProductListQuery.bind(null, { limit: 5000 })).toThrow();
    expect(parseProductListQuery.bind(null, { category: 'Capsules' })).toThrow();
  });
});

describe('public product DTOs', () => {
  it('never describe a cost field on list or detail schemas', () => {
    const listShape = JSON.stringify(productListResponseSchema);
    const detailShape = JSON.stringify(productDetailResponseSchema);
    expect(listShape).not.toMatch(/cost/i);
    expect(detailShape).not.toMatch(/cost/i);
  });

  it('strips unknown keys including cost if a client echoes them', () => {
    const parsed = productListResponseSchema.parse({
      data: [
        {
          id: 'p1',
          slug: 'test-product',
          name: '[TEST] Product',
          shortDescription: null,
          category: { id: 'c1', slug: 'capsules', name: 'Capsules' },
          image: null,
          variantMode: 'SINGLE',
          currency: 'XOF',
          variantId: 'v1',
          sku: 'TEST-SKU-1',
          price: 5000,
          compareAtPrice: null,
          availability: { status: 'UNTRACKED', purchasable: true, issue: null },
          priceRange: null,
          cost: 12,
        },
      ],
      meta: { page: 1, limit: 24, total: 1, pageCount: 1 },
    });
    expect(parsed.data[0]).not.toHaveProperty('cost');
  });
});
