import type { Money } from '@kairos/types/money';
import type { ReactNode } from 'react';

import { Button } from '../primitives/Button.js';
import { Card, CardBody, CardMedia, CardTitle } from '../primitives/Card.js';
import { PriceDisplay } from './PriceDisplay.js';
import { RatingStars, StockBadge, type StockTone } from './StockBadge.js';

export function ProductCard({
  href,
  name,
  image,
  imageAlt,
  price,
  compareAt,
  badge,
  rating,
  ratingLabel,
  stock,
  stockLabel,
  actionLabel,
  onAction,
}: {
  href: string;
  name: string;
  image?: ReactNode;
  imageAlt: string;
  price: Money;
  compareAt?: Money;
  badge?: ReactNode;
  rating?: number;
  ratingLabel?: string;
  stock?: StockTone;
  stockLabel?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <Card>
      <div className="relative">
        <a href={href} className="block">
          <CardMedia>
            {image ?? (
              <span
                className="bg-soft-green block h-full min-h-56 w-full"
                role="img"
                aria-label={imageAlt}
              />
            )}
          </CardMedia>
        </a>
        {badge ? <span className="absolute top-3 left-3">{badge}</span> : null}
      </div>
      <CardBody>
        <a href={href} className="hover:text-botanical">
          <CardTitle>{name}</CardTitle>
        </a>
        <PriceDisplay amount={price} compareAt={compareAt} />
        {rating !== undefined && ratingLabel ? (
          <RatingStars value={rating} label={ratingLabel} />
        ) : null}
        {stock && stockLabel ? <StockBadge tone={stock}>{stockLabel}</StockBadge> : null}
        {actionLabel && onAction ? (
          <Button fullWidth onClick={onAction}>
            {actionLabel}
          </Button>
        ) : null}
      </CardBody>
    </Card>
  );
}
