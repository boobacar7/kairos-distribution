import type { ReactNode, SVGProps } from 'react';

function Icon({ children, className, ...rest }: SVGProps<SVGSVGElement> & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className ?? 'h-6 w-6'}
      {...rest}
    >
      {children}
    </svg>
  );
}

export function CartGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M6 6h15l-1.5 9h-12z" />
      <path d="M6 6 5 3H2" />
      <circle cx="9" cy="20" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="18" cy="20" r="1.25" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function HomeGlyph({ filled = false, className }: { filled?: boolean; className?: string }) {
  return (
    <Icon className={className} fill={filled ? 'currentColor' : 'none'}>
      <path d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1z" />
    </Icon>
  );
}

export function ShopGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M4 7h16l-1 13H5z" />
      <path d="M9 7V5a3 3 0 0 1 6 0v2" />
    </Icon>
  );
}

export function AccountGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="8" r="3.25" />
      <path d="M5 19a7 7 0 0 1 14 0" />
    </Icon>
  );
}

export function SearchGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <circle cx="11" cy="11" r="6.25" />
      <path d="m16 16 4 4" />
    </Icon>
  );
}

export function ChevronGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-4 w-4'}>
      <path d="m6 9 6 6 6-6" />
    </Icon>
  );
}

export function OrdersGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className}>
      <path d="M7 3h10v18H7z" />
      <path d="M9 8h6M9 12h6M9 16h4" />
    </Icon>
  );
}

export function PlusGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-4 w-4'}>
      <path d="M12 6v12M6 12h12" />
    </Icon>
  );
}

export function LeafGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-8 w-8'} fill="currentColor" stroke="none">
      <path d="M5 19c8-1 14-8 14-16-9 1-16 8-16 16 4-1 6 0 8 1Z" />
      <path d="M7 17c4-4 7-8 9-13" stroke="var(--color-ivory)" strokeWidth="1.4" fill="none" />
    </Icon>
  );
}

export function CupGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-8 w-8'}>
      <path d="M6 8h10v5a5 5 0 0 1-10 0z" />
      <path d="M16 9h2.5a2.5 2.5 0 0 1 0 5H16" />
      <path d="M7 19h8" />
    </Icon>
  );
}

export function CapsuleGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-8 w-8'}>
      <rect x="7" y="4" width="10" height="16" rx="5" transform="rotate(45 12 12)" />
      <path d="m9 15 6-6" />
    </Icon>
  );
}

export function GiftGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-8 w-8'}>
      <path d="M4 11h16v9H4z" />
      <path d="M4 11V8h16v3" />
      <path d="M12 8v12" />
      <path d="M12 8c0-3-2.5-4-4-2s0 4 4 2" />
      <path d="M12 8c0-3 2.5-4 4-2s0 4-4 2" />
    </Icon>
  );
}

export function FacebookGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-5 w-5'}>
      <path d="M14 8h3V5h-3c-2.2 0-4 1.8-4 4v2H8v3h2v7h3v-7h3l1-3h-4V9c0-.6.4-1 1-1Z" />
    </Icon>
  );
}

export function InstagramGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-5 w-5'}>
      <rect x="4" y="4" width="16" height="16" rx="4" />
      <circle cx="12" cy="12" r="3.25" />
      <circle cx="17" cy="7" r="0.8" fill="currentColor" stroke="none" />
    </Icon>
  );
}

export function YoutubeGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-5 w-5'}>
      <rect x="3" y="7" width="18" height="10" rx="3" />
      <path d="m11 10 4 2-4 2z" fill="currentColor" />
    </Icon>
  );
}

export function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-6 w-6'}>
      <path d="M5 19 6.5 15A7.5 7.5 0 1 1 9 18.5z" />
      <path d="M9.5 9.5c.4 1.8 1.7 3.1 3.5 3.5" />
    </Icon>
  );
}

export function ArrowGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-4 w-4'}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}
