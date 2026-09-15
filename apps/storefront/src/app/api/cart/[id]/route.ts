import { proxyToApi } from '../../../../checkout/proxy';

export const dynamic = 'force-dynamic';

export function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  return context.params.then((params) => proxyToApi(request, `/v1/cart/${params.id}`, 'GET'));
}
