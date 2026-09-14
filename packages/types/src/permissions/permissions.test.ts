import { describe, expect, it } from 'vitest';

import { ADMIN_ROLES } from '../enums/index.js';
import {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  isPermission,
  permissionsForRole,
  roleHasAllPermissions,
  roleHasPermission,
} from './index.js';

describe('ROLE_PERMISSIONS', () => {
  it('covers every role', () => {
    for (const role of ADMIN_ROLES) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
    }
  });

  it('grants SUPER_ADMIN everything, resolved rather than enumerated', () => {
    expect(permissionsForRole('SUPER_ADMIN')).toHaveLength(PERMISSIONS.length);
  });

  it('never grants a permission outside the catalogue', () => {
    for (const role of ADMIN_ROLES) {
      for (const permission of ROLE_PERMISSIONS[role]) {
        expect(isPermission(permission)).toBe(true);
      }
    }
  });
});

describe("spec §31's worked example for ORDER_MANAGER", () => {
  it('can view orders, update order status and view customers', () => {
    expect(roleHasPermission('ORDER_MANAGER', 'orders:read')).toBe(true);
    expect(roleHasPermission('ORDER_MANAGER', 'orders:update_status')).toBe(true);
    expect(roleHasPermission('ORDER_MANAGER', 'customers:read')).toBe(true);
  });

  it('cannot change payment configuration, modify permissions or delete products', () => {
    expect(roleHasPermission('ORDER_MANAGER', 'payments:configure')).toBe(false);
    expect(roleHasPermission('ORDER_MANAGER', 'users:manage')).toBe(false);
    expect(roleHasPermission('ORDER_MANAGER', 'products:delete')).toBe(false);
  });
});

describe('ADMIN', () => {
  it('is denied the three escalation-sensitive permissions', () => {
    expect(roleHasPermission('ADMIN', 'users:manage')).toBe(false);
    expect(roleHasPermission('ADMIN', 'payments:configure')).toBe(false);
    expect(roleHasPermission('ADMIN', 'settings:write')).toBe(false);
  });

  it('can still run the catalogue and orders day to day', () => {
    expect(roleHasAllPermissions('ADMIN', ['products:write', 'orders:refund', 'media:write'])).toBe(
      true,
    );
  });
});

describe('SUPPORT', () => {
  it('is read-only apart from review moderation', () => {
    expect(roleHasAllPermissions('SUPPORT', ['orders:read', 'reviews:moderate'])).toBe(true);
    expect(roleHasPermission('SUPPORT', 'products:write')).toBe(false);
    expect(roleHasPermission('SUPPORT', 'inventory:adjust')).toBe(false);
  });
});

describe('roleHasAllPermissions', () => {
  it('requires every listed permission, not any', () => {
    expect(roleHasAllPermissions('SUPPORT', ['orders:read', 'orders:refund'])).toBe(false);
  });

  it('is vacuously true for an empty requirement', () => {
    expect(roleHasAllPermissions('SUPPORT', [])).toBe(true);
  });
});
