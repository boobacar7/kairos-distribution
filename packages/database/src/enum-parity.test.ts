import { describe, expect, it } from 'vitest';

import {
  ACTOR_TYPES,
  ADDRESS_KINDS,
  ADMIN_ROLES,
  ADMIN_USER_STATUSES,
  ANALYTICS_EVENT_TYPES,
  AUTH_TOKEN_TYPES,
  BANNER_PLACEMENTS,
  CAMPAIGN_CHANNELS,
  CAMPAIGN_STATUSES,
  CART_STATUSES,
  COLLECTION_MEMBERSHIP_SOURCES,
  COLLECTION_RULE_FIELDS,
  COLLECTION_TYPES,
  CONTENT_STATUSES,
  CUSTOMER_STATUSES,
  DISCOUNT_APPLIES_TO,
  DISCOUNT_CUSTOMER_ELIGIBILITIES,
  DISCOUNT_STATUSES,
  DISCOUNT_TYPES,
  IDEMPOTENCY_STATUSES,
  MEDIA_FOLDERS,
  NOTIFICATION_AUDIENCES,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STATUSES,
  ORDER_PAYMENT_STATUSES,
  ORDER_STATUSES,
  OUTBOX_STATUSES,
  PAYMENT_STATUSES,
  PAYMENT_TXN_STATUSES,
  PAYMENT_TXN_TYPES,
  PERMISSION_EFFECTS,
  PRODUCT_STATUSES,
  REFUND_STATUSES,
  REVIEW_STATUSES,
  RULE_MATCH_MODES,
  RULE_OPERATORS,
  SEGMENT_MEMBERSHIP_SOURCES,
  SEGMENT_TYPES,
  STOCK_MOVEMENT_TYPES,
  STOCK_RESERVATION_STATUSES,
  TAX_TREATMENTS,
  TEXT_POSITIONS,
  TOKEN_AUDIENCES,
} from '@kairos/types';

import * as PrismaEnums from './generated/prisma/enums.js';

function valuesOf(record: Record<string, string>): string[] {
  return Object.values(record).sort();
}

describe('Category 1 enum parity', () => {
  const pairs: Array<[string, readonly string[], Record<string, string>]> = [
    ['AdminRole', ADMIN_ROLES, PrismaEnums.AdminRole],
    ['AdminUserStatus', ADMIN_USER_STATUSES, PrismaEnums.AdminUserStatus],
    ['CustomerStatus', CUSTOMER_STATUSES, PrismaEnums.CustomerStatus],
    ['PermissionEffect', PERMISSION_EFFECTS, PrismaEnums.PermissionEffect],
    ['TokenAudience', TOKEN_AUDIENCES, PrismaEnums.TokenAudience],
    ['AuthTokenType', AUTH_TOKEN_TYPES, PrismaEnums.AuthTokenType],
    ['AddressKind', ADDRESS_KINDS, PrismaEnums.AddressKind],
    ['ProductStatus', PRODUCT_STATUSES, PrismaEnums.ProductStatus],
    ['CollectionType', COLLECTION_TYPES, PrismaEnums.CollectionType],
    ['RuleMatchMode', RULE_MATCH_MODES, PrismaEnums.RuleMatchMode],
    ['CollectionRuleField', COLLECTION_RULE_FIELDS, PrismaEnums.CollectionRuleField],
    ['RuleOperator', RULE_OPERATORS, PrismaEnums.RuleOperator],
    [
      'CollectionMembershipSource',
      COLLECTION_MEMBERSHIP_SOURCES,
      PrismaEnums.CollectionMembershipSource,
    ],
    ['StockMovementType', STOCK_MOVEMENT_TYPES, PrismaEnums.StockMovementType],
    ['StockReservationStatus', STOCK_RESERVATION_STATUSES, PrismaEnums.StockReservationStatus],
    ['ActorType', ACTOR_TYPES, PrismaEnums.ActorType],
    ['CartStatus', CART_STATUSES, PrismaEnums.CartStatus],
    ['OrderStatus', ORDER_STATUSES, PrismaEnums.OrderStatus],
    ['OrderPaymentStatus', ORDER_PAYMENT_STATUSES, PrismaEnums.OrderPaymentStatus],
    ['TaxMode/TaxTreatment', TAX_TREATMENTS, PrismaEnums.TaxMode],
    ['PaymentStatus', PAYMENT_STATUSES, PrismaEnums.PaymentStatus],
    ['PaymentTxnType', PAYMENT_TXN_TYPES, PrismaEnums.PaymentTxnType],
    ['PaymentTxnStatus', PAYMENT_TXN_STATUSES, PrismaEnums.PaymentTxnStatus],
    ['RefundStatus', REFUND_STATUSES, PrismaEnums.RefundStatus],
    ['DiscountType', DISCOUNT_TYPES, PrismaEnums.DiscountType],
    ['DiscountStatus', DISCOUNT_STATUSES, PrismaEnums.DiscountStatus],
    ['DiscountAppliesTo', DISCOUNT_APPLIES_TO, PrismaEnums.DiscountAppliesTo],
    [
      'DiscountCustomerEligibility',
      DISCOUNT_CUSTOMER_ELIGIBILITIES,
      PrismaEnums.DiscountCustomerEligibility,
    ],
    ['CampaignChannel', CAMPAIGN_CHANNELS, PrismaEnums.CampaignChannel],
    ['CampaignStatus', CAMPAIGN_STATUSES, PrismaEnums.CampaignStatus],
    ['ReviewStatus', REVIEW_STATUSES, PrismaEnums.ReviewStatus],
    ['ContentStatus', CONTENT_STATUSES, PrismaEnums.ContentStatus],
    ['TextPosition', TEXT_POSITIONS, PrismaEnums.TextPosition],
    ['BannerPlacement', BANNER_PLACEMENTS, PrismaEnums.BannerPlacement],
    ['MediaFolder', MEDIA_FOLDERS, PrismaEnums.MediaFolder],
    ['SegmentType', SEGMENT_TYPES, PrismaEnums.SegmentType],
    ['SegmentMembershipSource', SEGMENT_MEMBERSHIP_SOURCES, PrismaEnums.SegmentMembershipSource],
    ['NotificationChannel', NOTIFICATION_CHANNELS, PrismaEnums.NotificationChannel],
    ['NotificationAudience', NOTIFICATION_AUDIENCES, PrismaEnums.NotificationAudience],
    ['NotificationStatus', NOTIFICATION_STATUSES, PrismaEnums.NotificationStatus],
    ['OutboxStatus', OUTBOX_STATUSES, PrismaEnums.OutboxStatus],
    ['IdempotencyStatus', IDEMPOTENCY_STATUSES, PrismaEnums.IdempotencyStatus],
    ['AnalyticsEventType', ANALYTICS_EVENT_TYPES, PrismaEnums.AnalyticsEventType],
  ];

  it('matches @kairos/types in both directions for every Category 1 enum', () => {
    for (const [name, typesValues, prismaEnum] of pairs) {
      expect(valuesOf(prismaEnum), name).toEqual([...typesValues].sort());
    }
  });
});
