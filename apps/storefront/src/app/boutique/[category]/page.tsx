import { parseStorefrontEnv } from '@kairos/config';
import { slugSchema } from '@kairos/validation';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { BoutiqueView } from '../../../components/catalog/BoutiqueView';
import { CatalogUnavailable } from '../../../components/catalog/CatalogUnavailable';
import {
  loadCategories,
  loadCategory,
  loadProducts,
  parseBoutiqueQuery,
} from '../../../catalog/api';
import { CatalogNotFoundError, CatalogUnavailableError } from '../../../catalog/errors';
import { t } from '../../../messages/t';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Array<{ category: string }>> {
  try {
    const categories = await loadCategories();
    return categories.map((category) => ({ category: category.slug }));
  } catch (error) {
    if (error instanceof CatalogUnavailableError) return [];
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  const { category: slug } = await params;
  if (!slugSchema.safeParse(slug).success) {
    return { title: t('errors.notFound') };
  }
  try {
    const category = await loadCategory(slug);
    const env = parseStorefrontEnv(process.env);
    const title = category.seoTitle ?? category.name;
    const description =
      category.seoDescription ?? category.description ?? t('pages.shop.description');
    const canonical = `${env.STOREFRONT_SITE_URL}/boutique/${category.slug}`;
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: { title, description, url: canonical },
    };
  } catch (error) {
    if (error instanceof CatalogNotFoundError || error instanceof CatalogUnavailableError) {
      return { title: t('errors.notFound') };
    }
    throw error;
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { category: slug } = await params;
  if (!slugSchema.safeParse(slug).success) {
    notFound();
  }
  const query = parseBoutiqueQuery(await searchParams, slug);
  try {
    const [category, categories, products] = await Promise.all([
      loadCategory(slug),
      loadCategories(),
      loadProducts(query),
    ]);
    return (
      <BoutiqueView
        title={category.name}
        description={category.description}
        categories={categories}
        products={products}
        query={query}
        categorySlug={category.slug}
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
