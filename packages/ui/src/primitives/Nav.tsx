import type { ReactNode } from 'react';

import { cx } from '../lib/cx.js';

export function TopNav({
  label,
  brand,
  children,
  actions,
}: {
  label: string;
  brand: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="bg-ivory/95 border-beige sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex min-h-14 max-w-7xl items-center gap-4 px-gutter py-2 md:px-gutter-md">
        <div className="font-serif text-h4 text-aubergine shrink-0">{brand}</div>
        <nav aria-label={label} className="min-w-0 flex-1">
          <ul className="flex flex-wrap items-center gap-1">{children}</ul>
        </nav>
        {actions ? <div className="ml-auto flex items-center gap-2">{actions}</div> : null}
      </div>
    </header>
  );
}

export function SideNav({
  label,
  brand,
  children,
}: {
  label: string;
  brand?: ReactNode;
  children: ReactNode;
}) {
  return (
    <nav
      aria-label={label}
      data-surface="inverse"
      className="bg-aubergine text-ivory flex h-full min-h-dvh w-[min(100%,16rem)] flex-col gap-4 p-4"
    >
      {brand ? <div className="font-serif text-h3 px-2 pt-2">{brand}</div> : null}
      <ul className="flex flex-col gap-1">{children}</ul>
    </nav>
  );
}

export function NavItem({
  href,
  current,
  children,
  inverse = false,
}: {
  href: string;
  current?: boolean;
  children: ReactNode;
  inverse?: boolean;
}) {
  return (
    <li>
      <a
        href={href}
        aria-current={current ? 'page' : undefined}
        className={cx(
          'block rounded-md px-3 py-2 text-body-sm font-medium',
          inverse
            ? current
              ? 'bg-ivory text-aubergine'
              : 'text-ivory hover:bg-ivory/10'
            : current
              ? 'bg-soft-green text-botanical'
              : 'text-botanical hover:bg-soft-green',
        )}
      >
        {children}
      </a>
    </li>
  );
}

export function Footer({ children, label }: { children: ReactNode; label: string }) {
  return (
    <footer
      aria-label={label}
      data-surface="inverse"
      className="bg-botanical text-ivory mt-section px-gutter py-section md:px-gutter-lg"
    >
      {children}
    </footer>
  );
}
