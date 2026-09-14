'use client';

import { Alert, Button } from '@kairos/ui';

import { t } from '../../../messages/t';

export default function CatalogError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="px-gutter py-section mx-auto max-w-3xl">
      <Alert tone="danger" title={t('errors.title')}>
        <div className="space-y-3">
          <p>{t('errors.catalog')}</p>
          <Button variant="secondary" onClick={reset}>
            {t('errors.retry')}
          </Button>
        </div>
      </Alert>
    </div>
  );
}
