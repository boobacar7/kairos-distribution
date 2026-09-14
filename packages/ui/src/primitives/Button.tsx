import type { ButtonHTMLAttributes, ReactNode } from 'react';

import { cx } from '../lib/cx.js';
import { Spinner } from './VisuallyHidden.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive' | 'inverse';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-botanical text-ivory hover:bg-botanical/90 disabled:bg-botanical/40',
  secondary:
    'bg-ivory text-botanical border border-botanical hover:bg-soft-green disabled:border-beige disabled:text-botanical/40',
  ghost: 'bg-transparent text-botanical hover:bg-soft-green disabled:text-botanical/40',
  destructive: 'bg-coral text-ink hover:bg-coral/90 disabled:bg-coral/40',
  inverse: 'bg-ivory text-botanical hover:bg-soft-green disabled:bg-ivory/40',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 text-sm',
  md: 'min-h-11 px-4 text-body',
  lg: 'min-h-12 px-5 text-lead',
};

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  loadingLabel?: string;
  children: ReactNode;
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  loadingLabel = 'Loading',
  className,
  disabled,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  const isDisabled = Boolean(disabled) || loading;

  return (
    <button
      {...props}
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      aria-disabled={isDisabled || undefined}
      data-variant={variant}
      className={cx(
        'font-sans inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-colors',
        'disabled:cursor-not-allowed',
        VARIANT[variant],
        SIZE[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading ? <Spinner label={loadingLabel} /> : children}
    </button>
  );
}
