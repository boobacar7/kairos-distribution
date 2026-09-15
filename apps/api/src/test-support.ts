import { randomBytes } from 'node:crypto';

import { TEST_DATA_NAME_PREFIX } from '@kairos/types';
import {
  createPrismaClient,
  enableInventoryLedger,
  seedReference,
  type PrismaClient,
} from '@kairos/database';
import { type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { AppModule } from './app.module.js';
import { ApiExceptionFilter } from './common/api-exception.filter.js';
import { GLOBAL_PREFIX_OPTIONS } from './http.js';

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

export async function createCatalogApp(): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.setGlobalPrefix('v1', GLOBAL_PREFIX_OPTIONS);
  app.useGlobalFilters(new ApiExceptionFilter());
  await app.init();
  return app;
}

export type CreatedProduct = {
  id: string;
  slug: string;
  variantId: string | null;
  sku: string | null;
  name: string;
  categorySlug: string;
};

export async function createPublicProduct(
  client: PrismaClient,
  options: {
    name?: string;
    slug?: string;
    categorySlug?: string;
    status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
    price?: number;
    sku?: string;
    inventory?: 'tracked' | 'untracked' | 'missing';
    variants?: 'default' | 'none';
    onHand?: number;
    description?: string | null;
    benefits?: string | null;
    ingredients?: string | null;
    usage?: string | null;
    precautions?: string | null;
    publishedAt?: Date | null;
  } = {},
): Promise<CreatedProduct> {
  const id = suffix();
  const categorySlug = options.categorySlug ?? 'beaute-soins';
  const category = await client.category.findUniqueOrThrow({ where: { slug: categorySlug } });
  const price = options.price ?? 5000;
  const name = options.name ?? `${TEST_DATA_NAME_PREFIX} product ${id}`;
  const slug = options.slug ?? `test-product-${id}`;
  const sku = options.sku ?? `TEST-SKU-${id}`;
  const publishedAt =
    options.publishedAt === undefined
      ? options.status === 'DRAFT'
        ? null
        : new Date()
      : options.publishedAt;

  const product = await client.product.create({
    data: {
      name,
      slug,
      categoryId: category.id,
      status: options.status ?? 'ACTIVE',
      description: options.description ?? null,
      benefits: options.benefits ?? null,
      ingredients: options.ingredients ?? null,
      usage: options.usage ?? null,
      precautions: options.precautions ?? null,
      minPrice: options.variants === 'none' ? null : price,
      maxPrice: options.variants === 'none' ? null : price,
      publishedAt,
    },
  });

  if (options.variants === 'none') {
    return {
      id: product.id,
      slug,
      variantId: null,
      sku: null,
      name,
      categorySlug,
    };
  }

  const variant = await client.productVariant.create({
    data: {
      productId: product.id,
      name: 'Default',
      sku,
      price,
      cost: 42,
      isDefault: true,
    },
  });

  const inventory = options.inventory ?? 'tracked';
  if (inventory !== 'missing') {
    const trackInventory = inventory === 'tracked';
    const onHand = options.onHand ?? (trackInventory ? 3 : 0);
    await client.$transaction(async (tx) => {
      await enableInventoryLedger(tx);
      await tx.inventoryItem.create({
        data: {
          variantId: variant.id,
          trackInventory,
          onHandQty: onHand,
          reservedQty: 0,
          availableQty: onHand,
          // inventory_flags_math: isOutOfStock = (availableQty <= 0) regardless of tracking.
          isOutOfStock: onHand <= 0,
          isLowStock: trackInventory && onHand <= 5,
          lowStockThreshold: 5,
        },
      });
    });
  }

  return {
    id: product.id,
    slug,
    variantId: variant.id,
    sku,
    name,
    categorySlug,
  };
}

export async function deleteProduct(client: PrismaClient, productId: string): Promise<void> {
  await client.product.delete({ where: { id: productId } }).catch(() => undefined);
}

export async function createActiveDelivery(
  client: PrismaClient,
  options: { fee?: number; city?: string } = {},
): Promise<{ zoneId: string; methodId: string; fee: number }> {
  const id = suffix();
  const fee = options.fee ?? 1500;
  const zone = await client.deliveryZone.create({
    data: {
      name: `[TEST] zone ${id}`,
      slug: `test-zone-${id}`,
      city: options.city ?? 'Ouagadougou',
      countryCode: 'BF',
      isActive: true,
      position: 0,
    },
  });
  const method = await client.deliveryMethod.create({
    data: {
      zoneId: zone.id,
      code: `STD-${id.slice(0, 6)}`,
      name: 'Standard',
      fee,
      estimatedMinHours: 24,
      estimatedMaxHours: 72,
      isActive: true,
      position: 0,
    },
  });
  return { zoneId: zone.id, methodId: method.id, fee };
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
