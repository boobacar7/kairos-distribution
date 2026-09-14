import { Badge, Card, CardBody, EmptyState, RatingStars } from '@kairos/ui';

import type { VerifiedReview } from '../../content/contract.js';
import { t } from '../../messages/t.js';
import { HomeSection } from './HomeSection.js';

export function ReviewsSection({ reviews }: { reviews: readonly VerifiedReview[] }) {
  return (
    <HomeSection id="avis" title={t('home.reviews')}>
      {reviews.length === 0 ? (
        <EmptyState title={t('home.reviews')}>{t('empty.reviews')}</EmptyState>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <li key={review.id}>
              <Card>
                <CardBody>
                  <div className="flex flex-wrap items-center gap-2">
                    <RatingStars
                      value={review.rating}
                      label={t('reviews.rating', { value: review.rating })}
                    />
                    <Badge tone="success">{t('reviews.verified')}</Badge>
                  </div>
                  <p className="text-body-sm font-semibold text-botanical">{review.productName}</p>
                  <p>{review.comment}</p>
                  <p className="text-body-sm text-botanical">{review.authorName}</p>
                </CardBody>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </HomeSection>
  );
}
