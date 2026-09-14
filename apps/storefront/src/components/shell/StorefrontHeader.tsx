'use client';

import { usePathname } from 'next/navigation';

import { t } from '../../messages/t';
import { BrandMark } from './BrandMark';
import { CartIcon } from './CartIcon';
import { AccountGlyph, ChevronGlyph, SearchGlyph } from './icons';

const DESKTOP_NAV = [
  { href: '/', key: 'nav.home' as const },
  { href: '/boutique', key: 'nav.shop' as const },
  { href: '/boutique/promotions', key: 'nav.promotions' as const },
  { href: '/#avis', key: 'nav.reviews' as const },
] as const;

function navIsCurrent(key: (typeof DESKTOP_NAV)[number]['key'], pathname: string): boolean {
  if (key === 'nav.home') return pathname === '/';
  if (key === 'nav.shop')
    return pathname.startsWith('/boutique') && pathname !== '/boutique/promotions';
  if (key === 'nav.promotions') return pathname === '/boutique/promotions';
  return false;
}

export function StorefrontHeader() {
  const pathname = usePathname();

  return (
    <header className="bg-ivory/95 border-beige sticky top-0 z-40 border-b backdrop-blur">
      <div className="relative mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-3 px-gutter py-2 md:min-h-20 md:px-gutter-lg">
        <BrandMark />
        <nav
          aria-label={t('nav.primary')}
          className="absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 md:block"
        >
          <ul className="flex items-center gap-6">
            {DESKTOP_NAV.map((item) => {
              const current = navIsCurrent(item.key, pathname);
              return (
                <li key={item.key}>
                  <a
                    href={item.href}
                    aria-current={current ? 'page' : undefined}
                    className={
                      current
                        ? 'text-botanical border-botanical border-b pb-0.5 text-body-sm font-semibold'
                        : 'text-botanical hover:text-aubergine text-body-sm font-medium'
                    }
                  >
                    {t(item.key)}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="flex items-center gap-1 md:gap-2">
          <span className="text-botanical hidden items-center gap-1 px-2 text-body-sm font-semibold md:inline-flex">
            <span className="sr-only">{t('currency.label')}</span>
            {t('currency.code')}
            <ChevronGlyph />
          </span>
          <span className="bg-beige hidden h-5 w-px md:block" aria-hidden="true" />
          <a
            href="/boutique"
            className="text-botanical inline-flex min-h-11 min-w-11 items-center justify-center rounded-md"
            aria-label={t('nav.search')}
          >
            <SearchGlyph />
          </a>
          <a
            href="/compte"
            className="text-botanical hidden min-h-11 min-w-11 items-center justify-center rounded-md md:inline-flex"
            aria-label={t('nav.account')}
          >
            <AccountGlyph />
          </a>
          <CartIcon />
        </div>
      </div>
    </header>
  );
}
