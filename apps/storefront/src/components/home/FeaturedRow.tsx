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
          className={index < rounded ? `${type} text-gold` : `${type} text-beige`}
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
        className="px-gutter py-2 md:px-gutter-lg"
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
      className="px-gutter py-2 md:px-gutter-lg"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-2 flex items-baseline justify-between gap-4 md:mb-3">
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
                <article className="relative flex flex-col gap-1 md:flex-row md:items-center md:gap-3 md:pr-10">
                  <a href={`/produit/${product.slug}`} className="shrink-0">
                    {product.image ? (
                      <img
                        src={product.image.url}
                        alt={product.image.alt}
                        width={product.image.width ?? 160}
                        height={product.image.height ?? 160}
                        className="h-16 w-full rounded-lg object-cover md:h-[7.25rem] md:w-[7.25rem]"
                        loading="lazy"
                      />
                    ) : (
                      <span className="bg-soft-green block h-16 w-full rounded-lg md:h-[7.25rem] md:w-[7.25rem]" />
                    )}
                  </a>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <a href={`/produit/${product.slug}`} className="min-w-0">
                        <h3 className="text-botanical text-[0.6875rem] leading-tight font-semibold md:text-body-sm">
                          {product.name}
                        </h3>
                        {product.subtitle ? (
                          <p className="text-botanical/70 text-[0.625rem] leading-tight md:text-caption">
                            {product.subtitle}
                          </p>
                        ) : null}
                      </a>
                      {isTestDataName(product.name) ? (
                        <Badge tone="warning">{t('test.badge')}</Badge>
                      ) : null}
                    </div>
                    {rating !== undefined ? (
                      <p className="mt-0.5 flex flex-nowrap items-center gap-x-0.5 overflow-hidden whitespace-nowrap">
                        <StarRow value={rating} label={t('reviews.rating', { value: rating })} />
                        <span className="text-botanical/70 text-[0.625rem] md:text-caption">
                          {t('product.stars', { count: product.reviewCount ?? 0 })}
                        </span>
                      </p>
                    ) : null}
                    <p className="text-botanical mt-0.5 text-[0.6875rem] leading-tight font-semibold md:pr-2 md:text-body-sm">
                      {formatPrice(product.price)}
                    </p>
                  </div>
                  <a
                    href={`/produit/${product.slug}`}
                    className="bg-botanical text-ivory absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full md:top-1/2 md:right-0 md:h-8 md:w-8 md:-translate-y-1/2"
                    aria-label={t('product.add', { name: product.name })}
                  >
                    <PlusGlyph className="h-3 w-3 md:h-3.5 md:w-3.5" />
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
