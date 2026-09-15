import { randomBytes } from 'node:crypto';

import {
  allocateOrderReference,
  assertTokenNotDerivedFromReference,
  generateGuestClaimToken,
  hashGuestClaimToken,
  reserveTrackedStock,
  withInventoryTransaction,
  OutOfStockError,
  InventoryInconsistencyError,
} from '@kairos/database';
import { CURRENCY, isTestDataName } from '@kairos/types';
import { initialReservationExpiresAt } from '@kairos/types/inventory';
import { ZERO } from '@kairos/types/money';
import { Inject, Injectable } from '@nestjs/common';
import type { CheckoutQuoteRequest, PlaceOrderRequest } from '@kairos/validation/checkout';

import { CartRepository } from '../cart/cart.repository.js';
import { CartService } from '../cart/cart.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CheckoutConflictError } from './checkout.errors.js';
import { DeliveryService } from './delivery/delivery.service.js';
import { hasBlockingIssues } from './pricing/price-cart.js';
import { SettingsService } from './settings.service.js';
import { toPublicOrder, type PublicOrder } from './order-mapper.js';

@Injectable()
export class CheckoutService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(CartService) private readonly carts: CartService,
    @Inject(CartRepository) private readonly cartRepo: CartRepository,
    @Inject(DeliveryService) private readonly delivery: DeliveryService,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  async quote(request: CheckoutQuoteRequest) {
    const cart = await this.requireActiveCart(request.cartId);
    const items = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      weightGrams: 0,
    }));
    const subtotalSnapshot = await this.carts.priceServerCart(cart, ZERO);
    const option = await this.delivery.quoteMethod({
      deliveryMethodId: request.deliveryMethodId,
      destination: request.destination,
      orderSubtotal: subtotalSnapshot.totals.subtotal,
      items,
    });
    const priced = await this.carts.priceServerCart(cart, option.fee);
    return {
      cartId: cart.id,
      currency: CURRENCY,
      delivery: option,
      lines: priced.lines,
      totals: priced.totals,
      issues: priced.issues,
    };
  }

  async placeOrder(request: PlaceOrderRequest): Promise<PublicOrder & { claimToken: string }> {
    const cart = await this.requireActiveCart(request.cartId);
    const items = cart.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      weightGrams: 0,
    }));
    const subtotalSnapshot = await this.carts.priceServerCart(cart, ZERO);
    const option = await this.delivery.quoteMethod({
      deliveryMethodId: request.deliveryMethodId,
      destination: {
        city: request.shippingAddress.city,
        neighbourhood: request.shippingAddress.neighbourhood,
        region: request.shippingAddress.region,
        countryCode: request.shippingAddress.countryCode,
      },
      orderSubtotal: subtotalSnapshot.totals.subtotal,
      items,
    });
    const priced = await this.carts.priceServerCart(cart, option.fee);
    if (hasBlockingIssues(priced) || priced.lines.length === 0) {
      throw new CheckoutConflictError(
        priced.issues.length > 0
          ? priced.issues
          : [{ code: 'CART_EMPTY', message: 'Le panier est vide.' }],
      );
    }

    const hideTest = process.env['NODE_ENV'] === 'production';
    if (
      hideTest &&
      priced.lines.some((line) => line.productName && isTestDataName(line.productName))
    ) {
      throw new CheckoutConflictError([
        { code: 'PRODUCT_UNAVAILABLE', message: 'Ce produit n’est plus disponible.' },
      ]);
    }

    const ttlMinutes = await this.settings.reservationTtlMinutes();
    const capMinutes = await this.settings.reservationAbsoluteCapMinutes();
    const claimTtlDays = await this.settings.guestClaimTtlDays();
    const placedAt = new Date();
    const expiresAt = initialReservationExpiresAt(placedAt, placedAt, ttlMinutes, capMinutes);
    const claimToken = generateGuestClaimToken();
    const variantRows = await this.cartRepo.findVariantsByIds(
      cart.items.map((item) => item.variantId),
    );

    try {
      const created = await withInventoryTransaction({ prisma: this.prisma.client }, async (tx) => {
        const tmpReference = `tmp_${randomBytes(8).toString('hex')}`;
        const order = await tx.order.create({
          data: {
            reference: tmpReference,
            cartId: cart.id,
            email: request.contact.email,
            phone: request.contact.phone,
            firstName: request.contact.firstName,
            lastName: request.contact.lastName,
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            currency: CURRENCY,
            subtotal: priced.totals.subtotal,
            discountTotal: priced.totals.discountTotal,
            deliveryTotal: priced.totals.shippingTotal,
            taxTotal: priced.totals.taxTotal,
            grandTotal: priced.totals.grandTotal,
            taxMode: priced.totals.taxTreatment,
            deliveryZoneId: option.zoneId,
            deliveryMethodId: option.methodId,
            deliveryZoneName: option.zoneName,
            deliveryMethodName: option.label,
            deliveryFeeSnapshot: option.fee,
            deliveryEtaMinHours: option.estimate.minHours,
            deliveryEtaMaxHours: option.estimate.maxHours,
            deliveryInstructions: request.shippingAddress.instructions ?? null,
            customerNote: request.customerNote ?? null,
            placedAt,
            guestClaimTokenHash: hashGuestClaimToken(claimToken),
            guestClaimTokenExpiresAt: new Date(
              placedAt.getTime() + claimTtlDays * 24 * 60 * 60 * 1000,
            ),
            addresses: {
              create: [
                { kind: 'SHIPPING', ...addressFields(request) },
                { kind: 'BILLING', ...addressFields(request) },
              ],
            },
            items: {
              create: priced.lines.map((line) => {
                const row = variantRows.get(line.variantId);
                return {
                  productId: line.productId as string,
                  variantId: line.variantId,
                  sku: line.sku ?? 'UNKNOWN',
                  productName: line.productName ?? 'Produit',
                  variantName: line.variantName ?? 'Default',
                  productSlug: line.productSlug ?? 'produit',
                  unitPrice: line.unitPrice ?? 0,
                  compareAtPrice: line.compareAtPrice,
                  unitCost: row?.cost ?? null,
                  quantity: line.quantity,
                  lineSubtotal: line.lineSubtotal ?? 0,
                  discountAllocated: line.discountAllocated,
                  lineTotal: line.lineTotal ?? 0,
                  productSnapshot: {
                    name: line.productName,
                    slug: line.productSlug,
                    sku: line.sku,
                    variantName: line.variantName,
                    description: row?.product.description ?? null,
                    benefits: row?.product.benefits ?? null,
                    ingredients: row?.product.ingredients ?? null,
                    usage: row?.product.usage ?? null,
                    precautions: row?.product.precautions ?? null,
                  },
                };
              }),
            },
            statusHistory: {
              create: {
                sequence: 1,
                fromStatus: null,
                toStatus: 'PENDING',
                actorType: 'CUSTOMER',
              },
            },
          },
          include: { items: true, addresses: true },
        });

        const tracked = order.items
          .map((item) => {
            const row = variantRows.get(item.variantId);
            const inventoryId = row?.inventoryItem?.id;
            const track = row?.inventoryItem?.trackInventory ?? false;
            return { item, inventoryId, track };
          })
          .filter((entry) => entry.track && entry.inventoryId)
          .sort((a, b) => (a.inventoryId as string).localeCompare(b.inventoryId as string));

        for (const entry of tracked) {
          const reservation = await tx.stockReservation.create({
            data: {
              inventoryItemId: entry.inventoryId as string,
              orderId: order.id,
              orderItemId: entry.item.id,
              quantity: entry.item.quantity,
              status: 'HELD',
              expiresAt,
            },
          });
          await reserveTrackedStock(tx, {
            inventoryItemId: entry.inventoryId as string,
            quantity: entry.item.quantity,
            idempotencyKey: `reserve:${entry.item.id}`,
            orderId: order.id,
            reservationId: reservation.id,
          });
        }

        const reference = await allocateOrderReference(tx, placedAt);
        assertTokenNotDerivedFromReference(claimToken, reference);
        const updated = await tx.order.update({
          where: { id: order.id },
          data: { reference },
          include: { items: true, addresses: true, reservations: true },
        });

        await tx.cart.update({
          where: { id: cart.id },
          data: { status: 'CONVERTED', convertedAt: placedAt },
        });

        await tx.outboxEvent.create({
          data: {
            topic: 'order.created',
            dedupeKey: `order.created:${updated.id}`,
            payload: { orderId: updated.id, reference },
          },
        });
        await tx.auditLog.create({
          data: {
            actorType: 'CUSTOMER',
            action: 'order.created',
            entityType: 'Order',
            entityId: updated.id,
            metadata: { reference },
          },
        });

        for (const entry of tracked) {
          const productId = entry.item.productId;
          await tx.outboxEvent.upsert({
            where: { dedupeKey: `catalog.recompute_availability:${productId}` },
            create: {
              topic: 'catalog.recompute_availability',
              dedupeKey: `catalog.recompute_availability:${productId}`,
              payload: { productId },
            },
            update: { status: 'PENDING', availableAt: new Date() },
          });
        }

        return updated;
      });

      return { ...toPublicOrder(created), claimToken };
    } catch (error) {
      if (error instanceof OutOfStockError) {
        throw new CheckoutConflictError([
          { code: 'OUT_OF_STOCK', message: 'Cet article n’est plus en stock.' },
        ]);
      }
      if (error instanceof InventoryInconsistencyError) {
        throw error;
      }
      throw error;
    }
  }

  private async requireActiveCart(cartId: string) {
    const cart = await this.cartRepo.findActiveCart(cartId);
    if (!cart || cart.status !== 'ACTIVE' || cart.expiresAt <= new Date()) {
      throw new CheckoutConflictError([
        {
          code: cart?.status === 'CONVERTED' ? 'CART_CONVERTED' : 'CART_EXPIRED',
          message: 'Le panier n’est plus disponible.',
        },
      ]);
    }
    return cart;
  }
}

function addressFields(request: PlaceOrderRequest) {
  const address = request.shippingAddress;
  return {
    firstName: address.firstName,
    lastName: address.lastName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2 ?? null,
    city: address.city,
    neighbourhood: address.neighbourhood ?? null,
    region: address.region ?? null,
    postalCode: address.postalCode ?? null,
    countryCode: address.countryCode,
    instructions: address.instructions ?? null,
  };
}
