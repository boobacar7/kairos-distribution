import type { ReactNode } from 'react';

import { cx } from '../lib/cx.js';
import { Button } from './Button.js';

export function Pagination({
  page,
  pageCount,
  onPageChange,
  previousLabel,
  nextLabel,
  pageLabel,
}: {
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
  previousLabel: string;
  nextLabel: string;
  pageLabel: (page: number) => string;
}) {
  const pages = Array.from({ length: pageCount }, (_, index) => index + 1);

  return (
    <nav aria-label={pageLabel(page)} className="flex flex-wrap items-center gap-1">
      <Button
        variant="secondary"
        size="sm"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        {previousLabel}
      </Button>
      <ul className="flex flex-wrap gap-1">
        {pages.map((item) => (
          <li key={item}>
            <Button
              variant={item === page ? 'primary' : 'ghost'}
              size="sm"
              aria-current={item === page ? 'page' : undefined}
              aria-label={pageLabel(item)}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          </li>
        ))}
      </ul>
      <Button
        variant="secondary"
        size="sm"
        disabled={page >= pageCount}
        onClick={() => onPageChange(page + 1)}
      >
        {nextLabel}
      </Button>
    </nav>
  );
}

export type BreadcrumbItem = {
  href?: string;
  label: ReactNode;
};

export function Breadcrumb({ items, label }: { items: readonly BreadcrumbItem[]; label: string }) {
  return (
    <nav aria-label={label} className="text-body-sm text-botanical">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={index} className="flex items-center gap-2">
              {last || !item.href ? (
                <span
                  aria-current={last ? 'page' : undefined}
                  className={cx(last && 'font-semibold text-ink')}
                >
                  {item.label}
                </span>
              ) : (
                <a
                  href={item.href}
                  className="hover:text-aubergine underline-offset-4 hover:underline"
                >
                  {item.label}
                </a>
              )}
              {!last ? (
                <span aria-hidden="true" className="text-beige">
                  /
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
