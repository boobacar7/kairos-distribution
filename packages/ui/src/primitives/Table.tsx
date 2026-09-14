import type {
  ButtonHTMLAttributes,
  ReactNode,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from 'react';

import { cx } from '../lib/cx.js';

export function Table({
  caption,
  children,
  className,
  ...props
}: TableHTMLAttributes<HTMLTableElement> & { caption: string }) {
  return (
    <div className="border-beige overflow-x-auto rounded-lg border">
      <table {...props} className={cx('w-full min-w-[36rem] border-collapse text-left', className)}>
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return <thead className="bg-soft-green text-caption text-botanical uppercase">{children}</thead>;
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="text-body-sm text-ink">{children}</tbody>;
}

export function TR({
  children,
  selected,
  className,
}: {
  children: ReactNode;
  selected?: boolean;
  className?: string;
}) {
  return (
    <tr className={cx('border-beige border-t', selected ? 'bg-soft-green' : 'bg-ivory', className)}>
      {children}
    </tr>
  );
}

export function TH({
  children,
  className,
  sorted,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & {
  children?: ReactNode;
  sorted?: 'ascending' | 'descending' | 'none';
}) {
  return (
    <th
      {...props}
      aria-sort={sorted && sorted !== 'none' ? sorted : undefined}
      className={cx('px-3 py-3 font-semibold', className)}
    >
      {children}
    </th>
  );
}

export function TD({
  children,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { children?: ReactNode }) {
  return (
    <td {...props} className={cx('px-3 py-3 align-middle', className)}>
      {children}
    </td>
  );
}

export function SortButton({
  children,
  sorted,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  sorted?: 'ascending' | 'descending' | 'none';
}) {
  return (
    <button
      {...props}
      type="button"
      className="hover:text-ink inline-flex items-center gap-1 font-semibold"
    >
      {children}
      <span aria-hidden="true">
        {sorted === 'ascending' ? '↑' : sorted === 'descending' ? '↓' : '↕'}
      </span>
    </button>
  );
}
