import { baseConfig, frontendForbiddenImports } from '@kairos/config/eslint';

/**
 * Root ESLint configuration. Flat config lints the whole monorepo in one pass, so there is one
 * rule set rather than one per package.
 *
 * The `apps/*` override is declared ahead of the applications existing: the boundary must be in
 * place before the first frontend file is written, not added afterwards.
 */
export default [
  ...baseConfig,
  {
    files: ['apps/storefront/**/*.{ts,tsx}', 'apps/admin/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: frontendForbiddenImports,
          patterns: ['@kairos/*/src/*', '@kairos/*/dist/*'],
        },
      ],
    },
  },
];
