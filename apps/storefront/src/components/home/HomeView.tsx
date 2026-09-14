import type { HomepageSectionKey } from '@kairos/types';
import type { ReactNode } from 'react';

import type { HomeContent } from '../../content/contract.js';
import { t } from '../../messages/t.js';
import { CategoriesSection } from './CategoriesSection.js';
import { FaqSection } from './FaqSection.js';
import { HeroSection } from './HeroSection.js';
import { ProductGrid } from './ProductGrid.js';
import { PromoSection } from './PromoSection.js';
import { ReviewsSection } from './ReviewsSection.js';
import { TestimonialsSection } from './TestimonialsSection.js';
import { TrustBar } from './TrustBar.js';

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
    PRODUITS_PHARES: () => (
      <ProductGrid
        id="produits-phares"
        title={SECTION_TITLE.PRODUITS_PHARES}
        products={content.featuredProducts}
      />
    ),
    INCONTOURNABLES: () => (
      <ProductGrid
        id="incontournables"
        title={SECTION_TITLE.INCONTOURNABLES}
        products={content.bestsellers}
      />
    ),
    AVIS_VERIFIES: () => <ReviewsSection reviews={content.reviews} />,
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
