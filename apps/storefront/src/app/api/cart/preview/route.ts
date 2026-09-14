import { parseStorefrontEnv } from '@kairos/config';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const env = parseStorefrontEnv(process.env);
  if (!env.KAIROS_API_URL) {
    return NextResponse.json({ code: 'CART_UNAVAILABLE' }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ code: 'VALIDATION_ERROR' }, { status: 400 });
  }

  let response: Response;
  try {
    response = await fetch(new URL('/v1/cart/preview', env.KAIROS_API_URL), {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ code: 'CART_UNAVAILABLE' }, { status: 503 });
  }

  const payload: unknown = await response.json().catch(() => ({ code: 'CART_UNAVAILABLE' }));
  return NextResponse.json(payload, { status: response.status });
}
