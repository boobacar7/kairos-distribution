import { money, ZERO, type Money } from '@kairos/types/money';
import {
  type DeliveryOption,
  type DeliveryProvider,
  type DeliveryProviderCapabilities,
  type DeliveryQuoteRequest,
} from '@kairos/types/delivery';
import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class InternalDeliveryProvider implements DeliveryProvider {
  readonly id = 'internal';
  readonly capabilities: DeliveryProviderCapabilities = {
    externalTracking: false,
    labelPrinting: false,
    webhookStatus: false,
  };

  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async quote(req: DeliveryQuoteRequest): Promise<DeliveryOption[]> {
    const zones = await this.prisma.client.deliveryZone.findMany({
      where: { isActive: true },
      include: { methods: { where: { isActive: true }, orderBy: { position: 'asc' } } },
      orderBy: { position: 'asc' },
    });

    const options: DeliveryOption[] = [];
    for (const zone of zones) {
      if (req.destination.zoneId && zone.id !== req.destination.zoneId) continue;
      for (const method of zone.methods) {
        options.push(toOption(zone, method, req.orderSubtotal));
      }
    }
    return options;
  }

  createShipment(): Promise<{ shipmentId: string }> {
    return Promise.resolve({ shipmentId: 'internal:noop' });
  }
}

function toOption(
  zone: { id: string; name: string },
  method: {
    id: string;
    name: string;
    fee: number;
    estimatedMinHours: number;
    estimatedMaxHours: number;
    freeAboveSubtotal: number | null;
  },
  subtotal: Money,
): DeliveryOption {
  const free =
    method.freeAboveSubtotal != null && subtotal >= method.freeAboveSubtotal
      ? ZERO
      : money(method.fee);
  return {
    methodId: method.id,
    zoneId: zone.id,
    zoneName: zone.name,
    label: method.name,
    fee: free,
    estimate: { minHours: method.estimatedMinHours, maxHours: method.estimatedMaxHours },
    available: true,
  };
}
