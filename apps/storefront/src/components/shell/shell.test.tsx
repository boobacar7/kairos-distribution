import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { t } from '../../messages/t';
import { StorefrontHeader } from './StorefrontHeader';
import { MobileBottomNav } from './MobileBottomNav';
import { CartIcon } from './CartIcon';

describe('storefront shell', () => {
  it('exposes desktop nav labels from the French dictionary', () => {
    render(<StorefrontHeader />);
    expect(screen.getAllByRole('link', { name: t('nav.home') }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: t('nav.shop') }).length).toBeGreaterThan(0);
    expect(screen.getByRole('link', { name: t('nav.promotions') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t('nav.reviews') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t('nav.search') })).toHaveAttribute(
      'href',
      '/boutique',
    );
    expect(screen.getByRole('link', { name: t('cart.icon') })).toHaveAttribute('href', '/panier');
  });

  it('does not render a hamburger control', () => {
    render(<StorefrontHeader />);
    expect(screen.queryByRole('button', { name: t('nav.menu') })).not.toBeInTheDocument();
  });

  it('renders five mobile bottom navigation destinations', () => {
    render(<MobileBottomNav />);
    expect(screen.getByRole('navigation', { name: t('nav.mobile') })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t('nav.cart') })).toHaveAttribute('href', '/panier');
    expect(screen.getByRole('link', { name: t('nav.orders') })).toHaveAttribute(
      'href',
      '/commandes',
    );
  });

  it('hides the cart count when empty', () => {
    render(<CartIcon count={0} />);
    expect(screen.getByRole('link', { name: t('cart.icon') })).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('shows the [TEST] demo badge of 3 from the approved frame', () => {
    render(<CartIcon count={3} demo />);
    expect(
      screen.getByRole('link', { name: t('cart.demoCount', { count: 3 }) }),
    ).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('shows the demo cart badge on the mobile panier tab', () => {
    render(<MobileBottomNav cartCount={3} demoCart />);
    expect(
      screen.getByRole('link', { name: t('cart.demoCount', { count: 3 }) }),
    ).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });
});
