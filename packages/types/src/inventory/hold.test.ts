import { describe, expect, it } from 'vitest';

import {
  clampExpiresAt,
  initialReservationExpiresAt,
  pendingReservationExpiresAt,
  reservationCapAt,
} from './index.js';

const placedAt = new Date('2026-09-15T12:00:00.000Z');

describe('reservation hold policy', () => {
  it('sets the initial hold to 15 minutes and never returns null', () => {
    const expires = initialReservationExpiresAt(placedAt, placedAt, 15, 60);
    expect(expires.toISOString()).toBe('2026-09-15T12:15:00.000Z');
  });

  it('extends a pending hold but never past the 60-minute absolute cap', () => {
    const atTen = new Date('2026-09-15T12:10:00.000Z');
    const expires = pendingReservationExpiresAt(atTen, placedAt, 60, 60);
    expect(expires.toISOString()).toBe(reservationCapAt(placedAt, 60).toISOString());
    expect(expires.toISOString()).toBe('2026-09-15T13:00:00.000Z');
  });

  it('clamps a candidate that would otherwise be infinite or 24h', () => {
    const dayLater = new Date('2026-09-16T12:00:00.000Z');
    expect(clampExpiresAt(dayLater, placedAt, 60).toISOString()).toBe('2026-09-15T13:00:00.000Z');
  });
});
