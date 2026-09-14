/**
 * Copy latin woff2 files into public/fonts so the document head can preload them.
 * Source of truth remains @fontsource; these copies are gitignored.
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));
const destDir = join(here, '../public/fonts');

mkdirSync(destDir, { recursive: true });

function copyFont(pkgJsonSpecifier, relativeFile, destName) {
  const pkgRoot = dirname(require.resolve(pkgJsonSpecifier));
  copyFileSync(join(pkgRoot, relativeFile), join(destDir, destName));
}

copyFont(
  '@fontsource-variable/manrope/package.json',
  'files/manrope-latin-wght-normal.woff2',
  'manrope-latin-wght-normal.woff2',
);
copyFont(
  '@fontsource/dm-serif-display/package.json',
  'files/dm-serif-display-latin-400-normal.woff2',
  'dm-serif-display-latin-400-normal.woff2',
);
