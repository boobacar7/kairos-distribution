import { parseStorefrontEnv } from '@kairos/config';
import type { MetadataRoute } from 'next';

import { loadCategories, loadProducts } from '../catalog/api';
import { CatalogUnavailableError } from '../catalog/errors';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const env = parseStorefrontEnv(process.env);
  const base = env.STOREFRONT_SITE_URL;
  const entries: MetadataRoute.Sitemap = [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/boutique`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.4 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];

  try {
    const [categories, products] = await Promise.all([
      loadCategories(),
      loadProducts({ page: 1, limit: 100, sort: 'default', availability: 'all' }),
    ]);
    for (const category of categories) {
      entries.push({
        url: `${base}/boutique/${category.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
      });
    }
    for (const product of products.data) {
      entries.push({
        url: `${base}/produit/${product.slug}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  } catch (error) {
    if (!(error instanceof CatalogUnavailableError)) {
      throw error;
    }
  }

  return entries;
}
