import { describe, expect, it } from 'vitest';
import { money } from '@kairos/types/money';

import {
  countItems,
  previewCartLine,
  sumPurchasableSubtotal,
  type CartVariantRow,
} from './preview.js';

function variant(overrides: Partial<CartVariantRow> = {}): CartVariantRow {
  return {
    id: 'v1',
    name: 'Default',
    sku: 'SKU-1',
    price: 5000,
    isActive: true,
    deletedAt: null,
    inventoryItem: { trackInventory: true, availableQty: 4 },
    product: {
      id: 'p1',
      slug: 'creme',
      name: 'Crème',
      status: 'ACTIVE',
      deletedAt: null,
      images: [],
      variants: [{ id: 'v1', isDefault: true, isActive: true, deletedAt: null }],
    },
    ...overrides,
  };
}

describe('previewCartLine', () => {
  it('prices a tracked in-stock variant from the catalogue row, not a client figure', () => {
    const line = previewCartLine({ variantId: 'v1', quantity: 2 }, variant(), {
      hideTestProducts: false,
    });
    expect(line.purchasable).toBe(true);
    expect(line.unitPrice).toBe(money(5000));
    expect(line.lineSubtotal).toBe(money(10_000));
    expect(line.issue).toBeNull();
    expect(line.availability.status).toBe('IN_STOCK');
  });

  it('keeps untracked inventory purchasable even at quantity zero', () => {
    const line = previewCartLine(
      { variantId: 'v1', quantity: 1 },
      variant({ inventoryItem: { trackInventory: false, availableQty: 0 } }),
      { hideTestProducts: false },
    );
    expect(line.purchasable).toBe(true);
    expect(line.availability.status).toBe('UNTRACKED');
    expect(line.lineSubtotal).toBe(money(5000));
  });

  it('does not treat tracked quantity <= 0 as purchasable', () => {
    const line = previewCartLine(
      { variantId: 'v1', quantity: 1 },
      variant({ inventoryItem: { trackInventory: true, availableQty: 0 } }),
      { hideTestProducts: false },
    );
    expect(line.purchasable).toBe(false);
    expect(line.issue).toBe('OUT_OF_STOCK');
    expect(line.availability.status).toBe('OUT_OF_STOCK');
    expect(line.unitPrice).toBe(money(5000));
    expect(line.lineSubtotal).toBeNull();
  });

  it('never silently marks missing inventory as available', () => {
    const line = previewCartLine(
      { variantId: 'v1', quantity: 1 },
      variant({ inventoryItem: null }),
      { hideTestProducts: false },
    );
    expect(line.purchasable).toBe(false);
    expect(line.issue).toBe('MISSING_INVENTORY');
    expect(line.availability).toEqual({
      status: 'UNKNOWN',
      purchasable: false,
      issue: 'MISSING_INVENTORY',
    });
    expect(line.lineSubtotal).toBeNull();
  });

  it('marks a missing default variant as UNKNOWN and not purchasable', () => {
    const row = variant({
      product: {
        id: 'p1',
        slug: 'creme',
        name: 'Crème',
        status: 'ACTIVE',
        deletedAt: null,
        images: [],
        variants: [{ id: 'v1', isDefault: false, isActive: true, deletedAt: null }],
      },
    });
    const line = previewCartLine({ variantId: 'v1', quantity: 1 }, row, {
      hideTestProducts: false,
    });
    expect(line.purchasable).toBe(false);
    expect(line.issue).toBe('MISSING_DEFAULT_VARIANT');
    expect(line.availability.issue).toBe('MISSING_DEFAULT_VARIANT');
    expect(line.unitPrice).toBeNull();
    expect(line.lineSubtotal).toBeNull();
  });

  it('treats a missing, deleted, or inactive variant as unavailable', () => {
    expect(
      previewCartLine({ variantId: 'gone', quantity: 1 }, undefined, { hideTestProducts: false })
        .issue,
    ).toBe('VARIANT_UNAVAILABLE');
    expect(
      previewCartLine(
        { variantId: 'v1', quantity: 1 },
        variant({ deletedAt: new Date(), isActive: false }),
        { hideTestProducts: false },
      ).issue,
    ).toBe('VARIANT_UNAVAILABLE');
    expect(
      previewCartLine({ variantId: 'v1', quantity: 1 }, variant({ isActive: false }), {
        hideTestProducts: false,
      }).issue,
    ).toBe('VARIANT_UNAVAILABLE');
  });

  it('does not include non-purchasable lines in the cart subtotal', () => {
    const ok = previewCartLine({ variantId: 'v1', quantity: 2 }, variant(), {
      hideTestProducts: false,
    });
    const oos = previewCartLine(
      { variantId: 'v1', quantity: 1 },
      variant({ inventoryItem: { trackInventory: true, availableQty: 0 } }),
      { hideTestProducts: false },
    );
    expect(sumPurchasableSubtotal([ok, oos])).toBe(money(10_000));
    expect(countItems([ok, oos])).toBe(3);
  });
});
