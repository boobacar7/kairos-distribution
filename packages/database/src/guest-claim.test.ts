import { createHash } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  claimGuestOrder,
  generateGuestClaimToken,
  GuestClaimError,
  hashGuestClaimToken,
} from './guest-claim.js';
import {
  createCustomer,
  disconnectTestPrisma,
  ensureSeeded,
  suffix,
  testPrisma,
} from './test-support.js';

async function createGuestOrder(options: {
  token: string;
  expiresAt?: Date;
  deliveredAt?: Date | null;
  reference?: string;
}): Promise<{ id: string; reference: string }> {
  const prisma = testPrisma();
  const id = suffix();
  const reference = options.reference ?? `KD-2026-${id.slice(0, 6)}`;
  const order = await prisma.order.create({
    data: {
      reference,
      email: `guest-${id}@example.test`,
      phone: '+22670000000',
      firstName: 'Guest',
      lastName: 'Order',
      subtotal: 5000,
      grandTotal: 5000,
      deliveryZoneName: 'Ouagadougou',
      deliveryMethodName: 'Standard',
      deliveryFeeSnapshot: 0,
      guestClaimTokenHash: hashGuestClaimToken(options.token),
      guestClaimTokenExpiresAt:
        options.expiresAt ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      deliveredAt: options.deliveredAt ?? null,
    },
  });
  return { id: order.id, reference: order.reference };
}

describe('guest-order security', () => {
  beforeAll(async () => {
    await ensureSeeded();
  });

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it('stores only the SHA-256 hash, never the raw token', async () => {
    const token = generateGuestClaimToken();
    const { id, reference } = await createGuestOrder({ token });
    const row = await testPrisma().order.findUniqueOrThrow({ where: { id } });
    expect(row.guestClaimTokenHash).toBe(hashGuestClaimToken(token));
    expect(row.guestClaimTokenHash).not.toBe(token);
    expect(row.guestClaimTokenHash).not.toBe(createHash('sha256').update(reference).digest('hex'));
    expect(token).not.toBe(reference);
    expect(token.length).toBeGreaterThanOrEqual(43);
  });

  it('cannot be derived from the sequential order reference', async () => {
    const token = generateGuestClaimToken();
    const { reference } = await createGuestOrder({
      token,
      reference: `KD-2026-${suffix()}`,
    });
    expect(hashGuestClaimToken(token)).not.toBe(hashGuestClaimToken(reference));
    expect(hashGuestClaimToken('KD-2026-000043')).not.toBe(hashGuestClaimToken(token));
  });

  it('is single-use: a second claim with the same token fails', async () => {
    const token = generateGuestClaimToken();
    const { id } = await createGuestOrder({ token });
    const customer = await createCustomer(testPrisma(), { verified: true });
    const prisma = testPrisma();

    await prisma.$transaction((tx) =>
      claimGuestOrder(tx, { orderId: id, token, customerId: customer.id }),
    );

    const after = await prisma.order.findUniqueOrThrow({ where: { id } });
    expect(after.customerId).toBe(customer.id);
    expect(after.guestClaimTokenHash).toBeNull();
    expect(after.claimedAt).not.toBeNull();

    const other = await createCustomer(testPrisma(), { verified: true });
    await expect(
      prisma.$transaction((tx) =>
        claimGuestOrder(tx, { orderId: id, token, customerId: other.id }),
      ),
    ).rejects.toBeInstanceOf(GuestClaimError);
  });

  it('rejects claim by an unverified customer (trigger, not just the service)', async () => {
    const token = generateGuestClaimToken();
    const { id } = await createGuestOrder({ token });
    const unverified = await createCustomer(testPrisma(), { verified: false });

    await expect(
      testPrisma().$transaction((tx) =>
        claimGuestOrder(tx, { orderId: id, token, customerId: unverified.id }),
      ),
    ).rejects.toThrow(/email verification/);
  });

  it('rejects an expired token without linking', async () => {
    const token = generateGuestClaimToken();
    const { id } = await createGuestOrder({
      token,
      expiresAt: new Date(Date.now() - 1000),
    });
    const customer = await createCustomer(testPrisma(), { verified: true });
    await expect(
      testPrisma().$transaction((tx) =>
        claimGuestOrder(tx, { orderId: id, token, customerId: customer.id }),
      ),
    ).rejects.toBeInstanceOf(GuestClaimError);
    const row = await testPrisma().order.findUniqueOrThrow({ where: { id } });
    expect(row.customerId).toBeNull();
  });

  it('rejects a wrong token without distinguishing the failure mode', async () => {
    const { id } = await createGuestOrder({ token: generateGuestClaimToken() });
    const customer = await createCustomer(testPrisma(), { verified: true });
    await expect(
      testPrisma().$transaction((tx) =>
        claimGuestOrder(tx, {
          orderId: id,
          token: generateGuestClaimToken(),
          customerId: customer.id,
        }),
      ),
    ).rejects.toBeInstanceOf(GuestClaimError);
  });
});
