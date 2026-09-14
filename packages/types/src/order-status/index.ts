import { type OrderStatus } from '../enums/index.js';

/**
 * Expected spec §12 state machine. Seeded into `order_status_transition_rules` and asserted
 * against those rows in CI and at API boot. This constant is test/boot-check data, never a
 * runtime lookup — `apps/api` must not branch on it (docs/data-model.md §6.4.1).
 *
 * Flag assumptions (not silently decided as product policy):
 * - `PENDING → CONFIRMED` is the payment-verified transition (`requiresPayment = true`).
 *   Admin permission is null because `applyVerifiedPayment` performs it, not an admin click.
 * - Other transitions require `orders:update_status`, except refunds which require `orders:refund`.
 * - `PENDING → CANCELLED` releases the reservation (not yet fulfilled).
 * - Cancel/refund after `CONFIRMED` restocks, because fulfilment decrements on-hand at confirm.
 * - `SHIPPED → CANCELLED` is omitted — a shipped order is refunded instead (data-model §11 / §12.1 item 15).
 */
export interface OrderStatusTransitionRuleSpec {
  readonly fromStatus: OrderStatus;
  readonly toStatus: OrderStatus;
  readonly requiresPayment: boolean;
  readonly requiredPermission: string | null;
  readonly releasesReservation: boolean;
  readonly restocksInventory: boolean;
}

export const ORDER_STATUS_TRANSITION_RULES: readonly OrderStatusTransitionRuleSpec[] = [
  {
    fromStatus: 'PENDING',
    toStatus: 'CONFIRMED',
    requiresPayment: true,
    requiredPermission: null,
    releasesReservation: false,
    restocksInventory: false,
  },
  {
    fromStatus: 'PENDING',
    toStatus: 'CANCELLED',
    requiresPayment: false,
    requiredPermission: 'orders:update_status',
    releasesReservation: true,
    restocksInventory: false,
  },
  {
    fromStatus: 'CONFIRMED',
    toStatus: 'PROCESSING',
    requiresPayment: false,
    requiredPermission: 'orders:update_status',
    releasesReservation: false,
    restocksInventory: false,
  },
  {
    fromStatus: 'CONFIRMED',
    toStatus: 'CANCELLED',
    requiresPayment: false,
    requiredPermission: 'orders:update_status',
    releasesReservation: false,
    restocksInventory: true,
  },
  {
    fromStatus: 'CONFIRMED',
    toStatus: 'REFUNDED',
    requiresPayment: false,
    requiredPermission: 'orders:refund',
    releasesReservation: false,
    restocksInventory: true,
  },
  {
    fromStatus: 'PROCESSING',
    toStatus: 'READY_TO_SHIP',
    requiresPayment: false,
    requiredPermission: 'orders:update_status',
    releasesReservation: false,
    restocksInventory: false,
  },
  {
    fromStatus: 'PROCESSING',
    toStatus: 'CANCELLED',
    requiresPayment: false,
    requiredPermission: 'orders:update_status',
    releasesReservation: false,
    restocksInventory: true,
  },
  {
    fromStatus: 'PROCESSING',
    toStatus: 'REFUNDED',
    requiresPayment: false,
    requiredPermission: 'orders:refund',
    releasesReservation: false,
    restocksInventory: true,
  },
  {
    fromStatus: 'READY_TO_SHIP',
    toStatus: 'SHIPPED',
    requiresPayment: false,
    requiredPermission: 'orders:update_status',
    releasesReservation: false,
    restocksInventory: false,
  },
  {
    fromStatus: 'READY_TO_SHIP',
    toStatus: 'CANCELLED',
    requiresPayment: false,
    requiredPermission: 'orders:update_status',
    releasesReservation: false,
    restocksInventory: true,
  },
  {
    fromStatus: 'READY_TO_SHIP',
    toStatus: 'REFUNDED',
    requiresPayment: false,
    requiredPermission: 'orders:refund',
    releasesReservation: false,
    restocksInventory: true,
  },
  {
    fromStatus: 'SHIPPED',
    toStatus: 'DELIVERED',
    requiresPayment: false,
    requiredPermission: 'orders:update_status',
    releasesReservation: false,
    restocksInventory: false,
  },
  {
    fromStatus: 'SHIPPED',
    toStatus: 'REFUNDED',
    requiresPayment: false,
    requiredPermission: 'orders:refund',
    releasesReservation: false,
    restocksInventory: true,
  },
  {
    fromStatus: 'DELIVERED',
    toStatus: 'REFUNDED',
    requiresPayment: false,
    requiredPermission: 'orders:refund',
    releasesReservation: false,
    restocksInventory: true,
  },
];
