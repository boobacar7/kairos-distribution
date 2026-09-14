import { BANNER_PLACEMENTS, HOMEPAGE_SECTION_KEYS, TEXT_POSITIONS } from '@kairos/types';
import { moneySchema, slugSchema } from '@kairos/validation';
import { z } from 'zod';

/**
 * Public CMS / catalogue contract consumed by the storefront.
 *
 * This is the client-side shape of `GET /v1/content/home` (and related catalogue reads) until
 * CMS_AGENT owns `packages/validation/src/cms`. Unknown keys are stripped. Schedule and
 * publication filtering happen in `published-content.ts` so a misbehaving API cannot leak
 * draft or future-dated merchandising onto the public homepage.
 */

export const MAX_ACTIVE_HERO_SLIDES = 4;

const isoDate = z.string().min(1);

export const mediaRefSchema = z.object({
  id: z.string().min(1),
  url: z.string().min(1),
  alt: z.string(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});
export type MediaRef = z.infer<typeof mediaRefSchema>;

export const heroSlideSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  ctaLabel: z.string().nullable().optional(),
  ctaUrl: z.string().nullable().optional(),
  textPosition: z.enum(TEXT_POSITIONS).default('LEFT'),
  desktopImage: mediaRefSchema.nullable().optional(),
  mobileImage: mediaRefSchema.nullable().optional(),
  isActive: z.boolean(),
  position: z.number().int(),
  startsAt: isoDate.nullable().optional(),
  endsAt: isoDate.nullable().optional(),
});
export type HeroSlide = z.infer<typeof heroSlideSchema>;

export const trustItemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  body: z.string().nullable().optional(),
  position: z.number().int().default(0),
});
export type TrustItem = z.infer<typeof trustItemSchema>;

export const categoryCardSchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: z.string().min(1),
  image: mediaRefSchema.nullable().optional(),
  position: z.number().int().default(0),
});
export type CategoryCard = z.infer<typeof categoryCardSchema>;

export const featuredProductSchema = z.object({
  id: z.string().min(1),
  slug: slugSchema,
  name: z.string().min(1),
  variantId: z.string().min(1),
  price: moneySchema,
  compareAtPrice: moneySchema.nullable().optional(),
  image: mediaRefSchema.nullable().optional(),
  rating: z.number().min(0).max(5).nullable().optional(),
  reviewCount: z.number().int().nonnegative().nullable().optional(),
  available: z.boolean(),
});
export type FeaturedProduct = z.infer<typeof featuredProductSchema>;

export const verifiedReviewSchema = z.object({
  id: z.string().min(1),
  productName: z.string().min(1),
  rating: z.number().min(1).max(5),
  comment: z.string().min(1),
  verified: z.literal(true),
  authorName: z.string().min(1),
});
export type VerifiedReview = z.infer<typeof verifiedReviewSchema>;

export const promoBannerSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  subtitle: z.string().nullable().optional(),
  ctaLabel: z.string().nullable().optional(),
  ctaUrl: z.string().nullable().optional(),
  image: mediaRefSchema.nullable().optional(),
  placement: z.enum(BANNER_PLACEMENTS).default('HOMEPAGE_MID'),
  isActive: z.boolean(),
  position: z.number().int(),
  startsAt: isoDate.nullable().optional(),
  endsAt: isoDate.nullable().optional(),
});
export type PromoBanner = z.infer<typeof promoBannerSchema>;

export const testimonialSchema = z.object({
  id: z.string().min(1),
  authorName: z.string().min(1),
  authorLocation: z.string().nullable().optional(),
  quote: z.string().min(1),
  rating: z.number().int().min(1).max(5).nullable().optional(),
  isActive: z.boolean(),
  position: z.number().int(),
  publishedAt: isoDate.nullable().optional(),
});
export type Testimonial = z.infer<typeof testimonialSchema>;

export const faqItemSchema = z.object({
  id: z.string().min(1),
  question: z.string().min(1),
  answer: z.string().min(1),
  isActive: z.boolean().default(true),
  position: z.number().int().default(0),
});
export type FaqItem = z.infer<typeof faqItemSchema>;

export const footerLinkSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  url: z.string().min(1),
  opensInNewTab: z.boolean().default(false),
  isActive: z.boolean().default(true),
  position: z.number().int().default(0),
});

export const footerSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  isActive: z.boolean().default(true),
  position: z.number().int().default(0),
  links: z.array(footerLinkSchema).default([]),
});

export const socialLinkSchema = z.object({
  id: z.string().min(1),
  platform: z.string().min(1),
  url: z.string().min(1),
  isActive: z.boolean().default(true),
  position: z.number().int().default(0),
});

export const footerContentSchema = z.object({
  sections: z.array(footerSectionSchema).default([]),
  social: z.array(socialLinkSchema).default([]),
});
export type FooterContent = z.infer<typeof footerContentSchema>;

export const homepageSectionSchema = z.object({
  key: z.enum(HOMEPAGE_SECTION_KEYS),
  label: z.string().default(''),
  isEnabled: z.boolean().default(true),
  position: z.number().int(),
});
export type HomepageSection = z.infer<typeof homepageSectionSchema>;

export const homeContentSchema = z.object({
  sections: z.array(homepageSectionSchema).default([]),
  hero: z.array(heroSlideSchema).default([]),
  trustBar: z.array(trustItemSchema).default([]),
  categories: z.array(categoryCardSchema).default([]),
  featuredProducts: z.array(featuredProductSchema).default([]),
  bestsellers: z.array(featuredProductSchema).default([]),
  reviews: z.array(verifiedReviewSchema).default([]),
  banners: z.array(promoBannerSchema).default([]),
  testimonials: z.array(testimonialSchema).default([]),
  faq: z.array(faqItemSchema).default([]),
  footer: footerContentSchema.default({ sections: [], social: [] }),
});
export type HomeContent = z.infer<typeof homeContentSchema>;

export function parseHomePayload(payload: unknown): HomeContent {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return homeContentSchema.parse((payload as { data: unknown }).data);
  }
  return homeContentSchema.parse(payload);
}
