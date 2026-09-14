/**
 * Category 1 shared vocabulary — closed domain enums (docs/architecture.md §3.5).
 *
 * Every union here must exist as a Prisma enum with an identical member set, and the parity test
 * that DATABASE_AGENT lands in Phase 2 compares the two in both directions. All members are
 * SCREAMING_SNAKE_CASE on both sides.
 *
 * This file carries the enums the architecture itself depends on, plus the remaining Category 1
 * enums that arrived with the schema. Append-only: removing a member is a PostgreSQL type-swap.
 */

export const ADMIN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ORDER_MANAGER', 'SUPPORT'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ADMIN_USER_STATUSES = ['INVITED', 'ACTIVE', 'SUSPENDED'] as const;
export type AdminUserStatus = (typeof ADMIN_USER_STATUSES)[number];

export const CUSTOMER_STATUSES = ['ACTIVE', 'INACTIVE', 'BLOCKED'] as const;
export type CustomerStatus = (typeof CUSTOMER_STATUSES)[number];

export const PERMISSION_EFFECTS = ['ALLOW', 'DENY'] as const;
export type PermissionEffect = (typeof PERMISSION_EFFECTS)[number];

export const TOKEN_AUDIENCES = ['CUSTOMER', 'ADMIN'] as const;
/** Also the value of the JWT `aud` claim — uppercase, so no mapping layer is needed (§3.5). */
export type TokenAudience = (typeof TOKEN_AUDIENCES)[number];

export const AUTH_TOKEN_TYPES = [
  'PASSWORD_RESET',
  'EMAIL_VERIFICATION',
  'PHONE_VERIFICATION',
  'ADMIN_INVITE',
] as const;
export type AuthTokenType = (typeof AUTH_TOKEN_TYPES)[number];

export const ADDRESS_KINDS = ['SHIPPING', 'BILLING'] as const;
export type AddressKind = (typeof ADDRESS_KINDS)[number];

export const PRODUCT_STATUSES = ['DRAFT', 'ACTIVE', 'ARCHIVED'] as const;
export type ProductStatus = (typeof PRODUCT_STATUSES)[number];

export const COLLECTION_TYPES = ['MANUAL', 'AUTOMATIC'] as const;
export type CollectionType = (typeof COLLECTION_TYPES)[number];

export const RULE_MATCH_MODES = ['ALL', 'ANY'] as const;
export type RuleMatchMode = (typeof RULE_MATCH_MODES)[number];

export const COLLECTION_RULE_FIELDS = [
  'PRICE',
  'CATEGORY',
  'TAG',
  'PROMOTION',
  'FEATURED',
  'STOCK_STATUS',
] as const;
export type CollectionRuleField = (typeof COLLECTION_RULE_FIELDS)[number];

export const RULE_OPERATORS = [
  'EQUALS',
  'NOT_EQUALS',
  'GREATER_THAN',
  'GREATER_THAN_OR_EQUAL',
  'LESS_THAN',
  'LESS_THAN_OR_EQUAL',
  'IN',
  'NOT_IN',
  'CONTAINS',
  'IS_TRUE',
  'IS_FALSE',
] as const;
export type RuleOperator = (typeof RULE_OPERATORS)[number];

export const COLLECTION_MEMBERSHIP_SOURCES = ['MANUAL', 'AUTOMATIC'] as const;
export type CollectionMembershipSource = (typeof COLLECTION_MEMBERSHIP_SOURCES)[number];

export const STOCK_MOVEMENT_TYPES = [
  'SUPPLIER_DELIVERY',
  'MANUAL_ADJUSTMENT',
  'ORDER_RESERVATION',
  'RESERVATION_RELEASE',
  'RESERVATION_EXPIRY',
  'ORDER_FULFILMENT',
  'ORDER_CANCELLATION_RESTOCK',
  'RETURN_RESTOCK',
  'DAMAGE_WRITE_OFF',
  'STOCKTAKE_CORRECTION',
] as const;
export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const STOCK_RESERVATION_STATUSES = ['HELD', 'CONSUMED', 'RELEASED', 'EXPIRED'] as const;
export type StockReservationStatus = (typeof STOCK_RESERVATION_STATUSES)[number];

export const ACTOR_TYPES = ['ADMIN_USER', 'CUSTOMER', 'SYSTEM'] as const;
export type ActorType = (typeof ACTOR_TYPES)[number];

export const CART_STATUSES = ['ACTIVE', 'CONVERTED', 'ABANDONED', 'EXPIRED'] as const;
export type CartStatus = (typeof CART_STATUSES)[number];

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

/**
 * Snapshot on every order. Architecture names this `TaxTreatment`; the data model stores it as
 * `taxMode` / Prisma enum `TaxMode`. Member sets are identical — the parity test maps them.
 */
export const TAX_TREATMENTS = ['INCLUSIVE', 'EXCLUSIVE'] as const;
export type TaxTreatment = (typeof TAX_TREATMENTS)[number];
/** Prisma enum name. Same members as `TAX_TREATMENTS`. */
export const TAX_MODES = TAX_TREATMENTS;
export type TaxMode = TaxTreatment;

export const PAYMENT_STATUSES = [
  'PENDING',
  'REQUIRES_ACTION',
  'AUTHORIZED',
  'PAID',
  'PARTIALLY_REFUNDED',
  'REFUNDED',
  'FAILED',
  'CANCELLED',
] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_TXN_TYPES = [
  'INTENT',
  'AUTHORIZATION',
  'CAPTURE',
  'SALE',
  'REFUND',
  'VOID',
  'CHARGEBACK',
] as const;
export type PaymentTxnType = (typeof PAYMENT_TXN_TYPES)[number];

export const PAYMENT_TXN_STATUSES = [
  'PENDING',
  'REQUIRES_ACTION',
  'SUCCEEDED',
  'FAILED',
  'CANCELLED',
] as const;
export type PaymentTxnStatus = (typeof PAYMENT_TXN_STATUSES)[number];

export const REFUND_STATUSES = [
  'REQUESTED',
  'APPROVED',
  'REJECTED',
  'PROCESSING',
  'COMPLETED',
  'FAILED',
] as const;
export type RefundStatus = (typeof REFUND_STATUSES)[number];

export const DISCOUNT_TYPES = ['PERCENTAGE', 'FIXED_AMOUNT'] as const;
export type DiscountType = (typeof DISCOUNT_TYPES)[number];

export const DISCOUNT_STATUSES = ['DRAFT', 'SCHEDULED', 'ACTIVE', 'PAUSED', 'EXPIRED'] as const;
export type DiscountStatus = (typeof DISCOUNT_STATUSES)[number];

export const DISCOUNT_APPLIES_TO = [
  'ALL_PRODUCTS',
  'SPECIFIC_PRODUCTS',
  'SPECIFIC_COLLECTIONS',
] as const;
export type DiscountAppliesTo = (typeof DISCOUNT_APPLIES_TO)[number];

export const DISCOUNT_CUSTOMER_ELIGIBILITIES = [
  'ALL',
  'SPECIFIC_CUSTOMERS',
  'SPECIFIC_SEGMENTS',
  'FIRST_ORDER_ONLY',
] as const;
export type DiscountCustomerEligibility = (typeof DISCOUNT_CUSTOMER_ELIGIBILITIES)[number];

export const CAMPAIGN_CHANNELS = ['EMAIL', 'SMS', 'ON_SITE'] as const;
export type CampaignChannel = (typeof CAMPAIGN_CHANNELS)[number];

export const CAMPAIGN_STATUSES = ['DRAFT', 'SCHEDULED', 'SENDING', 'SENT', 'CANCELLED'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const REVIEW_STATUSES = ['PENDING_MODERATION', 'APPROVED', 'REJECTED'] as const;
export type ReviewStatus = (typeof REVIEW_STATUSES)[number];

export const CONTENT_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const TEXT_POSITIONS = ['LEFT', 'CENTER', 'RIGHT'] as const;
export type TextPosition = (typeof TEXT_POSITIONS)[number];

export const BANNER_PLACEMENTS = [
  'HOMEPAGE_MID',
  'HOMEPAGE_TOP',
  'CATEGORY_TOP',
  'CART_SIDEBAR',
] as const;
export type BannerPlacement = (typeof BANNER_PLACEMENTS)[number];

export const MEDIA_FOLDERS = ['PRODUCTS', 'BANNERS', 'CATEGORIES', 'REVIEWS', 'SOCIAL'] as const;
export type MediaFolder = (typeof MEDIA_FOLDERS)[number];

export const SEGMENT_TYPES = ['RULE_BASED', 'MANUAL'] as const;
export type SegmentType = (typeof SEGMENT_TYPES)[number];

export const SEGMENT_MEMBERSHIP_SOURCES = ['RULE', 'MANUAL'] as const;
export type SegmentMembershipSource = (typeof SEGMENT_MEMBERSHIP_SOURCES)[number];

export const NOTIFICATION_CHANNELS = ['EMAIL', 'SMS', 'PUSH', 'IN_APP'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNELS)[number];

export const NOTIFICATION_AUDIENCES = ['CUSTOMER', 'ADMIN'] as const;
export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

export const NOTIFICATION_STATUSES = ['QUEUED', 'SENDING', 'SENT', 'FAILED', 'CANCELLED'] as const;
export type NotificationStatus = (typeof NOTIFICATION_STATUSES)[number];

export const OUTBOX_STATUSES = ['PENDING', 'PROCESSING', 'PROCESSED', 'FAILED', 'DEAD'] as const;
export type OutboxStatus = (typeof OUTBOX_STATUSES)[number];

export const IDEMPOTENCY_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'FAILED'] as const;
export type IdempotencyStatus = (typeof IDEMPOTENCY_STATUSES)[number];

export const ANALYTICS_EVENT_TYPES = [
  'PAGE_VIEW',
  'PRODUCT_VIEW',
  'PRODUCT_LIST_VIEW',
  'SEARCH',
  'ADD_TO_CART',
  'REMOVE_FROM_CART',
  'CHECKOUT_STARTED',
  'CHECKOUT_COMPLETED',
] as const;
export type AnalyticsEventType = (typeof ANALYTICS_EVENT_TYPES)[number];
