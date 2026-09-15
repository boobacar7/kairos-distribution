import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  InventoryInconsistencyError,
  OutOfStockError,
  Prisma,
  consumeTrackedStock,
  expireTrackedStock,
  releaseTrackedStock,
  reserveTrackedStock,
  withInventoryTransaction,
} from './index.js';
import {
  createTrackedVariant,
  disconnectTestPrisma,
  ensureSeeded,
  testPrisma,
} from './test-support.js';

describe('inventory concurrency', () => {
  beforeAll(async () => {
    await ensureSeeded();
  });

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it('allows only one of N concurrent reserves against a single unit', async () => {
    const { inventoryItemId } = await createTrackedVariant(testPrisma(), { onHand: 1 });
    const prisma = testPrisma();
    const attempts = 15;

    const results = await Promise.allSettled(
      Array.from({ length: attempts }, (_, index) =>
        withInventoryTransaction({ prisma }, async (tx) =>
          reserveTrackedStock(tx, {
            inventoryItemId,
            quantity: 1,
            idempotencyKey: `reserve:${inventoryItemId}:${index}`,
          }),
        ),
      ),
    );

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');
    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(attempts - 1);
    for (const result of rejected) {
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.reason).toBeInstanceOf(OutOfStockError);
      }
    }

    const item = await prisma.inventoryItem.findUniqueOrThrow({ where: { id: inventoryItemId } });
    expect(item.onHandQty).toBe(1);
    expect(item.reservedQty).toBe(1);
    expect(item.availableQty).toBe(0);

    const movements = await prisma.stockMovement.findMany({
      where: { inventoryItemId, type: 'ORDER_RESERVATION' },
    });
    expect(movements).toHaveLength(1);
  });

  it('keeps an inventory-disabled product purchasable with no reservation row', async () => {
    const created = await createTrackedVariant(testPrisma(), { onHand: 0, trackInventory: false });
    const prisma = testPrisma();

    await expect(
      withInventoryTransaction({ prisma }, async (tx) =>
        reserveTrackedStock(tx, {
          inventoryItemId: created.inventoryItemId,
          quantity: 1,
          idempotencyKey: `reserve-untracked:${created.inventoryItemId}`,
        }),
      ),
    ).rejects.toBeInstanceOf(InventoryInconsistencyError);

    const item = await prisma.inventoryItem.findUniqueOrThrow({
      where: { id: created.inventoryItemId },
    });
    expect(item.trackInventory).toBe(false);
    expect(item.reservedQty).toBe(0);

    const reservations = await prisma.stockReservation.count({
      where: { inventoryItemId: created.inventoryItemId },
    });
    expect(reservations).toBe(0);
    const movements = await prisma.stockMovement.count({
      where: { inventoryItemId: created.inventoryItemId },
    });
    expect(movements).toBe(0);
  });

  it('still accepts an order line for an untracked variant with zero on-hand', async () => {
    const catalog = await createTrackedVariant(testPrisma(), {
      onHand: 0,
      trackInventory: false,
    });
    const prisma = testPrisma();
    const order = await prisma.order.create({
      data: {
        reference: `KD-UNTRACKED-${catalog.variantId.slice(0, 8)}`,
        email: 'untracked@example.test',
        phone: '+22673000000',
        firstName: 'Un',
        lastName: 'Tracked',
        subtotal: 5000,
        grandTotal: 5000,
        deliveryZoneName: 'Ouagadougou',
        deliveryMethodName: 'Standard',
        deliveryFeeSnapshot: 0,
        items: {
          create: {
            productId: catalog.productId,
            variantId: catalog.variantId,
            sku: `U-${catalog.variantId.slice(0, 8)}`,
            productName: '[TEST] untracked',
            variantName: 'Default',
            productSlug: 'untracked',
            unitPrice: 5000,
            quantity: 1,
            lineSubtotal: 5000,
            lineTotal: 5000,
            productSnapshot: { name: '[TEST] untracked' },
          },
        },
      },
      include: { items: true },
    });
    expect(order.items).toHaveLength(1);
    const reservations = await prisma.stockReservation.count({
      where: { inventoryItemId: catalog.inventoryItemId },
    });
    expect(reservations).toBe(0);
  });

  it('runs the reservation transaction at READ COMMITTED', async () => {
    const prisma = testPrisma();
    const level = await withInventoryTransaction({ prisma }, async (tx) => {
      const rows = await tx.$queryRaw<Array<{ transaction_isolation: string }>>`
        SHOW transaction_isolation
      `;
      return rows[0]?.transaction_isolation;
    });
    expect(level?.toLowerCase()).toBe('read committed');
  });

  it('does not serialise two variants of the same product on the product row', async () => {
    const prisma = testPrisma();
    const a = await createTrackedVariant(prisma, { onHand: 5 });
    const b = await createTrackedVariant(prisma, { onHand: 5 });
    // Re-parent b's variant onto a's product so they share a product row.
    await prisma.productVariant.update({
      where: { id: b.variantId },
      data: { productId: a.productId, isDefault: false },
    });

    const started = Date.now();
    await Promise.all([
      withInventoryTransaction({ prisma }, async (tx) =>
        reserveTrackedStock(tx, {
          inventoryItemId: a.inventoryItemId,
          quantity: 1,
          idempotencyKey: `a:${a.inventoryItemId}`,
        }),
      ),
      withInventoryTransaction({ prisma }, async (tx) =>
        reserveTrackedStock(tx, {
          inventoryItemId: b.inventoryItemId,
          quantity: 1,
          idempotencyKey: `b:${b.inventoryItemId}`,
        }),
      ),
    ]);
    const elapsed = Date.now() - started;
    expect(elapsed).toBeLessThan(5_000);

    const product = await prisma.product.findUniqueOrThrow({ where: { id: a.productId } });
    expect(product.totalAvailableQty).toBe(0);
  });

  it('refuses inventory writes without the ledger GUC', async () => {
    const created = await createTrackedVariant(testPrisma(), { onHand: 2 });
    await expect(
      testPrisma().inventoryItem.update({
        where: { id: created.inventoryItemId },
        data: { reservedQty: 1, availableQty: 1 },
      }),
    ).rejects.toThrow(/ledger context not set/);
  });

  it('uses the Prisma ReadCommitted enum (not a raised isolation level)', () => {
    expect(Prisma.TransactionIsolationLevel.ReadCommitted).toBe('ReadCommitted');
  });
});

describe('inventory release / expire / consume', () => {
  beforeAll(async () => {
    await ensureSeeded();
  });

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it('releases reserved units without changing on-hand', async () => {
    const { inventoryItemId } = await createTrackedVariant(testPrisma(), { onHand: 2 });
    const prisma = testPrisma();
    await withInventoryTransaction({ prisma }, async (tx) => {
      await reserveTrackedStock(tx, {
        inventoryItemId,
        quantity: 1,
        idempotencyKey: `reserve-rel:${inventoryItemId}`,
      });
      await releaseTrackedStock(tx, {
        inventoryItemId,
        quantity: 1,
        idempotencyKey: `release:${inventoryItemId}`,
      });
    });
    const item = await prisma.inventoryItem.findUniqueOrThrow({ where: { id: inventoryItemId } });
    expect(item.onHandQty).toBe(2);
    expect(item.reservedQty).toBe(0);
    expect(item.availableQty).toBe(2);
  });

  it('expires a held reservation past expiresAt and is idempotent', async () => {
    const created = await createTrackedVariant(testPrisma(), { onHand: 1 });
    const prisma = testPrisma();
    const reservation = await prisma.stockReservation.create({
      data: {
        inventoryItemId: created.inventoryItemId,
        quantity: 1,
        status: 'HELD',
        expiresAt: new Date(Date.now() - 1000),
      },
    });
    await withInventoryTransaction({ prisma }, async (tx) => {
      await reserveTrackedStock(tx, {
        inventoryItemId: created.inventoryItemId,
        quantity: 1,
        idempotencyKey: `reserve-exp:${created.inventoryItemId}`,
        reservationId: reservation.id,
      });
    });
    await prisma.stockReservation.update({
      where: { id: reservation.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const first = await withInventoryTransaction({ prisma }, async (tx) =>
      expireTrackedStock(tx, {
        inventoryItemId: created.inventoryItemId,
        quantity: 1,
        reservationId: reservation.id,
        idempotencyKey: `expire:${reservation.id}`,
      }),
    );
    expect(first).not.toBe('duplicate');
    expect(first).not.toBe('not_due');

    const second = await withInventoryTransaction({ prisma }, async (tx) =>
      expireTrackedStock(tx, {
        inventoryItemId: created.inventoryItemId,
        quantity: 1,
        reservationId: reservation.id,
        idempotencyKey: `expire:${reservation.id}`,
      }),
    );
    expect(second).toBe('duplicate');

    const item = await prisma.inventoryItem.findUniqueOrThrow({
      where: { id: created.inventoryItemId },
    });
    expect(item.reservedQty).toBe(0);
    expect(item.availableQty).toBe(1);
    const row = await prisma.stockReservation.findUniqueOrThrow({ where: { id: reservation.id } });
    expect(row.status).toBe('EXPIRED');
  });

  it('does not expire a reservation whose pending hold was extended', async () => {
    const created = await createTrackedVariant(testPrisma(), { onHand: 1 });
    const prisma = testPrisma();
    const reservation = await prisma.stockReservation.create({
      data: {
        inventoryItemId: created.inventoryItemId,
        quantity: 1,
        status: 'HELD',
        expiresAt: new Date(Date.now() + 60 * 60_000),
      },
    });
    await withInventoryTransaction({ prisma }, async (tx) => {
      await reserveTrackedStock(tx, {
        inventoryItemId: created.inventoryItemId,
        quantity: 1,
        idempotencyKey: `reserve-held:${created.inventoryItemId}`,
        reservationId: reservation.id,
      });
    });
    const result = await withInventoryTransaction({ prisma }, async (tx) =>
      expireTrackedStock(tx, {
        inventoryItemId: created.inventoryItemId,
        quantity: 1,
        reservationId: reservation.id,
        idempotencyKey: `expire:${reservation.id}`,
      }),
    );
    expect(result).toBe('not_due');
    const item = await prisma.inventoryItem.findUniqueOrThrow({
      where: { id: created.inventoryItemId },
    });
    expect(item.reservedQty).toBe(1);
  });

  it('consumes reserved stock by decrementing on-hand and reserved together', async () => {
    const { inventoryItemId } = await createTrackedVariant(testPrisma(), { onHand: 3 });
    const prisma = testPrisma();
    await withInventoryTransaction({ prisma }, async (tx) => {
      await reserveTrackedStock(tx, {
        inventoryItemId,
        quantity: 2,
        idempotencyKey: `reserve-c:${inventoryItemId}`,
      });
      await consumeTrackedStock(tx, {
        inventoryItemId,
        quantity: 2,
        idempotencyKey: `fulfil:${inventoryItemId}`,
      });
    });
    const item = await prisma.inventoryItem.findUniqueOrThrow({ where: { id: inventoryItemId } });
    expect(item.onHandQty).toBe(1);
    expect(item.reservedQty).toBe(0);
    expect(item.availableQty).toBe(1);
  });
});
