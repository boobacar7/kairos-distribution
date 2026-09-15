import { z } from 'zod';

/**
 * Environment is parsed once, at process start, from a schema.
 *
 * The point is failure timing: a missing or malformed DATABASE_URL becomes a boot error with a
 * readable message instead of a runtime 500 on the first query that happens to need it.
 *
 * Only variables that something in the repository actually reads belong here. Variables for
 * applications that do not exist yet are added by the phase that introduces them.
 */

export const nodeEnvSchema = z.enum(['development', 'test', 'production']);
export type NodeEnv = z.infer<typeof nodeEnvSchema>;

export const baseEnvSchema = z.object({
  NODE_ENV: nodeEnvSchema.default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export const databaseEnvSchema = z.object({
  /**
   * Postgres connection string. Local development points at the Compose service; CI points at a
   * service container. Never a production value in the repository.
   */
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required')
    .refine(
      (value) => value.startsWith('postgresql://') || value.startsWith('postgres://'),
      'DATABASE_URL must be a PostgreSQL connection string',
    ),
});

export const envSchema = baseEnvSchema.extend(databaseEnvSchema.shape);

export type Env = z.infer<typeof envSchema>;

/**
 * Storefront process env. Intentionally separate from `envSchema`: the Next app must never
 * require `DATABASE_URL` (architecture.md §3.2 — Prisma is API-only).
 *
 * `KAIROS_API_URL` is optional so the homepage can keep the visual stub until CMS
 * `GET /v1/content/home` exists. An empty string is treated as unset. Catalogue SSR in
 * non-production still defaults to `http://127.0.0.1:4000` (see storefront `catalog/api-url.ts`).
 */
export const storefrontEnvSchema = baseEnvSchema.extend({
  KAIROS_API_URL: z.preprocess(
    (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
    z.string().url().optional(),
  ),
  STOREFRONT_SITE_URL: z.string().url().default('http://127.0.0.1:3000'),
  STOREFRONT_REVALIDATE_SECRET: z.string().min(16).optional(),
  STOREFRONT_USE_TEST_CATALOGUE: z
    .string()
    .optional()
    .transform((value) => value === 'true' || value === '1'),
});

export type StorefrontEnv = z.infer<typeof storefrontEnvSchema>;

/**
 * API process env. Requires DATABASE_URL (Prisma is API-only) plus the HTTP bind port.
 * `CORS_ORIGIN` is the storefront origin when the browser calls the API directly.
 */
export const apiEnvSchema = envSchema.extend({
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  CORS_ORIGIN: z.string().url().optional(),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;

export class EnvironmentValidationError extends Error {
  public readonly issues: readonly string[];

  constructor(issues: readonly string[]) {
    super(
      `Invalid environment configuration:\n${issues.map((issue) => `  - ${issue}`).join('\n')}`,
    );
    this.name = 'EnvironmentValidationError';
    this.issues = issues;
  }
}

/**
 * Parse and validate an environment object.
 *
 * Throws rather than returning a result on purpose: there is no sensible way for a process to
 * continue with unusable configuration, and a thrown error at boot is far easier to diagnose than
 * a value that is silently undefined three layers down.
 */
export function parseEnv(source: NodeJS.ProcessEnv = process.env): Env {
  const result = envSchema.safeParse(source);

  if (!result.success) {
    throw new EnvironmentValidationError(formatIssues(result.error.issues));
  }

  return result.data;
}

export function parseStorefrontEnv(source: NodeJS.ProcessEnv = process.env): StorefrontEnv {
  const result = storefrontEnvSchema.safeParse(source);

  if (!result.success) {
    throw new EnvironmentValidationError(formatIssues(result.error.issues));
  }

  return result.data;
}

export function parseApiEnv(source: NodeJS.ProcessEnv = process.env): ApiEnv {
  const result = apiEnvSchema.safeParse(source);

  if (!result.success) {
    throw new EnvironmentValidationError(formatIssues(result.error.issues));
  }

  return result.data;
}

function formatIssues(issues: readonly { path: PropertyKey[]; message: string }[]): string[] {
  return issues.map((issue) => {
    const path = issue.path.join('.');
    return path.length > 0 ? `${path}: ${issue.message}` : issue.message;
  });
}

export function isProduction(env: Pick<Env, 'NODE_ENV'>): boolean {
  return env.NODE_ENV === 'production';
}
