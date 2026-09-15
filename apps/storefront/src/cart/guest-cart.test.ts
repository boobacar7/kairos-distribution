import { afterEach, describe, expect, it } from 'vitest';

import { prepareAddToCart } from '../catalog/cart-seam';
import {
  GUEST_CART_STORAGE_KEY,
  getGuestCartItems,
  parsePersistedGuestCart,
  reloadGuestCartFromStorageForTests,
  removeGuestCartItem,
  resetGuestCartForTests,
  setGuestCartQuantity,
} from './guest-cart';

afterEach(() => {
  resetGuestCartForTests();
});

describe('parsePersistedGuestCart', () => {
  it('returns an empty cart for malformed persisted data', () => {
    expect(parsePersistedGuestCart(null)).toEqual([]);
    expect(parsePersistedGuestCart('nope')).toEqual([]);
    expect(
      parsePersistedGuestCart({ version: 2, items: [{ variantId: 'v1', quantity: 1 }] }),
    ).toEqual([]);
    expect(parsePersistedGuestCart({ items: [{ variantId: 'v1', quantity: 1 }] })).toEqual([]);
    expect(
      parsePersistedGuestCart({
        version: 1,
        items: [{ variantId: 'v1', quantity: 0, unitPrice: 12 }],
      }),
    ).toEqual([]);
    expect(
      parsePersistedGuestCart({
        version: 1,
        items: [{ variantId: '', quantity: 2 }],
      }),
    ).toEqual([]);
  });

  it('keeps valid lines, merges duplicates, and ignores stored prices', () => {
    expect(
      parsePersistedGuestCart({
        version: 1,
        items: [
          { variantId: 'v1', quantity: 1, unitPrice: 9_999 },
          { variantId: 'v2', quantity: 2 },
          { variantId: 'v1', quantity: 3 },
          { variantId: 'bad', quantity: -1 },
        ],
      }),
    ).toEqual([
      { variantId: 'v1', quantity: 4 },
      { variantId: 'v2', quantity: 2 },
    ]);
  });
});

describe('guest cart mutations', () => {
  it('adds a variant and persists across reload', () => {
    expect(prepareAddToCart({ variantId: 'v1', quantity: 2 })).toEqual({
      ok: true,
      itemCount: 2,
      items: [{ variantId: 'v1', quantity: 2 }],
    });
    expect(JSON.parse(window.localStorage.getItem(GUEST_CART_STORAGE_KEY) ?? '{}')).toEqual({
      version: 1,
      items: [{ variantId: 'v1', quantity: 2 }],
    });

    reloadGuestCartFromStorageForTests();
    expect(getGuestCartItems()).toEqual([{ variantId: 'v1', quantity: 2 }]);
  });

  it('does not create a second line when the same variant is added twice', () => {
    prepareAddToCart({ variantId: 'v1', quantity: 1 });
    const result = prepareAddToCart({ variantId: 'v1', quantity: 2 });
    expect(result).toEqual({
      ok: true,
      itemCount: 3,
      items: [{ variantId: 'v1', quantity: 3 }],
    });
  });

  it('increments and decrements quantity without going below 1', () => {
    prepareAddToCart({ variantId: 'v1', quantity: 2 });
    expect(setGuestCartQuantity('v1', 3).ok).toBe(true);
    expect(getGuestCartItems()[0]?.quantity).toBe(3);
    expect(setGuestCartQuantity('v1', 1).ok).toBe(true);
    expect(getGuestCartItems()[0]?.quantity).toBe(1);
    expect(setGuestCartQuantity('v1', 0).ok).toBe(false);
    expect(getGuestCartItems()[0]?.quantity).toBe(1);
  });

  it('removes a line and can become empty', () => {
    prepareAddToCart({ variantId: 'v1', quantity: 1 });
    prepareAddToCart({ variantId: 'v2', quantity: 1 });
    expect(removeGuestCartItem('v1')).toEqual([{ variantId: 'v2', quantity: 1 }]);
    expect(removeGuestCartItem('v2')).toEqual([]);
  });

  it('rejects an invalid add intent', () => {
    expect(prepareAddToCart({ variantId: '', quantity: 1 }).code).toBe('INVALID_INTENT');
    expect(prepareAddToCart({ variantId: 'v1', quantity: 0 }).code).toBe('INVALID_INTENT');
  });
});
