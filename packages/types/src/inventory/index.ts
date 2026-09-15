/**
 * Reservation hold policy (Bob 2026-09-15).
 *
 * Initial hold 15 minutes. Payment PENDING extends expiresAt. Absolute cap 60 minutes from
 * placement. expiresAt is never null and never infinite. Provider invoice TTL is independent.
 * ManualProvider may stay pending longer; Kairos never holds stock past the cap.
 */

export function addMinutes(from: Date, minutes: number): Date {
  return new Date(from.getTime() + minutes * 60_000);
}

export function reservationCapAt(placedAt: Date, capMinutes: number): Date {
  return addMinutes(placedAt, capMinutes);
}

/** Clamp a candidate expiry to the absolute reservation cap. Never returns null. */
export function clampExpiresAt(candidate: Date, placedAt: Date, capMinutes: number): Date {
  const cap = reservationCapAt(placedAt, capMinutes);
  return candidate.getTime() <= cap.getTime() ? candidate : cap;
}

export function initialReservationExpiresAt(
  now: Date,
  placedAt: Date,
  ttlMinutes: number,
  capMinutes: number,
): Date {
  return clampExpiresAt(addMinutes(now, ttlMinutes), placedAt, capMinutes);
}

export function pendingReservationExpiresAt(
  now: Date,
  placedAt: Date,
  pendingHoldMinutes: number,
  capMinutes: number,
): Date {
  return clampExpiresAt(addMinutes(now, pendingHoldMinutes), placedAt, capMinutes);
}
