import { EmptyState } from '@kairos/ui';
import type { ComponentType } from 'react';

import type { CategoryCard } from '../../content/contract';
import { t } from '../../messages/t';
import { CapsuleGlyph, CupGlyph, GiftGlyph, LeafGlyph } from '../shell/icons';

const ICON_BY_SLUG: Record<string, { Icon: ComponentType<{ className?: string }>; tone: string }> =
  {
    'beaute-soins': { Icon: LeafGlyph, tone: 'bg-soft-green text-botanical' },
    'thes-infusions': { Icon: CupGlyph, tone: 'bg-beige text-botanical' },
    capsules: { Icon: CapsuleGlyph, tone: 'bg-coral text-ink' },
    packs: { Icon: GiftGlyph, tone: 'bg-powder-pink text-botanical' },
  };

export function CategoriesSection({ categories }: { categories: readonly CategoryCard[] }) {
  if (categories.length === 0) {
    return (
      <section aria-label={t('home.categories')} className="px-gutter py-6 md:px-gutter-lg">
        <div className="mx-auto max-w-7xl">
          <EmptyState title={t('empty.categories')} />
        </div>
      </section>
    );
  }

  return (
    <section aria-label={t('home.categories')} className="px-gutter py-4 md:px-gutter-lg md:py-6">
      <ul className="mx-auto grid max-w-7xl grid-cols-4 gap-2 md:gap-8">
        {categories.map((category) => {
          const visual = ICON_BY_SLUG[category.slug] ?? {
            Icon: LeafGlyph,
            tone: 'bg-soft-green text-botanical',
          };
          const Icon = visual.Icon;
          return (
            <li key={category.id}>
              <a
                href={`/boutique/${category.slug}`}
                className="flex flex-col items-center gap-2 text-center md:flex-row md:gap-4 md:text-left"
              >
                <span
                  className={`inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full md:h-20 md:w-20 ${visual.tone}`}
                >
                  <Icon className="h-8 w-8" />
                </span>
                <span>
                  <span className="text-botanical block text-body-sm font-semibold md:text-body">
                    {category.name}
                  </span>
                  {category.subtitle ? (
                    <span className="text-botanical/70 block text-caption">
                      {category.subtitle}
                    </span>
                  ) : null}
                </span>
              </a>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
