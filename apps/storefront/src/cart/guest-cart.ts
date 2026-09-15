import { MAX_CART_LINES, mergeCartIntent, type CartIntentItem } from '@kairos/validation/cart';

export const GUEST_CART_STORAGE_KEY = 'kairos.guest-cart.v1';

export type GuestCartItem = CartIntentItem;

const EMPTY: GuestCartItem[] = [];

type Listener = () => void;

let snapshot: GuestCartItem[] = EMPTY;
let hydrated = false;
const listeners = new Set<Listener>();

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emit(): void {
  for (const listener of listeners) {
    listener();
  }
}

export function parsePersistedGuestCart(raw: unknown): GuestCartItem[] {
  if (raw === null || typeof raw !== 'object') return [];
  const record = raw as Record<string, unknown>;
  if (record.version !== 1 || !Array.isArray(record.items)) return [];

  const parsed: GuestCartItem[] = [];
  for (const entry of record.items) {
    if (entry === null || typeof entry !== 'object') continue;
    const item = entry as Record<string, unknown>;
    if (typeof item.variantId !== 'string' || item.variantId.trim() === '') continue;
    if (item.variantId.length > 64) continue;
    if (!Number.isInteger(item.quantity) || (item.quantity as number) < 1) continue;
    parsed.push({
      variantId: item.variantId.trim(),
      quantity: Math.min(999, item.quantity as number),
    });
  }

  return mergeCartIntent(parsed).slice(0, MAX_CART_LINES);
}

function readStorage(): GuestCartItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(GUEST_CART_STORAGE_KEY);
    if (!raw) return [];
    return parsePersistedGuestCart(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

function writeStorage(items: GuestCartItem[]): void {
  if (!canUseStorage()) return;
  try {
    window.localStorage.setItem(GUEST_CART_STORAGE_KEY, JSON.stringify({ version: 1, items }));
  } catch {
    // Persistence is best-effort; in-memory state still drives the session.
  }
}

function hydrate(): void {
  if (hydrated) return;
  hydrated = true;
  const loaded = readStorage();
  snapshot = loaded.length === 0 ? EMPTY : loaded;
}

function setSnapshot(items: GuestCartItem[]): void {
  snapshot = items.length === 0 ? EMPTY : items;
  writeStorage(snapshot === EMPTY ? [] : snapshot);
  emit();
}

export function subscribeGuestCart(listener: Listener): () => void {
  hydrate();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getGuestCartItems(): GuestCartItem[] {
  hydrate();
  return snapshot;
}

export function getEmptyGuestCartItems(): GuestCartItem[] {
  return EMPTY;
}

export function guestCartItemCount(items: readonly GuestCartItem[] = getGuestCartItems()): number {
  return items.reduce((total, item) => total + item.quantity, 0);
}

export function addGuestCartItem(
  variantId: string,
  quantity: number,
): { ok: true; items: GuestCartItem[] } | { ok: false; code: 'INVALID_INTENT' } {
  if (!variantId || !Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, code: 'INVALID_INTENT' };
  }
  hydrate();
  const merged = mergeCartIntent([...snapshot, { variantId, quantity }]);
  if (merged.length > MAX_CART_LINES) {
    return { ok: false, code: 'INVALID_INTENT' };
  }
  setSnapshot(merged);
  return { ok: true, items: merged };
}

export function setGuestCartQuantity(
  variantId: string,
  quantity: number,
): { ok: true; items: GuestCartItem[] } | { ok: false; code: 'INVALID_INTENT' } {
  if (!variantId || !Number.isInteger(quantity) || quantity < 1) {
    return { ok: false, code: 'INVALID_INTENT' };
  }
  hydrate();
  const next = snapshot.map((item) =>
    item.variantId === variantId ? { variantId, quantity: Math.min(999, quantity) } : item,
  );
  if (next.every((item, index) => item === snapshot[index])) {
    return { ok: false, code: 'INVALID_INTENT' };
  }
  setSnapshot(next);
  return { ok: true, items: next };
}

export function removeGuestCartItem(variantId: string): GuestCartItem[] {
  hydrate();
  setSnapshot(snapshot.filter((item) => item.variantId !== variantId));
  return snapshot;
}

export function resetGuestCartForTests(): void {
  if (canUseStorage()) {
    window.localStorage.removeItem(GUEST_CART_STORAGE_KEY);
  }
  snapshot = EMPTY;
  hydrated = false;
  emit();
}

export function reloadGuestCartFromStorageForTests(): void {
  hydrated = false;
  snapshot = EMPTY;
}
