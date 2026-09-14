import { HOMEPAGE_SECTION_KEYS, isTestDataName } from '@kairos/types';

import {
  MAX_ACTIVE_HERO_SLIDES,
  type FooterContent,
  type HomeContent,
  type HomepageSection,
} from './contract.js';

export function isInSchedule(
  now: Date,
  startsAt: string | null | undefined,
  endsAt: string | null | undefined,
): boolean {
  if (startsAt) {
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime()) || start > now) return false;
  }
  if (endsAt) {
    const end = new Date(endsAt);
    if (Number.isNaN(end.getTime()) || end < now) return false;
  }
  return true;
}

function defaultSections(): HomepageSection[] {
  return HOMEPAGE_SECTION_KEYS.map((key, position) => ({
    key,
    label: '',
    isEnabled: true,
    position,
  }));
}

export function publishedHome(
  raw: HomeContent,
  now: Date,
  options: { allowTestCatalogue: boolean } = { allowTestCatalogue: false },
): HomeContent {
  const sections = (raw.sections.length > 0 ? raw.sections : defaultSections())
    .filter((section) => section.isEnabled)
    .sort((a, b) => a.position - b.position);

  const products = (list: HomeContent['featuredProducts']) =>
    list.filter((product) => options.allowTestCatalogue || !isTestDataName(product.name));

  const footer: FooterContent = {
    sections: raw.footer.sections
      .filter((section) => section.isActive)
      .sort((a, b) => a.position - b.position)
      .map((section) => ({
        ...section,
        links: section.links
          .filter((link) => link.isActive)
          .sort((a, b) => a.position - b.position),
      })),
    social: raw.footer.social
      .filter((link) => link.isActive)
      .sort((a, b) => a.position - b.position),
  };

  return {
    sections,
    hero: raw.hero
      .filter((slide) => slide.isActive && isInSchedule(now, slide.startsAt, slide.endsAt))
      .sort((a, b) => a.position - b.position)
      .slice(0, MAX_ACTIVE_HERO_SLIDES),
    trustBar: [...raw.trustBar].sort((a, b) => a.position - b.position),
    categories: [...raw.categories].sort((a, b) => a.position - b.position),
    featuredProducts: products(raw.featuredProducts),
    bestsellers: products(raw.bestsellers),
    reviews: raw.reviews.filter((review) => review.verified),
    banners: raw.banners
      .filter(
        (banner) =>
          banner.isActive &&
          banner.placement === 'HOMEPAGE_MID' &&
          isInSchedule(now, banner.startsAt, banner.endsAt),
      )
      .sort((a, b) => a.position - b.position),
    testimonials: raw.testimonials
      .filter(
        (item) => item.isActive && (item.publishedAt ? new Date(item.publishedAt) <= now : true),
      )
      .sort((a, b) => a.position - b.position),
    faq: raw.faq.filter((item) => item.isActive).sort((a, b) => a.position - b.position),
    footer,
  };
}
