import { randomBytes, scryptSync } from 'node:crypto';

import {
  CATEGORY_SEEDS,
  HOMEPAGE_SECTION_KEYS,
  INVENTORY_SETTING_DEFAULTS,
  INVENTORY_SETTING_KEYS,
  CART_SETTING_DEFAULTS,
  CART_SETTING_KEYS,
  NOTIFICATION_TEMPLATE_IDS,
  ORDER_SETTING_DEFAULTS,
  ORDER_SETTING_KEYS,
  ORDER_STATUS_TRANSITION_RULES,
  PAYMENT_PROVIDER_KEYS,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  SEGMENT_THRESHOLD_DEFAULTS,
  SEGMENT_THRESHOLD_SETTING_KEYS,
  STATIC_PAGE_SLUGS,
  SYSTEM_CUSTOMER_SEGMENT_KEYS,
  TAX_SETTING_DEFAULTS,
  TAX_SETTING_KEYS,
  type NotificationAudience,
  type NotificationChannel,
  type NotificationTemplateId,
  type Permission,
} from '@kairos/types';

import { createPrismaClient, type PrismaClient } from './client.js';

const PERMISSION_META: Record<Permission, { group: string; label: string; description: string }> = {
  'orders:read': {
    group: 'orders',
    label: 'Consulter les commandes',
    description: 'Voir la liste et le détail des commandes',
  },
  'orders:update_status': {
    group: 'orders',
    label: 'Modifier le statut d’une commande',
    description: 'Faire avancer une commande dans le cycle de vie',
  },
  'orders:refund': {
    group: 'orders',
    label: 'Rembourser une commande',
    description: 'Approuver et exécuter un remboursement',
  },
  'orders:export': {
    group: 'orders',
    label: 'Exporter les commandes',
    description: 'Télécharger un export de commandes',
  },
  'products:read': {
    group: 'products',
    label: 'Consulter le catalogue',
    description: 'Voir les produits et variantes',
  },
  'products:write': {
    group: 'products',
    label: 'Modifier le catalogue',
    description: 'Créer et modifier des produits',
  },
  'products:delete': {
    group: 'products',
    label: 'Supprimer un produit',
    description: 'Archiver ou supprimer un produit lorsqu’il est sûr de le faire',
  },
  'inventory:read': {
    group: 'inventory',
    label: 'Consulter le stock',
    description: 'Voir les quantités et mouvements',
  },
  'inventory:adjust': {
    group: 'inventory',
    label: 'Ajuster le stock',
    description: 'Saisir un ajustement manuel avec motif',
  },
  'customers:read': {
    group: 'customers',
    label: 'Consulter les clientes',
    description: 'Voir les comptes clientes',
  },
  'customers:write': {
    group: 'customers',
    label: 'Modifier une cliente',
    description: 'Mettre à jour un compte cliente',
  },
  'reviews:moderate': {
    group: 'reviews',
    label: 'Modérer les avis',
    description: 'Approuver, refuser ou mettre en avant un avis',
  },
  'content:write': {
    group: 'content',
    label: 'Modifier le contenu',
    description: 'Gérer CMS, pages et mise en avant',
  },
  'media:write': {
    group: 'media',
    label: 'Gérer les médias',
    description: 'Téléverser et supprimer des fichiers',
  },
  'marketing:write': {
    group: 'marketing',
    label: 'Gérer le marketing',
    description: 'Codes promo, campagnes et segments',
  },
  'analytics:read': {
    group: 'analytics',
    label: 'Consulter les statistiques',
    description: 'Voir le tableau de bord et les rapports',
  },
  'delivery:configure': {
    group: 'delivery',
    label: 'Configurer la livraison',
    description: 'Zones, méthodes et tarifs',
  },
  'payments:read': {
    group: 'payments',
    label: 'Consulter les paiements',
    description: 'Voir les transactions',
  },
  'payments:configure': {
    group: 'payments',
    label: 'Configurer les paiements',
    description: 'Activer un fournisseur ; lire un corps de webhook chiffré',
  },
  'users:read': {
    group: 'users',
    label: 'Consulter les administrateurs',
    description: 'Voir les comptes admin',
  },
  'users:manage': {
    group: 'users',
    label: 'Gérer les administrateurs',
    description: 'Inviter, suspendre, attribuer des rôles',
  },
  'settings:write': {
    group: 'settings',
    label: 'Modifier les paramètres',
    description: 'Paramètres du site',
  },
  'audit:read': {
    group: 'audit',
    label: 'Consulter le journal d’audit',
    description: 'Lire l’historique des actions',
  },
};

const STATIC_PAGE_TITLES: Record<(typeof STATIC_PAGE_SLUGS)[number], string> = {
  faq: 'FAQ',
  livraison: 'Livraison',
  retours: 'Retours',
  confidentialite: 'Confidentialité',
  conditions: 'Conditions générales',
  contact: 'Contact',
};

const HOMEPAGE_LABELS: Record<(typeof HOMEPAGE_SECTION_KEYS)[number], string> = {
  HERO: 'Hero',
  TRUST_BAR: 'Barre de confiance',
  CATEGORIES: 'Catégories',
  PRODUITS_PHARES: 'Produits phares',
  INCONTOURNABLES: 'Incontournables',
  AVIS_VERIFIES: 'Avis vérifiés',
  PROMO_BANNER: 'Bannière promo',
  TESTIMONIALS: 'Témoignages',
  FAQ: 'FAQ',
};

const TEMPLATE_META: Record<
  NotificationTemplateId,
  { channel: NotificationChannel; audience: NotificationAudience }
> = {
  'order.created': { channel: 'EMAIL', audience: 'CUSTOMER' },
  'order.payment_confirmed': { channel: 'EMAIL', audience: 'CUSTOMER' },
  'order.confirmed': { channel: 'EMAIL', audience: 'CUSTOMER' },
  'order.shipped': { channel: 'EMAIL', audience: 'CUSTOMER' },
  'order.delivered': { channel: 'EMAIL', audience: 'CUSTOMER' },
  'order.cancelled': { channel: 'EMAIL', audience: 'CUSTOMER' },
  'admin.new_order': { channel: 'EMAIL', audience: 'ADMIN' },
  'admin.low_stock': { channel: 'EMAIL', audience: 'ADMIN' },
  'admin.out_of_stock': { channel: 'EMAIL', audience: 'ADMIN' },
  'admin.review_pending': { channel: 'EMAIL', audience: 'ADMIN' },
  'admin.payment_failed': { channel: 'EMAIL', audience: 'ADMIN' },
  'admin.refund_requested': { channel: 'EMAIL', audience: 'ADMIN' },
};

const PAYMENT_PROVIDER_SEED: Record<
  (typeof PAYMENT_PROVIDER_KEYS)[number],
  {
    displayName: string;
    position: number;
    capabilities: {
      refunds: boolean;
      partialRefunds: boolean;
      webhooks: boolean;
      requiresRedirect: boolean;
      pollableStatus: boolean;
    };
    publicConfig: { vaultWebhookPayloads: boolean; vaultTtlDays: number };
    secretRef: string | null;
  }
> = {
  manual: {
    displayName: 'Paiement manuel',
    position: 0,
    capabilities: {
      refunds: true,
      partialRefunds: true,
      webhooks: false,
      requiresRedirect: false,
      pollableStatus: false,
    },
    publicConfig: { vaultWebhookPayloads: false, vaultTtlDays: 7 },
    secretRef: null,
  },
  mobile_money: {
    displayName: 'Mobile Money',
    position: 1,
    capabilities: {
      refunds: false,
      partialRefunds: false,
      webhooks: true,
      requiresRedirect: true,
      pollableStatus: true,
    },
    publicConfig: { vaultWebhookPayloads: true, vaultTtlDays: 7 },
    secretRef: 'PAYMENT_MOBILE_MONEY_SECRET',
  },
  stripe: {
    displayName: 'Stripe',
    position: 2,
    capabilities: {
      refunds: true,
      partialRefunds: true,
      webhooks: true,
      requiresRedirect: true,
      pollableStatus: true,
    },
    publicConfig: { vaultWebhookPayloads: false, vaultTtlDays: 7 },
    secretRef: 'STRIPE_SECRET_KEY',
  },
};

/**
 * Segment rule payloads. Thresholds are also stored as SiteSetting rows so a change is a
 * data edit. IS_NOT_NULL is an additive operator relative to data-model.md §6.8.1 so the
 * confirmed "never-purchasers are not INACTIVE" rule is configuration, not evaluator luck.
 *
 * VIP and HIGH_VALUE overlap intentionally (confirmed §5).
 * LOYAL reads Customer.ordersCount, which excludes fully refunded orders.
 */
export const SYSTEM_SEGMENT_RULES: Record<(typeof SYSTEM_CUSTOMER_SEGMENT_KEYS)[number], object> = {
  VIP: {
    version: 1,
    match: 'ALL',
    conditions: [{ field: 'totalSpent', operator: 'GTE', value: 200_000 }],
  },
  HIGH_VALUE: {
    version: 1,
    match: 'ALL',
    conditions: [{ field: 'totalSpent', operator: 'GTE', value: 100_000 }],
  },
  LOYAL: {
    version: 1,
    match: 'ALL',
    conditions: [{ field: 'ordersCount', operator: 'GTE', value: 5 }],
  },
  NEW_CUSTOMER: {
    version: 1,
    match: 'ANY',
    conditions: [
      { field: 'firstOrderAt', operator: 'WITHIN_LAST_DAYS', value: 30 },
      { field: 'accountCreatedAt', operator: 'WITHIN_LAST_DAYS', value: 30 },
    ],
  },
  INACTIVE: {
    version: 1,
    match: 'ALL',
    conditions: [
      { field: 'lastOrderAt', operator: 'IS_NOT_NULL' },
      { field: 'lastOrderAt', operator: 'NOT_WITHIN_LAST_DAYS', value: 90 },
    ],
  },
};

const SEGMENT_NAMES: Record<(typeof SYSTEM_CUSTOMER_SEGMENT_KEYS)[number], string> = {
  VIP: 'VIP',
  HIGH_VALUE: 'High value',
  LOYAL: 'Fidèle',
  NEW_CUSTOMER: 'Nouvelle cliente',
  INACTIVE: 'Inactive',
};

function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 32);
  return `scrypt:${salt.toString('base64')}:${hash.toString('base64')}`;
}

export async function seedReference(prisma: PrismaClient): Promise<void> {
  for (const key of PERMISSIONS) {
    const meta = PERMISSION_META[key];
    await prisma.permission.upsert({
      where: { key },
      create: { key, ...meta },
      update: { ...meta },
    });
  }

  for (const [role, keys] of Object.entries(ROLE_PERMISSIONS)) {
    for (const permissionKey of keys) {
      await prisma.rolePermission.upsert({
        where: {
          role_permissionKey: { role: role as keyof typeof ROLE_PERMISSIONS, permissionKey },
        },
        create: { role: role as keyof typeof ROLE_PERMISSIONS, permissionKey },
        update: {},
      });
    }
  }

  for (const rule of ORDER_STATUS_TRANSITION_RULES) {
    await prisma.orderStatusTransitionRule.upsert({
      where: { fromStatus_toStatus: { fromStatus: rule.fromStatus, toStatus: rule.toStatus } },
      create: { ...rule },
      update: {
        requiresPayment: rule.requiresPayment,
        requiredPermission: rule.requiredPermission,
        releasesReservation: rule.releasesReservation,
        restocksInventory: rule.restocksInventory,
      },
    });
  }

  for (const [index, category] of CATEGORY_SEEDS.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: { slug: category.slug, name: category.name, position: index, isActive: true },
      update: { name: category.name, position: index },
    });
  }

  for (const key of SYSTEM_CUSTOMER_SEGMENT_KEYS) {
    await prisma.customerSegment.upsert({
      where: { key },
      create: {
        key,
        name: SEGMENT_NAMES[key],
        type: 'RULE_BASED',
        isSystem: true,
        rules: SYSTEM_SEGMENT_RULES[key] as object,
      },
      update: {
        name: SEGMENT_NAMES[key],
        rules: SYSTEM_SEGMENT_RULES[key] as object,
        isSystem: true,
      },
    });
  }

  const taxCategory = await prisma.taxCategory.upsert({
    where: { key: 'STANDARD' },
    create: {
      key: 'STANDARD',
      name: 'Standard',
      isDefault: true,
      isSystem: true,
    },
    update: { name: 'Standard', isDefault: true, isSystem: true },
  });

  const taxZone = await prisma.taxZone.upsert({
    where: { key: 'BF' },
    create: {
      key: 'BF',
      name: 'Burkina Faso',
      countryCode: 'BF',
      isActive: true,
      priority: 0,
    },
    update: { name: 'Burkina Faso', countryCode: 'BF' },
  });

  const existingRate = await prisma.taxRate.findFirst({
    where: {
      taxZoneId: taxZone.id,
      taxCategoryId: taxCategory.id,
      effectiveTo: null,
      isActive: true,
    },
  });
  if (!existingRate) {
    await prisma.taxRate.create({
      data: {
        taxZoneId: taxZone.id,
        taxCategoryId: taxCategory.id,
        name: 'Exonéré (lancement)',
        rateBp: 0,
        mode: 'INCLUSIVE',
        appliesToDelivery: false,
        effectiveFrom: new Date('2026-01-01T00:00:00.000Z'),
        isActive: true,
      },
    });
  }

  for (const [index, key] of HOMEPAGE_SECTION_KEYS.entries()) {
    await prisma.homepageSectionSetting.upsert({
      where: { key },
      create: { key, label: HOMEPAGE_LABELS[key], isEnabled: true, position: index },
      update: { label: HOMEPAGE_LABELS[key], position: index },
    });
  }

  for (const slug of STATIC_PAGE_SLUGS) {
    await prisma.staticPage.upsert({
      where: { slug },
      create: { slug, title: STATIC_PAGE_TITLES[slug], body: '', status: 'DRAFT' },
      update: { title: STATIC_PAGE_TITLES[slug] },
    });
  }

  for (const key of NOTIFICATION_TEMPLATE_IDS) {
    const meta = TEMPLATE_META[key];
    await prisma.notificationTemplate.upsert({
      where: { key },
      create: {
        key,
        channel: meta.channel,
        audience: meta.audience,
        locale: 'fr',
        body: '',
        isActive: false,
      },
      update: { channel: meta.channel, audience: meta.audience },
    });
  }

  for (const key of PAYMENT_PROVIDER_KEYS) {
    const seed = PAYMENT_PROVIDER_SEED[key];
    await prisma.paymentProviderConfig.upsert({
      where: { key },
      create: {
        key,
        displayName: seed.displayName,
        isActive: false,
        position: seed.position,
        capabilities: seed.capabilities,
        publicConfig: seed.publicConfig,
        secretRef: seed.secretRef,
      },
      update: {
        displayName: seed.displayName,
        position: seed.position,
        capabilities: seed.capabilities,
        publicConfig: seed.publicConfig,
        secretRef: seed.secretRef,
      },
    });
  }

  const settings: Array<{ key: string; group: string; value: unknown }> = [
    {
      key: INVENTORY_SETTING_KEYS.RESERVATION_TTL_MINUTES,
      group: 'inventory',
      value: INVENTORY_SETTING_DEFAULTS[INVENTORY_SETTING_KEYS.RESERVATION_TTL_MINUTES],
    },
    {
      key: INVENTORY_SETTING_KEYS.DEFAULT_LOW_STOCK_THRESHOLD,
      group: 'inventory',
      value: INVENTORY_SETTING_DEFAULTS[INVENTORY_SETTING_KEYS.DEFAULT_LOW_STOCK_THRESHOLD],
    },
    {
      key: CART_SETTING_KEYS.TTL_DAYS,
      group: 'cart',
      value: CART_SETTING_DEFAULTS[CART_SETTING_KEYS.TTL_DAYS],
    },
    {
      key: ORDER_SETTING_KEYS.REFERENCE_PREFIX,
      group: 'orders',
      value: ORDER_SETTING_DEFAULTS[ORDER_SETTING_KEYS.REFERENCE_PREFIX],
    },
    {
      key: ORDER_SETTING_KEYS.GUEST_CLAIM_TOKEN_TTL_DAYS,
      group: 'orders',
      value: ORDER_SETTING_DEFAULTS[ORDER_SETTING_KEYS.GUEST_CLAIM_TOKEN_TTL_DAYS],
    },
    {
      key: TAX_SETTING_KEYS.DEFAULT_ZONE_KEY,
      group: 'tax',
      value: TAX_SETTING_DEFAULTS[TAX_SETTING_KEYS.DEFAULT_ZONE_KEY],
    },
    {
      key: TAX_SETTING_KEYS.DEFAULT_MODE,
      group: 'tax',
      value: TAX_SETTING_DEFAULTS[TAX_SETTING_KEYS.DEFAULT_MODE],
    },
    {
      key: SEGMENT_THRESHOLD_SETTING_KEYS.VIP_MIN_TOTAL_SPENT_XOF,
      group: 'segments',
      value: SEGMENT_THRESHOLD_DEFAULTS[SEGMENT_THRESHOLD_SETTING_KEYS.VIP_MIN_TOTAL_SPENT_XOF],
    },
    {
      key: SEGMENT_THRESHOLD_SETTING_KEYS.HIGH_VALUE_MIN_TOTAL_SPENT_XOF,
      group: 'segments',
      value:
        SEGMENT_THRESHOLD_DEFAULTS[SEGMENT_THRESHOLD_SETTING_KEYS.HIGH_VALUE_MIN_TOTAL_SPENT_XOF],
    },
    {
      key: SEGMENT_THRESHOLD_SETTING_KEYS.LOYAL_MIN_ORDER_COUNT,
      group: 'segments',
      value: SEGMENT_THRESHOLD_DEFAULTS[SEGMENT_THRESHOLD_SETTING_KEYS.LOYAL_MIN_ORDER_COUNT],
    },
    {
      key: SEGMENT_THRESHOLD_SETTING_KEYS.NEW_CUSTOMER_MAX_ACCOUNT_AGE_DAYS,
      group: 'segments',
      value:
        SEGMENT_THRESHOLD_DEFAULTS[
          SEGMENT_THRESHOLD_SETTING_KEYS.NEW_CUSTOMER_MAX_ACCOUNT_AGE_DAYS
        ],
    },
    {
      key: SEGMENT_THRESHOLD_SETTING_KEYS.INACTIVE_MIN_DAYS_SINCE_LAST_ORDER,
      group: 'segments',
      value:
        SEGMENT_THRESHOLD_DEFAULTS[
          SEGMENT_THRESHOLD_SETTING_KEYS.INACTIVE_MIN_DAYS_SINCE_LAST_ORDER
        ],
    },
    { key: 'contact.email', group: 'contact', value: '' },
    { key: 'contact.phone', group: 'contact', value: '' },
    { key: 'contact.whatsapp', group: 'contact', value: '' },
  ];

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      create: { key: setting.key, group: setting.group, value: setting.value as object },
      update: { group: setting.group, value: setting.value as object },
    });
  }
}

export async function seedDev(prisma: PrismaClient): Promise<void> {
  const email = process.env['SEED_ADMIN_EMAIL'];
  const password = process.env['SEED_ADMIN_PASSWORD'];
  if (!email || !password) {
    throw new Error(
      'SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD must be set to seed a SUPER_ADMIN. No default password exists in the repository.',
    );
  }

  await prisma.adminUser.upsert({
    where: { email },
    create: {
      email,
      passwordHash: hashPassword(password),
      firstName: 'Dev',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
    },
    update: { role: 'SUPER_ADMIN', status: 'ACTIVE' },
  });

  const zone = await prisma.deliveryZone.upsert({
    where: { slug: 'ouagadougou' },
    create: {
      name: 'Ouagadougou',
      slug: 'ouagadougou',
      city: 'Ouagadougou',
      countryCode: 'BF',
      description: 'exemple — à confirmer',
      isActive: false,
      position: 0,
    },
    update: { description: 'exemple — à confirmer', isActive: false },
  });

  await prisma.deliveryMethod.upsert({
    where: { zoneId_code: { zoneId: zone.id, code: 'STANDARD' } },
    create: {
      zoneId: zone.id,
      code: 'STANDARD',
      name: 'Standard',
      description: 'exemple — à confirmer',
      fee: 1500,
      estimatedMinHours: 24,
      estimatedMaxHours: 72,
      isActive: false,
      position: 0,
    },
    update: { description: 'exemple — à confirmer', isActive: false },
  });

  await prisma.deliveryMethod.upsert({
    where: { zoneId_code: { zoneId: zone.id, code: 'EXPRESS' } },
    create: {
      zoneId: zone.id,
      code: 'EXPRESS',
      name: 'Express',
      description: 'exemple — à confirmer',
      fee: 3000,
      estimatedMinHours: 4,
      estimatedMaxHours: 24,
      isActive: false,
      position: 1,
    },
    update: { description: 'exemple — à confirmer', isActive: false },
  });
}

export type SeedProfile = 'reference' | 'dev';

export async function runSeed(profile: SeedProfile = 'reference'): Promise<void> {
  if (profile === 'dev' && process.env['NODE_ENV'] === 'production') {
    throw new Error('The dev seed profile must never run in production');
  }
  const prisma = createPrismaClient({ includeDeleted: true });
  try {
    await seedReference(prisma);
    if (profile === 'dev') {
      await seedDev(prisma);
    }
  } finally {
    await prisma.$disconnect();
  }
}
