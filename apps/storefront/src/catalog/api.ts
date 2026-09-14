import 'server-only';

import { parseStorefrontEnv } from '@kairos/config';
import {
  parseCategoryDetailResponse,
  parseCategoryListResponse,
  parseProductDetailResponse,
  parseProductListQuery,
  parseProductListResponse,
  type CatalogCategory,
  type CatalogProductDetail,
  type ProductListQuery,
  type ProductListResponse,
} from '@kairos/validation/catalog';

import { CatalogNotFoundError, CatalogUnavailableError } from './errors';

export const CATALOG_REVALIDATE_SECONDS = 300;

function apiBaseUrl(): string {
  const env = parseStorefrontEnv(process.env);
  if (!env.KAIROS_API_URL) {
    throw new CatalogUnavailableError();
  }
  return env.KAIROS_API_URL;
}

async function apiGet(path: string, tags: string[]): Promise<unknown> {
  const url = new URL(path, apiBaseUrl());
  let response: Response;
  try {
    response = await fetch(url, {
      headers: { Accept: 'application/json' },
      next: { revalidate: CATALOG_REVALIDATE_SECONDS, tags },
    });
  } catch {
    throw new CatalogUnavailableError();
  }
  if (response.status === 404) {
    throw new CatalogNotFoundError();
  }
  if (!response.ok) {
    throw new CatalogUnavailableError();
  }
  return response.json();
}

export async function loadCategories(): Promise<CatalogCategory[]> {
  const payload = parseCategoryListResponse(await apiGet('/v1/categories', ['catalog:index']));
  return payload.data;
}

export async function loadCategory(slug: string): Promise<CatalogCategory> {
  const payload = parseCategoryDetailResponse(
    await apiGet(`/v1/categories/${encodeURIComponent(slug)}`, [
      'catalog:index',
      `category:${slug}`,
    ]),
  );
  return payload.data;
}

export async function loadProducts(query: ProductListQuery): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  params.set('page', String(query.page));
  params.set('limit', String(query.limit));
  params.set('sort', query.sort);
  params.set('availability', query.availability);
  if (query.q) params.set('q', query.q);
  if (query.category) params.set('category', query.category);
  if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice));
  if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice));
  const tags = query.category ? ['catalog:index', `category:${query.category}`] : ['catalog:index'];
  return parseProductListResponse(await apiGet(`/v1/products?${params.toString()}`, tags));
}

export async function loadProduct(slug: string): Promise<CatalogProductDetail> {
  const payload = parseProductDetailResponse(
    await apiGet(`/v1/products/${encodeURIComponent(slug)}`, ['catalog:index', `product:${slug}`]),
  );
  return payload.data;
}

export function parseBoutiqueQuery(
  searchParams: Record<string, string | string[] | undefined>,
  category?: string,
): ProductListQuery {
  const scalar = (key: string) => {
    const value = searchParams[key];
    if (Array.isArray(value)) return value[0];
    return value;
  };
  try {
    return parseProductListQuery({
      q: scalar('q'),
      category: category ?? scalar('category'),
      availability: scalar('availability'),
      minPrice: scalar('minPrice'),
      maxPrice: scalar('maxPrice'),
      sort: scalar('sort'),
      page: scalar('page'),
      limit: scalar('limit'),
    });
  } catch {
    return parseProductListQuery({ category });
  }
}
