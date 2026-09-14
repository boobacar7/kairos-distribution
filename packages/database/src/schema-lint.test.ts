import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

const SCHEMA_DIR = join(import.meta.dirname, '../prisma/schema');

function schemaFiles(): string[] {
  return readdirSync(SCHEMA_DIR)
    .filter((name) => name.endsWith('.prisma'))
    .map((name) => join(SCHEMA_DIR, name));
}

describe('schema conventions', () => {
  it('annotates every DateTime with @db.Timestamptz(6)', () => {
    const violations: string[] = [];
    for (const file of schemaFiles()) {
      const lines = readFileSync(file, 'utf8').split('\n');
      for (const [index, line] of lines.entries()) {
        if (!/\bDateTime\b/.test(line) || line.trimStart().startsWith('//')) continue;
        if (line.includes('@db.Date')) continue;
        if (!line.includes('@db.Timestamptz(6)')) {
          violations.push(`${file}:${index + 1}: ${line.trim()}`);
        }
      }
    }
    expect(violations).toEqual([]);
  });

  it('does not mention a Burkina Faso VAT rate', () => {
    const haystack = schemaFiles()
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');
    expect(haystack).not.toMatch(/18\s*%/);
    expect(haystack).not.toMatch(/rateBp\s*=\s*1800/);
  });
});
