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
  orderId?: string;
  reservationId?: string;
}

interface InventoryRow {
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
