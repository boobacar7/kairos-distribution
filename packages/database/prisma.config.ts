import { defineConfig } from 'prisma/config';

/**
 * Prisma 7 configuration. The datasource URL lives here, not in the schema files.
 *
 * `prisma generate` and `tsc` must work without a live database (CI typecheck/build
 * load this file). Migrate/deploy still read DATABASE_URL from the environment; the
 * fallback is the local Compose default and is never a production secret.
 */
export default defineConfig({
  schema: 'prisma/schema',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed/index.ts',
  },
  datasource: {
    url:
      process.env['DATABASE_URL'] ??
      'postgresql://kairos:kairos@127.0.0.1:5432/kairos_dev?schema=public',
    shadowDatabaseUrl: process.env['SHADOW_DATABASE_URL'],
  },
});
