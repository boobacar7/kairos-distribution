'use client';

import { NavItem, TopNav } from '@kairos/ui';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

import { t } from '../../messages/t.js';
import { Sheet } from '../../ui/interactive.js';
import { CartIcon } from './CartIcon.js';
import { MenuGlyph } from './icons.js';

const DESKTOP_NAV = [
  { href: '/', key: 'nav.home' as const },
  { href: '/boutique', key: 'nav.shop' as const },
  { href: '/faq', key: 'nav.faq' as const },
  { href: '/contact', key: 'nav.contact' as const },
] as const;

export function StorefrontHeader() {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="max-md:[&_nav]:hidden">
      <TopNav
        label={t('nav.primary')}
        brand={
          <a href="/" className="font-serif text-h4 text-aubergine">
            {t('brand.name')}
          </a>
        }
        actions={
          <>
            <a
              href="/compte"
              className="text-botanical hidden min-h-11 items-center px-2 text-body-sm font-medium md:inline-flex"
            >
              {t('nav.account')}
            </a>
            <CartIcon />
            <button
              type="button"
              className="text-botanical inline-flex min-h-11 min-w-11 items-center justify-center rounded-md md:hidden"
              aria-label={t('nav.menu')}
              onClick={() => setMenuOpen(true)}
            >
              <MenuGlyph />
            </button>
          </>
        }
      >
        {DESKTOP_NAV.map((item) => (
          <NavItem key={item.href} href={item.href} current={pathname === item.href}>
            {t(item.key)}
          </NavItem>
        ))}
      </TopNav>
      <Sheet
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        title={t('nav.menu')}
        closeLabel={t('nav.closeMenu')}
        side="bottom"
      >
        <ul className="flex flex-col gap-1">
          {DESKTOP_NAV.map((item) => (
            <NavItem key={item.href} href={item.href} current={pathname === item.href}>
              {t(item.key)}
            </NavItem>
          ))}
          <NavItem href="/compte" current={pathname === '/compte'}>
            {t('nav.account')}
          </NavItem>
        </ul>
      </Sheet>
    </div>
  );
}
