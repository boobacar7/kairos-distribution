import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { Prisma } from './generated/prisma/client.js';
import {
  allocateOrderReference,
  formatOrderReference,
  ORDER_REFERENCE_SCOPE,
} from './order-reference.js';
import { disconnectTestPrisma, ensureSeeded, suffix, testPrisma } from './test-support.js';

describe('order numbering', () => {
  beforeAll(async () => {
    await ensureSeeded();
  });

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it('allocates unique sequential references under concurrency with no gaps', async () => {
    const prisma = testPrisma();
    const year = 1700 + (parseInt(suffix().slice(0, 4), 16) % 200);
    const n = 20;
    const placedAt = new Date(Date.UTC(year, 0, 1));
    const existing = await prisma.numberSequence.findUnique({
      where: { scope_year: { scope: ORDER_REFERENCE_SCOPE, year } },
    });
    const start = existing?.lastValue ?? 0;

    const refs = await Promise.all(
      Array.from({ length: n }, () =>
        prisma.$transaction((tx) => allocateOrderReference(tx, placedAt), {
          isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        }),
      ),
    );

    expect(new Set(refs).size).toBe(n);
    const sequences = refs.map((ref) => Number(ref.slice(-6))).sort((a, b) => a - b);
    expect(sequences[0]).toBe(start + 1);
    expect(sequences[sequences.length - 1]).toBe(start + n);
    for (let i = 0; i < sequences.length; i += 1) {
      expect(sequences[i]).toBe(start + i + 1);
    }
  });

  it('uses a separate counter per year', async () => {
    const prisma = testPrisma();
    const yearA = 1600 + (parseInt(suffix().slice(0, 3), 16) % 40);
    const yearB = yearA + 1;
    const a = await prisma.$transaction((tx) =>
      allocateOrderReference(tx, new Date(Date.UTC(yearA, 5, 1))),
    );
    const b = await prisma.$transaction((tx) =>
      allocateOrderReference(tx, new Date(Date.UTC(yearB, 0, 1))),
    );
    expect(a.startsWith(`KD-${yearA}-`)).toBe(true);
    expect(b.startsWith(`KD-${yearB}-`)).toBe(true);
  });

  it('returns the number to the pool when the allocating transaction rolls back', async () => {
    const prisma = testPrisma();
    const year = 1500 + (parseInt(suffix().slice(0, 3), 16) % 40);
    const placedAt = new Date(Date.UTC(year, 0, 1));
    const existing = await prisma.numberSequence.findUnique({
      where: { scope_year: { scope: ORDER_REFERENCE_SCOPE, year } },
    });
    const next = (existing?.lastValue ?? 0) + 1;
    const marker = suffix();

    await expect(
      prisma.$transaction(async (tx) => {
        const ref = await allocateOrderReference(tx, placedAt);
        expect(ref).toBe(formatOrderReference(year, next));
        throw new Error(`rollback-${marker}`);
      }),
    ).rejects.toThrow(`rollback-${marker}`);

    const after = await prisma.$transaction((tx) => allocateOrderReference(tx, placedAt));
    expect(after).toBe(formatOrderReference(year, next));
  });
});
