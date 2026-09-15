import { parseStorefrontEnv } from '@kairos/config';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function proxyToApi(
  request: Request,
  path: string,
  method: string,
): Promise<NextResponse> {
  const env = parseStorefrontEnv(process.env);
  if (!env.KAIROS_API_URL) {
    return NextResponse.json({ code: 'CHECKOUT_UNAVAILABLE' }, { status: 503 });
  }

  let body: string | undefined;
  if (method !== 'GET' && method !== 'HEAD') {
    body = await request.text();
  }

  const headers = new Headers();
  headers.set('Accept', 'application/json');
  if (body) headers.set('Content-Type', 'application/json');
  const cookie = request.headers.get('cookie');
  if (cookie) headers.set('cookie', cookie);
  const idempotency = request.headers.get('idempotency-key');
  if (idempotency) headers.set('idempotency-key', idempotency);
  const claim = request.headers.get('x-kairos-claim-token');
  if (claim) headers.set('x-kairos-claim-token', claim);

  let response: Response;
  try {
    response = await fetch(new URL(path, env.KAIROS_API_URL), {
      method,
      headers,
      body,
      cache: 'no-store',
    });
  } catch {
    return NextResponse.json({ code: 'CHECKOUT_UNAVAILABLE' }, { status: 503 });
  }

  const payload = await response.text();
  const out = new NextResponse(payload, {
    status: response.status,
    headers: {
      'content-type': response.headers.get('content-type') ?? 'application/json',
      'cache-control': 'private, no-store',
    },
  });
  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    out.headers.set('set-cookie', setCookie);
  }
  return out;
}
