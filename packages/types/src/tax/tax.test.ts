import { describe, expect, it } from 'vitest';

import { money, ZERO } from '../money/index.js';
import { areTotalsCoherent, type OrderTotals, shouldDisplayTaxLine } from './index.js';

/** The launch configuration: tax-inclusive prices, zero rate. */
const launchTotals: OrderTotals = {
  subtotal: money(25_000),
  discountTotal: money(2_500),
  shippingTotal: money(1_500),
  taxTotal: ZERO,
  grandTotal: money(24_000),
  taxTreatment: 'INCLUSIVE',
  taxBreakdown: [],
};

describe('the total identity', () => {
  it('holds for the launch configuration', () => {
    expect(areTotalsCoherent(launchTotals)).toBe(true);
  });

  it('catches a total that does not reconcile', () => {
    expect(areTotalsCoherent({ ...launchTotals, grandTotal: money(23_999) })).toBe(false);
  });

  it('does NOT add inclusive tax to the total — that would double-count it', () => {
    // 22 500 net of discount plus 1 500 shipping = 24 000 gross, of which 3 661 is tax.
    const withInclusiveTax: OrderTotals = {
      ...launchTotals,
      taxTotal: money(3_661),
      grandTotal: money(24_000),
      taxBreakdown: [],
    };
    expect(areTotalsCoherent(withInclusiveTax)).toBe(true);
  });

  it('adds exclusive tax on top of the total', () => {
    const exclusive: OrderTotals = {
      ...launchTotals,
      taxTreatment: 'EXCLUSIVE',
      taxTotal: money(4_320),
      grandTotal: money(28_320),
    };
    expect(areTotalsCoherent(exclusive)).toBe(true);
    expect(areTotalsCoherent({ ...exclusive, grandTotal: money(24_000) })).toBe(false);
  });

  it('is identical under both treatments at a zero rate — the reason the seam is cheap now', () => {
    expect(areTotalsCoherent({ ...launchTotals, taxTreatment: 'EXCLUSIVE' })).toBe(true);
  });
});

describe('shouldDisplayTaxLine', () => {
  it('hides the line at launch rather than rendering "TVA 0 FCFA"', () => {
    expect(shouldDisplayTaxLine(launchTotals)).toBe(false);
  });

  it('shows a "dont TVA" memo once inclusive tax is non-zero', () => {
    expect(shouldDisplayTaxLine({ ...launchTotals, taxTotal: money(3_661) })).toBe(true);
  });

  it('always shows the line under an exclusive regime, even at zero', () => {
    expect(shouldDisplayTaxLine({ taxTotal: ZERO, taxTreatment: 'EXCLUSIVE' })).toBe(true);
  });
});
