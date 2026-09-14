import type { ReactNode } from 'react';

import { cx } from '../lib/cx.js';
import { Badge, type BadgeTone } from '../primitives/Badge.js';

export type StockTone = 'inStock' | 'low' | 'out';

const TONE: Record<StockTone, BadgeTone> = {
  inStock: 'success',
  low: 'warning',
  out: 'danger',
};

export function StockBadge({ tone, children }: { tone: StockTone; children: ReactNode }) {
  return <Badge tone={TONE[tone]}>{children}</Badge>;
}

export function RatingStars({
  value,
  max = 5,
  label,
}: {
  value: number;
  max?: number;
  label: string;
}) {
  const clamped = Math.min(max, Math.max(0, value));
  const rounded = Math.round(clamped);

  return (
    <span className="inline-flex items-center gap-1" aria-label={label}>
      {Array.from({ length: max }, (_, index) => (
        <span
          key={index}
          aria-hidden="true"
          className={cx('text-sm', index < rounded ? 'text-aubergine' : 'text-beige')}
        >
          ★
        </span>
      ))}
    </span>
  );
}
