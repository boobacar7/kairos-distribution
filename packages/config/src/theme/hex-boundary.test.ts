import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

import { describe, expect, it } from 'vitest';

import { PALETTE_HEXES } from './palette.js';

const REPO_ROOT = join(import.meta.dirname, '../../../..');

const ALLOWED_FILES = new Set([
  'packages/config/src/theme/palette.ts',
  'packages/config/src/theme/theme.test.ts',
  'packages/config/src/theme/hex-boundary.test.ts',
  'packages/config/theme/kairos.css',
]);

const SKIP_DIR_NAMES = new Set([
  'node_modules',
  'dist',
  '.git',
  '.turbo',
  'coverage',
  'generated',
  '.cache',
]);

const SCAN_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.css',
  '.json',
  '.md',
  '.html',
]);

const HEX_PATTERN = /#(?:[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g;

function shouldSkipDir(name: string): boolean {
  return SKIP_DIR_NAMES.has(name);
}

function walk(dir: string, files: string[]): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    if (shouldSkipDir(entry)) continue;
    const absolute = join(dir, entry);
    const stat = statSync(absolute);
    if (stat.isDirectory()) {
      walk(absolute, files);
      continue;
    }
    const ext = entry.slice(entry.lastIndexOf('.'));
    if (!SCAN_EXTENSIONS.has(ext)) continue;
    if (entry === 'pnpm-lock.yaml') continue;
    files.push(absolute);
  }
}

describe('hex colour boundary', () => {
  it('forbids hex literals outside the token files', () => {
    const files: string[] = [];
    walk(REPO_ROOT, files);

    const allowed = new Set(PALETTE_HEXES.map((hex) => hex.toUpperCase()));
    const violations: string[] = [];

    for (const file of files) {
      const rel = relative(REPO_ROOT, file).replaceAll('\\', '/');
      if (ALLOWED_FILES.has(rel)) continue;
      const source = readFileSync(file, 'utf8');
      const matches = source.match(HEX_PATTERN);
      if (!matches) continue;
      for (const hex of matches) {
        const expanded =
          hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
        violations.push(
          `${rel}: ${expanded} (token files only; allowed palette: ${[...allowed].join(', ')})`,
        );
      }
    }

    expect(violations).toEqual([]);
  });
});
