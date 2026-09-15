import { TAX_TREATMENTS } from '@kairos/types';
import { z } from 'zod';

import { cartIntentItemSchema, cartLineIssues, MAX_CART_LINES } from '../cart/index.js';
import { cuidSchema, moneySchema } from '../common/index.js';

export const checkoutIssues = [
  ...cartLineIssues,
  'DELIVERY_UNAVAILABLE',
  'CART_EMPTY',
  'CART_CONVERTED',
  'CART_EXPIRED',
] as const;
export type CheckoutIssueCode = (typeof checkoutIssues)[number];

export const checkoutIssueSchema = z.object({
  code: z.enum(checkoutIssues),
  variantId: z.string().min(1).optional(),
  message: z.string().min(1),
});
export type CheckoutIssue = z.infer<typeof checkoutIssueSchema>;

export const orderTotalsSchema = z.object({
  subtotal: moneySchema,
  discountTotal: moneySchema,
  shippingTotal: moneySchema,
  taxTotal: moneySchema,
  grandTotal: moneySchema,
  taxTreatment: z.enum(TAX_TREATMENTS),
  taxBreakdown: z.array(z.unknown()),
});

export const deliveryDestinationSchema = z.object({
  city: z.string().trim().min(1).max(120),
  neighbourhood: z.string().trim().max(120).optional(),
  region: z.string().trim().max(120).optional(),
  countryCode: z.string().trim().length(2).default('BF'),
  zoneId: cuidSchema.optional(),
});
export type DeliveryDestinationInput = z.infer<typeof deliveryDestinationSchema>;

export const checkoutQuoteRequestSchema = z.object({
  cartId: cuidSchema,
  deliveryMethodId: cuidSchema,
  destination: deliveryDestinationSchema,
});
export type CheckoutQuoteRequest = z.infer<typeof checkoutQuoteRequestSchema>;

export function parseCheckoutQuoteRequest(input: unknown): CheckoutQuoteRequest {
  return checkoutQuoteRequestSchema.parse(input);
}

const contactSchema = z.object({
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(8).max(20),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
});

const addressSchema = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  phone: z.string().trim().min(8).max(20),
  line1: z.string().trim().min(1).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string().trim().min(1).max(120),
  neighbourhood: z.string().trim().max(120).optional(),
  region: z.string().trim().max(120).optional(),
  postalCode: z.string().trim().max(20).optional(),
  countryCode: z.string().trim().length(2).default('BF'),
  instructions: z.string().trim().max(500).optional(),
});

export const placeOrderRequestSchema = z.object({
  cartId: cuidSchema,
  contact: contactSchema,
  shippingAddress: addressSchema,
  deliveryMethodId: cuidSchema,
  customerNote: z.string().trim().max(1000).optional(),
});
export type PlaceOrderRequest = z.infer<typeof placeOrderRequestSchema>;

export function parsePlaceOrderRequest(input: unknown): PlaceOrderRequest {
  return placeOrderRequestSchema.parse(input);
}

export const initiatePaymentRequestSchema = z.object({
  providerKey: z.literal('manual'),
});
export type InitiatePaymentRequest = z.infer<typeof initiatePaymentRequestSchema>;

export function parseInitiatePaymentRequest(input: unknown): InitiatePaymentRequest {
  return initiatePaymentRequestSchema.parse(input);
}

export const claimOrderRequestSchema = z.object({
  token: z.string().min(32).max(128),
  email: z.string().trim().email().max(254),
});
export type ClaimOrderRequest = z.infer<typeof claimOrderRequestSchema>;

export function parseClaimOrderRequest(input: unknown): ClaimOrderRequest {
  return claimOrderRequestSchema.parse(input);
}

export const trackingLookupRequestSchema = z
  .object({
    reference: z.string().trim().min(6).max(40),
    email: z.string().trim().email().max(254).optional(),
    phone: z.string().trim().min(8).max(20).optional(),
  })
  .refine((value) => Boolean(value.email || value.phone), {
    message: 'email or phone is required',
  });
export type TrackingLookupRequest = z.infer<typeof trackingLookupRequestSchema>;

export function parseTrackingLookupRequest(input: unknown): TrackingLookupRequest {
  return trackingLookupRequestSchema.parse(input);
}

export const inventoryAdjustRequestSchema = z.object({
  delta: z.number().int(),
  reason: z.string().trim().min(1).max(500),
});
export type InventoryAdjustRequest = z.infer<typeof inventoryAdjustRequestSchema>;

export function parseInventoryAdjustRequest(input: unknown): InventoryAdjustRequest {
  return inventoryAdjustRequestSchema.parse(input);
}

export const markPaidRequestSchema = z.object({
  note: z.string().trim().max(500).optional(),
});
export type MarkPaidRequest = z.infer<typeof markPaidRequestSchema>;

export function parseMarkPaidRequest(input: unknown): MarkPaidRequest {
  return markPaidRequestSchema.parse(input);
}

/** Re-export so checkout responses can describe intent lines without a second schema. */
export { cartIntentItemSchema, MAX_CART_LINES };
