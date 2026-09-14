import { PrismaPg } from '@prisma/adapter-pg';

import { Prisma, PrismaClient } from './generated/prisma/client.js';
import { installJsonSerializers } from './serialize.js';

installJsonSerializers();

const SOFT_DELETE_MODELS = new Set([
  'AdminUser',
  'Customer',
  'Address',
  'Category',
  'Product',
  'ProductVariant',
  'Collection',
  'MediaAsset',
]);

export interface CreatePrismaClientOptions {
  url?: string;
  /** Skip the soft-delete filter. Used by admin opt-out and by tests that assert deleted rows. */
  includeDeleted?: boolean;
}

function datasourceUrl(explicit?: string): string {
  const url = explicit ?? process.env['DATABASE_URL'];
  if (!url) {
    throw new Error('DATABASE_URL is required to construct PrismaClient');
  }
  return url;
}

/**
 * Prisma 7 requires a driver adapter. The client is constructed per-process; tests may
 * pass a different URL (e.g. kairos_app) to prove role grants.
 */
export function createPrismaClient(options: CreatePrismaClientOptions = {}): PrismaClient {
  const url = datasourceUrl(options.url);
  const adapter = new PrismaPg(url, { schema: 'public' });
  const client = new PrismaClient({ adapter });

  if (options.includeDeleted) {
    return client;
  }

  return client.$extends({
    name: 'softDelete',
    query: {
      $allModels: {
        async findMany({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        async findFirst({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
        async count({ model, args, query }) {
          if (SOFT_DELETE_MODELS.has(model)) {
            args.where = { deletedAt: null, ...args.where };
          }
          return query(args);
        },
      },
    },
  }) as unknown as PrismaClient;
}

export type KairosPrismaClient = ReturnType<typeof createPrismaClient>;

let singleton: PrismaClient | undefined;

/** Process-wide client for the API. Tests should call createPrismaClient themselves. */
export function getPrismaClient(): PrismaClient {
  singleton ??= createPrismaClient();
  return singleton;
}

export async function disconnectPrismaClient(): Promise<void> {
  if (singleton) {
    await singleton.$disconnect();
    singleton = undefined;
  }
}

export { Prisma, PrismaClient };
export type { PrismaClient as GeneratedPrismaClient };
