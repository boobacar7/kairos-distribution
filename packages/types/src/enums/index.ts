/**
 * Category 1 shared vocabulary — closed domain enums (docs/architecture.md §3.5).
 *
 * Every union here must exist as a Prisma enum with an identical member set, and the parity test
 * that DATABASE_AGENT lands in Phase 2 compares the two in both directions. All members are
 * SCREAMING_SNAKE_CASE on both sides.
 *
 * This file carries the enums the architecture itself depends on. The remaining Category 1 enums
 * arrive with the schema in Phase 2, alongside the parity test — they are DATABASE_AGENT's to add
 * here, append-only.
 */

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'SUPPORT'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const TOKEN_AUDIENCES = ['CUSTOMER', 'ADMIN'] as const;
/** Also the value of the JWT `aud` claim — uppercase, so no mapping layer is needed (§3.5). */
export type TokenAudience = (typeof TOKEN_AUDIENCES)[number];

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'READY_TO_SHIP',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const ORDER_PAYMENT_STATUSES = [
  'UNPAID',
  'PENDING',
  'PAID',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
  'FAILED',
] as const;
export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

export const PAYMENT_TXN_STATUSES = [
  'PENDING',
  'REQUIRES_ACTION',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
] as const;
export type PaymentTxnStatus = (typeof PAYMENT_TXN_STATUSES)[number];

export const REVIEW_STATUSES = ['PENDING_MODERATION', 'APPROVED', 'REJECTED'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const NOTIFICATION_CHANNELS = ['EMAIL', 'SMS', 'PUSH', 'IN_APP'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_AUDIENCES = ['CUSTOMER', 'ADMIN'] as const;
export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const TAX_TREATMENTS = ['INCLUSIVE', 'EXCLUSIVE'] as const;
export type TaxTreatment = (typeof TAX_TREATMENTS)[number];
