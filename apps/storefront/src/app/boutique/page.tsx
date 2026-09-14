import { parseStorefrontEnv } from '@kairos/config';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BoutiqueView } from '../../components/catalog/BoutiqueView';
import { CatalogUnavailable } from '../../components/catalog/CatalogUnavailable';
import { loadCategories, loadProducts, parseBoutiqueQuery } from '../../catalog/api';
import { CatalogNotFoundError, CatalogUnavailableError } from '../../catalog/errors';
import { t } from '../../messages/t';

export const revalidate = 300;

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const env = parseStorefrontEnv(process.env);
  const query = parseBoutiqueQuery(await searchParams);
  const canonical = `${env.STOREFRONT_SITE_URL}/boutique`;
  return {
    title: t('pages.shop.title'),
    description: t('pages.shop.description'),
    alternates: { canonical },
    openGraph: {
      title: t('pages.shop.title'),
      description: t('pages.shop.description'),
      url: canonical,
    },
    robots: query.q || query.page > 1 ? { index: false, follow: true } : undefined,
  };
}

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = parseBoutiqueQuery(await searchParams);
  try {
    const [categories, products] = await Promise.all([loadCategories(), loadProducts(query)]);
    return (
      <BoutiqueView
        title={t('pages.shop.title')}
        categories={categories}
        products={products}
        query={query}
      />
    );
  } catch (error) {
    if (error instanceof CatalogNotFoundError) {
      notFound();
    }
    if (error instanceof CatalogUnavailableError) {
      return <CatalogUnavailable />;
    }
    throw error;
  }
}
