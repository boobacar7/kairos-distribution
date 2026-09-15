import { type Money } from '../money/index.js';
import { type OrderReference } from '../payment/index.js';

/**
 * DeliveryProvider seam — docs/architecture.md §6.2.
 *
 * V1 is InternalDeliveryProvider: table-driven from DeliveryZone / DeliveryMethod.
 * Quote requires at least one active zone and one active rate; otherwise the quote is refused.
 * Fees are never invented in application code.
 */

export interface DeliveryDestination {
  city: string;
  neighbourhood?: string | undefined;
  region?: string | undefined;
  countryCode?: string | undefined;
  zoneId?: string | undefined;
}

export interface DeliveryQuoteRequest {
  destination: DeliveryDestination;
  items: Array<{ productId: string; quantity: number; weightGrams: number }>;
  /** Enables free-delivery-over-threshold rules from the method row. */
  orderSubtotal: Money;
}

export interface DeliveryOption {
  methodId: string;
  zoneId: string;
  zoneName: string;
  label: string;
  fee: Money;
  estimate: { minHours: number; maxHours: number };
  available: boolean;
  unavailableReason?: string;
}

export interface DeliveryRecipient {
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  city: string;
  countryCode: string;
}

export interface DeliveryProviderCapabilities {
  externalTracking: boolean;
  labelPrinting: boolean;
  webhookStatus: boolean;
}

export interface DeliveryProvider {
  readonly id: string;
  readonly capabilities: DeliveryProviderCapabilities;
  quote(req: DeliveryQuoteRequest): Promise<DeliveryOption[]>;
  createShipment(req: {
    orderRef: OrderReference;
    methodId: string;
    recipient: DeliveryRecipient;
  }): Promise<{ shipmentId: string; trackingNumber?: string; trackingUrl?: string }>;
  cancelShipment?(shipmentId: string): Promise<void>;
  mapStatus?(payload: unknown): {
    orderRef: OrderReference;
    status: 'SHIPPED' | 'DELIVERED' | 'FAILED';
  };
}
