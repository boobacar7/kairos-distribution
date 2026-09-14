import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';

import {
  createCatalogApp,
  createPublicProduct,
  deleteProduct,
  ensureSeeded,
  testPrisma,
  type CreatedProduct,
} from './test-support.js';

describe('catalog API', () => {
  let app: INestApplication;
  const created: CreatedProduct[] = [];

  beforeAll(async () => {
    await ensureSeeded();
    app = await createCatalogApp();
  });

  afterAll(async () => {
    const prisma = testPrisma();
    for (const product of created) {
      await deleteProduct(prisma, product.id);
    }
    await app.close();
  });

  async function addProduct(
    ...args: Parameters<typeof createPublicProduct>
  ): Promise<CreatedProduct> {
    const product = await createPublicProduct(...args);
    created.push(product);
    return product;
  }

  it('lists seeded active categories and 404s unknown or inactive slugs', async () => {
    const list = await request(app.getHttpServer()).get('/v1/categories').expect(200);
    const slugs = (
      list.body as { data: Array<{ slug: string; description: string | null }> }
    ).data.map((row) => row.slug);
    expect(slugs).toContain('capsules');
    expect(slugs).toContain('beaute-soins');

    await request(app.getHttpServer()).get('/v1/categories/capsules').expect(200);
    await request(app.getHttpServer()).get('/v1/categories/does-not-exist').expect(404);
    await request(app.getHttpServer()).get('/v1/categories/Not-A-Slug').expect(404);
  });

  it('returns an empty product list when nothing matches', async () => {
    const response = await request(app.getHttpServer())
      .get('/v1/products')
      .query({ q: 'zzznomatchzz' })
      .expect(200);
    expect(response.body).toEqual({
      data: [],
      meta: { page: 1, limit: 24, total: 0, pageCount: 0 },
    });
  });

  it('rejects an unbounded page size', async () => {
    await request(app.getHttpServer()).get('/v1/products').query({ limit: 5000 }).expect(400);
  });

  it('lists, searches, filters and sorts real products without leaking cost', async () => {
    const tracked = await addProduct(testPrisma(), {
      name: '[TEST] Capsule claire',
      slug: `test-capsule-${Date.now()}`,
      categorySlug: 'capsules',
      price: 8000,
      inventory: 'tracked',
      onHand: 4,
    });
    const cheap = await addProduct(testPrisma(), {
      name: '[TEST] Crème douce',
      slug: `test-creme-${Date.now()}`,
      categorySlug: 'beaute-soins',
      price: 3000,
      inventory: 'tracked',
      onHand: 2,
    });
    await addProduct(testPrisma(), {
      name: '[TEST] Draft hidden',
      status: 'DRAFT',
      inventory: 'tracked',
      onHand: 9,
    });

    const all = await request(app.getHttpServer())
      .get('/v1/products')
      .query({ q: '[TEST]', sort: 'price_asc' })
      .expect(200);

    const body = all.body as {
      data: Array<{
        name: string;
        slug: string;
        price: number;
        variantId: string;
        availability: { status: string };
        cost?: unknown;
      }>;
      meta: { total: number };
    };
    expect(JSON.stringify(body)).not.toMatch(/"cost"/);
    const names = body.data.map((row) => row.name);
    expect(names).toContain(tracked.name);
    expect(names).toContain(cheap.name);
    expect(names.some((name) => name.includes('Draft'))).toBe(false);
    expect(body.data[0]?.price).toBeLessThanOrEqual(body.data[body.data.length - 1]?.price ?? 0);

    const search = await request(app.getHttpServer())
      .get('/v1/products')
      .query({ q: 'Capsule claire' })
      .expect(200);
    expect(search.body.data).toEqual(
      expect.arrayContaining([expect.objectContaining({ slug: tracked.slug })]),
    );

    const category = await request(app.getHttpServer())
      .get('/v1/products')
      .query({ category: 'capsules' })
      .expect(200);
    expect(
      (category.body.data as Array<{ category: { slug: string } }>).every(
        (row) => row.category.slug === 'capsules',
      ),
    ).toBe(true);

    const emptySearch = await request(app.getHttpServer())
      .get('/v1/products')
      .query({ q: '' })
      .expect(200);
    expect(emptySearch.body.meta.total).toBeGreaterThan(0);
  });

  it('classifies tracked, untracked and missing inventory without treating missing as out of stock', async () => {
    const inStock = await addProduct(testPrisma(), {
      slug: `test-in-${Date.now()}`,
      inventory: 'tracked',
      onHand: 2,
    });
    const out = await addProduct(testPrisma(), {
      slug: `test-out-${Date.now()}`,
      inventory: 'tracked',
      onHand: 0,
    });
    const untracked = await addProduct(testPrisma(), {
      slug: `test-free-${Date.now()}`,
      inventory: 'untracked',
      onHand: 0,
    });
    const missing = await addProduct(testPrisma(), {
      slug: `test-missing-${Date.now()}`,
      inventory: 'missing',
    });

    const inStockBody = await request(app.getHttpServer()).get(`/v1/products/${inStock.slug}`);
    expect(inStockBody.body.data.availability).toEqual({
      status: 'IN_STOCK',
      purchasable: true,
      issue: null,
    });

    const outBody = await request(app.getHttpServer()).get(`/v1/products/${out.slug}`);
    expect(outBody.body.data.availability).toEqual({
      status: 'OUT_OF_STOCK',
      purchasable: false,
      issue: null,
    });
    expect(outBody.body.data).not.toHaveProperty('cost');
    expect(outBody.body.data.variantId).toBe(out.variantId);

    const untrackedBody = await request(app.getHttpServer()).get(`/v1/products/${untracked.slug}`);
    expect(untrackedBody.body.data.availability).toEqual({
      status: 'UNTRACKED',
      purchasable: true,
      issue: null,
    });

    const missingBody = await request(app.getHttpServer()).get(`/v1/products/${missing.slug}`);
    expect(missingBody.body.data.availability).toEqual({
      status: 'UNKNOWN',
      purchasable: false,
      issue: 'MISSING_INVENTORY',
    });

    const inStockFilter = await request(app.getHttpServer())
      .get('/v1/products')
      .query({ availability: 'in_stock', q: '[TEST]' })
      .expect(200);
    const inStockSlugs = (inStockFilter.body.data as Array<{ slug: string }>).map(
      (row) => row.slug,
    );
    expect(inStockSlugs).toEqual(expect.arrayContaining([inStock.slug, untracked.slug]));
    expect(inStockSlugs).not.toContain(out.slug);
    expect(inStockSlugs).not.toContain(missing.slug);

    const outFilter = await request(app.getHttpServer())
      .get('/v1/products')
      .query({ availability: 'out_of_stock', q: '[TEST]' })
      .expect(200);
    const outSlugs = (outFilter.body.data as Array<{ slug: string }>).map((row) => row.slug);
    expect(outSlugs).toContain(out.slug);
    expect(outSlugs).not.toContain(missing.slug);
    expect(outSlugs).not.toContain(untracked.slug);
  });

  it('returns a flattened single-variant PDP and omits empty narrative fields', async () => {
    const product = await addProduct(testPrisma(), {
      slug: `test-pdp-${Date.now()}`,
      description: 'Une crème hydratante.',
      benefits: 'Hydrate la peau.',
      ingredients: null,
      usage: '',
      precautions: null,
      inventory: 'tracked',
      onHand: 1,
    });

    const response = await request(app.getHttpServer())
      .get(`/v1/products/${product.slug}`)
      .expect(200);
    const data = response.body.data as {
      variantMode: string;
      description: string | null;
      benefits: string | null;
      composition: string | null;
      usage: string | null;
      precautions: string | null;
      sku: string;
      price: number;
    };
    expect(data.variantMode).toBe('SINGLE');
    expect(data.description).toBe('Une crème hydratante.');
    expect(data.benefits).toBe('Hydrate la peau.');
    expect(data.composition).toBeNull();
    expect(data.usage).toBeNull();
    expect(data.precautions).toBeNull();
    expect(data.sku).toBe(product.sku);
    expect(data.price).toBe(5000);
    expect(JSON.stringify(data)).not.toMatch(/"cost"/);

    await request(app.getHttpServer()).get('/v1/products/does-not-exist').expect(404);
    await request(app.getHttpServer()).get('/v1/products/draft-hidden').expect(404);
  });

  it('hides [TEST] products when NODE_ENV is production', async () => {
    await addProduct(testPrisma(), {
      name: '[TEST] production hidden',
      slug: `test-hidden-prod-${Date.now()}`,
    });
    const previous = process.env['NODE_ENV'];
    process.env['NODE_ENV'] = 'production';
    try {
      const response = await request(app.getHttpServer()).get('/v1/products').expect(200);
      const names = (response.body.data as Array<{ name: string }>).map((row) => row.name);
      expect(names.some((name) => name.startsWith('[TEST]'))).toBe(false);
    } finally {
      process.env['NODE_ENV'] = previous;
    }
  });

  it('exposes liveness without the /v1 prefix', async () => {
    await request(app.getHttpServer()).get('/health').expect(200);
  });
});
