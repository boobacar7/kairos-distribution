import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { createHash, randomBytes } from 'node:crypto';

import {
  createCatalogApp,
  createPublicProduct,
  createActiveDelivery,
  createCustomer,
  deleteProduct,
  ensureSeeded,
  testPrisma,
  type CreatedProduct,
} from '../test-support.js';
import { InventoryService } from './inventory/inventory.service.js';

function cookie(response: { headers: Record<string, unknown> }, name: string): string {
  const raw = response.headers['set-cookie'];
  const list = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const match = list.find((entry) => String(entry).startsWith(`${name}=`));
  return match ? String(match) : '';
}

function idempotencyKey(label: string): string {
  return `${label}-${randomBytes(8).toString('hex')}`;
}

const contact = {
  email: 'guest@example.test',
  phone: '+22670000000',
  firstName: 'Awa',
  lastName: 'Kaboré',
};

const address = {
  firstName: 'Awa',
  lastName: 'Kaboré',
  phone: '+22670000000',
  line1: 'Ouaga 2000',
  city: 'Ouagadougou',
  countryCode: 'BF',
};

describe('guest checkout + ManualProvider', () => {
  let app: INestApplication;
  const created: CreatedProduct[] = [];
  let delivery: { zoneId: string; methodId: string; fee: number };

  beforeAll(async () => {
    await ensureSeeded();
    delivery = await createActiveDelivery(testPrisma(), { fee: 1500 });
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

  async function createCart(variantId: string, quantity = 1, extra: Record<string, unknown> = {}) {
    const response = await request(app.getHttpServer())
      .post('/v1/cart')
      .send({
        items: [{ variantId, quantity, unitPrice: 1, price: 1 }],
        subtotal: 1,
        ...extra,
      })
      .expect(201);
    return { body: response.body, cookie: cookie(response, 'kairos.cartId') };
  }

  it('quotes and places using server prices, ignoring client money', async () => {
    const product = await addProduct(testPrisma(), {
      price: 8000,
      inventory: 'tracked',
      onHand: 5,
    });
    const cart = await createCart(product.variantId as string, 2);

    const quoted = await request(app.getHttpServer())
      .post('/v1/checkout/quote')
      .send({
        cartId: cart.body.cartId,
        deliveryMethodId: delivery.methodId,
        destination: { city: 'Ouagadougou' },
        shippingTotal: 1,
        grandTotal: 1,
      })
      .expect(200);

    expect(quoted.body.totals.subtotal).toBe(16_000);
    expect(quoted.body.totals.shippingTotal).toBe(1500);
    expect(quoted.body.totals.taxTotal).toBe(0);
    expect(quoted.body.totals.grandTotal).toBe(17_500);
    expect(JSON.stringify(quoted.body)).not.toMatch(/"cost"/);

    const placed = await request(app.getHttpServer())
      .post('/v1/checkout/orders')
      .set('Idempotency-Key', idempotencyKey('place'))
      .set('Cookie', cart.cookie)
      .send({
        cartId: cart.body.cartId,
        deliveryMethodId: delivery.methodId,
        contact,
        shippingAddress: address,
        grandTotal: 1,
        subtotal: 1,
        status: 'PAID',
      })
      .expect(201);

    expect(placed.body.totals.grandTotal).toBe(17_500);
    expect(placed.body.reference).toMatch(/^KD-\d{4}-\d{6}$/);
    expect(placed.body.claimToken).toBeTruthy();
    expect(placed.body.claimToken).not.toBe(placed.body.reference);
    expect(JSON.stringify(placed.body)).not.toMatch(/unitCost|internalNote|guestClaimTokenHash/);

    const row = await testPrisma().order.findUniqueOrThrow({
      where: { id: placed.body.id },
    });
    expect(row.guestClaimTokenHash).toBe(
      createHash('sha256').update(placed.body.claimToken, 'utf8').digest('hex'),
    );
    expect(row.guestClaimTokenHash).not.toBe(placed.body.claimToken);
  });

  it('replays an identical Idempotency-Key to the same order', async () => {
    const product = await addProduct(testPrisma(), { price: 3000, onHand: 4 });
    const cart = await createCart(product.variantId as string, 1);
    const key = idempotencyKey('same');
    const payload = {
      cartId: cart.body.cartId,
      deliveryMethodId: delivery.methodId,
      contact,
      shippingAddress: address,
    };
    const first = await request(app.getHttpServer())
      .post('/v1/checkout/orders')
      .set('Idempotency-Key', key)
      .set('Cookie', cart.cookie)
      .send(payload)
      .expect(201);
    const second = await request(app.getHttpServer())
      .post('/v1/checkout/orders')
      .set('Idempotency-Key', key)
      .set('Cookie', cart.cookie)
      .send(payload)
      .expect(201);
    expect(second.body.reference).toBe(first.body.reference);
    expect(second.body.claimToken).toBe(first.body.claimToken);
  });

  it('rejects a reused Idempotency-Key with a different body', async () => {
    const product = await addProduct(testPrisma(), { price: 3000, onHand: 4 });
    const cart = await createCart(product.variantId as string, 1);
    const key = idempotencyKey('reuse');
    await request(app.getHttpServer())
      .post('/v1/checkout/orders')
      .set('Idempotency-Key', key)
      .set('Cookie', cart.cookie)
      .send({
        cartId: cart.body.cartId,
        deliveryMethodId: delivery.methodId,
        contact,
        shippingAddress: address,
      })
      .expect(201);
    await request(app.getHttpServer())
      .post('/v1/checkout/orders')
      .set('Idempotency-Key', key)
      .set('Cookie', cart.cookie)
      .send({
        cartId: cart.body.cartId,
        deliveryMethodId: delivery.methodId,
        contact: { ...contact, firstName: 'Other' },
        shippingAddress: address,
      })
      .expect(409);
  });

  it('allows only one of two concurrent checkouts for a single unit', async () => {
    const product = await addProduct(testPrisma(), { price: 2000, onHand: 1 });
    const cartA = await createCart(product.variantId as string, 1);
    const cartB = await createCart(product.variantId as string, 1);
    const payload = (cartId: string) => ({
      cartId,
      deliveryMethodId: delivery.methodId,
      contact,
      shippingAddress: address,
    });
    const results = await Promise.allSettled([
      request(app.getHttpServer())
        .post('/v1/checkout/orders')
        .set('Idempotency-Key', idempotencyKey('n1'))
        .set('Cookie', cartA.cookie)
        .send(payload(cartA.body.cartId)),
      request(app.getHttpServer())
        .post('/v1/checkout/orders')
        .set('Idempotency-Key', idempotencyKey('n2'))
        .set('Cookie', cartB.cookie)
        .send(payload(cartB.body.cartId)),
    ]);
    const statuses = results.map((result) =>
      result.status === 'fulfilled' ? result.value.status : 0,
    );
    expect(statuses.sort()).toEqual([201, 409]);
    const item = await testPrisma().inventoryItem.findUniqueOrThrow({
      where: { variantId: product.variantId as string },
    });
    expect(item.reservedQty).toBe(1);
    expect(item.availableQty).toBe(0);
  });

  it('refuses a quote when no active zone and rate exist', async () => {
    const product = await addProduct(testPrisma(), { price: 2000, onHand: 2 });
    const cart = await createCart(product.variantId as string, 1);
    const prisma = testPrisma();
    await prisma.deliveryMethod.updateMany({ data: { isActive: false } });
    await prisma.deliveryZone.updateMany({ data: { isActive: false } });
    try {
      await request(app.getHttpServer())
        .post('/v1/checkout/quote')
        .send({
          cartId: cart.body.cartId,
          deliveryMethodId: delivery.methodId,
          destination: { city: 'Ouagadougou' },
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.code).toBe('DELIVERY_UNAVAILABLE');
          expect(res.body.issues?.[0]?.code).toBe('DELIVERY_UNAVAILABLE');
        });
    } finally {
      await prisma.deliveryZone.update({
        where: { id: delivery.zoneId },
        data: { isActive: true },
      });
      await prisma.deliveryMethod.update({
        where: { id: delivery.methodId },
        data: { isActive: true },
      });
    }
  });

  it('extends expiresAt on ManualProvider initiate and never past 60 minutes', async () => {
    const product = await addProduct(testPrisma(), { price: 4000, onHand: 2 });
    const cart = await createCart(product.variantId as string, 1);
    const placed = await request(app.getHttpServer())
      .post('/v1/checkout/orders')
      .set('Idempotency-Key', idempotencyKey('hold'))
      .set('Cookie', cart.cookie)
      .send({
        cartId: cart.body.cartId,
        deliveryMethodId: delivery.methodId,
        contact,
        shippingAddress: address,
      })
      .expect(201);

    const before = await testPrisma().stockReservation.findFirstOrThrow({
      where: { orderId: placed.body.id, status: 'HELD' },
    });
    const initialWindow = before.expiresAt.getTime() - new Date(placed.body.placedAt).getTime();
    expect(initialWindow).toBeGreaterThanOrEqual(14 * 60_000);
    expect(initialWindow).toBeLessThanOrEqual(16 * 60_000);

    await request(app.getHttpServer())
      .post(`/v1/payments/${placed.body.reference}/initiate`)
      .set('Idempotency-Key', idempotencyKey('init'))
      .send({ providerKey: 'manual', amount: 1 })
      .expect(200);

    const after = await testPrisma().stockReservation.findFirstOrThrow({
      where: { orderId: placed.body.id, status: 'HELD' },
    });
    const pendingWindow = after.expiresAt.getTime() - new Date(placed.body.placedAt).getTime();
    expect(pendingWindow).toBeGreaterThan(initialWindow);
    expect(pendingWindow).toBeLessThanOrEqual(60 * 60_000);
    expect(after.expiresAt.toISOString()).not.toBeNull();
  });

  it('expires a held reservation and releases stock', async () => {
    const product = await addProduct(testPrisma(), { price: 4000, onHand: 1 });
    const cart = await createCart(product.variantId as string, 1);
    const placed = await request(app.getHttpServer())
      .post('/v1/checkout/orders')
      .set('Idempotency-Key', idempotencyKey('exp'))
      .set('Cookie', cart.cookie)
      .send({
        cartId: cart.body.cartId,
        deliveryMethodId: delivery.methodId,
        contact,
        shippingAddress: address,
      })
      .expect(201);

    await testPrisma().stockReservation.updateMany({
      where: { orderId: placed.body.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    const inventory = app.get(InventoryService);
    const count = await inventory.expireDueReservations();
    expect(count).toBeGreaterThanOrEqual(1);
    const item = await testPrisma().inventoryItem.findUniqueOrThrow({
      where: { variantId: product.variantId as string },
    });
    expect(item.reservedQty).toBe(0);
    expect(item.availableQty).toBe(1);
    const reservation = await testPrisma().stockReservation.findFirstOrThrow({
      where: { orderId: placed.body.id },
    });
    expect(reservation.status).toBe('EXPIRED');
  });

  it('records payment and refunds when success arrives after release and stock is gone', async () => {
    const product = await addProduct(testPrisma(), { price: 4000, onHand: 1 });
    const cart = await createCart(product.variantId as string, 1);
    const placed = await request(app.getHttpServer())
      .post('/v1/checkout/orders')
      .set('Idempotency-Key', idempotencyKey('late'))
      .set('Cookie', cart.cookie)
      .send({
        cartId: cart.body.cartId,
        deliveryMethodId: delivery.methodId,
        contact,
        shippingAddress: address,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/payments/${placed.body.reference}/initiate`)
      .set('Idempotency-Key', idempotencyKey('late-init'))
      .send({ providerKey: 'manual' })
      .expect(200);

    await testPrisma().stockReservation.updateMany({
      where: { orderId: placed.body.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await app.get(InventoryService).expireDueReservations();

    const item = await testPrisma().inventoryItem.findUniqueOrThrow({
      where: { variantId: product.variantId as string },
    });
    expect(item.availableQty).toBe(1);

    const otherCart = await createCart(product.variantId as string, 1);
    await request(app.getHttpServer())
      .post('/v1/checkout/orders')
      .set('Idempotency-Key', idempotencyKey('other'))
      .set('Cookie', otherCart.cookie)
      .send({
        cartId: otherCart.body.cartId,
        deliveryMethodId: delivery.methodId,
        contact: { ...contact, email: 'other@example.test' },
        shippingAddress: address,
      })
      .expect(201);

    const gone = await testPrisma().inventoryItem.findUniqueOrThrow({
      where: { variantId: product.variantId as string },
    });
    expect(gone.availableQty).toBe(0);

    const marked = await request(app.getHttpServer())
      .post(`/v1/admin/orders/${placed.body.reference}/mark-paid`)
      .set('Idempotency-Key', idempotencyKey('mark'))
      .send({ note: 'late manual' })
      .expect(409);
    expect(marked.body.code).toBe('PAID_WITHOUT_STOCK');

    const order = await testPrisma().order.findUniqueOrThrow({
      where: { id: placed.body.id },
      include: { payment: true, refunds: true },
    });
    expect(order.status).toBe('PENDING');
    expect(order.payment?.status).toBe('PAID');
    expect(order.refunds[0]?.reason).toBe('paid_without_stock');
    const audit = await testPrisma().auditLog.findFirst({
      where: { action: 'payments.paid_without_stock', entityId: order.id },
    });
    expect(audit).not.toBeNull();
  });

  it('confirms a late payment when stock is still free after release', async () => {
    const product = await addProduct(testPrisma(), { price: 4000, onHand: 1 });
    const cart = await createCart(product.variantId as string, 1);
    const placed = await request(app.getHttpServer())
      .post('/v1/checkout/orders')
      .set('Idempotency-Key', idempotencyKey('late-ok'))
      .set('Cookie', cart.cookie)
      .send({
        cartId: cart.body.cartId,
        deliveryMethodId: delivery.methodId,
        contact,
        shippingAddress: address,
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/v1/payments/${placed.body.reference}/initiate`)
      .set('Idempotency-Key', idempotencyKey('late-ok-init'))
      .send({ providerKey: 'manual' })
      .expect(200);

    await testPrisma().stockReservation.updateMany({
      where: { orderId: placed.body.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });
    await app.get(InventoryService).expireDueReservations();

    const marked = await request(app.getHttpServer())
      .post(`/v1/admin/orders/${placed.body.reference}/mark-paid`)
      .set('Idempotency-Key', idempotencyKey('late-ok-mark'))
      .send({ note: 'stock still free' })
      .expect(200);
    expect(marked.body.outcome).toBe('confirmed');

    const order = await testPrisma().order.findUniqueOrThrow({
      where: { id: placed.body.id },
      include: { payment: true, refunds: true, reservations: true },
    });
    expect(order.status).toBe('CONFIRMED');
    expect(order.payment?.status).toBe('PAID');
    expect(order.refunds).toHaveLength(0);
    expect(order.reservations.every((row) => row.status === 'CONSUMED')).toBe(true);
    const item = await testPrisma().inventoryItem.findUniqueOrThrow({
      where: { variantId: product.variantId as string },
    });
    expect(item.onHandQty).toBe(0);
    expect(item.reservedQty).toBe(0);
    expect(item.availableQty).toBe(0);
  });

  it('claims a guest order only after email verification, once', async () => {
    const product = await addProduct(testPrisma(), { price: 2500, onHand: 3 });
    const cart = await createCart(product.variantId as string, 1);
    const placed = await request(app.getHttpServer())
      .post('/v1/checkout/orders')
      .set('Idempotency-Key', idempotencyKey('claim'))
      .set('Cookie', cart.cookie)
      .send({
        cartId: cart.body.cartId,
        deliveryMethodId: delivery.methodId,
        contact: { ...contact, email: `claim-${placedNonce()}@example.test` },
        shippingAddress: address,
      })
      .expect(201);

    const email = placed.body.email as string;
    const unverified = await createCustomer(testPrisma(), { email, verified: false });
    await request(app.getHttpServer())
      .post('/v1/orders/claim')
      .send({ token: placed.body.claimToken, email: unverified.email })
      .expect(400);

    const stranger = await createCustomer(testPrisma(), { verified: true });
    await request(app.getHttpServer())
      .post('/v1/orders/claim')
      .send({ token: placed.body.claimToken, email: stranger.email })
      .expect(400);

    await testPrisma().customer.update({
      where: { id: unverified.id },
      data: { emailVerifiedAt: new Date() },
    });

    await request(app.getHttpServer())
      .post('/v1/orders/claim')
      .send({ token: placed.body.claimToken, email })
      .expect(200);

    await request(app.getHttpServer())
      .post('/v1/orders/claim')
      .send({ token: placed.body.claimToken, email })
      .expect(400);

    const view = await request(app.getHttpServer())
      .get(`/v1/orders/${placed.body.id}`)
      .set('Cookie', cookie(placed, 'kairos.orderAccess'))
      .expect(200);
    expect(view.body.claimToken).toBeUndefined();
    expect(JSON.stringify(view.body)).not.toMatch(/unitCost|guestClaimTokenHash/);
  });
});

function placedNonce(): string {
  return randomBytes(4).toString('hex');
}
