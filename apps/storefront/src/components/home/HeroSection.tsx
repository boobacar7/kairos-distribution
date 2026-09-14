import { EmptyState } from '@kairos/ui';

import type { HeroSlide } from '../../content/contract';
import { t } from '../../messages/t';
import { Carousel } from '../../ui/interactive';
import { HeroPicture } from './HeroPicture';

const TEXT_POSITION = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right',
} as const;

export function HeroSection({ slides }: { slides: readonly HeroSlide[] }) {
  if (slides.length === 0) {
    return (
      <section aria-label={t('home.hero')} className="px-gutter py-section md:px-gutter-lg">
        <div className="mx-auto max-w-7xl">
          <EmptyState title={t('empty.hero')} />
        </div>
      </section>
    );
  }

  return (
    <section aria-label={t('home.hero')}>
      <Carousel
        label={t('carousel.label')}
        previousLabel={t('carousel.previous')}
        nextLabel={t('carousel.next')}
        pauseLabel={t('carousel.pause')}
        playLabel={t('carousel.play')}
        slideLabel={(page, total) => t('carousel.slide', { page, total })}
        slides={slides.map((slide, index) => ({
          id: slide.id,
          title: slide.title,
          subtitle: slide.subtitle ?? undefined,
          cta:
            slide.ctaLabel && slide.ctaUrl
              ? { label: slide.ctaLabel, href: slide.ctaUrl }
              : undefined,
          textPosition: TEXT_POSITION[slide.textPosition],
          image: slide.desktopImage ? (
            <HeroPicture
              desktop={slide.desktopImage}
              mobile={slide.mobileImage}
              priority={index === 0}
            />
          ) : undefined,
        }))}
      />
    </section>
  );
}
