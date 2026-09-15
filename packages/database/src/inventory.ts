import { Prisma, type PrismaClient } from './generated/prisma/client.js';

export const INVENTORY_LEDGER_GUC = 'kairos.inventory_ledger';

export type DbClient = PrismaClient | Prisma.TransactionClient;

/**
 * Enable the inventory ledger GUC on the current transaction connection.
 * Must run on the same client that will write inventory_items — a SET LOCAL
 * issued on the base client of a pool lands on a different connection and the
 * trigger fails closed (data-model.md §9.4b / §15).
 */
export async function enableInventoryLedger(tx: DbClient): Promise<void> {
  await tx.$executeRaw`SELECT set_config(${INVENTORY_LEDGER_GUC}, 'on', true)`;
}

export async function assertReadCommitted(tx: DbClient): Promise<void> {
  const rows = await tx.$queryRaw<Array<{ transaction_isolation: string }>>`
    SHOW transaction_isolation
  `;
  const level = rows[0]?.transaction_isolation?.toLowerCase();
  if (level !== 'read committed') {
    throw new Error(
      `Inventory transactions must run at READ COMMITTED (got ${level ?? 'unknown'}). ` +
        'Raising the isolation level makes the documented zero-row out-of-stock branch unreachable.',
    );
  }
}

export interface InventoryTransactionOptions {
  prisma: PrismaClient;
  isolationLevel?: Prisma.TransactionIsolationLevel;
}

/**
 * Interactive transaction at READ COMMITTED with the ledger GUC set.
 * The only supported way to write inventory_items from this package.
 */
export async function withInventoryTransaction<T>(
  options: InventoryTransactionOptions,
  fn: (tx: Prisma.TransactionClient) => Promise<T>,
): Promise<T> {
  const isolationLevel = options.isolationLevel ?? Prisma.TransactionIsolationLevel.ReadCommitted;
  return options.prisma.$transaction(
    async (tx) => {
      await assertReadCommitted(tx);
      await enableInventoryLedger(tx);
      return fn(tx);
    },
    { isolationLevel, timeout: 15_000, maxWait: 10_000 },
  );
}

export class OutOfStockError extends Error {
  readonly inventoryItemId: string;
  readonly requestedQty: number;

  constructor(inventoryItemId: string, requestedQty: number) {
    super(`OUT_OF_STOCK: inventory item ${inventoryItemId} cannot reserve ${requestedQty}`);
    this.name = 'OutOfStockError';
    this.inventoryItemId = inventoryItemId;
    this.requestedQty = requestedQty;
  }
}

export class InventoryInconsistencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InventoryInconsistencyError';
  }
}

export interface ReserveStockInput {
  inventoryItemId: string;
  quantity: number;
  idempotencyKey: string;
  orderId?: string | undefined;
  reservationId?: string | undefined;
}

export interface InventoryRow {
  id: string;
  onHandQty: number;
  reservedQty: number;
  availableQty: number;
  trackInventory: boolean;
}

/**
 * Conditional reserve. Zero rows is classified: missing, untracked, or genuinely out of stock.
 * Untracked lines must be pre-branched by the caller — this function is the fail-closed path.
 */
export async function reserveTrackedStock(
  tx: Prisma.TransactionClient,
  input: ReserveStockInput,
): Promise<InventoryRow> {
  if (input.quantity <= 0) {
    throw new Error('reserve quantity must be positive');
  }

  const updated = await tx.$queryRaw<InventoryRow[]>`
    UPDATE inventory_items
       SET "reservedQty"   = "reservedQty" + ${input.quantity},
           "availableQty"  = "availableQty" - ${input.quantity},
           "isOutOfStock"  = ("availableQty" - ${input.quantity}) <= 0,
           "isLowStock"    = "trackInventory" AND ("availableQty" - ${input.quantity}) <= "lowStockThreshold",
           "version"       = "version" + 1,
           "updatedAt"     = now()
     WHERE id = ${input.inventoryItemId}
       AND "trackInventory" = true
       AND "availableQty" >= ${input.quantity}
    RETURNING id, "onHandQty", "reservedQty", "availableQty", "trackInventory"
  `;

  const row = updated[0];
  if (row) {
    await tx.stockMovement.create({
      data: {
        inventoryItemId: input.inventoryItemId,
        type: 'ORDER_RESERVATION',
        onHandDelta: 0,
        reservedDelta: input.quantity,
        onHandAfter: row.onHandQty,
        reservedAfter: row.reservedQty,
        availableAfter: row.availableQty,
        orderId: input.orderId ?? null,
        reservationId: input.reservationId ?? null,
        idempotencyKey: input.idempotencyKey,
        actorType: 'SYSTEM',
      },
    });
    return row;
  }

  const existing = await tx.inventoryItem.findUnique({
    where: { id: input.inventoryItemId },
  });
  if (!existing) {
    throw new InventoryInconsistencyError(
      `inventory item ${input.inventoryItemId} does not exist (zero-row reserve)`,
    );
  }
  if (!existing.trackInventory) {
    throw new InventoryInconsistencyError(
      `inventory item ${input.inventoryItemId} is untracked; untracked lines must be pre-branched, not reserved`,
    );
  }
  throw new OutOfStockError(input.inventoryItemId, input.quantity);
}

export interface ReleaseStockInput {
  inventoryItemId: string;
  quantity: number;
  idempotencyKey: string;
  orderId?: string | undefined;
  reservationId?: string | undefined;
}

export interface ExpireStockInput extends ReleaseStockInput {
  reservationId: string;
}

export interface ConsumeStockInput {
  inventoryItemId: string;
  quantity: number;
  idempotencyKey: string;
  orderId?: string | undefined;
  reservationId?: string | undefined;
}

async function loadMovement(
  tx: Prisma.TransactionClient,
  idempotencyKey: string,
): Promise<boolean> {
  const existing = await tx.stockMovement.findUnique({ where: { idempotencyKey } });
  return existing !== null;
}

/**
 * Release reserved units (cancel / payment failure). Predicate is reservedQty >= qty,
 * not availability — do not copy the reserve statement (architecture.md §5.3.1).
 */
export async function releaseTrackedStock(
  tx: Prisma.TransactionClient,
  input: ReleaseStockInput,
): Promise<InventoryRow | 'duplicate'> {
  if (input.quantity <= 0) {
    throw new Error('release quantity must be positive');
  }
  if (await loadMovement(tx, input.idempotencyKey)) {
    return 'duplicate';
  }

  const updated = await tx.$queryRaw<InventoryRow[]>`
    UPDATE inventory_items
       SET "reservedQty"   = "reservedQty" - ${input.quantity},
           "availableQty"  = "availableQty" + ${input.quantity},
           "isOutOfStock"  = ("availableQty" + ${input.quantity}) <= 0,
           "isLowStock"    = "trackInventory" AND ("availableQty" + ${input.quantity}) <= "lowStockThreshold",
           "version"       = "version" + 1,
           "updatedAt"     = now()
     WHERE id = ${input.inventoryItemId}
       AND "reservedQty" >= ${input.quantity}
    RETURNING id, "onHandQty", "reservedQty", "availableQty", "trackInventory"
  `;
  const row = updated[0];
  if (!row) {
    const existing = await tx.inventoryItem.findUnique({ where: { id: input.inventoryItemId } });
    if (!existing) {
      throw new InventoryInconsistencyError(
        `inventory item ${input.inventoryItemId} does not exist (zero-row release)`,
      );
    }
    throw new InventoryInconsistencyError(
      `inventory item ${input.inventoryItemId} cannot release ${input.quantity} (reservedQty=${existing.reservedQty})`,
    );
  }

  await tx.stockMovement.create({
    data: {
      inventoryItemId: input.inventoryItemId,
      type: 'RESERVATION_RELEASE',
      onHandDelta: 0,
      reservedDelta: -input.quantity,
      onHandAfter: row.onHandQty,
      reservedAfter: row.reservedQty,
      availableAfter: row.availableQty,
      orderId: input.orderId ?? null,
      reservationId: input.reservationId ?? null,
      idempotencyKey: input.idempotencyKey,
      actorType: 'SYSTEM',
    },
  });
  return row;
}

/**
 * Expire a HELD reservation whose expiresAt is in the past. The expiresAt predicate is what
 * keeps an extended payment-pending hold from being swept at 15 minutes.
 */
export async function expireTrackedStock(
  tx: Prisma.TransactionClient,
  input: ExpireStockInput,
): Promise<InventoryRow | 'duplicate' | 'not_due'> {
  if (input.quantity <= 0) {
    throw new Error('expire quantity must be positive');
  }
  if (await loadMovement(tx, input.idempotencyKey)) {
    return 'duplicate';
  }

  const reservation = await tx.$queryRaw<Array<{ id: string }>>`
    UPDATE stock_reservations
       SET status = 'EXPIRED',
           "releasedAt" = now(),
           "releaseReason" = 'TTL',
           "updatedAt" = now()
     WHERE id = ${input.reservationId}
       AND status = 'HELD'
       AND "expiresAt" < now()
    RETURNING id
  `;
  if (!reservation[0]) {
    return 'not_due';
  }

  const updated = await tx.$queryRaw<InventoryRow[]>`
    UPDATE inventory_items
       SET "reservedQty"   = "reservedQty" - ${input.quantity},
           "availableQty"  = "availableQty" + ${input.quantity},
           "isOutOfStock"  = ("availableQty" + ${input.quantity}) <= 0,
           "isLowStock"    = "trackInventory" AND ("availableQty" + ${input.quantity}) <= "lowStockThreshold",
           "version"       = "version" + 1,
           "updatedAt"     = now()
     WHERE id = ${input.inventoryItemId}
       AND "reservedQty" >= ${input.quantity}
    RETURNING id, "onHandQty", "reservedQty", "availableQty", "trackInventory"
  `;
  const row = updated[0];
  if (!row) {
    throw new InventoryInconsistencyError(
      `inventory item ${input.inventoryItemId} cannot expire ${input.quantity}`,
    );
  }

  await tx.stockMovement.create({
    data: {
      inventoryItemId: input.inventoryItemId,
      type: 'RESERVATION_EXPIRY',
      onHandDelta: 0,
      reservedDelta: -input.quantity,
      onHandAfter: row.onHandQty,
      reservedAfter: row.reservedQty,
      availableAfter: row.availableQty,
      orderId: input.orderId ?? null,
      reservationId: input.reservationId,
      idempotencyKey: input.idempotencyKey,
      actorType: 'SYSTEM',
    },
  });
  return row;
}

/**
 * Fulfilment: decrement on-hand and reserved together. Available is unchanged.
 */
export async function consumeTrackedStock(
  tx: Prisma.TransactionClient,
  input: ConsumeStockInput,
): Promise<InventoryRow | 'duplicate'> {
  if (input.quantity <= 0) {
    throw new Error('consume quantity must be positive');
  }
  if (await loadMovement(tx, input.idempotencyKey)) {
    return 'duplicate';
  }

  const updated = await tx.$queryRaw<InventoryRow[]>`
    UPDATE inventory_items
       SET "onHandQty"     = "onHandQty" - ${input.quantity},
           "reservedQty"   = "reservedQty" - ${input.quantity},
           "isOutOfStock"  = "availableQty" <= 0,
           "isLowStock"    = "trackInventory" AND "availableQty" <= "lowStockThreshold",
           "version"       = "version" + 1,
           "updatedAt"     = now()
     WHERE id = ${input.inventoryItemId}
       AND "onHandQty" >= ${input.quantity}
       AND "reservedQty" >= ${input.quantity}
    RETURNING id, "onHandQty", "reservedQty", "availableQty", "trackInventory"
  `;
  const row = updated[0];
  if (!row) {
    const existing = await tx.inventoryItem.findUnique({ where: { id: input.inventoryItemId } });
    if (!existing) {
      throw new InventoryInconsistencyError(
        `inventory item ${input.inventoryItemId} does not exist (zero-row consume)`,
      );
    }
    throw new InventoryInconsistencyError(
      `inventory item ${input.inventoryItemId} cannot consume ${input.quantity} ` +
        `(onHand=${existing.onHandQty}, reserved=${existing.reservedQty})`,
    );
  }

  await tx.stockMovement.create({
    data: {
      inventoryItemId: input.inventoryItemId,
      type: 'ORDER_FULFILMENT',
      onHandDelta: -input.quantity,
      reservedDelta: -input.quantity,
      onHandAfter: row.onHandQty,
      reservedAfter: row.reservedQty,
      availableAfter: row.availableQty,
      orderId: input.orderId ?? null,
      reservationId: input.reservationId ?? null,
      idempotencyKey: input.idempotencyKey,
      actorType: 'SYSTEM',
    },
  });
  return row;
}

export interface AdjustStockInput {
  inventoryItemId: string;
  onHandDelta: number;
  reason: string;
  idempotencyKey: string;
  actorAdminUserId?: string | undefined;
}

/**
 * Read-then-decide adjustment: SELECT … FOR UPDATE then UPDATE (architecture.md §5.3.1).
 */
export async function adjustTrackedStock(
  tx: Prisma.TransactionClient,
  input: AdjustStockInput,
): Promise<InventoryRow> {
  if (input.onHandDelta === 0) {
    throw new Error('adjustment delta must be non-zero');
  }
  if (!input.reason.trim()) {
    throw new Error('adjustment reason is mandatory');
  }
  if (await loadMovement(tx, input.idempotencyKey)) {
    const item = await tx.inventoryItem.findUniqueOrThrow({ where: { id: input.inventoryItemId } });
    return item;
  }

  const locked = await tx.$queryRaw<InventoryRow[]>`
    SELECT id, "onHandQty", "reservedQty", "availableQty", "trackInventory"
      FROM inventory_items
     WHERE id = ${input.inventoryItemId}
     FOR UPDATE
  `;
  const current = locked[0];
  if (!current) {
    throw new InventoryInconsistencyError(
      `inventory item ${input.inventoryItemId} does not exist (adjust)`,
    );
  }

  const updated = await tx.$queryRaw<InventoryRow[]>`
    UPDATE inventory_items
       SET "onHandQty"     = "onHandQty" + ${input.onHandDelta},
           "availableQty"  = "availableQty" + ${input.onHandDelta},
           "isOutOfStock"  = ("availableQty" + ${input.onHandDelta}) <= 0,
           "isLowStock"    = "trackInventory" AND ("availableQty" + ${input.onHandDelta}) <= "lowStockThreshold",
           "version"       = "version" + 1,
           "updatedAt"     = now()
     WHERE id = ${input.inventoryItemId}
       AND "onHandQty" + ${input.onHandDelta} >= 0
       AND "availableQty" + ${input.onHandDelta} >= 0
    RETURNING id, "onHandQty", "reservedQty", "availableQty", "trackInventory"
  `;
  const row = updated[0];
  if (!row) {
    throw new InventoryInconsistencyError(`inventory item ${input.inventoryItemId} adjust failed`);
  }

  await tx.stockMovement.create({
    data: {
      inventoryItemId: input.inventoryItemId,
      type: 'MANUAL_ADJUSTMENT',
      onHandDelta: input.onHandDelta,
      reservedDelta: 0,
      onHandAfter: row.onHandQty,
      reservedAfter: row.reservedQty,
      availableAfter: row.availableQty,
      reason: input.reason.trim(),
      idempotencyKey: input.idempotencyKey,
      actorType: input.actorAdminUserId ? 'ADMIN_USER' : 'SYSTEM',
      actorAdminUserId: input.actorAdminUserId ?? null,
    },
  });
  return row;
}
