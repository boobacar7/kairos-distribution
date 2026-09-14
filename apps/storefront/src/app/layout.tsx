import { SkipLink } from '@kairos/ui';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { MobileBottomNav } from '../components/shell/MobileBottomNav.js';
import { StorefrontFooter } from '../components/shell/StorefrontFooter.js';
import { StorefrontHeader } from '../components/shell/StorefrontHeader.js';
import { HOME_REVALIDATE_SECONDS, loadHomeContent } from '../content/load-home.js';
import { t } from '../messages/t.js';
import './globals.css';

export const revalidate = HOME_REVALIDATE_SECONDS;

export const metadata: Metadata = {
  title: {
    default: t('meta.title'),
    template: `%s · ${t('brand.name')}`,
  },
  description: t('meta.description'),
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  let footer = { sections: [], social: [] };
  try {
    footer = (await loadHomeContent()).footer;
  } catch {
    footer = { sections: [], social: [] };
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
        <SkipLink href="#contenu">{t('a11y.skip')}</SkipLink>
        <StorefrontHeader />
        <main id="contenu" className="pb-20 md:pb-0">
          {children}
        </main>
        <StorefrontFooter footer={footer} />
        <MobileBottomNav />
      </body>
    </html>
  );
}
