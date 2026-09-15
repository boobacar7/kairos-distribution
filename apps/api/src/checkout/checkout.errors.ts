export type CheckoutIssue = {
  code: string;
  variantId?: string | undefined;
  message: string;
};

export class CheckoutConflictError extends Error {
  readonly issues: CheckoutIssue[];

  constructor(issues: CheckoutIssue[], message = 'Checkout conflict') {
    super(message);
    this.name = 'CheckoutConflictError';
    this.issues = issues;
  }
}

export class DeliveryUnavailableError extends CheckoutConflictError {
  constructor() {
    super(
      [
        {
          code: 'DELIVERY_UNAVAILABLE',
          message: 'Aucune zone ou tarif de livraison actif n’est disponible.',
        },
      ],
      'Delivery unavailable',
    );
    this.name = 'DeliveryUnavailableError';
  }
}

export class IdempotencyConflictError extends Error {
  readonly code: 'IDEMPOTENCY_KEY_REUSED' | 'IDEMPOTENCY_IN_PROGRESS';

  constructor(code: 'IDEMPOTENCY_KEY_REUSED' | 'IDEMPOTENCY_IN_PROGRESS') {
    super(code);
    this.name = 'IdempotencyConflictError';
    this.code = code;
  }
}

export class GuestClaimRejectedError extends Error {
  constructor() {
    super('guest claim failed');
    this.name = 'GuestClaimRejectedError';
  }
}

export class PaidWithoutStockError extends Error {
  readonly orderId: string;
  readonly reference: string;

  constructor(orderId: string, reference: string) {
    super(`payment captured without stock for ${reference}`);
    this.name = 'PaidWithoutStockError';
    this.orderId = orderId;
    this.reference = reference;
  }
}

export class StockUnavailableError extends Error {
  constructor() {
    super('STOCK_UNAVAILABLE');
    this.name = 'StockUnavailableError';
  }
}
