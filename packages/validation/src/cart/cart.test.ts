import { describe, expect, it } from 'vitest';

import { SERVER_AUTHORITATIVE_FIELDS } from '../common/index.js';
import {
  cartPreviewRequestSchema,
  cartPreviewResponseSchema,
  mergeCartIntent,
  parseCartPreviewRequest,
} from './index.js';

describe('cart preview request', () => {
  it('accepts variant ids and quantities only', () => {
    expect(
      parseCartPreviewRequest({
        items: [
          { variantId: 'v1', quantity: 2 },
          { variantId: 'v2', quantity: 1 },
        ],
      }),
    ).toEqual({
      items: [
        { variantId: 'v1', quantity: 2 },
        { variantId: 'v2', quantity: 1 },
      ],
    });
  });

  it('rejects a zero quantity and an oversized cart', () => {
    expect(() => parseCartPreviewRequest({ items: [{ variantId: 'v1', quantity: 0 }] })).toThrow();
    expect(() =>
      parseCartPreviewRequest({
        items: Array.from({ length: 51 }, (_, index) => ({
          variantId: `v${index}`,
          quantity: 1,
        })),
      }),
    ).toThrow();
  });

  it('strips client-supplied prices so they cannot become the request', () => {
    const parsed = parseCartPreviewRequest({
      items: [
        {
          variantId: 'v1',
          quantity: 2,
          price: 1,
          unitPrice: 1,
          subtotal: 1,
          total: 1,
        },
      ],
      subtotal: 1,
    });
    expect(parsed).toEqual({ items: [{ variantId: 'v1', quantity: 2 }] });
    expect(parsed).not.toHaveProperty('subtotal');
    expect(parsed.items[0]).not.toHaveProperty('price');
    expect(parsed.items[0]).not.toHaveProperty('unitPrice');
    for (const field of ['price', 'unitPrice', 'subtotal', 'total'] as const) {
      expect(SERVER_AUTHORITATIVE_FIELDS).toContain(field);
    }
  });
});

describe('mergeCartIntent', () => {
  it('does not create duplicate lines for the same variant', () => {
    expect(
      mergeCartIntent([
        { variantId: 'v1', quantity: 1 },
        { variantId: 'v2', quantity: 2 },
        { variantId: 'v1', quantity: 3 },
      ]),
    ).toEqual([
      { variantId: 'v1', quantity: 4 },
      { variantId: 'v2', quantity: 2 },
    ]);
  });
});

describe('cart preview response DTO', () => {
  it('never describes a cost field', () => {
    expect(JSON.stringify(cartPreviewRequestSchema)).not.toMatch(/cost/i);
    expect(JSON.stringify(cartPreviewResponseSchema)).not.toMatch(/cost/i);
  });
});
