import { Badge, Card, CardBody, EmptyState, RatingStars } from '@kairos/ui';

import type { ReviewsSummary, VerifiedReview } from '../../content/contract';
import { t } from '../../messages/t';
import { StarRow } from './FeaturedRow';
import { HomeSection } from './HomeSection';

function formatAverage(value: number): string {
  return value.toFixed(1).replace('.', ',');
}

export function ReviewsSection({
  reviews,
  summary,
}: {
  reviews: readonly VerifiedReview[];
  summary?: ReviewsSummary | null;
}) {
  if (summary) {
    const averageLabel = t('reviews.aggregate', {
      value: formatAverage(summary.averageRating),
      count: summary.reviewCount,
    });
    return (
      <section
        id="avis"
        aria-labelledby="avis-titre"
        className="px-gutter py-1 md:px-gutter-lg md:py-2"
      >
        <div className="border-beige mx-auto grid max-w-7xl grid-cols-[1fr_auto] items-center gap-x-2 gap-y-0.5 rounded-xl border bg-ivory px-3 py-1.5 shadow-soft md:flex md:items-center md:justify-between md:gap-4 md:px-8 md:py-3">
          <div className="min-w-0">
            <h2 id="avis-titre" className="text-botanical text-body font-semibold">
              {summary.headline}
            </h2>
            {summary.supporting ? (
              <p className="text-botanical/80 max-w-xs text-caption leading-tight">
                {summary.supporting}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col items-end gap-0.5 md:order-none md:items-center">
            <StarRow
              value={summary.averageRating}
              label={t('reviews.rating', { value: summary.averageRating })}
              size="body"
            />
            <p className="text-botanical text-caption">{averageLabel}</p>
          </div>
          <div className="col-span-2 flex items-center justify-end gap-2 md:col-auto md:gap-3">
            {summary.avatars.map((avatar) =>
              avatar.url ? (
                <img
                  key={avatar.id}
                  src={avatar.url}
                  alt={avatar.alt}
                  width={avatar.width ?? 150}
                  height={avatar.height ?? 72}
                  className="h-8 w-auto rounded-full md:h-10"
                  loading="lazy"
                />
              ) : null,
            )}
            {summary.additionalCount != null ? (
              <span className="bg-beige text-botanical inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-caption font-semibold md:h-10 md:min-w-10 md:px-3">
                {t('reviews.more', { count: summary.additionalCount })}
              </span>
            ) : null}
          </div>
        </div>
      </section>
    );
  }

  return (
    <HomeSection id="avis" title={t('home.reviews')}>
      {reviews.length === 0 ? (
        <EmptyState title={t('empty.reviews')} />
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
