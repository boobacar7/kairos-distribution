import type { ReactNode } from 'react';

import { cx } from '../lib/cx.js';
import { Button } from './Button.js';

export type ToastTone = 'info' | 'success' | 'warning' | 'danger';

const TONE: Record<ToastTone, string> = {
  info: 'bg-soft-green text-ink border-botanical',
  success: 'bg-soft-green text-ink border-botanical',
  warning: 'bg-beige text-ink border-beige',
  danger: 'bg-coral text-ink border-coral',
};

export function ToastRegion({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(100%-2rem,24rem)] flex-col gap-2">
      <div role="status" aria-live="polite" aria-label={label} className="flex flex-col gap-2">
        {children}
      </div>
    </div>
  );
}

export function Toast({
  tone = 'info',
  children,
  onDismiss,
  dismissLabel,
}: {
  tone?: ToastTone;
  children: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
}) {
  return (
    <div
      className={cx(
        'pointer-events-auto flex items-start gap-3 rounded-md border px-4 py-3 shadow-soft',
        TONE[tone],
      )}
    >
      <p className="text-body-sm flex-1 font-medium">{children}</p>
      {onDismiss && dismissLabel ? (
        <Button variant="ghost" size="sm" onClick={onDismiss} aria-label={dismissLabel}>
          ×
        </Button>
      ) : null}
    </div>
  );
}
