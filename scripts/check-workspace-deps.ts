#!/usr/bin/env tsx
/**
 * Workspace dependency boundary check.
 *
 * docs/architecture.md §3.2 defines which workspace package may depend on which. Prose does not
 * survive thirteen agents working in parallel, so the matrix is encoded here as data and enforced
 * in CI and in the pre-push hook.
 *
 * Two checks:
 *   1. Every internal dependency edge must appear in ALLOWED_DEPENDENCIES.
 *   2. The internal dependency graph must be acyclic.
 *
 * Deliberately dependency-free beyond `tsx`: a guardrail that needs its own dependency tree is a
 * guardrail that breaks when the dependency tree does.
 */

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const WORKSPACE_GLOBS = ['packages', 'apps'];
const SCOPE = '@kairos/';

/**
 * The shared toolchain, exempt from the matrix when declared as a devDependency.
 *
 * @kairos/config carries the tsconfig bases, the ESLint flat config and the Prettier config.
 * Extending a tsconfig is not a source import, so every package needs this edge and none of them
 * is crossing an architectural boundary by having it. The exemption is narrow on purpose: it
 * applies to this one package, only in devDependencies. A runtime `dependencies` edge to
 * @kairos/config is still governed by the matrix, and every other package is governed everywhere.
 */
const TOOLCHAIN_PACKAGE = '@kairos/config';

/**
 * The dependency matrix from docs/architecture.md §3.2.
 *
 * Read as: the key may depend on every package in its list, and on nothing else in the workspace.
 * An empty list means a leaf.
 *
 * The four rules this encodes:
 *   - No app imports another app.
 *   - No package imports an app.
 *   - @kairos/database is API-only.
 *   - @kairos/ui never imports @kairos/validation.
 */
const ALLOWED_DEPENDENCIES: Readonly<Record<string, readonly string[]>> = {
  '@kairos/config': [],
  '@kairos/types': [],
  '@kairos/validation': ['@kairos/config', '@kairos/types'],
  '@kairos/ui': ['@kairos/config', '@kairos/types'],
  '@kairos/database': ['@kairos/config', '@kairos/types'],
  '@kairos/api': ['@kairos/config', '@kairos/types', '@kairos/validation', '@kairos/database'],
  '@kairos/storefront': ['@kairos/config', '@kairos/types', '@kairos/validation', '@kairos/ui'],
  '@kairos/admin': ['@kairos/config', '@kairos/types', '@kairos/validation', '@kairos/ui'],
};

/** Why a given edge is forbidden, so the error explains the rule instead of just refusing. */
const RULE_EXPLANATIONS: Readonly<Record<string, string>> = {
  '@kairos/database':
    'Prisma is API-only. A Next.js app importing it pulls the query engine into the client ' +
    'dependency graph, exposes the full model surface, and makes DATABASE_URL a frontend secret. ' +
    'Frontends consume HTTP DTOs from @kairos/validation instead. (architecture.md §3.2 rule 3)',
  '@kairos/validation':
    '@kairos/ui must stay presentational: a dumb input plus app-level schema wiring. Importing ' +
    'validation into the design system duplicates business rules into components. ' +
    '(architecture.md §3.2 rule 4)',
};

interface InternalEdge {
  target: string;
  field: 'dependencies' | 'devDependencies' | 'peerDependencies';
}

interface WorkspacePackage {
  name: string;
  dir: string;
  /** Edges subject to the matrix, i.e. everything except the toolchain exemption. */
  internalDependencies: string[];
  /** Every internal edge, including exempt ones — used for cycle detection. */
  edges: InternalEdge[];
}

function isToolchainExempt(edge: InternalEdge): boolean {
  return edge.target === TOOLCHAIN_PACKAGE && edge.field === 'devDependencies';
}

function readPackages(): WorkspacePackage[] {
  const packages: WorkspacePackage[] = [];

  for (const workspaceDir of WORKSPACE_GLOBS) {
    const absolute = join(REPO_ROOT, workspaceDir);
    let entries: string[];
    try {
      entries = readdirSync(absolute);
    } catch {
      continue; // apps/ does not exist until a later phase
    }

    for (const entry of entries) {
      const dir = join(absolute, entry);
      if (!statSync(dir).isDirectory()) continue;

      const manifestPath = join(dir, 'package.json');
      let raw: string;
      try {
        raw = readFileSync(manifestPath, 'utf8');
      } catch {
        continue;
      }

      const manifest = JSON.parse(raw) as {
        name?: string;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
        peerDependencies?: Record<string, string>;
      };

      if (typeof manifest.name !== 'string') {
        throw new Error(`${manifestPath} has no "name" field`);
      }

      const fields = ['dependencies', 'devDependencies', 'peerDependencies'] as const;
      const edges: InternalEdge[] = [];

      for (const field of fields) {
        for (const target of Object.keys(manifest[field] ?? {})) {
          if (target.startsWith(SCOPE)) {
            edges.push({ target, field });
          }
        }
      }
      edges.sort((a, b) => a.target.localeCompare(b.target));

      packages.push({
        name: manifest.name,
        dir: `${workspaceDir}/${entry}`,
        internalDependencies: [
          ...new Set(edges.filter((edge) => !isToolchainExempt(edge)).map((edge) => edge.target)),
        ].sort(),
        edges,
      });
    }
  }

  return packages.sort((a, b) => a.name.localeCompare(b.name));
}

function checkMatrix(packages: readonly WorkspacePackage[]): string[] {
  const errors: string[] = [];
  const known = new Set(packages.map((pkg) => pkg.name));

  for (const pkg of packages) {
    const allowed = ALLOWED_DEPENDENCIES[pkg.name];

    if (allowed === undefined) {
      errors.push(
        `${pkg.name} (${pkg.dir}) is not in the dependency matrix.\n` +
          `    Add it to ALLOWED_DEPENDENCIES in scripts/check-workspace-deps.ts and to the\n` +
          `    matrix in docs/architecture.md §3.2. A new package must have declared boundaries.`,
      );
      continue;
    }

    for (const dependency of pkg.internalDependencies) {
      if (!known.has(dependency)) {
        errors.push(`${pkg.name} depends on ${dependency}, which is not a workspace package.`);
        continue;
      }

      if (dependency === pkg.name) {
        errors.push(`${pkg.name} depends on itself.`);
        continue;
      }

      if (!allowed.includes(dependency)) {
        const explanation = RULE_EXPLANATIONS[dependency];
        errors.push(
          `${pkg.name} may not depend on ${dependency}.\n` +
            `    Allowed: ${allowed.length > 0 ? allowed.join(', ') : '(leaf — nothing)'}\n` +
            (explanation === undefined ? '' : `    Why: ${explanation}\n`) +
            `    Declared in ${pkg.dir}/package.json`,
        );
      }
    }
  }

  return errors;
}

/** Depth-first cycle detection, reporting the cycle path rather than just its existence. */
function findCycles(packages: readonly WorkspacePackage[]): string[] {
  // Cycle detection uses every edge, exemptions included: a build-tooling edge still deadlocks
  // `tsc --build` if it closes a loop.
  const graph = new Map(
    packages.map((pkg) => [pkg.name, [...new Set(pkg.edges.map((edge) => edge.target))]]),
  );
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const cycles: string[] = [];

  function walk(name: string, path: string[]): void {
    if (visiting.has(name)) {
      const start = path.indexOf(name);
      cycles.push(`Dependency cycle: ${[...path.slice(start), name].join(' -> ')}`);
      return;
    }
    if (visited.has(name)) return;

    visiting.add(name);
    for (const dependency of graph.get(name) ?? []) {
      if (graph.has(dependency)) {
        walk(dependency, [...path, name]);
      }
    }
    visiting.delete(name);
    visited.add(name);
  }

  for (const pkg of packages) {
    walk(pkg.name, []);
  }

  return [...new Set(cycles)];
}

function main(): void {
  const packages = readPackages();

  if (packages.length === 0) {
    console.error('No workspace packages found. Is this being run from the repository root?');
    process.exit(1);
  }

  const errors = [...checkMatrix(packages), ...findCycles(packages)];

  if (errors.length > 0) {
    console.error('\nWorkspace dependency boundary check FAILED\n');
    for (const error of errors) {
      console.error(`  ✖ ${error}\n`);
    }
    console.error(`${errors.length} violation(s). See docs/architecture.md §3.2.\n`);
    process.exit(1);
  }

  console.log(`Workspace dependency boundaries OK — ${packages.length} packages checked:`);
  for (const pkg of packages) {
    const deps =
      pkg.internalDependencies.length > 0 ? pkg.internalDependencies.join(', ') : '(leaf)';
    console.log(`  ${pkg.name.padEnd(22)} -> ${deps}`);
  }
  console.log(`\n(${TOOLCHAIN_PACKAGE} as a devDependency is the shared toolchain and exempt.)`);
}

main();
