import 'server-only';

import { cache } from 'react';

import { parseStorefrontEnv } from '@kairos/config';

import { parseHomePayload, type HomeContent } from './contract.js';
import { publishedHome } from './published-content.js';
import { buildStubHome } from './stub.js';

export const HOME_REVALIDATE_SECONDS = 300;

function allowTestCatalogue(nodeEnv: string, flag: boolean): boolean {
  return flag && nodeEnv !== 'production';
}

async function fetchHomeFromApi(baseUrl: string): Promise<unknown> {
  const url = new URL('/v1/content/home', baseUrl);
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    next: { revalidate: HOME_REVALIDATE_SECONDS, tags: ['cms:home', 'category:*', 'product:*'] },
  });
  if (!response.ok) {
    throw new Error('HOME_CONTENT_UNAVAILABLE');
  }
  return response.json();
}

async function loadHomeUncached(now = new Date()): Promise<HomeContent> {
  const env = parseStorefrontEnv(process.env);
  const testAllowed = allowTestCatalogue(env.NODE_ENV, env.STOREFRONT_USE_TEST_CATALOGUE);

  const raw = env.KAIROS_API_URL
    ? parseHomePayload(await fetchHomeFromApi(env.KAIROS_API_URL))
    : buildStubHome({ useTestCatalogue: testAllowed });

  return publishedHome(raw, now, { allowTestCatalogue: testAllowed });
}

/** Deduped per request so layout (footer) and the homepage share one load. */
export const loadHomeContent = cache(loadHomeUncached);
