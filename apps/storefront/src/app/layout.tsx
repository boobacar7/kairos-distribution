import { SkipLink } from '@kairos/ui';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { CartProvider } from '../cart/cart-provider';
import { MobileBottomNav } from '../components/shell/MobileBottomNav';
import { StorefrontFooter } from '../components/shell/StorefrontFooter';
import { StorefrontHeader } from '../components/shell/StorefrontHeader';
import { WhatsAppFab } from '../components/shell/WhatsAppFab';
import type { FooterContent } from '../content/contract';
import { loadHomeContent } from '../content/load-home';
import { t } from '../messages/t';
import './globals.css';

export const metadata: Metadata = {
  title: {
    default: t('meta.title'),
    template: `%s · ${t('brand.name')}`,
  },
  description: t('meta.description'),
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  let footer: FooterContent = { sections: [], social: [] };
  try {
    footer = (await loadHomeContent()).footer;
  } catch {
    // Layout still renders when the CMS payload is unavailable; the page error boundary handles it.
  }

  return (
    <html lang="fr-BF">
      <head>
        <link
          rel="preload"
          href="/fonts/manrope-latin-wght-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/dm-serif-display-latin-400-normal.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="bg-ivory text-ink font-sans">
        <CartProvider>
          <SkipLink href="#contenu">{t('a11y.skip')}</SkipLink>
          <StorefrontHeader />
          <main id="contenu" className="pb-16 md:pb-0">
            {children}
          </main>
          <StorefrontFooter footer={footer} />
          <WhatsAppFab />
          <MobileBottomNav />
        </CartProvider>
      </body>
    </html>
  );
}
