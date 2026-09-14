import { describe, expect, it } from 'vitest';

import { classifyAvailability, matchesAvailabilityFilter } from './availability.js';

describe('classifyAvailability', () => {
  it('treats a missing inventory row as an explicit inconsistency, not out of stock', () => {
    expect(classifyAvailability(null)).toEqual({
      status: 'UNKNOWN',
      purchasable: false,
      issue: 'MISSING_INVENTORY',
    });
  });

  it('keeps untracked products purchasable even at zero quantity', () => {
    expect(classifyAvailability({ trackInventory: false, availableQty: 0 })).toEqual({
      status: 'UNTRACKED',
      purchasable: true,
      issue: null,
    });
  });

  it('reports genuine tracked stock depletion as out of stock', () => {
    expect(classifyAvailability({ trackInventory: true, availableQty: 0 })).toEqual({
      status: 'OUT_OF_STOCK',
      purchasable: false,
      issue: null,
    });
    expect(classifyAvailability({ trackInventory: true, availableQty: 2 }).status).toBe('IN_STOCK');
  });
});

describe('matchesAvailabilityFilter', () => {
  it('includes untracked products in the in-stock filter', () => {
    const untracked = classifyAvailability({ trackInventory: false, availableQty: 0 });
    expect(matchesAvailabilityFilter(untracked, 'in_stock')).toBe(true);
    expect(matchesAvailabilityFilter(untracked, 'out_of_stock')).toBe(false);
  });

  it('excludes missing inventory from both stock filters', () => {
    const missing = classifyAvailability(null);
    expect(matchesAvailabilityFilter(missing, 'in_stock')).toBe(false);
    expect(matchesAvailabilityFilter(missing, 'out_of_stock')).toBe(false);
    expect(matchesAvailabilityFilter(missing, 'all')).toBe(true);
  });
});
