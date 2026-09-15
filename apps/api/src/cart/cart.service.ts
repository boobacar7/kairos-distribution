import { Inject, Injectable } from '@nestjs/common';
import { CURRENCY } from '@kairos/types';
import {
  mergeCartIntent,
  type CartPreviewRequest,
  type CartPreviewResponse,
} from '@kairos/validation/cart';

import { CartRepository } from './cart.repository.js';
import { countItems, previewCartLine, sumPurchasableSubtotal } from './domain/preview.js';

@Injectable()
export class CartService {
  constructor(@Inject(CartRepository) private readonly repository: CartRepository) {}

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
}
