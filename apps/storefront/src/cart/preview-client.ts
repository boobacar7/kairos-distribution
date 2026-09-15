import { parseCartPreviewResponse, type CartPreviewResponse } from '@kairos/validation/cart';

import type { GuestCartItem } from './guest-cart';

export class CartPreviewError extends Error {
  constructor() {
    super('CART_PREVIEW_UNAVAILABLE');
    this.name = 'CartPreviewError';
  }
}

export async function previewGuestCart(
  items: readonly GuestCartItem[],
): Promise<CartPreviewResponse> {
  let response: Response;
  try {
    response = await fetch('/api/cart/preview', {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
      cache: 'no-store',
    });
  } catch {
    throw new CartPreviewError();
  }

  if (!response.ok) {
    throw new CartPreviewError();
  }

  try {
    return parseCartPreviewResponse(await response.json());
  } catch {
    throw new CartPreviewError();
  }
}
