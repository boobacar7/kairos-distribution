import { Badge, EmptyState } from '@kairos/ui';
import { isTestDataName } from '@kairos/types';

import type { FeaturedProduct } from '../../content/contract';
import { t } from '../../messages/t';
import { PlusGlyph } from '../shell/icons';

function formatPrice(amount: number): string {
  const grouped = Math.trunc(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return `${grouped} ${t('currency.code')}`;
}

function StarRow({
  value,
  label,
  size = 'caption',
}: {
  value: number;
  label: string;
  size?: 'caption' | 'body';
}) {
  const rounded = Math.round(value);
  const type = size === 'body' ? 'text-body' : 'text-caption';
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={index < rounded ? `${type} text-coral` : `${type} text-beige`}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export { StarRow };

export function FeaturedRow({ products }: { products: readonly FeaturedProduct[] }) {
  if (products.length === 0) {
    return (
      <section
        id="produits-phares"
        aria-labelledby="produits-phares-titre"
        className="px-gutter py-4 md:px-gutter-lg"
      >
        <div className="mx-auto max-w-7xl space-y-4">
          <h2 id="produits-phares-titre" className="font-serif text-h3 text-botanical md:text-h2">
            {t('home.featured')}
          </h2>
          <EmptyState title={t('empty.products')} />
        </div>
      </section>
    );
  }

  return (
    <section
      id="produits-phares"
      aria-labelledby="produits-phares-titre"
      className="px-gutter py-4 md:px-gutter-lg"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-4 flex items-baseline justify-between gap-4">
          <h2 id="produits-phares-titre" className="font-serif text-h3 text-botanical md:text-h2">
            {t('home.featured')}
          </h2>
          <a href="/boutique" className="text-botanical text-body-sm font-medium">
            {t('home.seeAll')} <span aria-hidden="true">&gt;</span>
          </a>
        </div>
        <ul className="grid grid-cols-4 gap-2 md:gap-5">
          {products.map((product) => {
            const rating =
              product.rating != null && product.reviewCount != null && product.reviewCount > 0
                ? product.rating
                : undefined;
            return (
              <li key={product.id}>
                <article className="relative flex flex-col gap-1.5 md:flex-row md:items-center md:gap-3 md:pr-10">
                  <a href={`/produit/${product.slug}`} className="shrink-0">
                    {product.image ? (
                      <img
                        src={product.image.url}
                        alt={product.image.alt}
                        width={product.image.width ?? 160}
                        height={product.image.height ?? 160}
                        className="h-[4.5rem] w-full rounded-lg object-cover md:h-[7.5rem] md:w-[7.5rem]"
                        loading="lazy"
                      />
                    ) : (
                      <span className="bg-soft-green block h-[4.5rem] w-full rounded-lg md:h-[7.5rem] md:w-[7.5rem]" />
                    )}
                  </a>
                  <div className="min-w-0 flex-1 pr-9 md:pr-0">
                    <div className="flex items-start justify-between gap-1">
                      <a href={`/produit/${product.slug}`} className="min-w-0">
                        <h3 className="text-botanical text-caption leading-tight font-semibold md:text-body-sm">
                          {product.name}
                        </h3>
                        {product.subtitle ? (
                          <p className="text-botanical/70 text-caption leading-tight">
                            {product.subtitle}
                          </p>
                        ) : null}
                      </a>
                      {isTestDataName(product.name) ? (
                        <Badge tone="warning">{t('test.badge')}</Badge>
                      ) : null}
                    </div>
                    {rating !== undefined ? (
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-1">
                        <StarRow value={rating} label={t('reviews.rating', { value: rating })} />
                        <span className="text-botanical/70 text-caption">
                          {t('product.stars', { count: product.reviewCount ?? 0 })}
                        </span>
                      </p>
                    ) : null}
                    <p className="text-botanical mt-1 text-caption whitespace-nowrap font-semibold md:text-body-sm">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  <a
                    href={`/produit/${product.slug}`}
                    className="bg-botanical text-ivory absolute right-0 bottom-0 inline-flex h-7 w-7 items-center justify-center rounded-full md:top-1/2 md:bottom-auto md:-translate-y-1/2 md:h-8 md:w-8"
                    aria-label={t('product.add', { name: product.name })}
                  >
                    <PlusGlyph className="h-3.5 w-3.5" />
                  </a>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
