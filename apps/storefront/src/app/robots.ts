import { parseStorefrontEnv } from '@kairos/config';
import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const env = parseStorefrontEnv(process.env);
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/panier', '/commande', '/compte', '/suivi-commande'],
    },
    sitemap: `${env.STOREFRONT_SITE_URL}/sitemap.xml`,
  };
}
