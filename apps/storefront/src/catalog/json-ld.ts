import { CURRENCY } from '@kairos/types';
import type { CatalogProductDetail } from '@kairos/validation/catalog';

import { displayOffer } from './offer';

function availabilityUrl(status: string): string | undefined {
  if (status === 'IN_STOCK' || status === 'UNTRACKED') {
    return 'https://schema.org/InStock';
  }
  if (status === 'OUT_OF_STOCK') {
    return 'https://schema.org/OutOfStock';
  }
  return undefined;
}

export function productJsonLd(
  product: CatalogProductDetail,
  canonical: string,
): Record<string, unknown> {
  const offer = displayOffer(product);
  const availability = availabilityUrl(offer.availability.status);
  const images = product.images.map((image) => image.url);

  const jsonLd: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    url: canonical,
  };

  if (product.description ?? product.shortDescription) {
    jsonLd.description = product.description ?? product.shortDescription;
  }
  if (images.length > 0) {
    jsonLd.image = images;
  }
  jsonLd.sku = offer.sku;

  const offers: Record<string, unknown> = {
    '@type': 'Offer',
    price: offer.price,
    priceCurrency: CURRENCY,
    url: canonical,
  };
  if (availability) {
    offers.availability = availability;
  }
  jsonLd.offers = offers;

  return jsonLd;
}

export function breadcrumbJsonLd(
  items: ReadonlyArray<{ name: string; url: string }>,
): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
