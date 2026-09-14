import type { CatalogAvailability, CatalogProductDetail } from '@kairos/validation/catalog';

export type DisplayOffer = {
  variantId: string;
  sku: string;
  price: number;
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
  const selected = product.variants.find((variant) => variant.isDefault) ?? product.variants[0];
  if (!selected) {
    throw new Error('MULTI product is missing variants');
  }
  return {
    variantId: selected.variantId,
    sku: selected.sku,
    price: selected.price,
    compareAtPrice: selected.compareAtPrice,
    availability: selected.availability,
  };
}
