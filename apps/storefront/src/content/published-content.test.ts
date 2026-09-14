import { HOMEPAGE_SECTION_KEYS } from '@kairos/types';
import { money } from '@kairos/types/money';
import { describe, expect, it } from 'vitest';

import { parseHomePayload, type HomeContent } from './contract';
import { isInSchedule, publishedHome } from './published-content';
import { buildStubHome } from './stub';

const now = new Date('2026-09-14T12:00:00.000Z');

function slide(partial: {
  id: string;
  isActive: boolean;
  position: number;
  startsAt?: string | null;
  endsAt?: string | null;
}): HomeContent['hero'][number] {
  return {
    id: partial.id,
    title: `[TEST] ${partial.id}`,
    subtitle: null,
    ctaLabel: null,
    ctaUrl: null,
    textPosition: 'LEFT',
    desktopImage: null,
    mobileImage: null,
    isActive: partial.isActive,
    position: partial.position,
    startsAt: partial.startsAt ?? null,
    endsAt: partial.endsAt ?? null,
  };
}

describe('isInSchedule', () => {
  it('treats missing dates as always in window', () => {
    expect(isInSchedule(now, null, null)).toBe(true);
  });

  it('excludes future starts and expired ends', () => {
    expect(isInSchedule(now, '2026-09-20T00:00:00.000Z', null)).toBe(false);
    expect(isInSchedule(now, null, '2026-09-01T00:00:00.000Z')).toBe(false);
  });
});

describe('publishedHome', () => {
  it('drops inactive and out-of-window hero slides and caps at 4', () => {
    const raw = buildStubHome({ useTestCatalogue: false });
    raw.hero = [
      slide({ id: 'inactive', isActive: false, position: 0 }),
      slide({ id: 'future', isActive: true, position: 1, startsAt: '2026-12-01T00:00:00.000Z' }),
      slide({ id: 'expired', isActive: true, position: 2, endsAt: '2026-01-01T00:00:00.000Z' }),
      slide({ id: 'a', isActive: true, position: 5 }),
      slide({ id: 'b', isActive: true, position: 4 }),
      slide({ id: 'c', isActive: true, position: 3 }),
      slide({ id: 'd', isActive: true, position: 6 }),
      slide({ id: 'e', isActive: true, position: 7 }),
    ];

    const published = publishedHome(raw, now, { allowTestCatalogue: false });
    expect(published.hero.map((item) => item.id)).toEqual(['c', 'b', 'a', 'd']);
  });

  it('never publishes unverified reviews', () => {
    const raw = buildStubHome({ useTestCatalogue: false });
    const published = publishedHome(
      {
        ...raw,
        reviews: [
          {
            id: 'r1',
            productName: '[TEST] Produit 1',
            rating: 5,
            comment: 'Lorem ipsum.',
            verified: true,
            authorName: '[TEST] Auteur',
          },
        ],
      },
      now,
    );
    expect(published.reviews).toHaveLength(1);

    expect(() =>
      parseHomePayload({
        ...raw,
        reviews: [
          {
            id: 'fake',
            productName: 'Invented',
            rating: 5,
            comment: 'Fake',
            verified: false,
            authorName: 'Bot',
          },
        ],
      }),
    ).toThrow();
  });

  it('strips [TEST] products unless the demo catalogue is allowed', () => {
    const raw = buildStubHome({ useTestCatalogue: true });
    const hidden = publishedHome(raw, now, { allowTestCatalogue: false });
    expect(hidden.featuredProducts).toEqual([]);
    const shown = publishedHome(raw, now, { allowTestCatalogue: true });
    expect(shown.featuredProducts.every((product) => product.name.startsWith('[TEST]'))).toBe(true);
    expect(shown.reviews).toEqual([]);
  });

  it('defaults section order to the seeded homepage keys', () => {
    const published = publishedHome(buildStubHome({ useTestCatalogue: false }), now);
    expect(published.sections.map((section) => section.key)).toEqual([...HOMEPAGE_SECTION_KEYS]);
  });
});

describe('buildStubHome', () => {
  it('returns empty merchandising by default so empty states are real', () => {
    const home = buildStubHome({ useTestCatalogue: false });
    expect(home.hero).toEqual([]);
    expect(home.trustBar).toEqual([]);
    expect(home.featuredProducts).toEqual([]);
    expect(home.reviews).toEqual([]);
    expect(home.testimonials).toEqual([]);
    expect(home.faq).toEqual([]);
  });
});

describe('parseHomePayload', () => {
  it('accepts a { data } envelope', () => {
    const parsed = parseHomePayload({ data: { hero: [], reviews: [] } });
    expect(parsed.hero).toEqual([]);
  });

  it('does not treat a display price as money until it is an integer', () => {
    expect(() =>
      parseHomePayload({
        featuredProducts: [
          {
            id: 'p',
            slug: 'p',
            name: '[TEST] P',
            variantId: 'v',
            price: 12.5,
            available: true,
          },
        ],
      }),
    ).toThrow();
    expect(money(12_500)).toBe(12_500);
  });
});
