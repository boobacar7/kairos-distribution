// Shared ESLint flat config for the Kairos monorepo.
// Consumed from the repository root, which lints every workspace in one pass.

import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

/**
 * Import paths that must never appear in a Next.js application.
 * `@kairos/database` is API-only (docs/architecture.md §3.2 rule 3): allowing a frontend to
 * import Prisma would pull the query engine into the client dependency graph, leak the full
 * model surface, and make DATABASE_URL a storefront secret.
 */
export const frontendForbiddenImports = [
  {
    name: '@prisma/client',
    message: 'Prisma is API-only. Frontends consume HTTP DTOs from @kairos/validation.',
  },
  {
    name: '@kairos/database',
    message: 'Prisma is API-only. Frontends consume HTTP DTOs from @kairos/validation.',
  },
];

/** Deep imports bypass a package\'s curated `exports` map, which is how boundaries quietly rot. */
export const deepImportPatterns = ['@kairos/*/src/*', '@kairos/*/dist/*'];

export const baseConfig = tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/.next/**',
      '**/.turbo/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/*.tsbuildinfo',
      '**/src/generated/**',
      '**/generated/**',
    ],
  },

  js.configs.recommended,
  ...tseslint.configs.recommended,

  {
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'no-restricted-imports': ['error', { patterns: deepImportPatterns }],
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'object-shorthand': 'error',
    },
  },

  {
    files: ['**/*.test.ts', '**/*.spec.ts', '**/vitest.config.ts'],
    rules: {
      'no-console': 'off',
    },
  },

  {
    files: ['scripts/**/*.ts', '**/*.config.{ts,mjs,js}'],
    rules: {
      'no-console': 'off',
    },
  },

  prettier,
);

export default baseConfig;
