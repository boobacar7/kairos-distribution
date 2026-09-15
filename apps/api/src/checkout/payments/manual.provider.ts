import {
  asOrderReference,
  type PaymentIntentRequest,
  type PaymentIntentResult,
  type PaymentProvider,
  type PaymentProviderCapabilities,
  type RefundRequest,
  type RefundResult,
  type VerifiedPayment,
} from '@kairos/types/payment';

export class ManualProvider implements PaymentProvider {
  readonly id = 'manual';
  readonly capabilities: PaymentProviderCapabilities = {
    refunds: true,
    partialRefunds: true,
    webhooks: false,
    requiresRedirect: false,
    pollableStatus: false,
  };

  createIntent(req: PaymentIntentRequest): Promise<PaymentIntentResult> {
    return Promise.resolve({
      providerTransactionId: `manual:${req.orderRef}`,
      status: 'PENDING',
    });
  }

  verifyWebhook(): Promise<VerifiedPayment> {
    return Promise.reject(new Error('ManualProvider does not accept webhooks'));
  }

  refund(req: RefundRequest): Promise<RefundResult> {
    return Promise.resolve({
      providerRefundId: `manual-refund:${req.idempotencyKey}`,
      status: 'SUCCEEDED',
      amount: req.amount,
    });
  }
}

export function manualMarkPaidVerified(input: {
  orderRef: string;
  amount: number;
  digest: string;
}): VerifiedPayment {
  return {
    provider: 'manual',
    providerTransactionId: `manual:${input.orderRef}`,
    orderRef: asOrderReference(input.orderRef),
    amount: input.amount as VerifiedPayment['amount'],
    currency: 'XOF',
    status: 'SUCCEEDED',
    rawPayloadDigest: input.digest,
    occurredAt: new Date(),
  };
}
