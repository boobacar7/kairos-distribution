import { CURRENCY, type OrderTotals } from '@kairos/types';
import { money } from '@kairos/types/money';

type OrderRow = {
  id: string;
  reference: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  status: string;
  paymentStatus: string;
  subtotal: number;
  discountTotal: number;
  deliveryTotal: number;
  taxTotal: number;
  grandTotal: number;
  taxMode: 'INCLUSIVE' | 'EXCLUSIVE';
  deliveryZoneName: string;
  deliveryMethodName: string;
  deliveryFeeSnapshot: number;
  deliveryEtaMinHours: number | null;
  deliveryEtaMaxHours: number | null;
  trackingNumber: string | null;
  customerNote: string | null;
  claimedAt: Date | null;
  placedAt: Date;
  items: Array<{
    id: string;
    variantId: string;
    productId: string;
    sku: string;
    productName: string;
    variantName: string;
    productSlug: string;
    unitPrice: number;
    compareAtPrice: number | null;
    quantity: number;
    lineSubtotal: number;
    discountAllocated: number;
    lineTotal: number;
  }>;
};

export type PublicOrder = {
  id: string;
  reference: string;
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  status: string;
  paymentStatus: string;
  currency: typeof CURRENCY;
  totals: OrderTotals;
  delivery: {
    zoneName: string;
    methodName: string;
    fee: number;
    etaMinHours: number | null;
    etaMaxHours: number | null;
    trackingNumber: string | null;
  };
  customerNote: string | null;
  claimedAt: string | null;
  placedAt: string;
  lines: Array<{
    variantId: string;
    sku: string;
    productName: string;
    variantName: string;
    productSlug: string;
    quantity: number;
    unitPrice: number;
    lineSubtotal: number;
    lineTotal: number;
  }>;
};

export function toPublicOrder(order: OrderRow): PublicOrder {
  const totals: OrderTotals = {
    subtotal: money(order.subtotal),
    discountTotal: money(order.discountTotal),
    shippingTotal: money(order.deliveryTotal),
    taxTotal: money(order.taxTotal),
    grandTotal: money(order.grandTotal),
    taxTreatment: order.taxMode,
    taxBreakdown: [],
  };
  return {
    id: order.id,
    reference: order.reference,
    email: order.email,
    phone: order.phone,
    firstName: order.firstName,
    lastName: order.lastName,
    status: order.status,
    paymentStatus: order.paymentStatus,
    currency: CURRENCY,
    totals,
    delivery: {
      zoneName: order.deliveryZoneName,
      methodName: order.deliveryMethodName,
      fee: order.deliveryFeeSnapshot,
      etaMinHours: order.deliveryEtaMinHours,
      etaMaxHours: order.deliveryEtaMaxHours,
      trackingNumber: order.trackingNumber,
    },
    customerNote: order.customerNote,
    claimedAt: order.claimedAt?.toISOString() ?? null,
    placedAt: order.placedAt.toISOString(),
    lines: order.items.map((item) => ({
      variantId: item.variantId,
      sku: item.sku,
      productName: item.productName,
      variantName: item.variantName,
      productSlug: item.productSlug,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      lineSubtotal: item.lineSubtotal,
      lineTotal: item.lineTotal,
    })),
  };
}

export function assertNoSecrets(payload: unknown): void {
  const json = JSON.stringify(payload);
  if (
    json.includes('unitCost') ||
    json.includes('internalNote') ||
    json.includes('guestClaimTokenHash')
  ) {
    throw new Error('order mapper leaked a secret field');
  }
}
