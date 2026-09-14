import { EmptyState } from '@kairos/ui';

import type { PromoBanner } from '../../content/contract';
import { t } from '../../messages/t';
import { HomeSection } from './HomeSection';

export function PromoSection({ banners }: { banners: readonly PromoBanner[] }) {
  return (
    <HomeSection id="offres" title={t('home.promo')}>
      {banners.length === 0 ? (
        <EmptyState title={t('empty.promo')} />
      ) : (
        <ul className="grid gap-4">
          {banners.map((banner) => (
            <li key={banner.id}>
              <article
                data-surface="inverse"
                className="bg-botanical text-ivory space-y-3 rounded-lg px-6 py-8"
              >
                <h3 className="font-serif text-h3">{banner.title}</h3>
                {banner.subtitle ? (
                  <p className="text-lead text-ivory/90">{banner.subtitle}</p>
                ) : null}
                {banner.ctaLabel && banner.ctaUrl ? (
                  <a
                    href={banner.ctaUrl}
                    data-cta=""
                    className="bg-coral text-ink inline-flex min-h-11 items-center rounded-md px-4 font-semibold"
                  >
                    {banner.ctaLabel}
                  </a>
                ) : null}
              </article>
            </li>
          ))}
        </ul>
      )}
    </HomeSection>
  );
}
