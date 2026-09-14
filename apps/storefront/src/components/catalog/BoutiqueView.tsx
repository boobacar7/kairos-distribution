import { Breadcrumb, EmptyState } from '@kairos/ui';
import type {
  CatalogCategory,
  ProductListQuery,
  ProductListResponse,
} from '@kairos/validation/catalog';

import { t } from '../../messages/t';
import { CatalogueProductCard } from './CatalogueProductCard';
import { CatalogPagination } from './CatalogPagination';
import { CategoryNav, FilterBar } from './FilterBar';

export function BoutiqueView({
  title,
  description,
  categories,
  products,
  query,
  categorySlug,
}: {
  title: string;
  description?: string | null;
  categories: readonly CatalogCategory[];
  products: ProductListResponse;
  query: ProductListQuery;
  categorySlug?: string;
}) {
  const emptySearch = Boolean(query.q) && products.data.length === 0;

  return (
    <div className="px-gutter py-section mx-auto max-w-7xl space-y-6 md:px-gutter-lg">
      <Breadcrumb
        label={t('catalog.breadcrumb')}
        items={[
          { href: '/', label: t('nav.home') },
          { href: '/boutique', label: t('pages.shop.title') },
          ...(categorySlug ? [{ label: title }] : []),
        ]}
      />
      <header className="space-y-2">
        <h1 className="font-serif text-h2 text-aubergine md:text-h1">{title}</h1>
        <p className="text-body text-botanical max-w-prose">
          {description || t('pages.shop.lead')}
        </p>
        <p className="text-body-sm text-botanical">
          {t('catalog.results', { count: products.meta.total })}
        </p>
      </header>
      <CategoryNav categories={categories} activeSlug={categorySlug} query={query} />
      <FilterBar query={query} categorySlug={categorySlug} />
      {products.data.length === 0 ? (
        <EmptyState title={emptySearch ? t('empty.catalog') : t('empty.products')}>
          {emptySearch ? t('empty.catalogBody') : t('pages.shop.lead')}
        </EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.data.map((product) => (
            <li key={product.id}>
              <CatalogueProductCard product={product} />
            </li>
          ))}
        </ul>
      )}
      <CatalogPagination
        query={query}
        pageCount={products.meta.pageCount}
        categorySlug={categorySlug}
      />
    </div>
  );
}
