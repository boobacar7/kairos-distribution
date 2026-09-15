import { type OrderStatus } from '@kairos/types';
import { type OrderStatusTransitionRuleSpec } from '@kairos/types/order-status';

export type TransitionContext = {
  paymentVerified?: boolean;
  permission?: string | null;
  actor?: 'SYSTEM' | 'ADMIN_USER' | 'CUSTOMER';
};

export type TransitionDecision =
  | { ok: true; rule: OrderStatusTransitionRuleSpec }
  | { ok: false; reason: 'forbidden' | 'requires_payment' | 'permission' };

/**
 * Pure lookup over injected rules. No switch, no hardcoded matrix at runtime
 * (data-model.md §6.4.1).
 */
export function canTransition(
  rules: readonly OrderStatusTransitionRuleSpec[],
  from: OrderStatus,
  to: OrderStatus,
  context: TransitionContext,
): TransitionDecision {
  const rule = rules.find(
    (candidate) => candidate.fromStatus === from && candidate.toStatus === to,
  );
  if (!rule) {
    return { ok: false, reason: 'forbidden' };
  }
  if (rule.requiresPayment && !context.paymentVerified) {
    return { ok: false, reason: 'requires_payment' };
  }
  if (rule.requiredPermission && context.actor !== 'SYSTEM') {
    if (context.permission !== rule.requiredPermission) {
      return { ok: false, reason: 'permission' };
    }
  }
  return { ok: true, rule };
}
