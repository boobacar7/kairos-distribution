import type { ReactNode } from 'react';

import { cx } from '../lib/cx.js';

export function VisuallyHidden({ children }: { children: ReactNode }) {
  return <span className="sr-only">{children}</span>;
}

export function SkipLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className={cx(
        'bg-botanical text-ivory absolute left-4 z-50 rounded-md px-3 py-2 text-sm font-semibold',
        '-translate-y-[200%] focus:translate-y-4',
      )}
    >
      {children}
    </a>
  );
}

export function Spinner({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-2" role="status">
      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 0 1 8-8v3a5 5 0 0 0-5 5H4z"
        />
      </svg>
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}

export function Skeleton({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span
      className={cx('bg-beige/70 inline-block animate-pulse rounded-md', className ?? 'h-4 w-full')}
      aria-busy="true"
      aria-live="polite"
    >
      <VisuallyHidden>{label}</VisuallyHidden>
    </span>
  );
}
