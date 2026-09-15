'use client';

import { createContext, useContext, useMemo, useSyncExternalStore, type ReactNode } from 'react';

import {
  addGuestCartItem,
  getEmptyGuestCartItems,
  getGuestCartItems,
  guestCartItemCount,
  removeGuestCartItem,
  setGuestCartQuantity,
  subscribeGuestCart,
  type GuestCartItem,
} from './guest-cart';

type CartContextValue = {
  items: GuestCartItem[];
  itemCount: number;
  add: typeof addGuestCartItem;
  setQuantity: typeof setGuestCartQuantity;
  remove: typeof removeGuestCartItem;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const items = useSyncExternalStore(subscribeGuestCart, getGuestCartItems, getEmptyGuestCartItems);
  const itemCount = guestCartItemCount(items);
  const value = useMemo<CartContextValue>(
    () => ({
      items,
      itemCount,
      add: addGuestCartItem,
      setQuantity: setGuestCartQuantity,
      remove: removeGuestCartItem,
    }),
    [items, itemCount],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useOptionalCart(): CartContextValue | null {
  return useContext(CartContext);
}

export function useCart(): CartContextValue {
  const cart = useContext(CartContext);
  if (!cart) {
    throw new Error('useCart requires CartProvider');
  }
  return cart;
}
