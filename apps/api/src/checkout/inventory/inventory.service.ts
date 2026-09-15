import {
  adjustTrackedStock,
  consumeTrackedStock,
  expireTrackedStock,
  releaseTrackedStock,
  reserveTrackedStock,
  withInventoryTransaction,
  OutOfStockError,
  type InventoryRow,
  type Prisma,
} from '@kairos/database';
import { pendingReservationExpiresAt } from '@kairos/types/inventory';
import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { SettingsService } from '../settings.service.js';
import { canTransition } from '../domain/can-transition.js';

@Injectable()
export class InventoryService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(SettingsService) private readonly settings: SettingsService,
  ) {}

  async expireDueReservations(now = new Date()): Promise<number> {
    const due = await this.prisma.client.stockReservation.findMany({
      where: { status: 'HELD', expiresAt: { lt: now } },
      orderBy: { inventoryItemId: 'asc' },
      include: { order: { select: { id: true, status: true } } },
    });
    let expired = 0;
    for (const reservation of due) {
      await withInventoryTransaction({ prisma: this.prisma.client }, async (tx) => {
        const result = await expireTrackedStock(tx, {
          inventoryItemId: reservation.inventoryItemId,
          quantity: reservation.quantity,
          reservationId: reservation.id,
          orderId: reservation.orderId ?? undefined,
          idempotencyKey: `expire:${reservation.id}`,
        });
        if (result === 'duplicate' || result === 'not_due') return;
        expired += 1;
        if (reservation.order?.status === 'PENDING') {
          const paymentStatus = await tx.order.findUnique({
            where: { id: reservation.order.id },
            select: { paymentStatus: true },
          });
          if (paymentStatus?.paymentStatus === 'UNPAID') {
            await cancelPendingOrder(tx, reservation.order.id);
          }
        }
      });
    }
    return expired;
  }

  async extendPaymentPendingHold(orderId: string, placedAt: Date): Promise<void> {
    const pendingMinutes = await this.settings.paymentPendingHoldMinutes();
    const capMinutes = await this.settings.reservationAbsoluteCapMinutes();
    const now = new Date();
    const expiresAt = pendingReservationExpiresAt(now, placedAt, pendingMinutes, capMinutes);
    await this.prisma.client.stockReservation.updateMany({
      where: { orderId, status: 'HELD' },
      data: { expiresAt },
    });
  }

  async adjustByVariantId(
    variantId: string,
    delta: number,
    reason: string,
    idempotencyKey: string,
  ): Promise<InventoryRow> {
    const item = await this.prisma.client.inventoryItem.findUnique({ where: { variantId } });
    if (!item) {
      throw new Error(`NO_INVENTORY:${variantId}`);
    }
    return withInventoryTransaction({ prisma: this.prisma.client }, async (tx) =>
      adjustTrackedStock(tx, {
        inventoryItemId: item.id,
        onHandDelta: delta,
        reason,
        idempotencyKey,
      }),
    );
  }
}

export { OutOfStockError, reserveTrackedStock, releaseTrackedStock, consumeTrackedStock };

async function cancelPendingOrder(tx: Prisma.TransactionClient, orderId: string): Promise<void> {
  const rules = await tx.orderStatusTransitionRule.findMany();
  const order = await tx.order.findUniqueOrThrow({ where: { id: orderId } });
  const decision = canTransition(rules, order.status, 'CANCELLED', { actor: 'SYSTEM' });
  if (!decision.ok) return;
  const last = await tx.orderStatusHistory.findFirst({
    where: { orderId },
    orderBy: { sequence: 'desc' },
  });
  await tx.order.update({
    where: { id: orderId },
    data: {
      status: 'CANCELLED',
      cancelledAt: new Date(),
      cancelReason: 'reservation_expired',
      version: { increment: 1 },
    },
  });
  await tx.orderStatusHistory.create({
    data: {
      orderId,
      sequence: (last?.sequence ?? 0) + 1,
      fromStatus: order.status,
      toStatus: 'CANCELLED',
      actorType: 'SYSTEM',
      note: 'reservation_expired',
    },
  });
  await tx.outboxEvent.upsert({
    where: { dedupeKey: `order.cancelled:${orderId}` },
    create: {
      topic: 'order.cancelled',
      dedupeKey: `order.cancelled:${orderId}`,
      payload: { orderId, reason: 'reservation_expired' },
    },
    update: { status: 'PENDING', availableAt: new Date() },
  });
}
