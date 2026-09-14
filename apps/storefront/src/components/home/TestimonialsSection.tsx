import { Card, CardBody, EmptyState, RatingStars } from '@kairos/ui';

import type { Testimonial } from '../../content/contract.js';
import { t } from '../../messages/t.js';
import { HomeSection } from './HomeSection.js';

export function TestimonialsSection({ testimonials }: { testimonials: readonly Testimonial[] }) {
  return (
    <HomeSection id="temoignages" title={t('home.testimonials')}>
      {testimonials.length === 0 ? (
        <EmptyState title={t('home.testimonials')}>{t('empty.testimonials')}</EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {testimonials.map((item) => (
            <li key={item.id}>
              <Card>
                <CardBody>
                  {item.rating != null ? (
                    <RatingStars
                      value={item.rating}
                      label={t('reviews.rating', { value: item.rating })}
                    />
                  ) : null}
                  <blockquote>
                    <p>{item.quote}</p>
                  </blockquote>
                  <p className="text-body-sm font-semibold text-botanical">
                    {item.authorName}
                    {item.authorLocation ? ` · ${item.authorLocation}` : ''}
                  </p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </HomeSection>
  );
}
