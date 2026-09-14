import { Badge, EmptyState, ProductCard } from '@kairos/ui';
import { isTestDataName } from '@kairos/types';
import { money } from '@kairos/types/money';

import type { FeaturedProduct } from '../../content/contract.js';
import { t } from '../../messages/t.js';
import { HomeSection } from './HomeSection.js';

export function ProductGrid({
  id,
  title,
  products,
}: {
  id: string;
  title: string;
  products: readonly FeaturedProduct[];
}) {
  return (
    <HomeSection id={id} title={title}>
      {products.length === 0 ? (
        <EmptyState title={title}>{t('empty.products')}</EmptyState>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const rating =
              product.rating != null && product.reviewCount != null && product.reviewCount > 0
                ? product.rating
                : undefined;
            return (
              <li key={product.id}>
                <ProductCard
                  href={`/produit/${product.slug}`}
                  name={product.name}
                  imageAlt={product.image?.alt ?? product.name}
                  image={
                    product.image ? (
                      <img
                        src={product.image.url}
                        alt={product.image.alt}
                        width={product.image.width ?? 600}
                        height={product.image.height ?? 750}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : undefined
                  }
                  price={money(product.price)}
                  compareAt={
                    product.compareAtPrice != null ? money(product.compareAtPrice) : undefined
                  }
                  badge={
                    isTestDataName(product.name) ? (
                      <Badge tone="warning">{t('test.badge')}</Badge>
                    ) : undefined
                  }
                  rating={rating}
                  ratingLabel={
                    rating !== undefined ? t('reviews.rating', { value: rating }) : undefined
                  }
                  stock={product.available ? 'inStock' : 'out'}
                  stockLabel={product.available ? t('stock.inStock') : t('stock.out')}
                />
              </li>
            );
          })}
        </ul>
      )}
    </HomeSection>
  );
}
