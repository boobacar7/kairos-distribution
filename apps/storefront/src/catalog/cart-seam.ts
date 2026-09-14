import { addGuestCartItem, guestCartItemCount, type GuestCartItem } from '../cart/guest-cart';

export type AddToCartIntent = {
  variantId: string;
  quantity: number;
};

export type AddToCartResult =
  { ok: true; itemCount: number; items: GuestCartItem[] } | { ok: false; code: 'INVALID_INTENT' };

/**
 * Add-to-cart entry for the storefront.
 *
 * Persists `{ variantId, quantity }` only (no prices). Catalogue price and availability
 * are reconciled by `POST /v1/cart/preview`. Does not reserve stock or create an order.
 * The payload shape is the same as a future server cart item write.
 */
export function prepareAddToCart(intent: AddToCartIntent): AddToCartResult {
  const result = addGuestCartItem(intent.variantId, intent.quantity);
  if (!result.ok) return result;
  return { ok: true, itemCount: guestCartItemCount(result.items), items: result.items };
}
