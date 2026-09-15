import { CURRENCY } from '@kairos/types';
import { z } from 'zod';

import { catalogAvailabilitySchema, catalogMediaSchema } from '../catalog/index.js';
import { moneySchema, quantitySchema } from '../common/index.js';

export const MAX_CART_LINES = 50;

export const cartLineIssues = [
  'VARIANT_UNAVAILABLE',
  'PRODUCT_UNAVAILABLE',
  'MISSING_DEFAULT_VARIANT',
  'MISSING_INVENTORY',
  'OUT_OF_STOCK',
  'PRICE_CHANGED',
  'QUANTITY_REDUCED',
  'COUPON_INVALID',
] as const;
export type CartLineIssue = (typeof cartLineIssues)[number];

export const cartIntentItemSchema = z.object({
  variantId: z.string().min(1).max(64),
  quantity: quantitySchema,
});
export type CartIntentItem = z.infer<typeof cartIntentItemSchema>;

export const cartPreviewRequestSchema = z.object({
  items: z.array(cartIntentItemSchema).max(MAX_CART_LINES),
});
export type CartPreviewRequest = z.infer<typeof cartPreviewRequestSchema>;

export const cartPreviewLineSchema = z.object({
  variantId: z.string().min(1),
  quantity: quantitySchema,
  productId: z.string().min(1).nullable(),
  productSlug: z.string().min(1).nullable(),
  productName: z.string().min(1).nullable(),
  variantName: z.string().min(1).nullable(),
  sku: z.string().min(1).nullable(),
  image: catalogMediaSchema.nullable(),
  unitPrice: moneySchema.nullable(),
  lineSubtotal: moneySchema.nullable(),
  purchasable: z.boolean(),
  availability: catalogAvailabilitySchema,
  issue: z.enum(cartLineIssues).nullable(),
});
export type CartPreviewLine = z.infer<typeof cartPreviewLineSchema>;

export const cartPreviewResponseSchema = z.object({
  currency: z.literal(CURRENCY),
  items: z.array(cartPreviewLineSchema),
  subtotal: moneySchema,
  itemCount: z.number().int().nonnegative(),
});
export type CartPreviewResponse = z.infer<typeof cartPreviewResponseSchema>;

export function parseCartPreviewRequest(input: unknown): CartPreviewRequest {
  return cartPreviewRequestSchema.parse(input);
}

export function parseCartPreviewResponse(input: unknown): CartPreviewResponse {
  return cartPreviewResponseSchema.parse(input);
}

export const createCartRequestSchema = cartPreviewRequestSchema;
export type CreateCartRequest = CartPreviewRequest;

export function parseCreateCartRequest(input: unknown): CreateCartRequest {
  return createCartRequestSchema.parse(input);
}

/** Merge duplicate variant lines and keep request order of first occurrence. */
export function mergeCartIntent(items: readonly CartIntentItem[]): CartIntentItem[] {
  const merged: CartIntentItem[] = [];
  const indexByVariant = new Map<string, number>();
  for (const item of items) {
    const existing = indexByVariant.get(item.variantId);
    if (existing === undefined) {
      indexByVariant.set(item.variantId, merged.length);
      merged.push({ variantId: item.variantId, quantity: item.quantity });
      continue;
    }
    const current = merged[existing];
    if (!current) continue;
    merged[existing] = {
      variantId: current.variantId,
      quantity: Math.min(999, current.quantity + item.quantity),
    };
  }
  return merged;
}
