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
    <section
      id="offres"
      aria-label={t('home.promo')}
      className="px-gutter py-1 md:px-gutter-lg md:py-2"
    >
      <ul className="mx-auto grid max-w-7xl gap-4">
        {banners.map((banner) => (
          <li key={banner.id}>
            <article className="bg-soft-green relative overflow-hidden rounded-xl px-3 py-2 md:px-8 md:py-5">
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
              <div className="relative grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 gap-y-1 md:flex md:flex-row md:items-center md:justify-between md:gap-8 md:px-24">
                {banner.eyebrow ? (
                  <p className="text-botanical col-span-2 text-[0.625rem] font-semibold tracking-[0.14em] whitespace-nowrap uppercase md:hidden">
                    {banner.eyebrow}
                  </p>
                ) : null}
                <div className="min-w-0 px-6 text-left md:px-0">
                  {banner.eyebrow ? (
                    <p className="text-botanical hidden text-caption font-semibold tracking-[0.18em] uppercase md:block">
                      {banner.eyebrow}
                    </p>
                  ) : null}
                  <h3 className="font-serif text-h4 leading-tight text-botanical md:text-h2">
                    {banner.title}{' '}
                    {banner.highlight ? (
                      <span className="text-coral">{banner.highlight}</span>
                    ) : null}
                  </h3>
                  {banner.subtitle ? (
                    <p className="text-botanical text-caption md:text-body-sm">{banner.subtitle}</p>
                  ) : null}
                </div>
                {banner.code ? (
                  <p className="border-beige bg-ivory text-botanical rounded-lg border px-2 py-1.5 text-center text-caption md:px-4 md:py-3 md:text-body-sm">
                    {t('home.promoCode')} :{' '}
                    <span className="font-semibold tracking-wide">{banner.code}</span>
                  </p>
                ) : null}
                {banner.ctaLabel && banner.ctaUrl ? (
                  <a
                    href={banner.ctaUrl}
                    className="bg-botanical text-ivory col-start-2 inline-flex min-h-9 items-center justify-center gap-1 rounded-full px-3 text-caption font-semibold md:min-h-11 md:gap-2 md:px-5 md:text-body-sm"
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
