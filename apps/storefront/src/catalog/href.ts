import type { ProductListQuery } from '@kairos/validation/catalog';

export function boutiquePath(categorySlug?: string): string {
  return categorySlug ? `/boutique/${categorySlug}` : '/boutique';
}

export function boutiqueHref(
  query: ProductListQuery,
  options: { categorySlug?: string | null; page?: number } = {},
): string {
  const categorySlug =
    options.categorySlug === null ? undefined : (options.categorySlug ?? query.category);
  const params = new URLSearchParams();
  if (query.q) params.set('q', query.q);
  if (query.availability !== 'all') params.set('availability', query.availability);
  if (query.sort !== 'default') params.set('sort', query.sort);
  if (query.minPrice !== undefined) params.set('minPrice', String(query.minPrice));
  if (query.maxPrice !== undefined) params.set('maxPrice', String(query.maxPrice));
  const page = options.page ?? query.page;
  if (page > 1) params.set('page', String(page));
  const search = params.toString();
  const path = boutiquePath(categorySlug);
  return search ? `${path}?${search}` : path;
}
