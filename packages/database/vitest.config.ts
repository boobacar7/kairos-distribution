import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    fileParallelism: false,
    sequence: { concurrent: false },
    testTimeout: 30_000,
    hookTimeout: 60_000,
    env: {
      DATABASE_URL:
        process.env['DATABASE_URL'] ??
        'postgresql://kairos:kairos@127.0.0.1:5432/kairos_test?schema=public',
      SHADOW_DATABASE_URL:
        process.env['SHADOW_DATABASE_URL'] ??
        'postgresql://kairos:kairos@127.0.0.1:5432/kairos_shadow_diff?schema=public',
      DATABASE_APP_URL:
        process.env['DATABASE_APP_URL'] ??
        'postgresql://kairos_app:kairos_app@127.0.0.1:5432/kairos_test?schema=public',
    },
  },
});
