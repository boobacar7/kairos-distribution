import { Badge, EmptyState } from '@kairos/ui';
import { isTestDataName } from '@kairos/types';

import type { FeaturedProduct } from '../../content/contract';
import { t } from '../../messages/t';
import { PlusGlyph } from '../shell/icons';

function formatPrice(amount: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(amount)} ${t('currency.code')}`;
}

function StarRow({ value, label }: { value: number; label: string }) {
  const rounded = Math.round(value);
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={label}>
      {Array.from({ length: 5 }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={index < rounded ? 'text-caption text-coral' : 'text-caption text-beige'}
        >
          ★
        </span>
      ))}
    </span>
  );
}

export function FeaturedRow({
  products,
}: {
  products: readonly FeaturedProduct[];
}) {
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
                <article className="flex items-center gap-2 md:gap-3">
                  <a href={`/produit/${product.slug}`} className="shrink-0">
                    {product.image ? (
                      <img
                        src={product.image.url}
                        alt={product.image.alt}
                        width={product.image.width ?? 160}
                        height={product.image.height ?? 160}
                        className="h-16 w-16 rounded-lg object-cover md:h-20 md:w-20"
                        loading="lazy"
                      />
                    ) : (
                      <span className="bg-soft-green block h-16 w-16 rounded-lg md:h-20 md:w-20" />
                    )}
                  </a>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-1">
                      <a href={`/produit/${product.slug}`} className="min-w-0">
                        <h3 className="text-botanical truncate text-caption font-semibold md:text-body-sm">
                          {product.name}
                        </h3>
                        {product.subtitle ? (
                          <p className="text-botanical/70 truncate text-caption">{product.subtitle}</p>
                        ) : null}
                      </a>
                      {isTestDataName(product.name) ? (
                        <Badge tone="warning">{t('test.badge')}</Badge>
                      ) : null}
                    </div>
                    {rating !== undefined ? (
                      <p className="mt-0.5 flex flex-wrap items-center gap-1">
                        <StarRow
                          value={rating}
                          label={t('reviews.rating', { value: rating })}
                        />
                        <span className="text-botanical/70 text-caption">
                          {t('product.stars', { count: product.reviewCount ?? 0 })}
                        </span>
                      </p>
                    ) : null}
                    <div className="mt-1 flex items-center justify-between gap-1">
                      <p className="text-botanical text-caption font-semibold md:text-body-sm">
                        {formatPrice(product.price)}
                      </p>
                      <a
                        href={`/produit/${product.slug}`}
                        className="bg-botanical text-ivory inline-flex h-8 w-8 items-center justify-center rounded-full"
                        aria-label={t('product.add', { name: product.name })}
                      >
                        <PlusGlyph className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
