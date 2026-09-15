export const CART_COOKIE = 'kairos.cartId';
export const ORDER_ACCESS_COOKIE = 'kairos.orderAccess';

export function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const index = part.indexOf('=');
    if (index <= 0) continue;
    const name = part.slice(0, index).trim();
    const value = part.slice(index + 1).trim();
    if (name) out[name] = decodeURIComponent(value);
  }
  return out;
}

export function serializeCookie(
  name: string,
  value: string,
  options: { maxAgeSeconds: number; httpOnly?: boolean },
): string {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'SameSite=Lax',
    `Max-Age=${options.maxAgeSeconds}`,
  ];
  if (options.httpOnly !== false) parts.push('HttpOnly');
  return parts.join('; ');
}

export function readCookie(header: string | undefined, name: string): string | undefined {
  return parseCookies(header)[name];
}
