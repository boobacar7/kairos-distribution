import { parseStorefrontEnv } from '@kairos/config';
import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const env = parseStorefrontEnv(process.env);
  const base = env.STOREFRONT_SITE_URL;
  return [
    { url: `${base}/`, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${base}/boutique`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/faq`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.4 },
    { url: `${base}/contact`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
  ];
}
