import { claimGuestOrder, GuestClaimError, hashGuestClaimToken } from '@kairos/database';
import { Inject, Injectable } from '@nestjs/common';
import type { ClaimOrderRequest, TrackingLookupRequest } from '@kairos/validation/checkout';

import { PrismaService } from '../prisma/prisma.service.js';
import { GuestClaimRejectedError } from './checkout.errors.js';
import { toPublicOrder } from './order-mapper.js';

@Injectable()
export class OrdersService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getForAccess(input: {
    orderId: string;
    cookieId?: string | undefined;
    claimToken?: string | undefined;
  }) {
    const order = await this.prisma.client.order.findUnique({
      where: { id: input.orderId },
      include: { items: true, addresses: true },
    });
    if (!order) {
      throw Object.assign(new Error('ORDER_NOT_FOUND'), { code: 'ORDER_NOT_FOUND' });
    }
    const cookieOk = input.cookieId === order.id;
    const tokenOk = input.claimToken ? tokenAllowsView(order, input.claimToken) : false;
    if (!cookieOk && !tokenOk) {
      throw Object.assign(new Error('ORDER_NOT_FOUND'), { code: 'ORDER_NOT_FOUND' });
    }
    return toPublicOrder(order);
  }

  async claim(request: ClaimOrderRequest) {
    const customer = await this.prisma.client.customer.findUnique({
      where: { email: request.email },
    });
    if (!customer?.emailVerifiedAt) {
      throw new GuestClaimRejectedError();
    }
    const tokenHash = hashGuestClaimToken(request.token);
    const order = await this.prisma.client.order.findFirst({
      where: {
        guestClaimTokenHash: tokenHash,
        email: { equals: request.email, mode: 'insensitive' },
      },
    });
    if (!order) {
      throw new GuestClaimRejectedError();
    }
    try {
      await this.prisma.client.$transaction((tx) =>
        claimGuestOrder(tx, {
          orderId: order.id,
          token: request.token,
          customerId: customer.id,
        }),
      );
    } catch (error) {
      if (error instanceof GuestClaimError) {
        throw new GuestClaimRejectedError();
      }
      throw error;
    }
    await this.prisma.client.auditLog.create({
      data: {
        actorType: 'CUSTOMER',
        actorLabel: customer.email,
        action: 'order.claimed',
        entityType: 'Order',
        entityId: order.id,
        metadata: { customerId: customer.id },
      },
    });
    const claimed = await this.prisma.client.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });
    return toPublicOrder(claimed);
  }

  async lookup(request: TrackingLookupRequest) {
    const order = await this.prisma.client.order.findFirst({
      where: {
        reference: request.reference,
        OR: [
          request.email ? { email: request.email } : undefined,
          request.phone ? { phone: request.phone } : undefined,
        ].filter((value): value is { email: string } | { phone: string } => value !== undefined),
      },
      include: { items: true },
    });
    if (!order) {
      throw Object.assign(new Error('ORDER_NOT_FOUND'), { code: 'ORDER_NOT_FOUND' });
    }
    return toPublicOrder(order);
  }
}

function tokenAllowsView(
  order: { guestClaimTokenHash: string | null; guestClaimTokenExpiresAt: Date | null },
  token: string,
): boolean {
  if (!order.guestClaimTokenHash || !order.guestClaimTokenExpiresAt) return false;
  if (order.guestClaimTokenExpiresAt <= new Date()) return false;
  return order.guestClaimTokenHash === hashGuestClaimToken(token);
}
