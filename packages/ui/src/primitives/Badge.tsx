import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../lib/cx.js';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'brand' | 'blush';

const TONE: Record<BadgeTone, string> = {
  neutral: 'bg-ivory text-ink border-beige',
  success: 'bg-soft-green text-ink border-soft-green',
  warning: 'bg-beige text-ink border-beige',
  danger: 'bg-coral text-ink border-coral',
  info: 'bg-botanical text-ivory border-botanical',
  brand: 'bg-botanical text-ivory border-botanical',
  blush: 'bg-powder-pink text-ink border-powder-pink',
};

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
  children: ReactNode;
};

export function Badge({ tone = 'neutral', className, children, ...props }: BadgeProps) {
  return (
    <span
      {...props}
      className={cx(
        'font-sans inline-flex items-center rounded-full border px-2.5 py-0.5 text-caption font-semibold tracking-wide uppercase',
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
