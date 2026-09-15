/**
 * Category 2 shared vocabulary — open registry keys (docs/architecture.md §3.5).
 *
 * These are `String` columns backed by seeded configuration rows, deliberately not database enums
 * so that adding a provider, template or segment is a row rather than a migration. That is what
 * makes the provider abstraction real: a new payment provider is one adapter file plus one row.
 *
 * Guarded by the seeded-key parity test, not the enum-parity test: every constant here must exist
 * as a row, and every system row must exist here.
 */

/** Payment provider keys — `lower_snake_case`, matching `PaymentProviderConfig.key`. */
export const PAYMENT_PROVIDER_KEYS = ['manual', 'mobile_money', 'stripe'] as const;
export type PaymentProviderKey = (typeof PAYMENT_PROVIDER_KEYS)[number];

/**
 * Open on purpose: adding a provider must not require editing this union.
 * Category 3 seam type — excluded from both parity tests.
 */
export type PaymentProviderId = PaymentProviderKey | (string & {});

/** Storage provider keys for the media abstraction. */
export const STORAGE_PROVIDER_KEYS = ['local', 'cloudinary', 's3'] as const;
export type StorageProviderKey = (typeof STORAGE_PROVIDER_KEYS)[number];

/** Notification template ids — `dot.lower.case`, matching `NotificationTemplate` rows. */
export const NOTIFICATION_TEMPLATE_IDS = [
  'order.created',
  'order.payment_confirmed',
  'order.confirmed',
  'order.shipped',
  'order.delivered',
  'order.cancelled',
  'admin.new_order',
  'admin.low_stock',
  'admin.out_of_stock',
  'admin.review_pending',
  'admin.payment_failed',
  'admin.refund_requested',
] as const;
export type NotificationTemplateId = (typeof NOTIFICATION_TEMPLATE_IDS)[number];

/**
 * System customer segments — spec §23, confirmed by Bob 2026-09-14.
 *
 * SCREAMING_SNAKE_CASE because the specification writes them that way. Admins may create further
 * segments freely; these five are seeded with `isSystem = true`, are not deletable, and their keys
 * are immutable — otherwise renaming one would break every rule that references it.
 */
export const SYSTEM_CUSTOMER_SEGMENT_KEYS = [
  'VIP',
  'LOYAL',
  'NEW_CUSTOMER',
  'INACTIVE',
  'HIGH_VALUE',
] as const;
export type SystemCustomerSegmentKey = (typeof SYSTEM_CUSTOMER_SEGMENT_KEYS)[number];

/**
 * Setting keys holding the segment thresholds.
 *
 * Bob's confirmed decision §5 requires thresholds to be configurable rather than hard-coded, so
 * the rule engine reads these settings and "VIP means 200 000 XOF" is an admin edit, not a deploy.
 * The values live in the database; only the keys and their defaults live in code.
 */
export const SEGMENT_THRESHOLD_SETTING_KEYS = {
  VIP_MIN_TOTAL_SPENT_XOF: 'segments.vip.minTotalSpentXof',
  LOYAL_MIN_ORDER_COUNT: 'segments.loyal.minOrderCount',
  NEW_CUSTOMER_MAX_ACCOUNT_AGE_DAYS: 'segments.newCustomer.maxAccountAgeDays',
  INACTIVE_MIN_DAYS_SINCE_LAST_ORDER: 'segments.inactive.minDaysSinceLastOrder',
  HIGH_VALUE_MIN_TOTAL_SPENT_XOF: 'segments.highValue.minTotalSpentXof',
} as const;

/** Seed values, not constants: these are what the settings rows start at. */
export const SEGMENT_THRESHOLD_DEFAULTS = {
  [SEGMENT_THRESHOLD_SETTING_KEYS.VIP_MIN_TOTAL_SPENT_XOF]: 200_000,
  [SEGMENT_THRESHOLD_SETTING_KEYS.LOYAL_MIN_ORDER_COUNT]: 5,
  [SEGMENT_THRESHOLD_SETTING_KEYS.NEW_CUSTOMER_MAX_ACCOUNT_AGE_DAYS]: 30,
  [SEGMENT_THRESHOLD_SETTING_KEYS.INACTIVE_MIN_DAYS_SINCE_LAST_ORDER]: 90,
  [SEGMENT_THRESHOLD_SETTING_KEYS.HIGH_VALUE_MIN_TOTAL_SPENT_XOF]: 100_000,
} as const;

/** Inventory settings. The reservation TTL is 15 minutes (confirmed §6), held as configuration. */
export const INVENTORY_SETTING_KEYS = {
  RESERVATION_TTL_MINUTES: 'inventory.reservationTtlMinutes',
  DEFAULT_LOW_STOCK_THRESHOLD: 'inventory.defaultLowStockThreshold',
  PAYMENT_PENDING_HOLD_MINUTES: 'inventory.paymentPendingHoldMinutes',
  RESERVATION_ABSOLUTE_CAP_MINUTES: 'inventory.reservationAbsoluteCapMinutes',
} as const;

export const INVENTORY_SETTING_DEFAULTS = {
  [INVENTORY_SETTING_KEYS.RESERVATION_TTL_MINUTES]: 15,
  [INVENTORY_SETTING_KEYS.DEFAULT_LOW_STOCK_THRESHOLD]: 5,
  /** Interactive pending cap (Kairos rule). Independent of any provider invoice TTL. */
  [INVENTORY_SETTING_KEYS.PAYMENT_PENDING_HOLD_MINUTES]: 60,
  /** Absolute stock hold from placement. Never null, never infinite. */
  [INVENTORY_SETTING_KEYS.RESERVATION_ABSOLUTE_CAP_MINUTES]: 60,
} as const;

export const CART_SETTING_KEYS = {
  TTL_DAYS: 'cart.ttlDays',
} as const;

export const CART_SETTING_DEFAULTS = {
  [CART_SETTING_KEYS.TTL_DAYS]: 30,
} as const;

export const ORDER_SETTING_KEYS = {
  REFERENCE_PREFIX: 'orders.referencePrefix',
  GUEST_CLAIM_TOKEN_TTL_DAYS: 'orders.guestClaimTokenTtlDays',
} as const;

export const ORDER_SETTING_DEFAULTS = {
  [ORDER_SETTING_KEYS.REFERENCE_PREFIX]: 'KD',
  /** Confirmed 2026-09-14: claim tokens expire after 30 days. */
  [ORDER_SETTING_KEYS.GUEST_CLAIM_TOKEN_TTL_DAYS]: 30,
} as const;

export const TAX_SETTING_KEYS = {
  DEFAULT_ZONE_KEY: 'tax.defaultZoneKey',
  DEFAULT_MODE: 'tax.defaultMode',
} as const;

export const TAX_SETTING_DEFAULTS = {
  [TAX_SETTING_KEYS.DEFAULT_ZONE_KEY]: 'BF',
  [TAX_SETTING_KEYS.DEFAULT_MODE]: 'INCLUSIVE',
} as const;

/** Spec §5 homepage sections, seeded in this order. */
export const HOMEPAGE_SECTION_KEYS = [
  'HERO',
  'TRUST_BAR',
  'CATEGORIES',
  'PRODUITS_PHARES',
  'INCONTOURNABLES',
  'AVIS_VERIFIES',
  'PROMO_BANNER',
  'TESTIMONIALS',
  'FAQ',
] as const;
export type HomepageSectionKey = (typeof HOMEPAGE_SECTION_KEYS)[number];

/** Spec §4 / §25 static page slugs. Seeded DRAFT with empty body — copy is Bob's. */
export const STATIC_PAGE_SLUGS = [
  'faq',
  'livraison',
  'retours',
  'confidentialite',
  'conditions',
  'contact',
] as const;
export type StaticPageSlug = (typeof STATIC_PAGE_SLUGS)[number];

/** Spec §7 category slugs. Names are seeded verbatim; descriptions stay empty. */
export const CATEGORY_SEEDS = [
  { slug: 'beaute-soins', name: 'Beauté & soins' },
  { slug: 'silhouette-bien-etre', name: 'Silhouette & bien-être' },
  { slug: 'boost-fessier', name: 'Boost fessier' },
  { slug: 'thes-infusions', name: 'Thés & infusions' },
  { slug: 'capsules', name: 'Capsules' },
  { slug: 'packs', name: 'Packs' },
  { slug: 'promotions', name: 'Promotions' },
] as const;

/**
 * Reserved name prefix for demo catalogue data (confirmed §8).
 *
 * Permitted in development and demo environments only. The API rejects it when
 * NODE_ENV=production and a nightly invariant asserts zero such rows there.
 */
export const TEST_DATA_NAME_PREFIX = '[TEST]';

export function isTestDataName(name: string): boolean {
  return name.trimStart().startsWith(TEST_DATA_NAME_PREFIX);
}
