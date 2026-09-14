import type { HTMLAttributes, ReactNode } from 'react';

import { cx } from '../lib/cx.js';

export function Card({
  className,
  children,
  as: Tag = 'article',
  ...props
}: HTMLAttributes<HTMLElement> & {
  children: ReactNode;
  as?: 'article' | 'div' | 'section' | 'li';
}) {
  return (
    <Tag
      {...props}
      className={cx(
        'bg-ivory border-beige shadow-soft overflow-hidden rounded-lg border',
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function CardMedia({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx('bg-soft-green aspect-[4/5] w-full overflow-hidden', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('flex flex-col gap-2 p-4', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return <h3 className={cx('font-serif text-h4 text-aubergine', className)}>{children}</h3>;
}
