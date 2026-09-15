import { type Currency, type Money } from '../money/index.js';
import { type PaymentTxnStatus } from '../enums/index.js';
import { type PaymentProviderId } from '../registry/index.js';

/**
 * PaymentProvider seam — docs/architecture.md §6.1.
 *
 * Adapters live in the API. Domain code never imports a vendor SDK. Checkout implements
 * ManualProvider only; Mobile Money / Stripe adapters are Payment-phase work.
 */

export type OrderReference = string & { readonly __brand: 'OrderReference' };

export function asOrderReference(value: string): OrderReference {
  return value as OrderReference;
}

export interface PaymentCustomer {
  email?: string;
  phone: string;
  firstName: string;
  lastName: string;
}

export interface PaymentIntentRequest {
  orderRef: OrderReference;
  /** Server-computed total. Providers must not receive a client amount. */
  amount: Money;
  currency: Currency;
  customer: PaymentCustomer;
  returnUrl: string;
  idempotencyKey: string;
  metadata: Record<string, string>;
}

export interface PaymentIntentResult {
  providerTransactionId: string;
  status: PaymentTxnStatus;
  redirectUrl?: string;
  /** Never logged, never persisted. */
  clientSecret?: string;
  expiresAt?: Date;
}

export interface VerifiedPayment {
  provider: PaymentProviderId;
  providerTransactionId: string;
  orderRef: OrderReference;
  amount: Money;
  currency: Currency;
  status: Extract<PaymentTxnStatus, 'SUCCEEDED' | 'FAILED' | 'PENDING'>;
  failureCode?: string;
  rawPayloadDigest: string;
  occurredAt: Date;
}

export interface RefundRequest {
  providerTransactionId: string;
  amount: Money;
  reason: string;
  idempotencyKey: string;
}

/** Category 3 seam type. Deliberately NOT the internal RefundStatus workflow enum. */
export type ProviderRefundOutcome = 'SUCCEEDED' | 'PENDING' | 'FAILED';

export interface RefundResult {
  providerRefundId: string;
  status: ProviderRefundOutcome;
  amount: Money;
}

export interface PaymentProviderCapabilities {
  refunds: boolean;
  partialRefunds: boolean;
  webhooks: boolean;
  requiresRedirect: boolean;
  pollableStatus: boolean;
}

export interface PaymentProvider {
  readonly id: PaymentProviderId;
  readonly capabilities: PaymentProviderCapabilities;
  createIntent(req: PaymentIntentRequest): Promise<PaymentIntentResult>;
  /** Verifies signature/authenticity and normalises. MUST throw on an invalid signature. */
  verifyWebhook(rawBody: Uint8Array, headers: Record<string, string>): Promise<VerifiedPayment>;
  /** For providers without webhooks. Optional; ManualProvider does not implement it. */
  fetchStatus?(providerTransactionId: string): Promise<VerifiedPayment>;
  refund?(req: RefundRequest): Promise<RefundResult>;
}
