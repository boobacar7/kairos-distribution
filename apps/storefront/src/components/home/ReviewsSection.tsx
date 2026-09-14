import { Badge, Card, CardBody, EmptyState, RatingStars } from '@kairos/ui';

import type { ReviewsSummary, VerifiedReview } from '../../content/contract';
import { t } from '../../messages/t';
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
      <section id="avis" aria-labelledby="avis-titre" className="px-gutter py-4 md:px-gutter-lg">
        <div className="border-beige mx-auto flex max-w-7xl flex-col gap-4 rounded-xl border bg-ivory px-4 py-4 shadow-soft md:flex-row md:items-center md:justify-between md:px-8">
          <div>
            <h2 id="avis-titre" className="text-botanical text-body font-semibold">
              {summary.headline}
            </h2>
            {summary.supporting ? (
              <p className="text-botanical/80 max-w-xs text-caption">{summary.supporting}</p>
            ) : null}
          </div>
          <div className="flex flex-col items-start gap-1 md:items-center">
            <RatingStars
              value={summary.averageRating}
              label={t('reviews.rating', { value: summary.averageRating })}
            />
            <p className="text-botanical text-caption">{averageLabel}</p>
          </div>
          <div className="flex items-center gap-3">
            {summary.avatars.map((avatar) =>
              avatar.url ? (
                <img
                  key={avatar.id}
                  src={avatar.url}
                  alt={avatar.alt}
                  width={avatar.width ?? 150}
                  height={avatar.height ?? 72}
                  className="h-10 w-auto rounded-full"
                  loading="lazy"
                />
              ) : null,
            )}
            {summary.additionalCount != null ? (
              <span className="bg-beige text-botanical inline-flex h-10 min-w-10 items-center justify-center rounded-full px-3 text-caption font-semibold">
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
