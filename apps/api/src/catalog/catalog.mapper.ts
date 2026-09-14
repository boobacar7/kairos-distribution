import { money } from '@kairos/types/money';
import type {
  CatalogAvailability,
  CatalogCategory,
  CatalogMedia,
  CatalogOffer,
  CatalogProductDetail,
  CatalogProductListItem,
  CatalogVariant,
} from '@kairos/validation/catalog';

import { CatalogInconsistentError } from './catalog.errors.js';
import { classifyAvailability } from './domain/availability.js';

export type InventoryRow = {
  trackInventory: boolean;
  availableQty: number;
};

export type VariantRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  weightGrams: number | null;
  isDefault: boolean;
  isActive: boolean;
  deletedAt: Date | null;
  inventoryItem: InventoryRow | null;
};

export type MediaRow = {
  id: string;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  deletedAt: Date | null;
};

export type ImageRow = {
  altOverride: string | null;
  mediaAsset: MediaRow | null;
};

export type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  position: number;
  seoTitle: string | null;
  seoDescription: string | null;
  image: MediaRow | null;
};

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  shortDescription: string | null;
  benefits: string | null;
  ingredients: string | null;
  usage: string | null;
  precautions: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  publishedAt: Date | null;
  category: { id: string; slug: string; name: string };
  images: ImageRow[];
  variants: VariantRow[];
};

function presentText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapMedia(asset: MediaRow | null, fallbackAlt: string): CatalogMedia | null {
  if (!asset || asset.deletedAt) return null;
  return {
    id: asset.id,
    url: asset.url,
    alt: presentText(asset.altText) ?? fallbackAlt,
    width: asset.width,
    height: asset.height,
    blurDataUrl: asset.blurDataUrl,
  };
}

function mapImage(image: ImageRow, fallbackAlt: string): CatalogMedia | null {
  if (!image.mediaAsset || image.mediaAsset.deletedAt) return null;
  const alt =
    presentText(image.altOverride) ?? presentText(image.mediaAsset.altText) ?? fallbackAlt;
  return {
    id: image.mediaAsset.id,
    url: image.mediaAsset.url,
    alt,
    width: image.mediaAsset.width,
    height: image.mediaAsset.height,
    blurDataUrl: image.mediaAsset.blurDataUrl,
  };
}

function toAvailabilityDto(item: InventoryRow | null): CatalogAvailability {
  const classified = classifyAvailability(item);
  return {
    status: classified.status,
    purchasable: classified.purchasable,
    issue: classified.issue,
  };
}

function activeVariants(product: ProductRow): VariantRow[] {
  return product.variants
    .filter((variant) => variant.isActive && variant.deletedAt === null)
    .sort((a, b) => Number(b.isDefault) - Number(a.isDefault));
}

function defaultVariant(product: ProductRow): VariantRow {
  const variants = activeVariants(product);
  const found = variants.find((variant) => variant.isDefault) ?? variants[0];
  if (!found) {
    throw new CatalogInconsistentError(product.id, 'missing_default_variant');
  }
  return found;
}

function mapOffer(variant: VariantRow): CatalogOffer {
  return {
    variantId: variant.id,
    sku: variant.sku,
    price: money(variant.price),
    compareAtPrice: variant.compareAtPrice === null ? null : money(variant.compareAtPrice),
    weightGrams: variant.weightGrams,
    availability: toAvailabilityDto(variant.inventoryItem),
  };
}

function mapVariant(variant: VariantRow): CatalogVariant {
  return {
    ...mapOffer(variant),
    name: variant.name,
    isDefault: variant.isDefault,
  };
}

function priceRange(variants: readonly VariantRow[]) {
  const prices = variants.map((variant) => variant.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min: money(min), max: money(max) };
}

export function mapCategory(row: CategoryRow): CatalogCategory {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: presentText(row.description),
    image: mapMedia(row.image, row.name),
    position: row.position,
    seoTitle: presentText(row.seoTitle),
    seoDescription: presentText(row.seoDescription),
  };
}

export function mapProductListItem(product: ProductRow): CatalogProductListItem {
  const variants = activeVariants(product);
  const selected = defaultVariant(product);
  const offer = mapOffer(selected);
  const multi = variants.length > 1;
  const images = product.images
    .map((image) => mapImage(image, product.name))
    .filter((image): image is CatalogMedia => image !== null);

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: presentText(product.shortDescription),
    category: product.category,
    image: images[0] ?? null,
    variantMode: multi ? 'MULTI' : 'SINGLE',
    currency: 'XOF',
    variantId: offer.variantId,
    sku: offer.sku,
    price: offer.price,
    compareAtPrice: offer.compareAtPrice,
    availability: offer.availability,
    priceRange: multi ? priceRange(variants) : null,
  };
}

export function mapProductDetail(product: ProductRow): CatalogProductDetail {
  const variants = activeVariants(product);
  const selected = defaultVariant(product);
  const offer = mapOffer(selected);
  const images = product.images
    .map((image) => mapImage(image, product.name))
    .filter((image): image is CatalogMedia => image !== null);
  const shared = {
    id: product.id,
    slug: product.slug,
    name: product.name,
    shortDescription: presentText(product.shortDescription),
    category: product.category,
    image: images[0] ?? null,
    currency: 'XOF' as const,
    description: presentText(product.description),
    benefits: presentText(product.benefits),
    composition: presentText(product.ingredients),
    usage: presentText(product.usage),
    precautions: presentText(product.precautions),
    images,
    seoTitle: presentText(product.seoTitle),
    seoDescription: presentText(product.seoDescription),
    canonicalUrl: presentText(product.canonicalUrl),
    publishedAt: product.publishedAt ? product.publishedAt.toISOString() : null,
  };

  if (variants.length > 1) {
    return {
      ...shared,
      variantMode: 'MULTI',
      priceRange: priceRange(variants),
      variants: variants.map(mapVariant),
    };
  }

  return {
    ...shared,
    variantMode: 'SINGLE',
    variantId: offer.variantId,
    sku: offer.sku,
    price: offer.price,
    compareAtPrice: offer.compareAtPrice,
    weightGrams: offer.weightGrams,
    availability: offer.availability,
  };
}

/** Guard used in tests: public mappers must never copy cost onto a DTO. */
export function assertNoCost(payload: unknown): void {
  const serialized = JSON.stringify(payload);
  if (serialized.includes('"cost"')) {
    throw new Error('cost leaked into a catalog DTO');
  }
}
