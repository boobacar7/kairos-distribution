/**
 * Global JSON serializers for Prisma values that `JSON.stringify` cannot handle.
 *
 * Decision (data-model.md §15): BigInt ids and cumulative money columns serialize as
 * decimal strings, never as numbers. Number would overflow Number.MAX_SAFE_INTEGER for
 * a lifetime total; a silent 500 on the first audit-log endpoint is the alternative.
 *
 * Prisma.Decimal (ratingAverage, Discount.value) already implements toJSON as a string
 * via decimal.js; we still install a defensive serializer so a future code path that
 * boxes a Decimal-like object cannot emit `{}`.
 */

const bigintToJson = function bigintToJson(this: bigint): string {
  return this.toString();
};

export function installJsonSerializers(): void {
  const proto = BigInt.prototype as unknown as { toJSON?: () => string };
  if (proto.toJSON !== bigintToJson) {
    Object.defineProperty(BigInt.prototype, 'toJSON', {
      value: bigintToJson,
      configurable: true,
      writable: true,
    });
  }
}
