import { describe, expect, it } from 'vitest';

import { publishedHome } from './published-content';
import { buildVisualHome } from './visual-home';

describe('buildVisualHome', () => {
  it('matches the approved homepage sections without review quotes', () => {
    const published = publishedHome(buildVisualHome(), new Date(), { allowTestCatalogue: false });

    expect(published.sections.map((section) => section.key)).toEqual([
      'HERO',
      'CATEGORIES',
      'PRODUITS_PHARES',
      'AVIS_VERIFIES',
      'PROMO_BANNER',
    ]);
    expect(published.hero).toHaveLength(3);
    expect(published.featuredProducts).toHaveLength(4);
    expect(published.reviews).toEqual([]);
    expect(published.reviewsSummary?.averageRating).toBe(4.8);
    expect(published.banners[0]?.code).toBe('KAIROS10');
    expect(published.featuredProducts.every((product) => !product.name.startsWith('[TEST]'))).toBe(
      true,
    );
  });
});
