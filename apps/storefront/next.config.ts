import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { NextConfig } from 'next';

const appDir = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = path.resolve(appDir, '../..');

const nextConfig: NextConfig = {
  outputFileTracingRoot: repoRoot,
  reactStrictMode: true,
  transpilePackages: ['@kairos/ui', '@kairos/config', '@kairos/types', '@kairos/validation'],
  typedRoutes: true,
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
