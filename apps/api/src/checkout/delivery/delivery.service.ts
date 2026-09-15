import { type Money } from '@kairos/types/money';
import { type DeliveryDestination, type DeliveryOption } from '@kairos/types/delivery';
import { Inject, Injectable } from '@nestjs/common';

import { DeliveryUnavailableError } from '../checkout.errors.js';
import { InternalDeliveryProvider } from './internal-delivery.provider.js';

@Injectable()
export class DeliveryService {
  constructor(
    @Inject(InternalDeliveryProvider) private readonly provider: InternalDeliveryProvider,
  ) {}

  async listActiveOptions(input: {
    destination: DeliveryDestination;
    orderSubtotal: Money;
    items: Array<{ productId: string; quantity: number; weightGrams: number }>;
  }): Promise<DeliveryOption[]> {
    return this.provider.quote({
      destination: input.destination,
      orderSubtotal: input.orderSubtotal,
      items: input.items,
    });
  }

  async quoteMethod(input: {
    deliveryMethodId: string;
    destination: DeliveryDestination;
    orderSubtotal: Money;
    items: Array<{ productId: string; quantity: number; weightGrams: number }>;
  }): Promise<DeliveryOption> {
    const options = await this.listActiveOptions(input);
    if (options.length === 0) {
      throw new DeliveryUnavailableError();
    }
    const match = options.find((option) => option.methodId === input.deliveryMethodId);
    if (!match) {
      throw new DeliveryUnavailableError();
    }
    return match;
  }
}
