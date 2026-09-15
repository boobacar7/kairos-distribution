import { Inject, Injectable } from '@nestjs/common';
import { CURRENCY, type OrderTotals } from '@kairos/types';
import { ZERO } from '@kairos/types/money';
import {
  mergeCartIntent,
  type CartPreviewRequest,
  type CartPreviewResponse,
  type CreateCartRequest,
} from '@kairos/validation/cart';
import type { CheckoutIssue } from '@kairos/validation/checkout';

import { CartRepository } from './cart.repository.js';
import { countItems, previewCartLine, sumPurchasableSubtotal } from './domain/preview.js';
import { SettingsService } from '../checkout/settings.service.js';
import { ZeroTaxProvider } from '../checkout/pricing/zero-tax.provider.js';
import { priceCart, type PricedCartSnapshot } from '../checkout/pricing/price-cart.js';
import { money } from '@kairos/types/money';

export type ServerCartResponse = {
  cartId: string;
  currency: typeof CURRENCY;
  status: string;
  lines: PricedCartSnapshot['lines'];
  totals: OrderTotals;
  issues: CheckoutIssue[];
  itemCount: number;
};

@Injectable()
export class CartService {
  private readonly tax = new ZeroTaxProvider();

  constructor(
    @Inject(CartRepository) private readonly repository: CartRepository,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  async preview(request: CartPreviewRequest): Promise<CartPreviewResponse> {
    const items = mergeCartIntent(request.items);
    const rows = await this.repository.findVariantsByIds(items.map((item) => item.variantId));
    const hideTestProducts = process.env['NODE_ENV'] === 'production';
    const priced = items.map((item) =>
      previewCartLine(item, rows.get(item.variantId), { hideTestProducts }),
    );

    return {
      currency: CURRENCY,
      items: priced,
      subtotal: sumPurchasableSubtotal(priced),
      itemCount: countItems(priced),
    };
  }

  async createFromIntent(
    request: CreateCartRequest,
    existingCartId?: string,
  ): Promise<ServerCartResponse> {
    const items = mergeCartIntent(request.items);
    const rows = await this.repository.findVariantsByIds(items.map((item) => item.variantId));
    const ttlDays = await this.settings.cartTtlDays();
    const expiresAt = new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
    const records = items.flatMap((item) => {
      const row = rows.get(item.variantId);
      if (!row || row.deletedAt) return [];
      return [
        {
          productId: row.product.id,
          variantId: row.id,
          quantity: item.quantity,
          unitPriceAtAdd: row.price,
        },
      ];
    });

    let cartId = existingCartId;
    if (cartId) {
      const existing = await this.repository.findActiveCart(cartId);
      if (existing && existing.status === 'ACTIVE' && existing.expiresAt > new Date()) {
        await this.repository.replaceCartItems(cartId, records);
      } else {
        cartId = undefined;
      }
    }
    if (!cartId) {
      const created = await this.repository.createCart({ expiresAt, items: records });
      cartId = created.id;
    }

    return this.getPriced(cartId);
  }

  async getPriced(cartId: string): Promise<ServerCartResponse> {
    const cart = await this.repository.findActiveCart(cartId);
    if (!cart) {
      throw Object.assign(new Error('CART_NOT_FOUND'), { code: 'CART_NOT_FOUND' });
    }
    const snapshot = await this.priceServerCart(cart);
    return {
      cartId: cart.id,
      currency: CURRENCY,
      status: cart.status,
      lines: snapshot.lines,
      totals: snapshot.totals,
      issues: snapshot.issues,
      itemCount: snapshot.lines.reduce((sum, line) => sum + line.quantity, 0),
    };
  }

  async priceServerCart(
    cart: NonNullable<Awaited<ReturnType<CartRepository['findActiveCart']>>>,
    shippingTotal: ReturnType<typeof money> = ZERO,
  ): Promise<PricedCartSnapshot> {
    const hideTestProducts = process.env['NODE_ENV'] === 'production';
    const rows = await this.repository.findVariantsByIds(cart.items.map((item) => item.variantId));
    const lines = cart.items.map((item) => {
      const preview = previewCartLine(
        { variantId: item.variantId, quantity: item.quantity },
        rows.get(item.variantId),
        { hideTestProducts },
      );
      const row = rows.get(item.variantId);
      return {
        variantId: item.variantId,
        productId: preview.productId,
        productName: preview.productName,
        variantName: preview.variantName,
        productSlug: preview.productSlug,
        sku: preview.sku,
        quantity: item.quantity,
        unitPrice: preview.unitPrice,
        compareAtPrice: row?.compareAtPrice == null ? null : money(row.compareAtPrice),
        unitPriceAtAdd: item.unitPriceAtAdd,
        availableQty: row?.inventoryItem?.availableQty ?? null,
        trackInventory: row?.inventoryItem?.trackInventory ?? null,
        purchasable: preview.purchasable,
        catalogueIssue: preview.issue,
      };
    });
    const taxQuote = await this.tax.quote({
      context: {
        destination: { countryCode: 'BF' },
        origin: { countryCode: 'BF' },
        customerTaxStatus: 'CONSUMER',
        occurredAt: new Date(),
        currency: CURRENCY,
      },
      lines: [],
    });
    return priceCart({ lines, shippingTotal, taxQuote });
  }
}
