import { EmptyState } from '@kairos/ui';

import type { PromoBanner } from '../../content/contract';
import { t } from '../../messages/t';
import { ArrowGlyph } from '../shell/icons';
import { HomeSection } from './HomeSection';

export function PromoSection({ banners }: { banners: readonly PromoBanner[] }) {
  if (banners.length === 0) {
    return (
      <HomeSection id="offres" title={t('home.promo')}>
        <EmptyState title={t('empty.promo')} />
      </HomeSection>
    );
  }

  return (
    <section id="offres" aria-label={t('home.promo')} className="px-gutter py-4 md:px-gutter-lg">
      <ul className="mx-auto grid max-w-7xl gap-4">
        {banners.map((banner) => (
          <li key={banner.id}>
            <article className="bg-soft-green relative overflow-hidden rounded-xl px-4 py-5 md:px-8 md:py-6">
              <img
                src="/media/promo-leaf-left.jpg"
                alt=""
                className="pointer-events-none absolute bottom-0 left-0 h-full w-16 object-cover md:w-28"
                aria-hidden="true"
              />
              <img
                src="/media/promo-leaf-right.jpg"
                alt=""
                className="pointer-events-none absolute right-0 bottom-0 h-full w-16 object-cover md:w-28"
                aria-hidden="true"
              />
              <div className="relative flex flex-col items-stretch gap-4 md:flex-row md:items-center md:justify-between md:gap-8 md:px-24">
                <div className="text-center md:text-left">
                  {banner.eyebrow ? (
                    <p className="text-botanical text-caption font-semibold tracking-[0.18em] uppercase">
                      {banner.eyebrow}
                    </p>
                  ) : null}
                  <h3 className="font-serif text-h3 text-botanical md:text-h2">
                    {banner.title}{' '}
                    {banner.highlight ? (
                      <span className="text-coral">{banner.highlight}</span>
                    ) : null}
                  </h3>
                  {banner.subtitle ? (
                    <p className="text-botanical text-body-sm">{banner.subtitle}</p>
                  ) : null}
                </div>
                {banner.code ? (
                  <p className="border-beige bg-ivory text-botanical rounded-lg border px-4 py-3 text-center text-body-sm">
                    {t('home.promoCode')} :{' '}
                    <span className="font-semibold tracking-wide">{banner.code}</span>
                  </p>
                ) : null}
                {banner.ctaLabel && banner.ctaUrl ? (
                  <a
                    href={banner.ctaUrl}
                    className="bg-botanical text-ivory inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-body-sm font-semibold"
                  >
                    {banner.ctaLabel}
                    <ArrowGlyph />
                  </a>
                ) : null}
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  );
}
