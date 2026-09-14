'use client';

import { usePathname } from 'next/navigation';

import { t } from '../../messages/t.js';
import { AccountGlyph, CartGlyph, HomeGlyph, ShopGlyph } from './icons.js';

const ITEMS = [
  { href: '/', key: 'nav.home' as const, icon: HomeGlyph },
  { href: '/boutique', key: 'nav.shop' as const, icon: ShopGlyph },
  { href: '/panier', key: 'nav.cart' as const, icon: CartGlyph },
  { href: '/compte', key: 'nav.account' as const, icon: AccountGlyph },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label={t('nav.mobile')}
      className="border-beige bg-ivory/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-1">
        {ITEMS.map((item) => {
          const current = pathname === item.href;
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <a
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={
                  current
                    ? 'bg-botanical text-ivory flex flex-col items-center gap-1 rounded-md px-2 py-2 text-caption font-semibold'
                    : 'text-botanical flex flex-col items-center gap-1 rounded-md px-2 py-2 text-caption font-semibold'
                }
              >
                <Icon />
                {t(item.key)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
