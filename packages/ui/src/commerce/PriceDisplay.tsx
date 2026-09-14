import { formatXOF, type Money } from '@kairos/types/money';

import { cx } from '../lib/cx.js';

export function PriceDisplay({
  amount,
  compareAt,
  className,
}: {
  amount: Money;
  compareAt?: Money;
  className?: string;
}) {
  const discounted = compareAt !== undefined && compareAt > amount;

  return (
    <span className={cx('font-sans inline-flex items-baseline gap-2', className)}>
      <span className="font-semibold text-ink">{formatXOF(amount)}</span>
      {discounted ? <s className="text-body-sm text-botanical/70">{formatXOF(compareAt)}</s> : null}
    </span>
  );
}
