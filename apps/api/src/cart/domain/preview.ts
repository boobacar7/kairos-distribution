import { isTestDataName } from '@kairos/types';
import { money, multiply, ZERO, type Money } from '@kairos/types/money';
import type { CatalogAvailability, CatalogMedia } from '@kairos/validation/catalog';
import type { CartIntentItem, CartLineIssue, CartPreviewLine } from '@kairos/validation/cart';

import { classifyAvailability } from '../../catalog/domain/availability.js';

export type CartInventoryRow = {
  trackInventory: boolean;
  availableQty: number;
};

export type CartProductVariantFlag = {
  id: string;
  isDefault: boolean;
  isActive: boolean;
  deletedAt: Date | null;
};

export type CartMediaRow = {
  id: string;
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  deletedAt: Date | null;
};

export type CartImageRow = {
  altOverride: string | null;
  mediaAsset: CartMediaRow | null;
};

export type CartVariantRow = {
  id: string;
  name: string;
  sku: string;
  price: number;
  isActive: boolean;
  deletedAt: Date | null;
  inventoryItem: CartInventoryRow | null;
  product: {
    id: string;
    slug: string;
    name: string;
    status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
    deletedAt: Date | null;
    images: CartImageRow[];
    variants: CartProductVariantFlag[];
  };
};

const unknownAvailability: CatalogAvailability = {
  status: 'UNKNOWN',
  purchasable: false,
  issue: null,
};

function presentText(value: string | null | undefined): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function mapImage(image: CartImageRow, fallbackAlt: string): CatalogMedia | null {
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

function listingImage(product: CartVariantRow['product']): CatalogMedia | null {
  for (const image of product.images) {
    const mapped = mapImage(image, product.name);
    if (mapped) return mapped;
  }
  return null;
}

function hasActiveDefaultVariant(product: CartVariantRow['product']): boolean {
  return product.variants.some(
    (variant) => variant.isDefault && variant.isActive && variant.deletedAt === null,
  );
}

function unavailableLine(
  item: CartIntentItem,
  issue: CartLineIssue,
  extras: Partial<CartPreviewLine> = {},
): CartPreviewLine {
  return {
    variantId: item.variantId,
    quantity: item.quantity,
    productId: extras.productId ?? null,
    productSlug: extras.productSlug ?? null,
    productName: extras.productName ?? null,
    variantName: extras.variantName ?? null,
    sku: extras.sku ?? null,
    image: extras.image ?? null,
    unitPrice: extras.unitPrice ?? null,
    lineSubtotal: extras.lineSubtotal ?? null,
    purchasable: false,
    availability: extras.availability ?? unknownAvailability,
    issue,
  };
}

/**
 * Price one guest-cart line from catalogue rows. Never uses a client-supplied price.
 * Availability is classified read-only; this does not reserve stock.
 */
export function previewCartLine(
  item: CartIntentItem,
  row: CartVariantRow | undefined,
  options: { hideTestProducts: boolean },
): CartPreviewLine {
  if (!row) {
    return unavailableLine(item, 'VARIANT_UNAVAILABLE');
  }

  const product = row.product;
  const image = listingImage(product);
  const display = {
    productId: product.id,
    productSlug: product.slug,
    productName: product.name,
    variantName: row.name,
    sku: row.sku,
    image,
  };

  if (row.deletedAt !== null || !row.isActive) {
    return unavailableLine(item, 'VARIANT_UNAVAILABLE', display);
  }

  if (product.deletedAt !== null || product.status !== 'ACTIVE') {
    return unavailableLine(item, 'PRODUCT_UNAVAILABLE', display);
  }

  if (options.hideTestProducts && isTestDataName(product.name)) {
    return unavailableLine(item, 'PRODUCT_UNAVAILABLE', display);
  }

  if (!hasActiveDefaultVariant(product)) {
    return unavailableLine(item, 'MISSING_DEFAULT_VARIANT', {
      ...display,
      availability: {
        status: 'UNKNOWN',
        purchasable: false,
        issue: 'MISSING_DEFAULT_VARIANT',
      },
    });
  }

  const classified = classifyAvailability(row.inventoryItem);
  const availability: CatalogAvailability = {
    status: classified.status,
    purchasable: classified.purchasable,
    issue: classified.issue,
  };

  if (classified.issue === 'MISSING_INVENTORY') {
    return unavailableLine(item, 'MISSING_INVENTORY', { ...display, availability });
  }

  if (!classified.purchasable) {
    const unitPrice = money(row.price);
    return unavailableLine(item, 'OUT_OF_STOCK', {
      ...display,
      availability,
      unitPrice,
    });
  }

  const unitPrice = money(row.price);
  const lineSubtotal = multiply(unitPrice, item.quantity);
  return {
    variantId: item.variantId,
    quantity: item.quantity,
    ...display,
    unitPrice,
    lineSubtotal,
    purchasable: true,
    availability,
    issue: null,
  };
}

export function sumPurchasableSubtotal(lines: readonly CartPreviewLine[]): Money {
  return lines.reduce<Money>((total, line) => {
    if (!line.purchasable || line.lineSubtotal == null) return total;
    return money(total + line.lineSubtotal);
  }, ZERO);
}

export function countItems(lines: readonly { quantity: number }[]): number {
  return lines.reduce((total, line) => total + line.quantity, 0);
}
