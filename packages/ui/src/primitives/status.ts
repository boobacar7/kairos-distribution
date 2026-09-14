import type { OrderPaymentStatus, OrderStatus, ProductStatus, ReviewStatus } from '@kairos/types';

import type { BadgeTone } from './Badge.js';

/** Presentational mapping only. Labels stay with the apps so copy is not hardcoded here. */
export const ORDER_STATUS_TONE: Record<OrderStatus, BadgeTone> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PROCESSING: 'brand',
  READY_TO_SHIP: 'brand',
  SHIPPED: 'info',
  DELIVERED: 'success',
  CANCELLED: 'neutral',
  REFUNDED: 'neutral',
};

export const PAYMENT_STATUS_TONE: Record<OrderPaymentStatus, BadgeTone> = {
  UNPAID: 'warning',
  PENDING: 'warning',
  PAID: 'success',
  PARTIALLY_REFUNDED: 'info',
  REFUNDED: 'neutral',
  FAILED: 'danger',
};

export const PRODUCT_STATUS_TONE: Record<ProductStatus, BadgeTone> = {
  DRAFT: 'neutral',
  ACTIVE: 'success',
  ARCHIVED: 'warning',
};

export const REVIEW_STATUS_TONE: Record<ReviewStatus, BadgeTone> = {
  PENDING_MODERATION: 'warning',
  APPROVED: 'success',
  REJECTED: 'danger',
};
