import { CURRENCY, type Money } from '@kairos/types';
import { z } from 'zod';

/**
 * Cross-cutting schemas. Domain schemas live in sibling folders owned by the agent that owns the
 * bounded context (docs/agent-task-map.md), so agents edit disjoint files.
 *
 * The DTO type is always inferred from the schema and exported alongside it. A hand-written type
 * next to a separately maintained validator is the most common source of "validated one shape,
 * used another".
 */

/** A whole number of XOF. Mirrors the `Money` invariant from `@kairos/types`. */
export const moneySchema = z
  .number()
  .int('Amounts are whole XOF — the currency has no minor unit')
  .transform((value) => value as Money);

export const nonNegativeMoneySchema = z
  .number()
  .int('Amounts are whole XOF — the currency has no minor unit')
  .nonnegative()
  .transform((value) => value as Money);

export const currencySchema = z.literal(CURRENCY);

export const cuidSchema = z.string().min(1).max(64);

export const slugSchema = z
  .string()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Must be a lowercase, hyphen-separated slug');

export const quantitySchema = z.number().int().positive().max(999);

/**
 * List pagination with a hard ceiling. Unbounded `limit` is how a list endpoint becomes a
 * denial-of-service vector.
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(24),
});
export type PaginationInput = z.infer<typeof paginationSchema>;

export const sortDirectionSchema = z.enum(['asc', 'desc']).default('desc');
export type SortDirection = z.infer<typeof sortDirectionSchema>;

/**
 * Header required on every endpoint that creates money-bearing state — checkout, payment
 * initiation, refunds, inventory adjustments.
 */
export const idempotencyKeySchema = z.string().min(16).max(128);

/**
 * Fields a client may attempt to send that the server always computes for itself.
 *
 * Zod strips unknown keys by default, so these are stripped already; listing them explicitly
 * gives the trust boundary in docs/route-map.md §4 a single machine-readable home, and lets a
 * test assert that no request schema accidentally accepts one.
 */
export const SERVER_AUTHORITATIVE_FIELDS = [
  'price',
  'unitPrice',
  'subtotal',
  'discountTotal',
  'shippingTotal',
  'taxTotal',
  'grandTotal',
  'total',
  'deliveryFee',
  'tax',
  'taxTreatment',
  'stock',
  'availableQty',
  'reservedQty',
  'role',
  'permissions',
  'isAdmin',
  'status',
  'verified',
  'featured',
] as const;

export type ServerAuthoritativeField = (typeof SERVER_AUTHORITATIVE_FIELDS)[number];
