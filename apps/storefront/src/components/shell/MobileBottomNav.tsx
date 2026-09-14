'use client';

import { usePathname } from 'next/navigation';

import { t } from '../../messages/t';
import { AccountGlyph, CartGlyph, HomeGlyph, OrdersGlyph, ShopGlyph } from './icons';

const ITEMS = [
  { href: '/', key: 'nav.home' as const, icon: 'home' },
  { href: '/boutique', key: 'nav.shop' as const, icon: 'shop' },
  { href: '/panier', key: 'nav.cart' as const, icon: 'cart' },
  { href: '/commandes', key: 'nav.orders' as const, icon: 'orders' },
  { href: '/compte', key: 'nav.account' as const, icon: 'account' },
] as const;

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label={t('nav.mobile')}
      className="border-beige bg-ivory/95 fixed inset-x-0 bottom-0 z-40 border-t backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-1 py-1">
        {ITEMS.map((item) => {
          const current = pathname === item.href;
          return (
            <li key={item.href} className="flex-1">
              <a
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={
                  current
                    ? 'text-botanical flex flex-col items-center gap-0.5 rounded-md px-1 py-2 text-caption font-semibold'
                    : 'text-botanical/70 flex flex-col items-center gap-0.5 rounded-md px-1 py-2 text-caption font-medium'
                }
              >
                {item.icon === 'home' ? (
                  <HomeGlyph filled={current} className="h-5 w-5" />
                ) : null}
                {item.icon === 'shop' ? <ShopGlyph className="h-5 w-5" /> : null}
                {item.icon === 'cart' ? <CartGlyph className="h-5 w-5" /> : null}
                {item.icon === 'orders' ? <OrdersGlyph className="h-5 w-5" /> : null}
                {item.icon === 'account' ? <AccountGlyph className="h-5 w-5" /> : null}
                {t(item.key)}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
