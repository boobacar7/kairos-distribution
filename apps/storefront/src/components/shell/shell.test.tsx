import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { t } from '../../messages/t.js';
import { StorefrontHeader } from './StorefrontHeader.js';
import { MobileBottomNav } from './MobileBottomNav.js';
import { CartIcon } from './CartIcon.js';

describe('storefront shell', () => {
  it('exposes desktop nav labels from the French dictionary', () => {
    render(<StorefrontHeader />);
    expect(screen.getAllByRole('link', { name: t('nav.home') }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: t('nav.shop') }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: t('cart.icon') })).toHaveAttribute('href', '/panier');
  });

  it('opens the mobile menu sheet from the header button', async () => {
    const user = userEvent.setup();
    render(<StorefrontHeader />);
    await user.click(screen.getByRole('button', { name: t('nav.menu') }));
    expect(screen.getByRole('heading', { name: t('nav.menu') })).toBeInTheDocument();
  });

  it('renders mobile bottom navigation destinations', () => {
    render(<MobileBottomNav />);
    expect(screen.getByRole('navigation', { name: t('nav.mobile') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t('nav.cart') })).toHaveAttribute('href', '/panier');
  });

  it('hides the cart count when empty', () => {
    render(<CartIcon count={0} />);
    expect(screen.getByRole('link', { name: t('cart.icon') })).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });
});
