import { Body, Controller, Headers, HttpCode, HttpStatus, Inject, Post, Res } from '@nestjs/common';
import { parseCheckoutQuoteRequest, parsePlaceOrderRequest } from '@kairos/validation/checkout';
import { idempotencyKeySchema } from '@kairos/validation';
import type { Response } from 'express';

import { CheckoutService } from './checkout.service.js';
import { CART_COOKIE, ORDER_ACCESS_COOKIE, readCookie, serializeCookie } from './cookies.js';
import { hashIdempotencyPayload, withIdempotency } from './idempotency.js';
import { PrismaService } from '../prisma/prisma.service.js';

@Controller('checkout')
export class CheckoutController {
  constructor(
    @Inject(CheckoutService) private readonly checkout: CheckoutService,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Post('quote')
  @HttpCode(HttpStatus.OK)
  quote(@Body() body: unknown) {
    return this.checkout.quote(parseCheckoutQuoteRequest(body));
  }

  @Post('orders')
  async place(
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
    @Headers('cookie') cookieHeader: string | undefined,
    @Res({ passthrough: true }) response: Response,
  ) {
    const key = idempotencyKeySchema.parse(idempotencyKey);
    const parsed = parsePlaceOrderRequest(body);
    const cookieCart = readCookie(cookieHeader, CART_COOKIE);
    if (cookieCart && cookieCart !== parsed.cartId) {
      parsed.cartId = cookieCart;
    }
    const result = await withIdempotency({
      prisma: this.prisma.client,
      scope: 'checkout.orders',
      key,
      requestHash: hashIdempotencyPayload(parsed),
      run: async () => {
        const order = await this.checkout.placeOrder(parsed);
        return { status: 201, body: order };
      },
    });
    response.status(result.status);
    if (!result.replayed && result.body && typeof result.body === 'object' && 'id' in result.body) {
      response.setHeader(
        'Set-Cookie',
        serializeCookie(ORDER_ACCESS_COOKIE, String(result.body.id), {
          maxAgeSeconds: 30 * 24 * 60 * 60,
        }),
      );
    }
    return result.body;
  }
}
