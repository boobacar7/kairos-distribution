'use client';

import { Alert, Button } from '@kairos/ui';

import { t } from '../messages/t';
import './globals.css';

/**
 * Replaces the root layout when it throws. Must not wrap CartProvider, header, footer,
 * or any other layout chrome — those providers are not in this tree.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr-BF">
      <body className="bg-ivory text-ink font-sans">
        <div className="px-gutter py-section mx-auto max-w-3xl">
          <Alert tone="danger" title={t('errors.title')}>
            <div className="space-y-3">
              <p>{t('errors.global')}</p>
              <Button variant="secondary" onClick={reset}>
                {t('errors.retry')}
              </Button>
            </div>
          </Alert>
        </div>
      </body>
    </html>
  );
}
