import type { HomepageSectionKey } from '@kairos/types';
import type { ReactNode } from 'react';

import type { HomeContent } from '../../content/contract';
import { t } from '../../messages/t';
import { CategoriesSection } from './CategoriesSection';
import { FaqSection } from './FaqSection';
import { FeaturedRow } from './FeaturedRow';
import { HeroSection } from './HeroSection';
import { ProductGrid } from './ProductGrid';
import { PromoSection } from './PromoSection';
import { ReviewsSection } from './ReviewsSection';
import { TestimonialsSection } from './TestimonialsSection';
import { TrustBar } from './TrustBar';

const SECTION_TITLE: Record<HomepageSectionKey, ReturnType<typeof t>> = {
  HERO: t('home.hero'),
  TRUST_BAR: t('home.trust'),
  CATEGORIES: t('home.categories'),
  PRODUITS_PHARES: t('home.featured'),
  INCONTOURNABLES: t('home.bestsellers'),
  AVIS_VERIFIES: t('home.reviews'),
  PROMO_BANNER: t('home.promo'),
  TESTIMONIALS: t('home.testimonials'),
  FAQ: t('home.faq'),
};

export function HomeView({ content }: { content: HomeContent }) {
  const renderers: Record<HomepageSectionKey, () => ReactNode> = {
    HERO: () => <HeroSection slides={content.hero} />,
    TRUST_BAR: () => <TrustBar items={content.trustBar} />,
    CATEGORIES: () => <CategoriesSection categories={content.categories} />,
    PRODUITS_PHARES: () => <FeaturedRow products={content.featuredProducts} />,
    INCONTOURNABLES: () => (
      <ProductGrid
        id="incontournables"
        title={SECTION_TITLE.INCONTOURNABLES}
        products={content.bestsellers}
      />
    ),
    AVIS_VERIFIES: () => (
      <ReviewsSection reviews={content.reviews} summary={content.reviewsSummary} />
    ),
    PROMO_BANNER: () => <PromoSection banners={content.banners} />,
    TESTIMONIALS: () => <TestimonialsSection testimonials={content.testimonials} />,
    FAQ: () => <FaqSection items={content.faq} />,
  };

  return (
    <div>
      {content.sections.map((section) => (
        <div key={section.key}>{renderers[section.key]()}</div>
      ))}
    </div>
  );
}
