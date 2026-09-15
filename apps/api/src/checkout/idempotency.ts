import { createHash } from 'node:crypto';

import { Prisma } from '@kairos/database';

import { IdempotencyConflictError } from './checkout.errors.js';
import { type PrismaService } from '../prisma/prisma.service.js';

export function hashIdempotencyPayload(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

const TTL_MS = 24 * 60 * 60 * 1000;

export async function withIdempotency<T>(options: {
  prisma: PrismaService['client'];
  scope: string;
  key: string;
  requestHash: string;
  actorType?: 'CUSTOMER' | 'ADMIN_USER' | 'SYSTEM';
  run: () => Promise<{ status: number; body: T }>;
}): Promise<{ status: number; body: T; replayed: boolean }> {
  const expiresAt = new Date(Date.now() + TTL_MS);
  try {
    await options.prisma.idempotencyKey.create({
      data: {
        scope: options.scope,
        key: options.key,
        requestHash: options.requestHash,
        status: 'IN_PROGRESS',
        actorType: options.actorType ?? 'CUSTOMER',
        expiresAt,
      },
    });
  } catch (error) {
    if (!(error instanceof Prisma.PrismaClientKnownRequestError) || error.code !== 'P2002') {
      throw error;
    }
    const existing = await options.prisma.idempotencyKey.findUniqueOrThrow({
      where: { scope_key: { scope: options.scope, key: options.key } },
    });
    if (existing.requestHash !== options.requestHash) {
      throw new IdempotencyConflictError('IDEMPOTENCY_KEY_REUSED');
    }
    if (existing.status === 'COMPLETED') {
      return {
        status: existing.responseStatus ?? 200,
        body: existing.responseBody as T,
        replayed: true,
      };
    }
    if (existing.status === 'IN_PROGRESS') {
      throw new IdempotencyConflictError('IDEMPOTENCY_IN_PROGRESS');
    }
    await options.prisma.idempotencyKey.update({
      where: { id: existing.id },
      data: { status: 'IN_PROGRESS', lockedAt: new Date() },
    });
  }

  try {
    const result = await options.run();
    await options.prisma.idempotencyKey.update({
      where: { scope_key: { scope: options.scope, key: options.key } },
      data: {
        status: 'COMPLETED',
        responseStatus: result.status,
        responseBody: result.body as object,
        completedAt: new Date(),
        resourceType: options.scope,
      },
    });
    return { ...result, replayed: false };
  } catch (error) {
    await options.prisma.idempotencyKey.update({
      where: { scope_key: { scope: options.scope, key: options.key } },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}
