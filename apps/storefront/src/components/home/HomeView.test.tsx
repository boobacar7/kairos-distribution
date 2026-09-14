import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import { publishedHome } from '../../content/published-content.js';
import { buildStubHome } from '../../content/stub.js';
import { t } from '../../messages/t.js';
import { HomeView } from './HomeView.js';

describe('HomeView', () => {
  it('renders every homepage section empty state when the CMS stub is empty', () => {
    const content = publishedHome(buildStubHome({ useTestCatalogue: false }), new Date());
    render(<HomeView content={content} />);

    expect(screen.getByText(t('empty.hero'))).toBeInTheDocument();
    expect(screen.getByText(t('empty.trust'))).toBeInTheDocument();
    expect(screen.getByText(t('empty.categories'))).toBeInTheDocument();
    expect(screen.getAllByText(t('empty.products')).length).toBeGreaterThan(0);
    expect(screen.getByText(t('empty.reviews'))).toBeInTheDocument();
    expect(screen.getByText(t('empty.promo'))).toBeInTheDocument();
    expect(screen.getByText(t('empty.testimonials'))).toBeInTheDocument();
    expect(screen.getByText(t('empty.faq'))).toBeInTheDocument();
    expect(screen.queryByText(/Achat vérifié/)).not.toBeInTheDocument();
  });

  it('renders [TEST] products without inventing reviews', () => {
    const content = publishedHome(buildStubHome({ useTestCatalogue: true }), new Date(), {
      allowTestCatalogue: true,
    });
    render(<HomeView content={content} />);

    expect(screen.getByText('[TEST] Produit 1')).toBeInTheDocument();
    expect(screen.getByText(t('empty.reviews'))).toBeInTheDocument();
    expect(screen.queryByRole('img', { name: /miracle/i })).not.toBeInTheDocument();
  });

  it('has no axe violations on the empty homepage', async () => {
    const content = publishedHome(buildStubHome({ useTestCatalogue: false }), new Date());
    const { container } = render(<HomeView content={content} />);
    const results = await axe.run(container);
    expect(results.violations).toEqual([]);
  });
});

describe('Hero carousel wiring', () => {
  it('supports keyboard next/previous when CMS slides exist', async () => {
    const user = userEvent.setup();
    const raw = buildStubHome({ useTestCatalogue: false });
    raw.hero = [
      {
        id: 'one',
        title: '[TEST] Premier',
        subtitle: null,
        ctaLabel: '[TEST] Action',
        ctaUrl: '/boutique',
        textPosition: 'LEFT',
        desktopImage: null,
        mobileImage: null,
        isActive: true,
        position: 0,
        startsAt: null,
        endsAt: null,
      },
      {
        id: 'two',
        title: '[TEST] Second',
        subtitle: null,
        ctaLabel: null,
        ctaUrl: null,
        textPosition: 'CENTER',
        desktopImage: null,
        mobileImage: null,
        isActive: true,
        position: 1,
        startsAt: null,
        endsAt: null,
      },
    ];
    const content = publishedHome(raw, new Date(), { allowTestCatalogue: false });
    render(<HomeView content={content} />);

    expect(screen.getByRole('heading', { name: '[TEST] Premier' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t('carousel.next') }));
    expect(screen.getByRole('heading', { name: '[TEST] Second' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t('carousel.previous') }));
    expect(screen.getByRole('heading', { name: '[TEST] Premier' })).toBeInTheDocument();
  });
});
