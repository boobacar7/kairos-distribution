import { type AdminRole } from '../enums/index.js';

/**
 * Permission-based authorization (docs/architecture.md §7.3).
 *
 * Role checks scattered as `if (role === 'ADMIN')` are how permission bugs ship. Roles map to
 * permission sets declared once, here, and every server-side check asks about a permission.
 *
 * Category 2 registry keys (§3.5): `resource:action`, backed by seeded catalogue rows.
 */

export const PERMISSIONS = [
  'orders:read',
  'orders:update_status',
  'orders:refund',
  'orders:export',
  'products:read',
  'products:write',
  'products:delete',
  'inventory:read',
  'inventory:adjust',
  'customers:read',
  'customers:write',
  'reviews:moderate',
  'content:write',
  'media:write',
  'marketing:write',
  'analytics:read',
  'delivery:configure',
  'payments:read',
  'payments:configure',
  'users:read',
  'users:manage',
  'settings:write',
  'audit:read',
] as const;

export type Permission = (typeof PERMISSIONS)[number];

/**
 * SUPER_ADMIN holds every permission implicitly, so it is resolved rather than enumerated — an
 * explicit list would silently miss each newly added permission.
 */
const ADMIN_PERMISSIONS: readonly Permission[] = PERMISSIONS.filter(
  (permission) =>
    permission !== 'users:manage' &&
    permission !== 'payments:configure' &&
    permission !== 'settings:write',
);

/** Spec §31's worked example, expressed as data rather than scattered conditionals. */
const ORDER_MANAGER_PERMISSIONS: readonly Permission[] = [
  'orders:read',
  'orders:update_status',
  'orders:export',
  'customers:read',
  'inventory:read',
  'products:read',
];

const SUPPORT_PERMISSIONS: readonly Permission[] = [
  'orders:read',
  'customers:read',
  'products:read',
  'reviews:moderate',
];

export const ROLE_PERMISSIONS: Readonly<Record<AdminRole, readonly Permission[]>> = {
  SUPER_ADMIN: PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
  ORDER_MANAGER: ORDER_MANAGER_PERMISSIONS,
  SUPPORT: SUPPORT_PERMISSIONS,
};

export function permissionsForRole(role: AdminRole): readonly Permission[] {
  return ROLE_PERMISSIONS[role];
}

export function roleHasPermission(role: AdminRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

/**
 * Whether a role satisfies every permission a handler requires.
 *
 * Pure, so the authorization decision is unit-testable without HTTP or a database — spec §39
 * requires permission tests, and this is the function they target.
 */
export function roleHasAllPermissions(role: AdminRole, required: readonly Permission[]): boolean {
  const granted = ROLE_PERMISSIONS[role];
  return required.every((permission) => granted.includes(permission));
}

export function isPermission(value: string): value is Permission {
  return (PERMISSIONS as readonly string[]).includes(value);
}
