import { describe, expect, it } from 'vitest';

import {
  EnvironmentValidationError,
  isProduction,
  parseApiEnv,
  parseEnv,
  parseStorefrontEnv,
} from './index.js';

const validEnv = {
  DATABASE_URL: 'postgresql://kairos:kairos@localhost:5432/kairos_dev?schema=public',
};

describe('parseEnv', () => {
  it('applies defaults for optional variables', () => {
    const env = parseEnv(validEnv);

    expect(env.NODE_ENV).toBe('development');
    expect(env.LOG_LEVEL).toBe('info');
  });

  it('throws when DATABASE_URL is missing rather than returning undefined', () => {
    expect(() => parseEnv({})).toThrow(EnvironmentValidationError);
  });

  it('rejects a connection string for the wrong engine', () => {
    expect(() => parseEnv({ DATABASE_URL: 'mysql://localhost:3306/kairos' })).toThrow(
      /PostgreSQL connection string/,
    );
  });

  it('names every offending variable in the error', () => {
    try {
      parseEnv({ NODE_ENV: 'staging' });
      expect.unreachable('parseEnv should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(EnvironmentValidationError);
      const issues = (error as EnvironmentValidationError).issues.join('\n');
      expect(issues).toContain('NODE_ENV');
      expect(issues).toContain('DATABASE_URL');
    }
  });

  it('accepts the postgres:// scheme alias', () => {
    expect(() => parseEnv({ DATABASE_URL: 'postgres://localhost:5432/kairos' })).not.toThrow();
  });
});

describe('isProduction', () => {
  it('is true only for production', () => {
    expect(isProduction({ NODE_ENV: 'production' })).toBe(true);
    expect(isProduction({ NODE_ENV: 'development' })).toBe(false);
    expect(isProduction({ NODE_ENV: 'test' })).toBe(false);
  });
});

describe('parseStorefrontEnv', () => {
  it('does not require DATABASE_URL', () => {
    const env = parseStorefrontEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.KAIROS_API_URL).toBeUndefined();
    expect(env.STOREFRONT_USE_TEST_CATALOGUE).toBe(false);
    expect(env.STOREFRONT_SITE_URL).toBe('http://127.0.0.1:3000');
  });

  it('rejects a malformed API URL rather than calling it later', () => {
    expect(() => parseStorefrontEnv({ KAIROS_API_URL: 'not-a-url' })).toThrow(
      EnvironmentValidationError,
    );
  });

  it('enables the [TEST] catalogue only for explicit true/1 flags', () => {
    expect(
      parseStorefrontEnv({ STOREFRONT_USE_TEST_CATALOGUE: 'true' }).STOREFRONT_USE_TEST_CATALOGUE,
    ).toBe(true);
    expect(
      parseStorefrontEnv({ STOREFRONT_USE_TEST_CATALOGUE: '1' }).STOREFRONT_USE_TEST_CATALOGUE,
    ).toBe(true);
    expect(
      parseStorefrontEnv({ STOREFRONT_USE_TEST_CATALOGUE: 'false' }).STOREFRONT_USE_TEST_CATALOGUE,
    ).toBe(false);
  });
});

describe('parseApiEnv', () => {
  it('requires DATABASE_URL and defaults the listen port', () => {
    const env = parseApiEnv(validEnv);
    expect(env.PORT).toBe(4000);
    expect(env.DATABASE_URL).toContain('postgresql://');
  });

  it('rejects a malformed CORS origin', () => {
    expect(() => parseApiEnv({ ...validEnv, CORS_ORIGIN: 'not-a-url' })).toThrow(
      EnvironmentValidationError,
    );
  });
});
