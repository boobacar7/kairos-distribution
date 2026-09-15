export { installJsonSerializers } from './serialize.js';
export {
  createPrismaClient,
  getPrismaClient,
  disconnectPrismaClient,
  Prisma,
  PrismaClient,
  type CreatePrismaClientOptions,
  type KairosPrismaClient,
} from './client.js';
export {
  INVENTORY_LEDGER_GUC,
  OutOfStockError,
  InventoryInconsistencyError,
  assertReadCommitted,
  enableInventoryLedger,
  withInventoryTransaction,
  reserveTrackedStock,
  releaseTrackedStock,
  expireTrackedStock,
  consumeTrackedStock,
  adjustTrackedStock,
  type ReserveStockInput,
  type ReleaseStockInput,
  type ExpireStockInput,
  type ConsumeStockInput,
  type AdjustStockInput,
  type InventoryRow,
} from './inventory.js';
export {
  ORDER_REFERENCE_SCOPE,
  INVOICE_REFERENCE_SCOPE,
  DEFAULT_ORDER_PREFIX,
  ORDER_COUNTER_MAX,
  OrderReferenceOverflowError,
  formatOrderReference,
  allocateSequenceValue,
  allocateOrderReference,
} from './order-reference.js';
export {
  GUEST_CLAIM_TOKEN_BYTES,
  DEFAULT_GUEST_CLAIM_TTL_DAYS,
  GuestClaimError,
  generateGuestClaimToken,
  hashGuestClaimToken,
  claimGuestOrder,
  assertTokenNotDerivedFromReference,
} from './guest-claim.js';
export { seedReference, seedDev, runSeed, type SeedProfile } from './seed.js';

/** Placeholder from the Phase 1 shell, kept so existing imports do not break. */
export const DATABASE_PACKAGE_READY = true;
