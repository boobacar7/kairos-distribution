/**
 * Origin used when `KAIROS_API_URL` is unset outside production.
 *
 * Matches `parseApiEnv`’s default `PORT` (4000). `127.0.0.1` rather than `localhost` so Node’s
 * fetch does not try IPv6 `::1` while Nest listens on IPv4 (`0.0.0.0`).
 */
export const DEFAULT_DEV_CATALOG_API_ORIGIN = 'http://127.0.0.1:4000';

/**
 * Resolve the API origin for catalogue SSR fetches.
 *
 * `KAIROS_API_URL` stays optional on the process: the homepage uses its absence to keep the
 * visual stub (`GET /v1/content/home` is not implemented). Boutique and PDP still need a
 * reachable local API in `next dev`; treating a missing URL as fatal is what rendered
 * “Le catalogue est indisponible” while Nest was up.
 *
 * Production still requires `KAIROS_API_URL` so `next build` without the API keeps failing
 * closed (empty static params / CatalogUnavailable) instead of calling loopback.
 */
export function resolveCatalogApiOrigin(env: {
  KAIROS_API_URL?: string | undefined;
  NODE_ENV: string;
}): string | undefined {
  const configured = env.KAIROS_API_URL?.trim();
  const raw =
    configured && configured.length > 0
      ? configured
      : env.NODE_ENV === 'production'
        ? undefined
        : DEFAULT_DEV_CATALOG_API_ORIGIN;
  if (!raw) {
    return undefined;
  }
  try {
    const url = new URL(raw);
    if (url.hostname === 'localhost') {
      url.hostname = '127.0.0.1';
    }
    return url.origin;
  } catch {
    return undefined;
  }
}
