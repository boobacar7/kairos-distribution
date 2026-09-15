import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';

import type { CatalogCategory, ProductListResponse } from '@kairos/validation/catalog';

import { t } from '../../messages/t';
import { BoutiqueView } from './BoutiqueView';
import { ProductDetailView } from './ProductDetailView';

const categories: CatalogCategory[] = [
  {
    id: 'c1',
    slug: 'capsules',
    name: 'Capsules',
    description: null,
    image: null,
    position: 0,
    seoTitle: null,
    seoDescription: null,
  },
];

function listResponse(overrides?: Partial<ProductListResponse>): ProductListResponse {
  return {
    data: [
      {
        id: 'p1',
        slug: 'test-creme',
        name: '[TEST] Crème',
        shortDescription: null,
        category: { id: 'c1', slug: 'capsules', name: 'Capsules' },
        image: null,
        variantMode: 'SINGLE',
        currency: 'XOF',
        variantId: 'v1',
        sku: 'TEST-SKU-1',
        price: 5000,
        compareAtPrice: null,
        availability: { status: 'IN_STOCK', purchasable: true, issue: null },
        priceRange: null,
      },
    ],
    meta: { page: 1, limit: 24, total: 1, pageCount: 1 },
    ...overrides,
  };
}

const query = {
  page: 1,
  limit: 24,
  sort: 'default' as const,
  availability: 'all' as const,
};

describe('BoutiqueView', () => {
  it('renders a product card from API data without invented ratings or stock figures', () => {
    render(
      <BoutiqueView
        title={t('pages.shop.title')}
        categories={categories}
        products={listResponse()}
        query={query}
      />,
    );
    expect(screen.getByRole('heading', { name: t('pages.shop.title') })).toBeInTheDocument();
    expect(screen.getByText('[TEST] Crème')).toBeInTheDocument();
    expect(screen.getAllByText('Capsules').length).toBeGreaterThan(0);
    expect(screen.getByText(/5\s?000 FCFA/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t('catalog.addToCart') })).toBeInTheDocument();
    expect(screen.queryByText(/avis/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/miracle/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/\d+ en stock/i)).not.toBeInTheDocument();
  });

  it('adds a purchasable card variant to the guest cart', async () => {
    const user = userEvent.setup();
    render(
      <BoutiqueView
        title={t('pages.shop.title')}
        categories={categories}
        products={listResponse()}
        query={query}
      />,
    );
    await user.click(screen.getByRole('button', { name: t('catalog.addToCart') }));
    expect(screen.getByText(t('cart.added'))).toBeInTheDocument();
  });

  it('shows an empty catalogue state when the API returns no products', () => {
    render(
      <BoutiqueView
        title={t('pages.shop.title')}
        categories={categories}
        products={{ data: [], meta: { page: 1, limit: 24, total: 0, pageCount: 0 } }}
        query={query}
      />,
    );
    expect(screen.getByRole('heading', { name: t('empty.products') })).toBeInTheDocument();
    expect(screen.queryByText(t('errors.catalog'))).not.toBeInTheDocument();
  });

  it('shows an empty state when the catalogue has no matching products', () => {
    render(
      <BoutiqueView
        title={t('pages.shop.title')}
        categories={categories}
        products={{ data: [], meta: { page: 1, limit: 24, total: 0, pageCount: 0 } }}
        query={{ ...query, q: 'inconnu' }}
      />,
    );
    expect(screen.getByRole('heading', { name: t('empty.catalog') })).toBeInTheDocument();
  });

  it('has no axe violations on the listing', async () => {
    const { container } = render(
      <BoutiqueView
        title={t('pages.shop.title')}
        categories={categories}
        products={listResponse()}
        query={query}
      />,
    );
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });

  it('keeps an ACTIVE product with no default variant visible without inventing a price', () => {
    render(
      <BoutiqueView
        title={t('pages.shop.title')}
        categories={categories}
        products={{
          data: [
            {
              id: 'p-broken',
              slug: 'test-no-default',
              name: '[TEST] Sans variante',
              shortDescription: null,
              category: { id: 'c1', slug: 'capsules', name: 'Capsules' },
              image: null,
              variantMode: 'SINGLE',
              currency: 'XOF',
              variantId: null,
              sku: null,
              price: null,
              compareAtPrice: null,
              availability: {
                status: 'UNKNOWN',
                purchasable: false,
                issue: 'MISSING_DEFAULT_VARIANT',
              },
              priceRange: null,
            },
          ],
          meta: { page: 1, limit: 24, total: 1, pageCount: 1 },
        }}
        query={query}
      />,
    );
    expect(screen.getByText('[TEST] Sans variante')).toBeInTheDocument();
    expect(screen.getByText(t('catalog.inconsistent'))).toBeInTheDocument();
    expect(screen.queryByText(/\d[\d\s]*FCFA/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t('catalog.addToCart') })).not.toBeInTheDocument();
  });
});

describe('ProductDetailView', () => {
  const product = {
    id: 'p1',
    slug: 'test-creme',
    name: '[TEST] Crème',
    shortDescription: 'Une crème hydratante.',
    category: { id: 'c1', slug: 'capsules', name: 'Capsules' },
    image: null,
    variantMode: 'SINGLE' as const,
    currency: 'XOF' as const,
    variantId: 'v1',
    sku: 'TEST-SKU-1',
    price: 5000,
    compareAtPrice: null,
    weightGrams: null,
    availability: { status: 'IN_STOCK' as const, purchasable: true, issue: null },
    description: 'Description réelle.',
    benefits: 'Hydrate.',
    composition: null,
    usage: null,
    precautions: null,
    images: [],
    seoTitle: null,
    seoDescription: null,
    canonicalUrl: null,
    publishedAt: null,
  };

  it('renders only narrative sections that exist and never invents composition', () => {
    render(<ProductDetailView product={product} />);
    expect(screen.getByRole('heading', { name: '[TEST] Crème' })).toBeInTheDocument();
    expect(screen.getByText('Description réelle.')).toBeInTheDocument();
    expect(screen.getByText('Hydrate.')).toBeInTheDocument();
    expect(screen.queryByText(t('catalog.composition'))).not.toBeInTheDocument();
    expect(screen.queryByText(t('catalog.usage'))).not.toBeInTheDocument();
    expect(screen.queryByText(/certifi/i)).not.toBeInTheDocument();
    expect(screen.getByText(/TEST-SKU-1/)).toBeInTheDocument();
  });

  it('adds the product to the guest cart from the PDP', async () => {
    const user = userEvent.setup();
    render(<ProductDetailView product={product} />);
    await user.click(screen.getByRole('button', { name: t('catalog.addToCart') }));
    expect(screen.getByText(t('cart.added'))).toBeInTheDocument();
  });

  it('surfaces an inventory inconsistency without calling it out of stock', () => {
    render(
      <ProductDetailView
        product={{
          ...product,
          availability: { status: 'UNKNOWN', purchasable: false, issue: 'MISSING_INVENTORY' },
        }}
      />,
    );
    expect(screen.getByText(t('catalog.inventoryError'))).toBeInTheDocument();
    expect(screen.queryByText(t('stock.out'))).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: t('catalog.addToCart') })).toBeDisabled();
  });

  it('has no axe violations on the PDP', async () => {
    const { container } = render(<ProductDetailView product={product} />);
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});
