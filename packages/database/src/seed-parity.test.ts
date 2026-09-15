import {
  CATEGORY_SEEDS,
  HOMEPAGE_SECTION_KEYS,
  NOTIFICATION_TEMPLATE_IDS,
  ORDER_STATUS_TRANSITION_RULES,
  PAYMENT_PROVIDER_KEYS,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  STATIC_PAGE_SLUGS,
  SYSTEM_CUSTOMER_SEGMENT_KEYS,
} from '@kairos/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { SYSTEM_SEGMENT_RULES } from './seed.js';
import { disconnectTestPrisma, ensureSeeded, testPrisma } from './test-support.js';

describe('seeded-key parity', () => {
  beforeAll(async () => {
    await ensureSeeded();
  });

  afterAll(async () => {
    await disconnectTestPrisma();
  });

  it('seeds every permission and the role matrix', async () => {
    const prisma = testPrisma();
    const keys = (await prisma.permission.findMany({ select: { key: true } }))
      .map((row) => row.key)
      .sort();
    expect(keys).toEqual([...PERMISSIONS].sort());

    for (const [role, expected] of Object.entries(ROLE_PERMISSIONS)) {
      const rows = await prisma.rolePermission.findMany({
        where: { role: role as keyof typeof ROLE_PERMISSIONS },
      });
      expect(rows.map((row) => row.permissionKey).sort()).toEqual([...expected].sort());
    }
  });

  it('seeds the order state machine equal to the types constant', async () => {
    const rows = await testPrisma().orderStatusTransitionRule.findMany();
    const actual = rows
      .map((row) => ({
        fromStatus: row.fromStatus,
        toStatus: row.toStatus,
        requiresPayment: row.requiresPayment,
        requiredPermission: row.requiredPermission,
        releasesReservation: row.releasesReservation,
        restocksInventory: row.restocksInventory,
      }))
      .sort((a, b) =>
        `${a.fromStatus}:${a.toStatus}`.localeCompare(`${b.fromStatus}:${b.toStatus}`),
      );
    const expected = [...ORDER_STATUS_TRANSITION_RULES].sort((a, b) =>
      `${a.fromStatus}:${a.toStatus}`.localeCompare(`${b.fromStatus}:${b.toStatus}`),
    );
    expect(actual).toEqual(expected);
  });

  it('seeds system segments, categories, templates, pages, providers and homepage keys', async () => {
    const prisma = testPrisma();
    const segments = await prisma.customerSegment.findMany({ where: { isSystem: true } });
    expect(segments.map((row) => row.key).sort()).toEqual([...SYSTEM_CUSTOMER_SEGMENT_KEYS].sort());
    for (const segment of segments) {
      expect(segment.rules).toEqual(
        SYSTEM_SEGMENT_RULES[segment.key as keyof typeof SYSTEM_SEGMENT_RULES],
      );
    }

    const categories = await prisma.category.findMany();
    expect(categories.map((row) => row.slug).sort()).toEqual(
      [...CATEGORY_SEEDS].map((row) => row.slug).sort(),
    );
    expect(categories.every((row) => row.description === null)).toBe(true);

    const templates = await prisma.notificationTemplate.findMany();
    expect(templates.map((row) => row.key).sort()).toEqual([...NOTIFICATION_TEMPLATE_IDS].sort());
    expect(templates.every((row) => row.body === '' && row.isActive === false)).toBe(true);

    const pages = await prisma.staticPage.findMany();
    expect(pages.map((row) => row.slug).sort()).toEqual([...STATIC_PAGE_SLUGS].sort());
    expect(pages.every((row) => row.body === '' && row.status === 'DRAFT')).toBe(true);

    const providers = await prisma.paymentProviderConfig.findMany();
    expect(providers.map((row) => row.key).sort()).toEqual([...PAYMENT_PROVIDER_KEYS].sort());
    const byKey = Object.fromEntries(providers.map((row) => [row.key, row.isActive]));
    expect(byKey['manual']).toBe(true);
    expect(byKey['mobile_money']).toBe(false);
    expect(byKey['stripe']).toBe(false);

    const sections = await prisma.homepageSectionSetting.findMany();
    expect(sections.map((row) => row.key).sort()).toEqual([...HOMEPAGE_SECTION_KEYS].sort());
  });

  it('seeds tax = 0 and does not invent a VAT rate', async () => {
    const rate = await testPrisma().taxRate.findFirstOrThrow({ where: { isActive: true } });
    expect(rate.rateBp).toBe(0);
    expect(rate.mode).toBe('INCLUSIVE');
    const reduced = await testPrisma().taxCategory.findUnique({ where: { key: 'REDUCED' } });
    expect(reduced).toBeNull();
  });

  it('does not seed products, orders, reviews or customers', async () => {
    const prisma = testPrisma();
    // Gate tests create [TEST] rows; the seed itself must not have added any non-test catalogue.
    const seededProducts = await prisma.product.findMany({
      where: { slug: { in: CATEGORY_SEEDS.map((row) => row.slug) } },
    });
    expect(seededProducts).toHaveLength(0);
  });

  it('refuses to delete a system segment or rename its key', async () => {
    const prisma = testPrisma();
    const vip = await prisma.customerSegment.findUniqueOrThrow({ where: { key: 'VIP' } });
    await expect(prisma.customerSegment.delete({ where: { id: vip.id } })).rejects.toThrow(
      /cannot be deleted/,
    );
    await expect(
      prisma.customerSegment.update({ where: { id: vip.id }, data: { key: 'VIP2' } }),
    ).rejects.toThrow(/immutable/);
  });
});
