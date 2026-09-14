import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { createPrismaClient } from './client.js';
import { reserveTrackedStock, withInventoryTransaction } from './inventory.js';
import {
  createCustomer,
  createTrackedVariant,
  disconnectTestPrisma,
  ensureSeeded,
  suffix,
  testPrisma,
} from './test-support.js';

const APP_URL =
  process.env['DATABASE_APP_URL'] ??
  'postgresql://kairos_app:kairos_app@127.0.0.1:5432/kairos_test?schema=public';

describe('role separation', () => {
  beforeAll(async () => {
    await ensureSeeded();
  });

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it('keeps admin privilege off the customer table', async () => {
    const columns = await testPrisma().$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
        FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'customers'
    `;
    const names = columns.map((column) => column.column_name);
    expect(names).not.toContain('role');
    expect(names).not.toContain('mfaSecret');
    expect(names).not.toContain('mfaEnabled');
    expect(names).toContain('emailVerifiedAt');

    const adminColumns = await testPrisma().$queryRaw<Array<{ column_name: string }>>`
      SELECT column_name
        FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'admin_users'
    `;
    expect(adminColumns.map((column) => column.column_name)).toContain('role');
  });

  it('rejects a refresh token that is ambiguous about its population', async () => {
    const customer = await createCustomer(testPrisma());
    await expect(
      testPrisma().refreshToken.create({
        data: {
          audience: 'ADMIN',
          customerId: customer.id,
          tokenHash: `hash-${suffix()}`,
          familyId: suffix(),
          expiresAt: new Date(Date.now() + 60_000),
        },
      }),
    ).rejects.toThrow(/refresh_tokens_subject_xor/);
  });

  it('does not let kairos_app run DDL', async () => {
    const app = createPrismaClient({ url: APP_URL, includeDeleted: true });
    try {
      await expect(
        app.$executeRaw`CREATE TABLE kairos_app_should_not_exist (id int)`,
      ).rejects.toThrow(/permission denied|must be owner/i);
    } finally {
      await app.$disconnect();
    }
  });

  it('does not let kairos_app UPDATE or DELETE append-only stock_movements', async () => {
    const owner = testPrisma();
    const app = createPrismaClient({ url: APP_URL, includeDeleted: true });
    try {
      const { inventoryItemId } = await createTrackedVariant(owner, { onHand: 4 });
      await withInventoryTransaction({ prisma: owner }, async (tx) =>
        reserveTrackedStock(tx, {
          inventoryItemId,
          quantity: 1,
          idempotencyKey: `role-${suffix()}`,
        }),
      );
      const movement = await owner.stockMovement.findFirstOrThrow({
        where: { inventoryItemId },
      });
      await expect(
        app.$executeRaw`UPDATE stock_movements SET reason = 'tamper' WHERE id = ${movement.id}`,
      ).rejects.toThrow();
      await expect(
        app.$executeRaw`DELETE FROM stock_movements WHERE id = ${movement.id}`,
      ).rejects.toThrow();
    } finally {
      await app.$disconnect();
    }
  });
});
