/**
 * Run `next build` without an inherited NODE_ENV.
 *
 * `start-kairos.sh` sources `.env` (which used to pin NODE_ENV=development) and then
 * `pnpm build`. Next.js 16 prerenders `/_global-error` in that mixed mode and React's
 * dispatcher is null: `Cannot read properties of null (reading 'useContext')`, plus
 * key warnings on `__next_viewport_boundary__` / `meta` / `head`.
 *
 * Next.js sets NODE_ENV=production itself once the variable is unset. Do not skip
 * prerender or swallow that exception.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const appDir = fileURLToPath(new URL('..', import.meta.url));
const env = { ...process.env };
delete env.NODE_ENV;

const child = spawn('next', ['build', ...process.argv.slice(2)], {
  cwd: appDir,
  stdio: 'inherit',
  env,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.exit(1);
  }
  process.exit(code ?? 1);
});
