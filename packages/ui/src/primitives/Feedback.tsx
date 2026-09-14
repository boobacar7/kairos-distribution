import type { ReactNode } from 'react';

import { cx } from '../lib/cx.js';
import { Button } from './Button.js';

export type AlertTone = 'info' | 'success' | 'warning' | 'danger';

const TONE: Record<AlertTone, string> = {
  info: 'bg-soft-green border-botanical text-ink',
  success: 'bg-soft-green border-botanical text-botanical',
  warning: 'bg-beige border-beige text-ink',
  danger: 'bg-coral border-coral text-ink',
};

export function Alert({
  tone = 'info',
  title,
  children,
  onDismiss,
  dismissLabel,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
}) {
  const role = tone === 'danger' || tone === 'warning' ? 'alert' : 'status';

  return (
    <div
      role={role}
      className={cx('flex items-start gap-3 rounded-md border px-4 py-3', TONE[tone])}
    >
      <div className="min-w-0 flex-1">
        {title ? <p className="text-body-sm font-semibold">{title}</p> : null}
        <div className="text-body-sm">{children}</div>
      </div>
      {onDismiss && dismissLabel ? (
        <Button variant="ghost" size="sm" onClick={onDismiss} aria-label={dismissLabel}>
          ×
        </Button>
      ) : null}
    </div>
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="border-beige flex flex-col items-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center">
      <h2 className="font-serif text-h3 text-aubergine">{title}</h2>
      {children ? <p className="text-body max-w-prose text-botanical">{children}</p> : null}
      {action}
    </div>
  );
}
