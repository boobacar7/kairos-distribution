import { ZERO } from '@kairos/types/money';
import {
  type TaxProvider,
  type TaxProviderCapabilities,
  type TaxQuote,
  type TaxQuoteRequest,
} from '@kairos/types/tax';

export class ZeroTaxProvider implements TaxProvider {
  readonly id = 'zero';
  readonly capabilities: TaxProviderCapabilities = {
    perJurisdiction: false,
    shippingTaxable: false,
    exemptions: false,
    remote: false,
  };

  quote(request: TaxQuoteRequest): Promise<TaxQuote> {
    return Promise.resolve({
      treatment: 'INCLUSIVE',
      amounts: [],
      total: ZERO,
      providerId: this.id,
      calculatedAt: request.context.occurredAt,
    });
  }
}
