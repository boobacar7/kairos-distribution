import { createHmac, timingSafeEqual } from 'node:crypto';

import { parseStorefrontEnv } from '@kairos/config';
import { revalidateTag } from 'next/cache';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const bodySchema = z.object({
  tags: z.array(z.string().min(1).max(120)).min(1).max(20),
});

const MAX_AGE_MS = 5 * 60 * 1000;

function parseJson(raw: string): unknown {
  if (raw.length === 0) return {};
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

function safeEqual(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const env = parseStorefrontEnv(process.env);
  if (!env.STOREFRONT_REVALIDATE_SECRET) {
    return NextResponse.json({ error: 'unavailable' }, { status: 501 });
  }

  const timestampHeader = request.headers.get('x-kairos-timestamp');
  const signature = request.headers.get('x-kairos-signature');
  if (!timestampHeader || !signature) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp) || Math.abs(Date.now() - timestamp) > MAX_AGE_MS) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const raw = await request.text();
  const expected = createHmac('sha256', env.STOREFRONT_REVALIDATE_SECRET)
    .update(`${timestampHeader}.${raw}`)
    .digest('hex');

  if (!safeEqual(expected, signature)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(parseJson(raw));
  if (!parsed.success) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 });
  }

  for (const tag of parsed.data.tags) {
    revalidateTag(tag, 'max');
  }

  return NextResponse.json({ revalidated: true });
}
