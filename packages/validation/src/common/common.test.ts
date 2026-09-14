import { describe, expect, it } from 'vitest';

import { moneySchema, paginationSchema, quantitySchema, slugSchema } from './index.js';

describe('moneySchema', () => {
  it('rejects fractional amounts', () => {
    expect(moneySchema.safeParse(1250.5).success).toBe(false);
  });

  it('accepts whole francs', () => {
    expect(moneySchema.parse(12_500)).toBe(12_500);
  });
});

describe('paginationSchema', () => {
  it('applies defaults', () => {
    expect(paginationSchema.parse({})).toEqual({ page: 1, limit: 24 });
  });

  it('caps the page size so a list endpoint cannot be used to dump the table', () => {
    expect(paginationSchema.safeParse({ limit: 5000 }).success).toBe(false);
  });

  it('coerces query-string values', () => {
    expect(paginationSchema.parse({ page: '3', limit: '50' })).toEqual({ page: 3, limit: 50 });
  });
});

describe('slugSchema', () => {
  it('accepts lowercase hyphenated slugs', () => {
    expect(slugSchema.safeParse('beaute-soins').success).toBe(true);
  });

  it('rejects uppercase, spaces and accents', () => {
    expect(slugSchema.safeParse('Beaute Soins').success).toBe(false);
    expect(slugSchema.safeParse('beauté-soins').success).toBe(false);
  });
});

describe('unknown keys', () => {
  it('are stripped rather than passed through', () => {
    const parsed = paginationSchema.parse({ page: 1, limit: 10, total: 999_999 });
    expect(parsed).not.toHaveProperty('total');
  });
});

describe('quantitySchema', () => {
  it('rejects zero and negative quantities', () => {
    expect(quantitySchema.safeParse(0).success).toBe(false);
    expect(quantitySchema.safeParse(-1).success).toBe(false);
  });
});
