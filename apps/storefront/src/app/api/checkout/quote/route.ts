import { proxyToApi } from '../../../../checkout/proxy';

export const dynamic = 'force-dynamic';

export function POST(request: Request) {
  return proxyToApi(request, '/v1/checkout/quote', 'POST');
}
