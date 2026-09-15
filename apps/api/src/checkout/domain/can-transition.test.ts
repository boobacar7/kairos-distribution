import { describe, expect, it } from 'vitest';
import { ORDER_STATUS_TRANSITION_RULES } from '@kairos/types/order-status';

import { canTransition } from './can-transition.js';

describe('canTransition', () => {
  it('allows PENDING → CONFIRMED only when payment is verified', () => {
    expect(
      canTransition(ORDER_STATUS_TRANSITION_RULES, 'PENDING', 'CONFIRMED', {
        paymentVerified: false,
      }).ok,
    ).toBe(false);
    expect(
      canTransition(ORDER_STATUS_TRANSITION_RULES, 'PENDING', 'CONFIRMED', {
        paymentVerified: true,
      }).ok,
    ).toBe(true);
  });

  it('does not infer a SHIPPED → CANCELLED edge', () => {
    expect(canTransition(ORDER_STATUS_TRANSITION_RULES, 'SHIPPED', 'CANCELLED', {}).ok).toBe(false);
  });
});
