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
      <path d="M12 2.5c.8 1.2 1.4 2.4 1.6 3.7 3.6.6 6.6 3.4 7.4 7.1-1.2 4.8-5.6 8.2-10.5 8.2-1.7 0-3.2-.4-4.5-1.2C3.6 16 2.8 10.6 6 6.2c1.7-2.3 3.8-3.4 6-3.7Z" />
      <path
        d="M11.2 5.2c.2 3.4.1 6.7-1.6 10.2"
        stroke="var(--color-ivory)"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M11.4 9.2c1.6 1 3.2 1.4 4.8 1.3M10.6 12.4c1.3.8 2.6 1.2 4.1 1.2"
        stroke="var(--color-ivory)"
        strokeWidth="1.15"
        fill="none"
      />
    </Icon>
  );
}

export function CupGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-8 w-8'} strokeWidth={1.9}>
      <path d="M8 5.2c.6 1.1.6 2.2 0 3.2M11 4.8c.7 1.2.7 2.4 0 3.5M14 5.2c.6 1.1.6 2.2 0 3.2" />
      <path d="M5.5 9.5h10.2v4.2a4.8 4.8 0 0 1-10.2 0z" fill="currentColor" stroke="none" />
      <path d="M15.7 10.2h2.2a2.3 2.3 0 0 1 0 4.6h-1.6" />
      <path d="M7.2 19.2h7.6" />
    </Icon>
  );
}

export function CapsuleGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-8 w-8'} strokeWidth={1.7}>
      <path d="M8.2 15.8a4.2 4.2 0 0 1 0-5.9l5.7-5.7a4.2 4.2 0 1 1 5.9 5.9l-5.7 5.7a4.2 4.2 0 0 1-5.9 0Z" />
      <path d="m9.6 14.4 5.9-5.9" />
      <path
        d="M8.8 12.2c.6 2 2.6 3.4 4.8 3.2"
        fill="currentColor"
        fillOpacity="0.35"
        stroke="none"
      />
    </Icon>
  );
}

export function GiftGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-8 w-8'} strokeWidth={1.9}>
      <path d="M4.5 10.5h15v9.2H4.5z" fill="currentColor" fillOpacity="0.18" />
      <path d="M4.5 10.5h15v9.2H4.5z" />
      <path d="M4.5 10.5V8.2h15V10.5" />
      <path d="M12 8.2v11.5" />
      <path d="M12 8.2c-.2-2.8-2.8-3.8-4.2-2.2C6.4 7.6 8.2 9.6 12 8.2" fill="currentColor" />
      <path d="M12 8.2c.2-2.8 2.8-3.8 4.2-2.2C17.6 7.6 15.8 9.6 12 8.2" fill="currentColor" />
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
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={className ?? 'h-6 w-6'}
      fill="currentColor"
    >
      <path d="M12.04 2.5A9.46 9.46 0 0 0 2.6 11.9c0 1.67.44 3.3 1.27 4.73L2.5 21.5l5.03-1.32A9.47 9.47 0 0 0 12.04 21.4 9.5 9.5 0 0 0 21.5 11.9 9.5 9.5 0 0 0 12.04 2.5Zm5.53 13.42c-.23.65-1.14 1.2-1.86 1.36-.5.11-1.14.2-3.32-.71-2.79-1.17-4.58-4.02-4.72-4.2-.14-.19-1.18-1.57-1.18-3 0-1.42.75-2.12 1.01-2.41.27-.29.58-.36.77-.36h.56c.18 0 .42-.07.66.5.23.58.8 2 .87 2.14.07.14.12.31.02.5-.1.19-.14.31-.29.48-.14.16-.3.37-.43.5-.14.14-.29.29-.12.56.16.27.73 1.2 1.56 1.94 1.07.96 1.97 1.26 2.24 1.4.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.61-.13.25.08 1.58.75 1.85.88.27.14.45.2.52.31.06.12.06.68-.17 1.33Z" />
    </svg>
  );
}

export function ArrowGlyph({ className }: { className?: string }) {
  return (
    <Icon className={className ?? 'h-4 w-4'}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}
