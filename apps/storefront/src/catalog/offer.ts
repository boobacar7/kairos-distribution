import type { CatalogAvailability, CatalogProductDetail } from '@kairos/validation/catalog';

export type DisplayOffer = {
  variantId: string | null;
  sku: string | null;
  price: number | null;
  compareAtPrice: number | null;
  availability: CatalogAvailability;
};

export function displayOffer(product: CatalogProductDetail): DisplayOffer {
  if (product.variantMode === 'SINGLE') {
    return {
      variantId: product.variantId,
      sku: product.sku,
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      availability: product.availability,
    };
  }
  const selected = product.variants.find((variant) => variant.isDefault);
  if (!selected) {
    return {
      variantId: null,
      sku: null,
      price: null,
      compareAtPrice: null,
      availability: {
        status: 'UNKNOWN',
        purchasable: false,
        issue: 'MISSING_DEFAULT_VARIANT',
      },
    };
  }
  return {
    variantId: selected.variantId,
    sku: selected.sku,
    price: selected.price,
    compareAtPrice: selected.compareAtPrice,
    availability: selected.availability,
  };
}
