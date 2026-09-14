import { type Prisma } from './generated/prisma/client.js';

export const ORDER_REFERENCE_SCOPE = 'ORDER';
export const INVOICE_REFERENCE_SCOPE = 'INVOICE';
export const DEFAULT_ORDER_PREFIX = 'KD';
export const ORDER_COUNTER_WIDTH = 6;
export const ORDER_COUNTER_MAX = 999_999;

export class OrderReferenceOverflowError extends Error {
  constructor(year: number) {
    super(
      `Order reference counter for ${year} would exceed ${ORDER_COUNTER_MAX}; widening the format is a product decision, not an accident`,
    );
    this.name = 'OrderReferenceOverflowError';
  }
}

export function formatOrderReference(
  year: number,
  sequence: number,
  prefix = DEFAULT_ORDER_PREFIX,
): string {
  if (sequence > ORDER_COUNTER_MAX) {
    throw new OrderReferenceOverflowError(year);
  }
  return `${prefix}-${year}-${String(sequence).padStart(ORDER_COUNTER_WIDTH, '0')}`;
}

/**
 * Gapless per-year allocation. Must run inside the order-creation transaction, last,
 * so a rollback returns the number to the pool. ON CONFLICT takes a row lock; under
 * READ COMMITTED the next waiter sees the committed value (data-model.md §6.1).
 *
 * `count(*) + 1` is forbidden: it races and it renumbers history.
 */
export async function allocateSequenceValue(
  tx: Prisma.TransactionClient,
  scope: string,
  year: number,
): Promise<number> {
  const rows = await tx.$queryRaw<Array<{ lastValue: number }>>`
    INSERT INTO number_sequences ("scope", "year", "lastValue", "updatedAt")
    VALUES (${scope}, ${year}, 1, now())
    ON CONFLICT ("scope", "year")
    DO UPDATE SET "lastValue" = number_sequences."lastValue" + 1, "updatedAt" = now()
    RETURNING "lastValue"
  `;
  const value = rows[0]?.lastValue;
  if (value === undefined) {
    throw new Error(`number_sequences returned no row for ${scope}/${year}`);
  }
  if (value > ORDER_COUNTER_MAX) {
    throw new OrderReferenceOverflowError(year);
  }
  return value;
}

export async function allocateOrderReference(
  tx: Prisma.TransactionClient,
  placedAt: Date,
  prefix = DEFAULT_ORDER_PREFIX,
): Promise<string> {
  const year = placedAt.getUTCFullYear();
  const sequence = await allocateSequenceValue(tx, ORDER_REFERENCE_SCOPE, year);
  return formatOrderReference(year, sequence, prefix);
}
