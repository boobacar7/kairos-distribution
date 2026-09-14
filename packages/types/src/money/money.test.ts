import { describe, expect, it } from 'vitest';

import {
  addExclusiveTax,
  allocate,
  applyPercent,
  extractInclusiveTax,
  floorAtZero,
  formatXOF,
  money,
  MoneyError,
  multiply,
  ZERO,
} from './index.js';

describe('money', () => {
  it('rejects fractional amounts because XOF has no minor unit', () => {
    expect(() => money(1250.5)).toThrow(MoneyError);
  });

  it('rejects non-finite amounts', () => {
    expect(() => money(Number.NaN)).toThrow(MoneyError);
    expect(() => money(Number.POSITIVE_INFINITY)).toThrow(MoneyError);
  });

  it('accepts whole francs including zero and negatives', () => {
    expect(money(0)).toBe(0);
    expect(money(12_500)).toBe(12_500);
    expect(money(-500)).toBe(-500);
  });
});

describe('applyPercent', () => {
  it('rounds to the franc', () => {
    expect(applyPercent(money(1000), 15)).toBe(150);
    expect(applyPercent(money(999), 10)).toBe(100);
  });

  it('rounds half away from zero so a refund mirrors its charge', () => {
    expect(applyPercent(money(100), 2.5)).toBe(3);
    expect(applyPercent(money(-100), 2.5)).toBe(-3);
  });

  it('rejects a non-finite percentage', () => {
    expect(() => applyPercent(money(1000), Number.NaN)).toThrow(MoneyError);
  });
});

describe('tax arithmetic', () => {
  it('extracts tax from a tax-inclusive amount rather than adding it', () => {
    // 11 800 gross at 18% contains 1 800 of tax, not 2 124.
    expect(extractInclusiveTax(money(11_800), 18)).toBe(1800);
  });

  it('adds tax on top of a net amount under an exclusive regime', () => {
    expect(addExclusiveTax(money(10_000), 18)).toBe(1800);
  });

  it('returns zero at a zero rate, which is the launch configuration', () => {
    expect(extractInclusiveTax(money(11_800), 0)).toBe(0);
    expect(addExclusiveTax(money(10_000), 0)).toBe(0);
  });

  it('rejects a negative rate', () => {
    expect(() => extractInclusiveTax(money(1000), -5)).toThrow(MoneyError);
  });
});

describe('allocate', () => {
  it('distributes so the parts sum exactly to the whole', () => {
    const parts = allocate(money(100), [1, 1, 1]);
    expect(parts).toEqual([34, 33, 33]);
    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(100);
  });

  it('weights the allocation', () => {
    const parts = allocate(money(1000), [3000, 1000]);
    expect(parts).toEqual([750, 250]);
  });

  it('never loses a franc on an awkward split', () => {
    const parts = allocate(money(1000), [333, 333, 334]);
    expect(parts.reduce((sum, part) => sum + part, 0)).toBe(1000);
  });

  it('returns zeros when every weight is zero', () => {
    expect(allocate(money(500), [0, 0])).toEqual([0, 0]);
  });

  it('handles an empty line set', () => {
    expect(allocate(money(500), [])).toEqual([]);
  });

  it('rejects negative weights', () => {
    expect(() => allocate(money(500), [1, -1])).toThrow(MoneyError);
  });
});

describe('helpers', () => {
  it('floors at zero so a total can never go negative', () => {
    expect(floorAtZero(money(-250))).toBe(ZERO);
    expect(floorAtZero(money(250))).toBe(250);
  });

  it('rejects a fractional quantity', () => {
    expect(() => multiply(money(100), 1.5)).toThrow(MoneyError);
  });

  it('formats for the customer with a non-breaking group separator', () => {
    expect(formatXOF(money(12_500)).replace(/\u202f|\u00a0/g, ' ')).toBe('12 500 FCFA');
    expect(formatXOF(ZERO)).toBe('0 FCFA');
  });
});
