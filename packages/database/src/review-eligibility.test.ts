import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  createCustomer,
  createTrackedVariant,
  disconnectTestPrisma,
  ensureSeeded,
  suffix,
  testPrisma,
} from './test-support.js';

async function createDeliveredOrder(options: {
  customerId: string;
  productId: string;
  variantId: string;
  delivered?: boolean;
}): Promise<{ orderId: string; orderItemId: string }> {
  const prisma = testPrisma();
  const order = await prisma.order.create({
    data: {
      reference: `KD-REV-${suffix()}`,
      customerId: options.customerId,
      email: `rev-${suffix()}@example.test`,
      phone: '+22671000000',
      firstName: 'Rev',
      lastName: 'Iew',
      subtotal: 5000,
      grandTotal: 5000,
      deliveryZoneName: 'Ouagadougou',
      deliveryMethodName: 'Standard',
      deliveryFeeSnapshot: 0,
      deliveredAt: options.delivered === false ? null : new Date(),
      items: {
        create: {
          productId: options.productId,
          variantId: options.variantId,
          sku: `REV-${suffix()}`,
          productName: '[TEST] reviewed',
          variantName: 'Default',
          productSlug: 'test',
          unitPrice: 5000,
          quantity: 1,
          lineSubtotal: 5000,
          lineTotal: 5000,
          productSnapshot: { name: '[TEST] reviewed' },
        },
      },
    },
    include: { items: true },
  });
  const item = order.items[0];
  if (!item) throw new Error('order item missing');
  return { orderId: order.id, orderItemId: item.id };
}

describe('review eligibility', () => {
  beforeAll(async () => {
    await ensureSeeded();
  });

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it('allows a review of a delivered, owned line', async () => {
    const prisma = testPrisma();
    const owner = await createCustomer(prisma);
    const catalog = await createTrackedVariant(prisma, { onHand: 3 });
    const { orderId, orderItemId } = await createDeliveredOrder({
      customerId: owner.id,
      productId: catalog.productId,
      variantId: catalog.variantId,
    });
    const review = await prisma.review.create({
      data: {
        orderItemId,
        orderId,
        productId: catalog.productId,
        customerId: owner.id,
        rating: 5,
        comment: 'ok',
      },
    });
    expect(review.isVerifiedPurchase).toBe(true);
  });

  it('rejects a review of an undelivered order', async () => {
    const prisma = testPrisma();
    const owner = await createCustomer(prisma);
    const catalog = await createTrackedVariant(prisma, { onHand: 3 });
    const { orderId, orderItemId } = await createDeliveredOrder({
      customerId: owner.id,
      productId: catalog.productId,
      variantId: catalog.variantId,
      delivered: false,
    });
    await expect(
      prisma.review.create({
        data: {
          orderItemId,
          orderId,
          productId: catalog.productId,
          customerId: owner.id,
          rating: 4,
          comment: 'too soon',
        },
      }),
    ).rejects.toThrow(/never reached DELIVERED/);
  });

  it('rejects a review of an order the customer does not own', async () => {
    const prisma = testPrisma();
    const owner = await createCustomer(prisma);
    const stranger = await createCustomer(prisma);
    const catalog = await createTrackedVariant(prisma, { onHand: 3 });
    const { orderId, orderItemId } = await createDeliveredOrder({
      customerId: owner.id,
      productId: catalog.productId,
      variantId: catalog.variantId,
    });
    await expect(
      prisma.review.create({
        data: {
          orderItemId,
          orderId,
          productId: catalog.productId,
          customerId: stranger.id,
          rating: 1,
          comment: 'not mine',
        },
      }),
    ).rejects.toThrow();
  });

  it('rejects a review whose product does not match the order line', async () => {
    const prisma = testPrisma();
    const owner = await createCustomer(prisma);
    const catalog = await createTrackedVariant(prisma, { onHand: 3 });
    const other = await createTrackedVariant(prisma, { onHand: 3 });
    const { orderId, orderItemId } = await createDeliveredOrder({
      customerId: owner.id,
      productId: catalog.productId,
      variantId: catalog.variantId,
    });
    await expect(
      prisma.review.create({
        data: {
          orderItemId,
          orderId,
          productId: other.productId,
          customerId: owner.id,
          rating: 3,
          comment: 'wrong product',
        },
      }),
    ).rejects.toThrow();
  });

  it('rejects a review of an unclaimed guest order', async () => {
    const prisma = testPrisma();
    const catalog = await createTrackedVariant(prisma, { onHand: 3 });
    const guest = await prisma.order.create({
      data: {
        reference: `KD-GUEST-${suffix()}`,
        email: `guest-rev-${suffix()}@example.test`,
        phone: '+22672000000',
        firstName: 'Guest',
        lastName: 'Review',
        subtotal: 5000,
        grandTotal: 5000,
        deliveryZoneName: 'Ouagadougou',
        deliveryMethodName: 'Standard',
        deliveryFeeSnapshot: 0,
        deliveredAt: new Date(),
        items: {
          create: {
            productId: catalog.productId,
            variantId: catalog.variantId,
            sku: `G-${suffix()}`,
            productName: '[TEST] guest',
            variantName: 'Default',
            productSlug: 'guest',
            unitPrice: 5000,
            quantity: 1,
            lineSubtotal: 5000,
            lineTotal: 5000,
            productSnapshot: { name: '[TEST] guest' },
          },
        },
      },
      include: { items: true },
    });
    const item = guest.items[0];
    if (!item) throw new Error('missing item');
    const someone = await createCustomer(prisma);
    await expect(
      prisma.review.create({
        data: {
          orderItemId: item.id,
          orderId: guest.id,
          productId: catalog.productId,
          customerId: someone.id,
          rating: 5,
          comment: 'guest',
        },
      }),
    ).rejects.toThrow();
  });
});
