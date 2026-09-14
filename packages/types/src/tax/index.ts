import { type Currency, type Money } from '../money/index.js';
import { type TaxTreatment } from '../enums/index.js';

/**
 * The tax seam — docs/architecture.md §5.6.
 *
 * Kairos launches with tax-inclusive prices and `tax = 0`, but the order financial model carries
 * all five fields explicitly so country-specific taxation can be introduced later without
 * reshaping orders, checkout, payments or invoices.
 *
 * The reason this is cheap to build now: inclusive and exclusive tax are different arithmetic —
 * one extracts tax from the total, the other adds it — but at a zero rate they are numerically
 * identical. The shape can therefore be fixed and exercised today while the branches are
 * indistinguishable.
 *
 * `ZeroTaxProvider` is a real implementation of this interface, not a special case. That is what
 * makes "zero-tax configuration" and "future per-country rule set" the same code path: there is no
 * `if (taxEnabled)` anywhere for a later implementation to unpick.
 */

/** Category 2 registry key (§3.5): backed by seeded rows, not an enum, so rates are configurable. */
export type TaxCode = string;

/** Reserved line identifier for the delivery charge, which may itself be taxable. */
export const SHIPPING_LINE_ID = 'SHIPPING' as const;

export interface TaxContext {
  destination: { countryCode: string; region?: string; city?: string };
  origin: { countryCode: string };
  customerTaxStatus: 'CONSUMER' | 'BUSINESS';
  customerTaxId?: string;
  /** Rules are time-versioned: an order is taxed by the rules in force when it was placed. */
  occurredAt: Date;
  currency: Currency;
}

export interface TaxableLine {
  lineId: string;
  taxCode: TaxCode | null;
  /** Line amount AFTER discount allocation — tax is always computed on the post-discount base. */
  amount: Money;
  quantity: number;
}

export interface TaxAmount {
  lineId: string;
  /** e.g. `BF`, or a sub-national code if a jurisdiction ever requires one. */
  jurisdiction: string;
  /** Appears verbatim on the invoice. */
  taxName: string;
  ratePercent: number;
  taxableBase: Money;
  /** Already rounded to the franc. This is the charged figure. */
  amount: Money;
}

export interface TaxQuote {
  treatment: TaxTreatment;
  /** Empty under ZeroTaxProvider. */
  amounts: readonly TaxAmount[];
  total: Money;
  providerId: string;
  calculatedAt: Date;
}

export interface TaxQuoteRequest {
  context: TaxContext;
  lines: readonly TaxableLine[];
}

export interface TaxProviderCapabilities {
  perJurisdiction: boolean;
  shippingTaxable: boolean;
  exemptions: boolean;
  remote: boolean;
}

export interface TaxProvider {
  readonly id: string;
  readonly capabilities: TaxProviderCapabilities;
  quote(request: TaxQuoteRequest): Promise<TaxQuote>;
}

/**
 * The one money shape.
 *
 * Used identically by the priced cart, the checkout quote, order detail, admin order views, the
 * invoice and analytics. Shape stability across a future tax change comes from there being one
 * type, not five.
 */
export interface OrderTotals {
  /** Sum of line amounts as displayed to the customer — gross under inclusive pricing. */
  subtotal: Money;
  /** Positive. */
  discountTotal: Money;
  shippingTotal: Money;
  /** Zero at launch. Under INCLUSIVE this is a memo, not an addend — see `assertTotalsCoherent`. */
  taxTotal: Money;
  grandTotal: Money;
  /** Snapshotted onto the order so a historical total is never ambiguous after a regime change. */
  taxTreatment: TaxTreatment;
  /** Empty at launch. */
  taxBreakdown: readonly TaxAmount[];
}

/**
 * The total identity, which differs by treatment:
 *
 *   INCLUSIVE  grandTotal = subtotal - discountTotal + shippingTotal   (tax is inside the total)
 *   EXCLUSIVE  grandTotal = subtotal - discountTotal + shippingTotal + taxTotal
 *
 * Both hold today because `taxTotal` is zero. Mirrors the database CHECK constraint so the same
 * rule is enforced in the domain and in the schema.
 */
export function expectedGrandTotal(
  totals: Pick<
    OrderTotals,
    'subtotal' | 'discountTotal' | 'shippingTotal' | 'taxTotal' | 'taxTreatment'
  >,
): number {
  const base = totals.subtotal - totals.discountTotal + totals.shippingTotal;
  return totals.taxTreatment === 'EXCLUSIVE' ? base + totals.taxTotal : base;
}

export function areTotalsCoherent(totals: OrderTotals): boolean {
  return totals.grandTotal === expectedGrandTotal(totals);
}

/**
 * Whether the customer-facing UI should render a tax line.
 *
 * A "TVA 0 FCFA" row at launch is noise. Under inclusive pricing with a non-zero rate the French
 * convention is a "dont TVA X FCFA" memo line, which this still permits.
 */
export function shouldDisplayTaxLine(
  totals: Pick<OrderTotals, 'taxTotal' | 'taxTreatment'>,
): boolean {
  return totals.taxTotal > 0 || totals.taxTreatment === 'EXCLUSIVE';
}
