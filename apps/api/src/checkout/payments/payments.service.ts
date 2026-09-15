import { createHash } from 'node:crypto';

import {
  consumeTrackedStock,
  OutOfStockError,
  reserveTrackedStock,
  withInventoryTransaction,
  type Prisma,
} from '@kairos/database';
import { asOrderReference, type VerifiedPayment } from '@kairos/types/payment';
import { money } from '@kairos/types/money';
import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service.js';
import { canTransition } from '../domain/can-transition.js';
import { InventoryService } from '../inventory/inventory.service.js';
import { PaidWithoutStockError, StockUnavailableError } from '../checkout.errors.js';
import { ManualProvider, manualMarkPaidVerified } from './manual.provider.js';

export type ApplyPaymentOutcome = 'confirmed' | 'replayed' | 'paid_without_stock';

@Injectable()
export class PaymentsService {
  private readonly manual = new ManualProvider();

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(InventoryService) private readonly inventory: InventoryService,
  ) {}

  async initiate(
    orderRef: string,
    idempotencyKey: string,
  ): Promise<{
    orderRef: string;
    providerKey: string;
    status: string;
    amount: number;
    redirectUrl: string | null;
  }> {
    const order = await this.prisma.client.order.findUnique({
      where: { reference: orderRef },
      include: { payment: true },
    });
    if (
      !order ||
      order.status !== 'PENDING' ||
      order.paymentStatus === 'PAID' ||
      order.payment?.status === 'PAID'
    ) {
      throw Object.assign(new Error('ORDER_NOT_PAYABLE'), { code: 'ORDER_NOT_PAYABLE' });
    }
    const provider = await this.prisma.client.paymentProviderConfig.findUnique({
      where: { key: 'manual' },
    });
    if (!provider?.isActive) {
      throw Object.assign(new Error('PROVIDER_INACTIVE'), { code: 'PROVIDER_INACTIVE' });
    }

    const intent = await this.manual.createIntent({
      orderRef: asOrderReference(order.reference),
      amount: money(order.grandTotal),
      currency: 'XOF',
      customer: {
        email: order.email,
        phone: order.phone,
        firstName: order.firstName,
        lastName: order.lastName,
      },
      returnUrl: '',
      idempotencyKey,
      metadata: { orderId: order.id },
    });

    await this.prisma.client.$transaction(async (tx) => {
      const payment =
        order.payment ??
        (await tx.payment.create({
          data: {
            orderId: order.id,
            providerKey: 'manual',
            status: 'PENDING',
            currency: 'XOF',
            amountExpected: order.grandTotal,
            providerPaymentId: intent.providerTransactionId,
          },
        }));
      await tx.paymentTransaction.upsert({
        where: { idempotencyKey },
        create: {
          paymentId: payment.id,
          type: 'INTENT',
          status: 'PENDING',
          amount: order.grandTotal,
          providerTransactionId: intent.providerTransactionId,
          idempotencyKey,
        },
        update: {},
      });
      await tx.order.update({
        where: { id: order.id },
        data: { paymentStatus: 'PENDING' },
      });
    });

    await this.inventory.extendPaymentPendingHold(order.id, order.placedAt);

    const payment = await this.prisma.client.payment.findUniqueOrThrow({
      where: { orderId: order.id },
    });
    return {
      orderRef: order.reference,
      providerKey: 'manual',
      status: String(payment.status),
      amount: payment.amountExpected,
      redirectUrl: intent.redirectUrl ?? null,
    };
  }

  async status(orderRef: string): Promise<{
    orderRef: string;
    orderStatus: string;
    paymentStatus: string;
    providerStatus: string | null;
  }> {
    const order = await this.prisma.client.order.findUnique({
      where: { reference: orderRef },
      include: { payment: true },
    });
    if (!order) {
      throw Object.assign(new Error('ORDER_NOT_FOUND'), { code: 'ORDER_NOT_FOUND' });
    }
    return {
      orderRef: order.reference,
      orderStatus: order.status,
      paymentStatus: order.paymentStatus,
      providerStatus: order.payment?.status ?? null,
    };
  }

  async markPaid(orderRef: string, idempotencyKey: string, note?: string) {
    const order = await this.prisma.client.order.findUnique({ where: { reference: orderRef } });
    if (!order) {
      throw Object.assign(new Error('ORDER_NOT_FOUND'), { code: 'ORDER_NOT_FOUND' });
    }
    const digest = createHash('sha256')
      .update(`manual-mark-paid:${order.reference}:${idempotencyKey}`)
      .digest('hex');
    const verified = manualMarkPaidVerified({
      orderRef: order.reference,
      amount: order.grandTotal,
      digest,
    });
    const outcome = await this.applyVerifiedPayment(verified, { note, actor: 'ADMIN_USER' });
    if (outcome === 'paid_without_stock') {
      throw new PaidWithoutStockError(order.id, order.reference);
    }
    return { orderRef: order.reference, outcome };
  }

  async applyVerifiedPayment(
    verified: VerifiedPayment,
    options: { note?: string | undefined; actor?: 'ADMIN_USER' | 'SYSTEM' } = {},
  ): Promise<ApplyPaymentOutcome> {
    if (verified.status !== 'SUCCEEDED') {
      throw new Error('applyVerifiedPayment requires SUCCEEDED');
    }

    try {
      return await withInventoryTransaction({ prisma: this.prisma.client }, async (tx) =>
        confirmPaidOrder(tx, verified, options),
      );
    } catch (error) {
      if (error instanceof StockUnavailableError) {
        await this.prisma.client.$transaction((tx) =>
          recordPaidWithoutStockFromRef(tx, verified, options.note),
        );
        return 'paid_without_stock';
      }
      throw error;
    }
  }
}

type OrderWithStock = {
  id: string;
  reference: string;
  grandTotal: number;
  status: string;
  paymentStatus: string;
  payment: { id: string } | null;
  refunds: Array<{ reason: string }>;
  items: Array<{
    id: string;
    variantId: string;
    productId: string;
    quantity: number;
  }>;
  reservations: Array<{
    id: string;
    status: string;
    quantity: number;
    inventoryItemId: string;
    orderItemId: string | null;
  }>;
};

async function confirmPaidOrder(
  tx: Prisma.TransactionClient,
  verified: VerifiedPayment,
  options: { note?: string | undefined; actor?: 'ADMIN_USER' | 'SYSTEM' },
): Promise<ApplyPaymentOutcome> {
  const order = await tx.order.findUnique({
    where: { reference: verified.orderRef },
    include: { items: true, reservations: true, payment: true, refunds: true },
  });
  if (!order) {
    throw new Error('ORDER_NOT_FOUND');
  }
  if (order.paymentStatus === 'PAID' && order.status === 'CONFIRMED') {
    return 'replayed';
  }
  if (order.refunds.some((refund) => refund.reason === 'paid_without_stock')) {
    return 'paid_without_stock';
  }
  if (verified.amount !== order.grandTotal || verified.currency !== 'XOF') {
    throw new Error('AMOUNT_MISMATCH');
  }
  if (order.status !== 'PENDING') {
    throw new StockUnavailableError();
  }

  const rules = await tx.orderStatusTransitionRule.findMany();
  const decision = canTransition(rules, order.status, 'CONFIRMED', {
    paymentVerified: true,
    actor: options.actor ?? 'SYSTEM',
  });
  if (!decision.ok) {
    throw new Error(`TRANSITION_DENIED:${decision.reason}`);
  }

  await consumeOrRereserve(tx, order);

  const payment = await upsertPaidPayment(tx, order, verified);
  const last = await tx.orderStatusHistory.findFirst({
    where: { orderId: order.id },
    orderBy: { sequence: 'desc' },
  });
  await tx.order.update({
    where: { id: order.id },
    data: {
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      confirmedAt: verified.occurredAt,
      paidAt: verified.occurredAt,
      version: { increment: 1 },
    },
  });
  await tx.orderStatusHistory.create({
    data: {
      orderId: order.id,
      sequence: (last?.sequence ?? 0) + 1,
      fromStatus: 'PENDING',
      toStatus: 'CONFIRMED',
      actorType: options.actor ?? 'SYSTEM',
      note: options.note ?? 'payment_verified',
    },
  });
  await tx.outboxEvent.upsert({
    where: { dedupeKey: `order.paid:${order.id}` },
    create: {
      topic: 'order.paid',
      dedupeKey: `order.paid:${order.id}`,
      payload: { orderId: order.id, reference: order.reference, paymentId: payment.id },
    },
    update: { status: 'PENDING', availableAt: new Date() },
  });
  await tx.auditLog.create({
    data: {
      actorType: options.actor ?? 'SYSTEM',
      action: 'payment.verified',
      entityType: 'Order',
      entityId: order.id,
      metadata: { reference: order.reference, provider: verified.provider },
    },
  });
  return 'confirmed';
}

async function consumeOrRereserve(
  tx: Prisma.TransactionClient,
  order: OrderWithStock,
): Promise<void> {
  const heldOrReleased = order.reservations.filter((row) =>
    ['HELD', 'EXPIRED', 'RELEASED'].includes(row.status),
  );
  const sorted = [...heldOrReleased].sort((a, b) =>
    a.inventoryItemId.localeCompare(b.inventoryItemId),
  );
  for (const reservation of sorted) {
    try {
      if (reservation.status !== 'HELD') {
        await reserveTrackedStock(tx, {
          inventoryItemId: reservation.inventoryItemId,
          quantity: reservation.quantity,
          idempotencyKey: `rereserve:${reservation.orderItemId ?? reservation.id}`,
          orderId: order.id,
          reservationId: reservation.id,
        });
      }
      const consumed = await consumeTrackedStock(tx, {
        inventoryItemId: reservation.inventoryItemId,
        quantity: reservation.quantity,
        idempotencyKey: `fulfil:${reservation.orderItemId ?? reservation.id}`,
        orderId: order.id,
        reservationId: reservation.id,
      });
      if (consumed === 'duplicate') continue;
      await tx.stockReservation.update({
        where: { id: reservation.id },
        data: { status: 'CONSUMED', consumedAt: new Date() },
      });
    } catch (error) {
      if (error instanceof OutOfStockError) {
        throw new StockUnavailableError();
      }
      throw error;
    }
  }
}

async function upsertPaidPayment(
  tx: Prisma.TransactionClient,
  order: { id: string; grandTotal: number; payment: { id: string } | null },
  verified: VerifiedPayment,
) {
  if (order.payment) {
    return tx.payment.update({
      where: { id: order.payment.id },
      data: {
        status: 'PAID',
        amountCaptured: order.grandTotal,
        providerPaymentId: verified.providerTransactionId,
        verifiedAt: verified.occurredAt,
      },
    });
  }
  return tx.payment.create({
    data: {
      orderId: order.id,
      providerKey: verified.provider,
      status: 'PAID',
      currency: 'XOF',
      amountExpected: order.grandTotal,
      amountCaptured: order.grandTotal,
      providerPaymentId: verified.providerTransactionId,
      verifiedAt: verified.occurredAt,
    },
  });
}

async function recordPaidWithoutStockFromRef(
  tx: Prisma.TransactionClient,
  verified: VerifiedPayment,
  note?: string,
): Promise<void> {
  const order = await tx.order.findUnique({
    where: { reference: verified.orderRef },
    include: { payment: true, refunds: true },
  });
  if (!order) return;
  if (order.refunds.some((refund) => refund.reason === 'paid_without_stock')) return;
  await recordPaidWithoutStock(tx, order, verified, note);
}

async function recordPaidWithoutStock(
  tx: Prisma.TransactionClient,
  order: Pick<OrderWithStock, 'id' | 'reference' | 'grandTotal' | 'payment'>,
  verified: VerifiedPayment,
  note?: string,
): Promise<void> {
  const payment = await upsertPaidPayment(tx, order, verified);
  await tx.order.update({
    where: { id: order.id },
    data: { paymentStatus: 'PAID' },
  });
  await tx.refund.create({
    data: {
      paymentId: payment.id,
      orderId: order.id,
      amount: order.grandTotal,
      reason: 'paid_without_stock',
      status: 'REQUESTED',
      idempotencyKey: `paid-without-stock:${order.id}`,
    },
  });
  await tx.outboxEvent.upsert({
    where: { dedupeKey: `payments.paid_without_stock:${order.id}` },
    create: {
      topic: 'payments.paid_without_stock',
      dedupeKey: `payments.paid_without_stock:${order.id}`,
      payload: { orderId: order.id, reference: order.reference, paymentId: payment.id },
    },
    update: { status: 'PENDING', availableAt: new Date() },
  });
  await tx.auditLog.create({
    data: {
      actorType: 'SYSTEM',
      action: 'payments.paid_without_stock',
      entityType: 'Order',
      entityId: order.id,
      metadata: { reference: order.reference, note: note ?? null },
    },
  });
}
