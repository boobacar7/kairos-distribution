import {
  Body,
  Controller,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Post,
} from '@nestjs/common';
import {
  parseClaimOrderRequest,
  parseInitiatePaymentRequest,
  parseInventoryAdjustRequest,
  parseMarkPaidRequest,
  parseTrackingLookupRequest,
} from '@kairos/validation/checkout';
import { idempotencyKeySchema } from '@kairos/validation';

import { hashIdempotencyPayload, withIdempotency } from './idempotency.js';
import { InventoryService } from './inventory/inventory.service.js';
import { OrdersService } from './orders.service.js';
import { PaymentsService } from './payments/payments.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { ORDER_ACCESS_COOKIE, readCookie } from './cookies.js';
import { InternalDeliveryProvider } from './delivery/internal-delivery.provider.js';
import { ZERO } from '@kairos/types/money';

@Controller()
export class CommerceController {
  constructor(
    @Inject(PaymentsService) private readonly payments: PaymentsService,
    @Inject(OrdersService) private readonly orders: OrdersService,
    @Inject(InventoryService) private readonly inventory: InventoryService,
    @Inject(InternalDeliveryProvider) private readonly delivery: InternalDeliveryProvider,
    @Inject(PrismaService) private readonly prisma: PrismaService,
  ) {}

  @Post('payments/:orderRef/initiate')
  async initiate(
    @Param('orderRef') orderRef: string,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    const parsed = parseInitiatePaymentRequest(body ?? {});
    const key = idempotencyKeySchema.parse(idempotencyKey);
    const result = await withIdempotency({
      prisma: this.prisma.client,
      scope: 'payments.initiate',
      key,
      requestHash: hashIdempotencyPayload({ orderRef, providerKey: parsed.providerKey }),
      run: async () => ({
        status: 200,
        body: await this.payments.initiate(orderRef, key),
      }),
    });
    return result.body;
  }

  @Get('payments/:orderRef/status')
  status(@Param('orderRef') orderRef: string) {
    return this.payments.status(orderRef);
  }

  @Post('admin/orders/:ref/mark-paid')
  async markPaid(
    @Param('ref') ref: string,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    const parsed = parseMarkPaidRequest(body ?? {});
    const key = idempotencyKeySchema.parse(idempotencyKey);
    const result = await withIdempotency({
      prisma: this.prisma.client,
      scope: 'admin.mark-paid',
      key,
      requestHash: hashIdempotencyPayload({ ref, note: parsed.note ?? null }),
      actorType: 'ADMIN_USER',
      run: async () => ({
        status: 200,
        body: await this.payments.markPaid(ref, key, parsed.note),
      }),
    });
    return result.body;
  }

  @Post('admin/inventory/:variantId/adjust')
  async adjust(
    @Param('variantId') variantId: string,
    @Body() body: unknown,
    @Headers('idempotency-key') idempotencyKey: string | undefined,
  ) {
    const parsed = parseInventoryAdjustRequest(body);
    const key = idempotencyKeySchema.parse(idempotencyKey);
    const row = await this.inventory.adjustByVariantId(variantId, parsed.delta, parsed.reason, key);
    return {
      variantId,
      onHandQty: row.onHandQty,
      reservedQty: row.reservedQty,
      availableQty: row.availableQty,
    };
  }

  @Get('orders/:id')
  getOrder(
    @Param('id') id: string,
    @Headers('cookie') cookieHeader: string | undefined,
    @Headers('x-kairos-claim-token') claimToken: string | undefined,
  ) {
    return this.orders.getForAccess({
      orderId: id,
      cookieId: readCookie(cookieHeader, ORDER_ACCESS_COOKIE),
      claimToken,
    });
  }

  @Post('orders/claim')
  @HttpCode(HttpStatus.OK)
  claim(@Body() body: unknown) {
    return this.orders.claim(parseClaimOrderRequest(body));
  }

  @Post('tracking/lookup')
  @HttpCode(HttpStatus.OK)
  lookup(@Body() body: unknown) {
    return this.orders.lookup(parseTrackingLookupRequest(body));
  }

  @Get('delivery/options')
  async deliveryOptions() {
    const options = await this.delivery.quote({
      destination: { city: 'Ouagadougou', countryCode: 'BF' },
      orderSubtotal: ZERO,
      items: [],
    });
    return { data: options };
  }
}
