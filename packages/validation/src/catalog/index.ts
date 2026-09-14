import { CURRENCY } from '@kairos/types';
import { z } from 'zod';

import { moneySchema, paginationSchema, slugSchema } from '../common/index.js';

export const catalogAvailabilityStatuses = [
  'IN_STOCK',
  'OUT_OF_STOCK',
  'UNTRACKED',
  'UNKNOWN',
] as const;
export type CatalogAvailabilityStatus = (typeof catalogAvailabilityStatuses)[number];

export const catalogAvailabilityIssues = ['MISSING_INVENTORY'] as const;
export type CatalogAvailabilityIssue = (typeof catalogAvailabilityIssues)[number];

export const productSortValues = ['default', 'price_asc', 'price_desc', 'newest'] as const;
export type ProductSort = (typeof productSortValues)[number];

export const productAvailabilityFilters = ['all', 'in_stock', 'out_of_stock'] as const;
export type ProductAvailabilityFilter = (typeof productAvailabilityFilters)[number];

export const variantModes = ['SINGLE', 'MULTI'] as const;
export type VariantMode = (typeof variantModes)[number];

const emptyToUndefined = (value: unknown) => {
  if (value === '' || value === undefined || value === null) return undefined;
  return value;
};

export const productListQuerySchema = paginationSchema.extend({
  q: z.preprocess(emptyToUndefined, z.string().trim().max(120).optional()),
  category: z.preprocess(emptyToUndefined, slugSchema.optional()),
  availability: z.preprocess(emptyToUndefined, z.enum(productAvailabilityFilters).default('all')),
  minPrice: z.preprocess(emptyToUndefined, z.coerce.number().int().nonnegative().optional()),
  maxPrice: z.preprocess(emptyToUndefined, z.coerce.number().int().nonnegative().optional()),
  sort: z.preprocess(emptyToUndefined, z.enum(productSortValues).default('default')),
});
export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export const categorySlugParamSchema = z.object({
  slug: slugSchema,
});

export const catalogMediaSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  alt: z.string(),
  width: z.number().int().positive().nullable(),
  height: z.number().int().positive().nullable(),
  blurDataUrl: z.string().nullable(),
});
export type CatalogMedia = z.infer<typeof catalogMediaSchema>;

export const catalogCategorySchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: z.string().min(1),
  description: z.string().nullable(),
  image: catalogMediaSchema.nullable(),
  position: z.number().int(),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
});
export type CatalogCategory = z.infer<typeof catalogCategorySchema>;

export const catalogAvailabilitySchema = z.object({
  status: z.enum(catalogAvailabilityStatuses),
  purchasable: z.boolean(),
  issue: z.enum(catalogAvailabilityIssues).nullable(),
});
export type CatalogAvailability = z.infer<typeof catalogAvailabilitySchema>;

export const catalogOfferSchema = z.object({
  variantId: z.string().min(1),
  sku: z.string().min(1),
  price: moneySchema,
  compareAtPrice: moneySchema.nullable(),
  weightGrams: z.number().int().nonnegative().nullable(),
  availability: catalogAvailabilitySchema,
});
export type CatalogOffer = z.infer<typeof catalogOfferSchema>;

const listingProductBase = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: z.string().min(1),
  shortDescription: z.string().nullable(),
  category: z.object({
    id: z.string().min(1),
    slug: slugSchema,
    name: z.string().min(1),
  }),
  image: catalogMediaSchema.nullable(),
  variantMode: z.enum(variantModes),
  currency: z.literal(CURRENCY),
});

export const catalogProductListItemSchema = listingProductBase.extend({
  variantId: z.string().min(1),
  sku: z.string().min(1),
  price: moneySchema,
  compareAtPrice: moneySchema.nullable(),
  availability: catalogAvailabilitySchema,
  priceRange: z
    .object({
      min: moneySchema,
      max: moneySchema,
    })
    .nullable(),
});
export type CatalogProductListItem = z.infer<typeof catalogProductListItemSchema>;

export const catalogVariantSchema = catalogOfferSchema.extend({
  name: z.string().min(1),
  isDefault: z.boolean(),
});
export type CatalogVariant = z.infer<typeof catalogVariantSchema>;

const productDetailShared = listingProductBase.extend({
  description: z.string().nullable(),
  benefits: z.string().nullable(),
  composition: z.string().nullable(),
  usage: z.string().nullable(),
  precautions: z.string().nullable(),
  images: z.array(catalogMediaSchema),
  seoTitle: z.string().nullable(),
  seoDescription: z.string().nullable(),
  canonicalUrl: z.string().nullable(),
  publishedAt: z.string().nullable(),
});

export const catalogProductDetailSingleSchema = productDetailShared.extend({
  variantMode: z.literal('SINGLE'),
  variantId: z.string().min(1),
  sku: z.string().min(1),
  price: moneySchema,
  compareAtPrice: moneySchema.nullable(),
  weightGrams: z.number().int().nonnegative().nullable(),
  availability: catalogAvailabilitySchema,
});

export const catalogProductDetailMultiSchema = productDetailShared.extend({
  variantMode: z.literal('MULTI'),
  priceRange: z.object({
    min: moneySchema,
    max: moneySchema,
  }),
  variants: z.array(catalogVariantSchema).min(2),
});

export const catalogProductDetailSchema = z.discriminatedUnion('variantMode', [
  catalogProductDetailSingleSchema,
  catalogProductDetailMultiSchema,
]);
export type CatalogProductDetail = z.infer<typeof catalogProductDetailSchema>;

export const listMetaSchema = z.object({
  page: z.number().int().positive(),
  limit: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  pageCount: z.number().int().nonnegative(),
});
export type ListMeta = z.infer<typeof listMetaSchema>;

export const categoryListResponseSchema = z.object({
  data: z.array(catalogCategorySchema),
});
export type CategoryListResponse = z.infer<typeof categoryListResponseSchema>;

export const categoryDetailResponseSchema = z.object({
  data: catalogCategorySchema,
});
export type CategoryDetailResponse = z.infer<typeof categoryDetailResponseSchema>;

export const productListResponseSchema = z.object({
  data: z.array(catalogProductListItemSchema),
  meta: listMetaSchema,
});
export type ProductListResponse = z.infer<typeof productListResponseSchema>;

export const productDetailResponseSchema = z.object({
  data: catalogProductDetailSchema,
});
export type ProductDetailResponse = z.infer<typeof productDetailResponseSchema>;

export function parseProductListQuery(input: unknown): ProductListQuery {
  return productListQuerySchema.parse(input);
}

export function parseCategoryListResponse(input: unknown): CategoryListResponse {
  return categoryListResponseSchema.parse(input);
}

export function parseCategoryDetailResponse(input: unknown): CategoryDetailResponse {
  return categoryDetailResponseSchema.parse(input);
}

export function parseProductListResponse(input: unknown): ProductListResponse {
  return productListResponseSchema.parse(input);
}

export function parseProductDetailResponse(input: unknown): ProductDetailResponse {
  return productDetailResponseSchema.parse(input);
}
