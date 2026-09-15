import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';

import { type Prisma } from './generated/prisma/client.js';

export const GUEST_CLAIM_TOKEN_BYTES = 32;
export const DEFAULT_GUEST_CLAIM_TTL_DAYS = 30;

export class GuestClaimError extends Error {
  constructor(message = 'guest claim failed') {
    super(message);
    this.name = 'GuestClaimError';
  }
}

/** 256 bits from CSPRNG, base64url. Never derived from the order id, reference, email or time. */
export function generateGuestClaimToken(): string {
  return randomBytes(GUEST_CLAIM_TOKEN_BYTES).toString('base64url');
}

export function hashGuestClaimToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

export function tokenLooksLikeOrderReference(token: string, reference: string): boolean {
  return token === reference || hashGuestClaimToken(reference) === hashGuestClaimToken(token);
}

function hashesEqual(left: string, right: string): boolean {
  const a = Buffer.from(left, 'hex');
  const b = Buffer.from(right, 'hex');
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export interface ClaimGuestOrderInput {
  orderId: string;
  token: string;
  customerId: string;
}

/**
 * Single-use atomic claim. Guest claim V1 is email: the customer row must match the
 * order email. The database trigger additionally rejects an unverified customer
 * email — possession of a token is not verification (coordinator ruling).
 *
 * Zero rows is returned as GuestClaimError without distinguishing expired / used /
 * wrong / missing, so the endpoint cannot be used as an oracle for which references exist.
 */
export async function claimGuestOrder(
  tx: Prisma.TransactionClient,
  input: ClaimGuestOrderInput,
): Promise<{ id: string }> {
  const tokenHash = hashGuestClaimToken(input.token);
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    UPDATE orders
       SET "customerId" = ${input.customerId},
           "claimedAt" = now(),
           "guestClaimTokenHash" = NULL,
           "guestClaimTokenExpiresAt" = NULL
     WHERE id = ${input.orderId}
       AND "guestClaimTokenHash" = ${tokenHash}
       AND "customerId" IS NULL
       AND "guestClaimTokenExpiresAt" > now()
       AND lower("email") = (
         SELECT lower(c.email) FROM customers c WHERE c.id = ${input.customerId}
       )
    RETURNING id
  `;
  const claimed = rows[0];
  if (!claimed) {
    throw new GuestClaimError();
  }
  return claimed;
}

export function assertTokenNotDerivedFromReference(token: string, reference: string): void {
  if (tokenLooksLikeOrderReference(token, reference)) {
    throw new Error('guest claim token must not be derived from the order reference');
  }
}

export { hashesEqual };
