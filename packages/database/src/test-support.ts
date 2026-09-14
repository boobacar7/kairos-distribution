import { randomBytes } from 'node:crypto';

import { TEST_DATA_NAME_PREFIX } from '@kairos/types';

import { createPrismaClient, type PrismaClient } from './client.js';
import { enableInventoryLedger } from './inventory.js';
import { seedReference } from './seed.js';

export function suffix(): string {
  return randomBytes(6).toString('hex');
}

let prisma: PrismaClient | undefined;
let seeded = false;

export function testPrisma(): PrismaClient {
  prisma ??= createPrismaClient({ includeDeleted: true });
  return prisma;
}

export async function ensureSeeded(): Promise<PrismaClient> {
  const client = testPrisma();
  if (!seeded) {
    await seedReference(client);
    seeded = true;
  }
  return client;
}

export async function disconnectTestPrisma(): Promise<void> {
  if (prisma) {
    await prisma.$disconnect();
    prisma = undefined;
    seeded = false;
  }
}

export async function createTrackedVariant(
  client: PrismaClient,
  options: { onHand: number; trackInventory?: boolean; sku?: string },
): Promise<{
  productId: string;
  variantId: string;
  inventoryItemId: string;
  categoryId: string;
}> {
  const category = await client.category.findUniqueOrThrow({ where: { slug: 'beaute-soins' } });
  const id = suffix();
  const product = await client.product.create({
    data: {
      name: `${TEST_DATA_NAME_PREFIX} product ${id}`,
      slug: `test-product-${id}`,
      categoryId: category.id,
      status: 'ACTIVE',
      minPrice: 5000,
      maxPrice: 5000,
    },
  });
  const variant = await client.productVariant.create({
    data: {
      productId: product.id,
      name: 'Default',
      sku: options.sku ?? `TEST-SKU-${id}`,
      price: 5000,
      isDefault: true,
    },
  });
  const trackInventory = options.trackInventory ?? true;
  const onHand = options.onHand;
  const reserved = 0;
  const available = onHand - reserved;
  const rows = await client.$transaction(async (tx) => {
    await enableInventoryLedger(tx);
    return tx.inventoryItem.create({
      data: {
        variantId: variant.id,
        trackInventory,
        onHandQty: onHand,
        reservedQty: reserved,
        availableQty: available,
        isOutOfStock: available <= 0,
        isLowStock: trackInventory && available <= 5,
        lowStockThreshold: 5,
      },
    });
  });
  return {
    productId: product.id,
    variantId: variant.id,
    inventoryItemId: rows.id,
    categoryId: category.id,
  };
}

export async function createCustomer(
  client: PrismaClient,
  options: { verified?: boolean; email?: string } = {},
): Promise<{ id: string; email: string }> {
  const id = suffix();
  const email = options.email ?? `customer-${id}@example.test`;
  const customer = await client.customer.create({
    data: {
      email,
      firstName: 'Test',
      lastName: 'Customer',
      emailVerifiedAt: options.verified === false ? null : new Date(),
    },
  });
  return { id: customer.id, email };
}
