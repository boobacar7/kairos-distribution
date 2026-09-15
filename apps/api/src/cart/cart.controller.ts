import { Body, Controller, HttpCode, HttpStatus, Inject, Post } from '@nestjs/common';
import { parseCartPreviewRequest } from '@kairos/validation/cart';

import { CartService } from './cart.service.js';

@Controller('cart')
export class CartController {
  constructor(@Inject(CartService) private readonly cart: CartService) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  preview(@Body() body: unknown) {
    return this.cart.preview(parseCartPreviewRequest(body));
  }
}
