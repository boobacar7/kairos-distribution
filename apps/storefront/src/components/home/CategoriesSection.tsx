import { Card, CardBody, CardMedia, CardTitle, EmptyState } from '@kairos/ui';

import type { CategoryCard } from '../../content/contract';
import { t } from '../../messages/t';
import { HomeSection } from './HomeSection';

export function CategoriesSection({ categories }: { categories: readonly CategoryCard[] }) {
  return (
    <HomeSection id="categories" title={t('home.categories')}>
      {categories.length === 0 ? (
        <EmptyState title={t('empty.categories')} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <li key={category.id}>
              <Card as="div">
                <a href={`/boutique/${category.slug}`} className="block">
                  <CardMedia>
                    {category.image ? (
                      <img
                        src={category.image.url}
                        alt={category.image.alt}
                        width={category.image.width ?? 600}
                        height={category.image.height ?? 750}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <span className="bg-soft-green block h-full min-h-40 w-full" />
                    )}
                  </CardMedia>
                  <CardBody>
                    <CardTitle>{category.name}</CardTitle>
                  </CardBody>
                </a>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </HomeSection>
  );
}
