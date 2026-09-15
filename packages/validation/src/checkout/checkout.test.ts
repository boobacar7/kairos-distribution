import { describe, expect, it } from 'vitest';

import { SERVER_AUTHORITATIVE_FIELDS } from '../common/index.js';
import {
  parseCheckoutQuoteRequest,
  parseInitiatePaymentRequest,
  parsePlaceOrderRequest,
} from './index.js';

describe('checkout request schemas', () => {
  it('strips client money fields from quote and place-order bodies', () => {
    const quote = parseCheckoutQuoteRequest({
      cartId: 'cart1',
      deliveryMethodId: 'method1',
      destination: { city: 'Ouagadougou' },
      shippingTotal: 1,
      grandTotal: 1,
      fee: 1,
    });
    expect(quote).not.toHaveProperty('shippingTotal');
    expect(quote).not.toHaveProperty('grandTotal');
    expect(quote).not.toHaveProperty('fee');

    const placed = parsePlaceOrderRequest({
      cartId: 'cart1',
      deliveryMethodId: 'method1',
      contact: {
        email: 'guest@example.test',
        phone: '+22670000000',
        firstName: 'Awa',
        lastName: 'Kaboré',
      },
      shippingAddress: {
        firstName: 'Awa',
        lastName: 'Kaboré',
        phone: '+22670000000',
        line1: 'Ouaga 2000',
        city: 'Ouagadougou',
      },
      grandTotal: 1,
      subtotal: 1,
      taxTotal: 99,
      status: 'PAID',
    });
    expect(placed).not.toHaveProperty('grandTotal');
    expect(placed).not.toHaveProperty('subtotal');
    expect(placed).not.toHaveProperty('status');
    for (const field of ['grandTotal', 'subtotal', 'taxTotal', 'status'] as const) {
      expect(SERVER_AUTHORITATIVE_FIELDS).toContain(field);
    }
  });

  it('accepts only the manual provider key at initiate', () => {
    expect(parseInitiatePaymentRequest({ providerKey: 'manual' })).toEqual({
      providerKey: 'manual',
    });
    expect(() => parseInitiatePaymentRequest({ providerKey: 'orange' })).toThrow();
    expect(() => parseInitiatePaymentRequest({ providerKey: 'moov' })).toThrow();
    expect(() => parseInitiatePaymentRequest({ providerKey: 'wave' })).toThrow();
    expect(() => parseInitiatePaymentRequest({ providerKey: 'cinetpay' })).toThrow();
    const initiated = parseInitiatePaymentRequest({
      providerKey: 'manual',
      amount: 1,
      grandTotal: 1,
    });
    expect(initiated).toEqual({ providerKey: 'manual' });
    expect(initiated).not.toHaveProperty('amount');
    expect(initiated).not.toHaveProperty('grandTotal');
  });
});
