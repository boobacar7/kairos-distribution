export type AddToCartIntent = {
  variantId: string;
  quantity: number;
};

export type AddToCartSeamResult = {
  ok: false;
  code: 'CART_NOT_IMPLEMENTED' | 'INVALID_INTENT';
};

/**
 * Cart seam for the catalogue slice.
 *
 * Architecture defines a server cart (`POST /v1/cart/:id/items` with `{ variantId, quantity }`).
 * That module is not implemented yet. This function is the only add-to-cart entry point on the
 * storefront: it validates the intended payload and refuses to invent a cart, cookie, reservation
 * or stock mutation.
 */
export function prepareAddToCart(intent: AddToCartIntent): AddToCartSeamResult {
  if (!intent.variantId || !Number.isInteger(intent.quantity) || intent.quantity < 1) {
    return { ok: false, code: 'INVALID_INTENT' };
  }
  return { ok: false, code: 'CART_NOT_IMPLEMENTED' };
}
