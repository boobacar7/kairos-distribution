import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import axe from 'axe-core';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { CartPreviewLine, CartPreviewResponse } from '@kairos/validation/cart';
import { formatXOF, money } from '@kairos/types/money';

import { prepareAddToCart } from '../../catalog/cart-seam';
import { CartProvider } from '../../cart/cart-provider';
import { resetGuestCartForTests } from '../../cart/guest-cart';
import { t } from '../../messages/t';
import { CartPageView } from './CartPageView';
import { CartIcon } from '../shell/CartIcon';
import { MobileBottomNav } from '../shell/MobileBottomNav';
import { StorefrontHeader } from '../shell/StorefrontHeader';

const previewGuestCart = vi.hoisted(() => vi.fn());

vi.mock('../../cart/preview-client', () => ({
  previewGuestCart,
  CartPreviewError: class CartPreviewError extends Error {},
}));

function line(overrides: Partial<CartPreviewLine> = {}): CartPreviewLine {
  return {
    variantId: 'v1',
    quantity: 2,
    productId: 'p1',
    productSlug: 'creme',
    productName: '[TEST] Crème',
    variantName: 'Default',
    sku: 'TEST-SKU-1',
    image: null,
    unitPrice: 5000,
    lineSubtotal: 10_000,
    purchasable: true,
    availability: { status: 'IN_STOCK', purchasable: true, issue: null },
    issue: null,
    ...overrides,
  };
}

function snapshot(items: CartPreviewLine[], subtotal: number): CartPreviewResponse {
  return {
    currency: 'XOF',
    items,
    subtotal,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
  };
}

function renderCart() {
  return render(
    <CartProvider>
      <StorefrontHeader />
      <CartPageView />
      <MobileBottomNav />
    </CartProvider>,
  );
}

describe('cart page', () => {
  beforeEach(() => {
    resetGuestCartForTests();
    previewGuestCart.mockReset();
  });

  it('shows the empty state and no badge count', async () => {
    renderCart();
    expect(await screen.findByRole('heading', { name: t('cart.empty') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t('cart.continue') })).toHaveAttribute(
      'href',
      '/boutique',
    );
    expect(screen.getAllByRole('link', { name: t('cart.icon') }).length).toBeGreaterThan(0);
    expect(screen.queryByText('3')).not.toBeInTheDocument();
  });

  it('renders reconciled lines, unit price, quantity, line subtotal and cart subtotal', async () => {
    prepareAddToCart({ variantId: 'v1', quantity: 2 });
    previewGuestCart.mockResolvedValue(snapshot([line()], 10_000));
    renderCart();

    expect(await screen.findByText('[TEST] Crème')).toBeInTheDocument();
    expect(screen.getByText(/TEST-SKU-1/)).toBeInTheDocument();
    expect(screen.getAllByText(/10\s?000 FCFA/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/5\s?000 FCFA/).length).toBeGreaterThan(0);
    expect(screen.getByLabelText(t('catalog.quantity'))).toHaveValue(2);
    expect(previewGuestCart).toHaveBeenCalledWith([{ variantId: 'v1', quantity: 2 }]);
  });

  it('updates the badge with the real item count', async () => {
    prepareAddToCart({ variantId: 'v1', quantity: 2 });
    previewGuestCart.mockResolvedValue(snapshot([line()], 10_000));
    renderCart();
    expect(
      await screen.findAllByRole('link', { name: t('cart.count', { count: 2 }) }),
    ).not.toHaveLength(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
  });

  it('increments and decrements quantity then removes the line', async () => {
    const user = userEvent.setup();
    prepareAddToCart({ variantId: 'v1', quantity: 2 });
    previewGuestCart.mockImplementation(async (items) => {
      const quantity = items[0]?.quantity ?? 0;
      if (items.length === 0) return snapshot([], 0);
      return snapshot([line({ quantity, lineSubtotal: 5000 * quantity })], 5000 * quantity);
    });
    renderCart();
    expect(await screen.findByText('[TEST] Crème')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: t('catalog.increase') }));
    await waitFor(() => expect(screen.getByLabelText(t('catalog.quantity'))).toHaveValue(3));

    await user.click(screen.getByRole('button', { name: t('catalog.decrease') }));
    await waitFor(() => expect(screen.getByLabelText(t('catalog.quantity'))).toHaveValue(2));

    await user.click(
      screen.getByRole('button', { name: t('cart.remove', { name: '[TEST] Crème' }) }),
    );
    expect(await screen.findByRole('heading', { name: t('cart.empty') })).toBeInTheDocument();
  });

  it('surfaces an unavailable item without adding it to the subtotal', async () => {
    prepareAddToCart({ variantId: 'v1', quantity: 1 });
    previewGuestCart.mockResolvedValue(
      snapshot(
        [
          line({
            quantity: 1,
            unitPrice: 5000,
            lineSubtotal: null,
            purchasable: false,
            issue: 'OUT_OF_STOCK',
            availability: { status: 'OUT_OF_STOCK', purchasable: false, issue: null },
          }),
        ],
        0,
      ),
    );
    renderCart();
    expect(await screen.findByText(t('stock.out'))).toBeInTheDocument();
    const zero = formatXOF(money(0));
    expect(
      screen.getByText((content, element) => content === zero && element?.children.length === 0),
    ).toBeInTheDocument();
  });

  it('surfaces a missing default variant as a catalogue inconsistency', async () => {
    prepareAddToCart({ variantId: 'v1', quantity: 1 });
    previewGuestCart.mockResolvedValue(
      snapshot(
        [
          line({
            quantity: 1,
            unitPrice: null,
            lineSubtotal: null,
            purchasable: false,
            issue: 'MISSING_DEFAULT_VARIANT',
            availability: {
              status: 'UNKNOWN',
              purchasable: false,
              issue: 'MISSING_DEFAULT_VARIANT',
            },
          }),
        ],
        0,
      ),
    );
    renderCart();
    expect(await screen.findByText(t('catalog.inconsistent'))).toBeInTheDocument();
    expect(screen.queryByText(t('stock.out'))).not.toBeInTheDocument();
  });

  it('shows an API error with a retry control', async () => {
    const user = userEvent.setup();
    prepareAddToCart({ variantId: 'v1', quantity: 1 });
    previewGuestCart.mockRejectedValueOnce(new Error('down'));
    previewGuestCart.mockResolvedValueOnce(
      snapshot([line({ quantity: 1, lineSubtotal: 5000 })], 5000),
    );
    renderCart();
    expect(await screen.findByText(t('cart.error'))).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t('errors.retry') }));
    expect(await screen.findByText('[TEST] Crème')).toBeInTheDocument();
  });

  it('has no axe violations on the empty cart', async () => {
    const { container } = renderCart();
    await screen.findByRole('heading', { name: t('cart.empty') });
    const results = await axe.run(container, { rules: { 'color-contrast': { enabled: false } } });
    expect(results.violations).toEqual([]);
  });
});

describe('cart badge chrome', () => {
  it('renders a real count rather than the homepage [TEST] fixture of 3', () => {
    render(<CartIcon count={2} />);
    expect(screen.getByRole('link', { name: t('cart.count', { count: 2 }) })).toBeInTheDocument();
    expect(screen.queryByText('[TEST]')).not.toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });
});
