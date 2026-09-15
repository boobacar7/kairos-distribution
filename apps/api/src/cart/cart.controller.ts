import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Param,
  Post,
  Res,
} from '@nestjs/common';
import { parseCartPreviewRequest, parseCreateCartRequest } from '@kairos/validation/cart';
import type { Response } from 'express';

import { CartService } from './cart.service.js';
import { CART_COOKIE, readCookie, serializeCookie } from '../checkout/cookies.js';
import { SettingsService } from '../checkout/settings.service.js';

@Controller('cart')
export class CartController {
  constructor(
    @Inject(CartService) private readonly cart: CartService,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  @Post('preview')
  @HttpCode(HttpStatus.OK)
  preview(@Body() body: unknown) {
    return this.cart.preview(parseCartPreviewRequest(body));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() body: unknown,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const existing = readCookie(cookieHeader, CART_COOKIE);
    const priced = await this.cart.createFromIntent(parseCreateCartRequest(body), existing);
    const ttlDays = await this.settings.cartTtlDays();
    response.setHeader(
      'Set-Cookie',
      serializeCookie(CART_COOKIE, priced.cartId, {
        maxAgeSeconds: ttlDays * 24 * 60 * 60,
      }),
    );
    return priced;
  }

  @Get(':id')
  async get(@Param('id') id: string, @Headers('cookie') cookieHeader: string | undefined) {
    const cookieId = readCookie(cookieHeader, CART_COOKIE);
    if (!cookieId || cookieId !== id) {
      throw new NotFoundException();
    }
    try {
      return await this.cart.getPriced(id);
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'CART_NOT_FOUND') {
        throw new NotFoundException();
      }
      throw error;
    }
  }
}
