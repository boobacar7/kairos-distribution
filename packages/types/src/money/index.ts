/**
 * Money in XOF.
 *
 * XOF is a zero-decimal currency (ISO 4217 minor unit = 0): amounts are whole francs, there are
 * no cents, and floating point never appears in a money calculation. See docs/architecture.md §5.1.
 */

export const CURRENCY = 'XOF' as const;
export type Currency = typeof CURRENCY;

declare const moneyBrand: unique symbol;

/** An integer number of West African CFA francs. */
export type Money = number & { readonly [moneyBrand]: 'XOF' };

export class MoneyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoneyError';
  }
}

/** Construct a Money value. Throws on anything that is not a finite integer. */
export function money(value: number): Money {
  if (!Number.isFinite(value)) {
    throw new MoneyError(`Money must be a finite number, received ${String(value)}`);
  }
  if (!Number.isInteger(value)) {
    throw new MoneyError(
      `Money must be a whole number of XOF — the currency has no minor unit — received ${value}`,
    );
  }
  return value as Money;
}

export const ZERO: Money = money(0);

export function add(...amounts: readonly Money[]): Money {
  return money(amounts.reduce<number>((total, amount) => total + amount, 0));
}

export function subtract(minuend: Money, subtrahend: Money): Money {
  return money(minuend - subtrahend);
}

export function multiply(amount: Money, quantity: number): Money {
  if (!Number.isInteger(quantity)) {
    throw new MoneyError(`Quantity must be an integer, received ${quantity}`);
  }
  return money(amount * quantity);
}

/** Clamp to zero. Totals and allocations may never go negative. */
export function floorAtZero(amount: Money): Money {
  return amount < 0 ? ZERO : amount;
}

/**
 * Round half away from zero.
 *
 * `Math.round` rounds half *up* toward positive infinity, so -0.5 becomes -0 rather than -1, which
 * makes a refund round differently from the charge it reverses. Money must round symmetrically.
 */
function roundHalfAwayFromZero(value: number): number {
  return value < 0 ? -Math.round(-value) : Math.round(value);
}

/**
 * Apply a percentage, rounded to the franc.
 *
 * Rounding happens here, once, and the rounded result is what gets persisted and charged. Totals
 * are never recomputed from percentages after the fact — see docs/architecture.md §5.1.
 */
export function applyPercent(amount: Money, percent: number): Money {
  if (!Number.isFinite(percent)) {
    throw new MoneyError(`Percent must be a finite number, received ${String(percent)}`);
  }
  return money(roundHalfAwayFromZero((amount * percent) / 100));
}

/**
 * Extract the tax contained in a tax-inclusive amount.
 *
 * Under inclusive pricing the displayed amount already contains tax, so tax is
 * `gross × rate / (100 + rate)` rather than `gross × rate / 100`. Getting this backwards
 * overstates tax, which is why it lives here as a named function rather than inline arithmetic.
 */
export function extractInclusiveTax(grossAmount: Money, ratePercent: number): Money {
  if (!Number.isFinite(ratePercent) || ratePercent < 0) {
    throw new MoneyError(`Tax rate must be a non-negative finite number, received ${ratePercent}`);
  }
  if (ratePercent === 0) {
    return ZERO;
  }
  return money(roundHalfAwayFromZero((grossAmount * ratePercent) / (100 + ratePercent)));
}

/** Tax added on top of a net amount, for a future tax-exclusive regime. */
export function addExclusiveTax(netAmount: Money, ratePercent: number): Money {
  if (!Number.isFinite(ratePercent) || ratePercent < 0) {
    throw new MoneyError(`Tax rate must be a non-negative finite number, received ${ratePercent}`);
  }
  return applyPercent(netAmount, ratePercent);
}

/**
 * Distribute an amount across weights so the parts sum exactly to the whole.
 *
 * Used for allocating an order-level discount back to lines. Naive per-line rounding loses or
 * gains francs; the largest-remainder method spends the rounding difference deterministically so
 * the line figures always reconcile with the order figure on an invoice.
 */
export function allocate(amount: Money, weights: readonly number[]): Money[] {
  if (weights.length === 0) {
    return [];
  }
  if (weights.some((weight) => weight < 0)) {
    throw new MoneyError('Allocation weights must be non-negative');
  }

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  if (totalWeight === 0) {
    return weights.map(() => ZERO);
  }

  const exact = weights.map((weight) => (amount * weight) / totalWeight);
  const floored = exact.map((value) => Math.floor(value));
  let remainder = amount - floored.reduce((sum, value) => sum + value, 0);

  const order = exact
    .map((value, index) => ({ index, fraction: value - Math.floor(value) }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);

  const result = [...floored];
  for (const { index } of order) {
    if (remainder <= 0) break;
    result[index] = (result[index] ?? 0) + 1;
    remainder -= 1;
  }

  return result.map((value) => money(value));
}

const XOF_FORMATTER = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 });

/** Customer-facing formatting: `12 500 FCFA`. Used identically by the API and both frontends. */
export function formatXOF(amount: Money): string {
  return `${XOF_FORMATTER.format(amount)} FCFA`;
}
