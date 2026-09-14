/**
 * @kairos/database — wired but intentionally empty.
 *
 * This package is owned by DATABASE_AGENT (docs/agent-task-map.md). ARCHITECT_AGENT created the
 * shell — dependencies, build wiring, scripts and boundary registration — but must not author the
 * schema. Phase 2 fills it in.
 *
 * Two boundary rules apply here and are enforced, not merely documented:
 *
 *   1. Only `apps/api` may depend on this package. Letting a Next.js application import Prisma
 *      would pull the query engine into the client dependency graph, expose the full model
 *      surface, and make DATABASE_URL a storefront secret. See docs/architecture.md §3.2 rule 3,
 *      scripts/check-workspace-deps.ts, and the `no-restricted-imports` rule in the shared ESLint
 *      config.
 *
 *   2. `schema.prisma` has a single writer. Every other agent requests a migration rather than
 *      editing it, because four agents editing one schema produces conflicting migration
 *      timestamps and a broken shadow database.
 *
 * What Phase 2 adds here:
 *   - prisma/schema/*.prisma  (schema folder, one file per bounded context)
 *   - prisma/migrations/
 *   - prisma/seed/            (reference and configuration data only — no products, orders,
 *                             reviews or customers; spec §41)
 *   - src/client.ts           (the PrismaClient singleton)
 *   - src/index.ts            (re-exports the client and generated types)
 *
 * `prisma generate` is deliberately not wired into install or CI yet: there is no schema, so it
 * would fail. The `db:generate` script exists and is run explicitly once the schema lands.
 */

/** Placeholder so the package has a valid build output before the schema exists. */
export const DATABASE_PACKAGE_READY = false;
