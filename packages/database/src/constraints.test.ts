import { execFileSync } from 'node:child_process';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { ensureSeeded, testPrisma, disconnectTestPrisma } from './test-support.js';

const EXPECTED_CHECKS = [
  'order_items_money_nonneg',
  'order_items_line_math',
  'orders_total_math',
  'orders_inclusive_tax_bound',
  'orders_delivery_tax_bound',
  'order_items_tax_bounds',
  'order_tax_lines_bounds',
  'tax_rates_bounds',
  'refunds_tax_bound',
  'inventory_nonneg',
  'inventory_available_math',
  'inventory_flags_math',
  'stock_movements_reason_required',
  'stock_movements_not_noop',
  'discounts_value_range',
  'discounts_window',
  'reviews_rating_range',
  'testimonials_rating_range',
  'refresh_tokens_subject_xor',
  'auth_tokens_subject_xor',
  'notifications_recipient_xor',
  'collections_rule_mode',
  'media_assets_alt_required',
  'delivery_eta_order',
  'orders_currency_xof',
  'payments_currency_xof',
];

const EXPECTED_PARTIAL_INDEXES = [
  'product_variants_one_default',
  'carts_one_active_per_customer',
  'stock_reservations_one_held_per_item',
  'addresses_one_default_shipping',
  'addresses_one_default_billing',
  'product_images_one_primary',
  'tax_categories_one_default',
  'tax_rates_one_current',
];

const EXPECTED_TRIGRAM_INDEXES = [
  'products_name_trgm',
  'customers_name_trgm',
  'orders_reference_trgm',
  'discounts_code_trgm',
  'static_pages_title_trgm',
];

const EXPECTED_TRIGGERS = [
  'trg_stock_movements_append_only',
  'trg_audit_logs_append_only',
  'trg_order_status_history_append_only',
  'trg_inventory_requires_ledger',
  'trg_order_items_immutable',
  'trg_reviews_eligibility',
  'trg_customer_segments_protect_system',
  'trg_orders_claim_requires_verification',
];

const EXPECTED_COMPOSITE_FKS = [
  'reviews_orderitem_product_fk',
  'reviews_order_customer_fk',
  'reviews_orderitem_order_fk',
];

const ALLOWED_DRIFT = [
  'reviews_order_customer_fk',
  'reviews_orderitem_order_fk',
  'reviews_orderitem_product_fk',
  'discounts_code_trgm',
  'orders_reference_trgm',
  'products_name_trgm',
  'static_pages_title_trgm',
  'customers_name_trgm',
];

describe('integrity objects after migrate deploy', () => {
  beforeAll(async () => {
    await ensureSeeded();
  });

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it('has every CHECK named in data-model §9.1', async () => {
    const rows = await testPrisma().$queryRaw<Array<{ conname: string }>>`
      SELECT conname FROM pg_constraint WHERE contype = 'c'
    `;
    const names = new Set(rows.map((row) => row.conname));
    for (const name of EXPECTED_CHECKS) {
      expect(names.has(name), name).toBe(true);
    }
  });

  it('has every partial unique index from §9.2', async () => {
    const rows = await testPrisma().$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
    `;
    const names = new Set(rows.map((row) => row.indexname));
    for (const name of EXPECTED_PARTIAL_INDEXES) {
      expect(names.has(name), name).toBe(true);
    }
    for (const name of EXPECTED_TRIGRAM_INDEXES) {
      expect(names.has(name), name).toBe(true);
    }
  });

  it('has named query indexes from §8', async () => {
    const rows = await testPrisma().$queryRaw<Array<{ indexname: string }>>`
      SELECT indexname FROM pg_indexes WHERE schemaname = 'public'
    `;
    const names = new Set(rows.map((row) => row.indexname));
    expect(names.has('orders_status_placedAt_idx')).toBe(true);
    expect(names.has('stock_reservations_status_expiresAt_idx')).toBe(true);
    expect(names.has('outbox_events_status_availableAt_idx')).toBe(true);
    expect(names.has('inventory_items_isLowStock_idx')).toBe(true);
  });

  it('has Prisma foreign keys plus the three review composite FKs', async () => {
    const rows = await testPrisma().$queryRaw<Array<{ conname: string }>>`
      SELECT conname FROM pg_constraint WHERE contype = 'f'
    `;
    const names = new Set(rows.map((row) => row.conname));
    for (const name of EXPECTED_COMPOSITE_FKS) {
      expect(names.has(name), name).toBe(true);
    }
    expect(names.has('order_items_productId_fkey')).toBe(true);
    expect(names.has('inventory_items_variantId_fkey')).toBe(true);
  });

  it('has every trigger from §9.4', async () => {
    const rows = await testPrisma().$queryRaw<Array<{ tgname: string }>>`
      SELECT tgname FROM pg_trigger WHERE NOT tgisinternal
    `;
    const names = new Set(rows.map((row) => row.tgname));
    for (const name of EXPECTED_TRIGGERS) {
      expect(names.has(name), name).toBe(true);
    }
  });

  it('rejects a negative inventory write via CHECK', async () => {
    await expect(
      testPrisma().$executeRaw`
        SELECT set_config('kairos.inventory_ledger', 'on', true);
        UPDATE inventory_items SET "onHandQty" = -1, "availableQty" = -1 WHERE false
      `,
    ).resolves.toBeDefined();

    const category = await testPrisma().category.findFirstOrThrow();
    await expect(
      testPrisma().$transaction(async (tx) => {
        await tx.$executeRaw`SELECT set_config('kairos.inventory_ledger', 'on', true)`;
        const product = await tx.product.create({
          data: {
            name: '[TEST] neg',
            slug: `neg-${Date.now()}`,
            categoryId: category.id,
          },
        });
        const variant = await tx.productVariant.create({
          data: { productId: product.id, sku: `NEG-${Date.now()}`, price: 1, isDefault: true },
        });
        await tx.inventoryItem.create({
          data: {
            variantId: variant.id,
            onHandQty: -1,
            reservedQty: 0,
            availableQty: -1,
            isOutOfStock: true,
            isLowStock: true,
          },
        });
      }),
    ).rejects.toThrow(/inventory_nonneg/);
  });

  it('rejects an INCLUSIVE order whose grandTotal adds tax', async () => {
    await expect(
      testPrisma().order.create({
        data: {
          reference: `KD-BAD-${Date.now()}`,
          email: 'bad@example.test',
          phone: '+22600000000',
          firstName: 'Bad',
          lastName: 'Total',
          subtotal: 1000,
          discountTotal: 0,
          deliveryTotal: 0,
          taxTotal: 180,
          grandTotal: 1180,
          taxMode: 'INCLUSIVE',
          deliveryZoneName: 'x',
          deliveryMethodName: 'x',
          deliveryFeeSnapshot: 0,
        },
      }),
    ).rejects.toThrow(/orders_total_math/);
  });
});

describe('migrate diff drift', () => {
  it('only drops known hand-written extras Prisma cannot model', () => {
    const script = execFileSync(
      join(process.cwd(), 'node_modules/.bin/prisma'),
      [
        'migrate',
        'diff',
        '--from-migrations',
        'prisma/migrations',
        '--to-schema',
        'prisma/schema',
        '--script',
      ],
      {
        encoding: 'utf8',
        env: process.env,
        cwd: process.cwd(),
      },
    );

    const unexpected: string[] = [];
    for (const line of script.split('\n')) {
      const trimmed = line.trim();
      if (
        trimmed.length === 0 ||
        trimmed.startsWith('--') ||
        trimmed.startsWith('Loaded ') ||
        trimmed.startsWith('Prisma ')
      ) {
        continue;
      }
      const allowed = ALLOWED_DRIFT.some(
        (name) => trimmed.includes(`"${name}"`) || trimmed.includes(name),
      );
      const isDrop =
        /^(ALTER TABLE|DROP INDEX|DROP CONSTRAINT|DROP FOREIGN KEY)/i.test(trimmed) ||
        (trimmed.startsWith('ALTER TABLE') && /DROP CONSTRAINT/i.test(trimmed));
      if (trimmed.startsWith('ALTER TABLE') && /DROP CONSTRAINT/i.test(trimmed) && allowed)
        continue;
      if (trimmed.startsWith('DROP INDEX') && allowed) continue;
      if (isDrop && allowed) continue;
      unexpected.push(trimmed);
    }

    expect(unexpected).toEqual([]);
  });
});
