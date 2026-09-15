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
} from '../test-support.js';

describe('cart preview API', () => {
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

  it('prices lines from the catalogue and ignores client-supplied amounts', async () => {
    const product = await addProduct(testPrisma(), {
      name: '[TEST] Cart priced',
      price: 8000,
      inventory: 'tracked',
      onHand: 6,
    });

    const response = await request(app.getHttpServer())
      .post('/v1/cart/preview')
      .send({
        items: [
          {
            variantId: product.variantId,
            quantity: 2,
            unitPrice: 1,
            price: 1,
            subtotal: 1,
          },
        ],
        subtotal: 1,
      })
      .expect(200);

    expect(JSON.stringify(response.body)).not.toMatch(/"cost"/);
    expect(response.body).toEqual({
      currency: 'XOF',
      itemCount: 2,
      subtotal: 16_000,
      items: [
        expect.objectContaining({
          variantId: product.variantId,
          quantity: 2,
          productName: '[TEST] Cart priced',
          sku: product.sku,
          unitPrice: 8000,
          lineSubtotal: 16_000,
          purchasable: true,
          issue: null,
          availability: { status: 'IN_STOCK', purchasable: true, issue: null },
        }),
      ],
    });
  });

  it('merges duplicate variant ids and keeps untracked products purchasable', async () => {
    const product = await addProduct(testPrisma(), {
      name: '[TEST] Cart untracked',
      price: 3000,
      inventory: 'untracked',
    });

    const response = await request(app.getHttpServer())
      .post('/v1/cart/preview')
      .send({
        items: [
          { variantId: product.variantId, quantity: 1 },
          { variantId: product.variantId, quantity: 2 },
        ],
      })
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        variantId: product.variantId,
        quantity: 3,
        unitPrice: 3000,
        lineSubtotal: 9000,
        purchasable: true,
        availability: { status: 'UNTRACKED', purchasable: true, issue: null },
      }),
    );
    expect(response.body.subtotal).toBe(9000);
  });

  it('does not treat tracked zero quantity or missing inventory as silently available', async () => {
    const oos = await addProduct(testPrisma(), {
      name: '[TEST] Cart oos',
      price: 4000,
      inventory: 'tracked',
      onHand: 0,
    });
    const missing = await addProduct(testPrisma(), {
      name: '[TEST] Cart missing inv',
      price: 4000,
      inventory: 'missing',
    });

    const response = await request(app.getHttpServer())
      .post('/v1/cart/preview')
      .send({
        items: [
          { variantId: oos.variantId, quantity: 1 },
          { variantId: missing.variantId, quantity: 1 },
        ],
      })
      .expect(200);

    expect(response.body.subtotal).toBe(0);
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        purchasable: false,
        issue: 'OUT_OF_STOCK',
        availability: { status: 'OUT_OF_STOCK', purchasable: false, issue: null },
      }),
    );
    expect(response.body.items[1]).toEqual(
      expect.objectContaining({
        purchasable: false,
        issue: 'MISSING_INVENTORY',
        availability: { status: 'UNKNOWN', purchasable: false, issue: 'MISSING_INVENTORY' },
      }),
    );
  });

  it('surfaces a missing default variant as a catalogue inconsistency', async () => {
    const product = await addProduct(testPrisma(), {
      name: '[TEST] Cart no default',
      price: 5000,
      inventory: 'tracked',
      onHand: 3,
    });
    await testPrisma().productVariant.update({
      where: { id: product.variantId as string },
      data: { isDefault: false },
    });

    const response = await request(app.getHttpServer())
      .post('/v1/cart/preview')
      .send({ items: [{ variantId: product.variantId, quantity: 1 }] })
      .expect(200);

    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        purchasable: false,
        issue: 'MISSING_DEFAULT_VARIANT',
        unitPrice: null,
        lineSubtotal: null,
        availability: {
          status: 'UNKNOWN',
          purchasable: false,
          issue: 'MISSING_DEFAULT_VARIANT',
        },
      }),
    );
    expect(response.body.subtotal).toBe(0);
  });

  it('marks deleted variants and inactive products as unavailable', async () => {
    const deleted = await addProduct(testPrisma(), {
      name: '[TEST] Cart deleted variant',
      inventory: 'tracked',
      onHand: 2,
    });
    const draft = await addProduct(testPrisma(), {
      name: '[TEST] Cart draft',
      status: 'DRAFT',
      inventory: 'tracked',
      onHand: 2,
    });
    await testPrisma().productVariant.update({
      where: { id: deleted.variantId as string },
      data: { deletedAt: new Date(), isActive: false },
    });

    const response = await request(app.getHttpServer())
      .post('/v1/cart/preview')
      .send({
        items: [
          { variantId: deleted.variantId, quantity: 1 },
          { variantId: draft.variantId, quantity: 1 },
          { variantId: 'does-not-exist', quantity: 1 },
        ],
      })
      .expect(200);

    expect(response.body.items.map((line: { issue: string }) => line.issue)).toEqual([
      'VARIANT_UNAVAILABLE',
      'PRODUCT_UNAVAILABLE',
      'VARIANT_UNAVAILABLE',
    ]);
    expect(response.body.subtotal).toBe(0);
  });

  it('rejects an invalid quantity', async () => {
    await request(app.getHttpServer())
      .post('/v1/cart/preview')
      .send({ items: [{ variantId: 'v1', quantity: 0 }] })
      .expect(400);
  });
});
