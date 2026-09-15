import { describe, expect, it } from 'vitest';
import { money, ZERO } from '@kairos/types/money';

import { hasBlockingIssues, priceCart, type PricingLineInput } from './price-cart.js';

const taxQuote = {
  treatment: 'INCLUSIVE' as const,
  amounts: [],
  total: ZERO,
  providerId: 'zero',
  calculatedAt: new Date(),
};

function line(overrides: Partial<PricingLineInput> = {}): PricingLineInput {
  return {
    variantId: 'v1',
    productId: 'p1',
    productName: 'Crème',
    variantName: 'Default',
    productSlug: 'creme',
    sku: 'SKU',
    quantity: 2,
    unitPrice: money(5000),
    compareAtPrice: null,
    unitPriceAtAdd: 5000,
    availableQty: 5,
    trackInventory: true,
    purchasable: true,
    catalogueIssue: null,
    ...overrides,
  };
}

describe('priceCart', () => {
  it('ignores a client-supplied total by never taking one as input', () => {
    const priced = priceCart({ lines: [line()], shippingTotal: money(1500), taxQuote });
    expect(priced.totals.subtotal).toBe(10_000);
    expect(priced.totals.shippingTotal).toBe(1500);
    expect(priced.totals.taxTotal).toBe(0);
    expect(priced.totals.grandTotal).toBe(11_500);
    expect(priced.totals.discountTotal).toBe(0);
  });

  it('emits PRICE_CHANGED when the live price moved since add', () => {
    const priced = priceCart({
      lines: [line({ unitPriceAtAdd: 4000 })],
      shippingTotal: ZERO,
      taxQuote,
    });
    expect(priced.issues.some((issue) => issue.code === 'PRICE_CHANGED')).toBe(true);
    expect(hasBlockingIssues(priced)).toBe(true);
  });

  it('emits QUANTITY_REDUCED when requested qty exceeds available', () => {
    const priced = priceCart({
      lines: [line({ quantity: 9, availableQty: 2 })],
      shippingTotal: ZERO,
      taxQuote,
    });
    expect(priced.issues[0]?.code).toBe('QUANTITY_REDUCED');
    expect(priced.lines[0]?.purchasable).toBe(false);
  });
});
