import {
  INVENTORY_SETTING_DEFAULTS,
  INVENTORY_SETTING_KEYS,
  ORDER_SETTING_DEFAULTS,
  ORDER_SETTING_KEYS,
  CART_SETTING_DEFAULTS,
  CART_SETTING_KEYS,
} from '@kairos/types';
import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class SettingsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getNumber(key: string, fallback: number): Promise<number> {
    const row = await this.prisma.client.siteSetting.findUnique({ where: { key } });
    if (!row) return fallback;
    const value = row.value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && /^-?\d+$/.test(value)) return Number(value);
    return fallback;
  }

  reservationTtlMinutes(): Promise<number> {
    return this.getNumber(
      INVENTORY_SETTING_KEYS.RESERVATION_TTL_MINUTES,
      INVENTORY_SETTING_DEFAULTS[INVENTORY_SETTING_KEYS.RESERVATION_TTL_MINUTES],
    );
  }

  paymentPendingHoldMinutes(): Promise<number> {
    return this.getNumber(
      INVENTORY_SETTING_KEYS.PAYMENT_PENDING_HOLD_MINUTES,
      INVENTORY_SETTING_DEFAULTS[INVENTORY_SETTING_KEYS.PAYMENT_PENDING_HOLD_MINUTES],
    );
  }

  reservationAbsoluteCapMinutes(): Promise<number> {
    return this.getNumber(
      INVENTORY_SETTING_KEYS.RESERVATION_ABSOLUTE_CAP_MINUTES,
      INVENTORY_SETTING_DEFAULTS[INVENTORY_SETTING_KEYS.RESERVATION_ABSOLUTE_CAP_MINUTES],
    );
  }

  guestClaimTtlDays(): Promise<number> {
    return this.getNumber(
      ORDER_SETTING_KEYS.GUEST_CLAIM_TOKEN_TTL_DAYS,
      ORDER_SETTING_DEFAULTS[ORDER_SETTING_KEYS.GUEST_CLAIM_TOKEN_TTL_DAYS],
    );
  }

  cartTtlDays(): Promise<number> {
    return this.getNumber(
      CART_SETTING_KEYS.TTL_DAYS,
      CART_SETTING_DEFAULTS[CART_SETTING_KEYS.TTL_DAYS],
    );
  }
}
