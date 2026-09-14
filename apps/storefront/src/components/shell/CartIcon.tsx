import { t } from '../../messages/t';
import { CartGlyph } from './icons';

export function CartIcon({ count = 0 }: { count?: number }) {
  const label = count > 0 ? t('cart.count', { count }) : t('cart.icon');

  return (
    <a
      href="/panier"
      className="text-botanical relative inline-flex min-h-11 min-w-11 items-center justify-center rounded-md"
      aria-label={label}
    >
      <CartGlyph />
      {count > 0 ? (
        <span
          className="bg-botanical text-ivory absolute top-1 right-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-caption font-semibold"
          aria-hidden="true"
        >
          {count}
        </span>
      ) : null}
    </a>
  );
}
