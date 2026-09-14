import { parseStorefrontEnv } from '@kairos/config';
import { slugSchema } from '@kairos/validation';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import { CatalogUnavailable } from '../../../components/catalog/CatalogUnavailable';
import { ProductDetailView } from '../../../components/catalog/ProductDetailView';
import { loadProduct, loadProducts } from '../../../catalog/api';
import { CatalogNotFoundError, CatalogUnavailableError } from '../../../catalog/errors';
import { breadcrumbJsonLd, productJsonLd } from '../../../catalog/json-ld';
import { displayOffer } from '../../../catalog/offer';
import { t } from '../../../messages/t';

export const revalidate = 300;
export const dynamicParams = true;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const products = await loadProducts({
      page: 1,
      limit: 100,
      sort: 'default',
      availability: 'all',
    });
    return products.data.map((product) => ({ slug: product.slug }));
  } catch (error) {
    if (error instanceof CatalogUnavailableError) return [];
    throw error;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) {
    return { title: t('errors.notFound') };
  }
  try {
    const product = await loadProduct(slug);
    const env = parseStorefrontEnv(process.env);
    const title = product.seoTitle ?? product.name;
    const description =
      product.seoDescription ??
      product.shortDescription ??
      product.description ??
      t('pages.shop.description');
    const canonical = product.canonicalUrl ?? `${env.STOREFRONT_SITE_URL}/produit/${product.slug}`;
    const offer = displayOffer(product);
    return {
      title,
      description,
      alternates: { canonical },
      openGraph: {
        title,
        description,
        url: canonical,
        images: product.images[0]
          ? [{ url: product.images[0].url, alt: product.images[0].alt }]
          : undefined,
      },
      other: {
        'product:price:amount': String(offer.price),
        'product:price:currency': 'XOF',
      },
    };
  } catch (error) {
    if (error instanceof CatalogNotFoundError || error instanceof CatalogUnavailableError) {
      return { title: t('errors.notFound') };
    }
    throw error;
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!slugSchema.safeParse(slug).success) {
    notFound();
  }
  try {
    const product = await loadProduct(slug);
    const env = parseStorefrontEnv(process.env);
    const canonical = product.canonicalUrl ?? `${env.STOREFRONT_SITE_URL}/produit/${product.slug}`;
    const crumbs = [
      { name: t('nav.home'), url: env.STOREFRONT_SITE_URL },
      { name: t('pages.shop.title'), url: `${env.STOREFRONT_SITE_URL}/boutique` },
      {
        name: product.category.name,
        url: `${env.STOREFRONT_SITE_URL}/boutique/${product.category.slug}`,
      },
      { name: product.name, url: canonical },
    ];
    return (
      <>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd(product, canonical)) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd(crumbs)) }}
        />
        <ProductDetailView product={product} />
      </>
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
