import { Alert } from '@kairos/ui';

import { t } from '../../messages/t';

export function CatalogUnavailable() {
  return (
    <div className="px-gutter py-section mx-auto max-w-3xl">
      <Alert tone="danger" title={t('errors.title')}>
        <p>{t('errors.catalog')}</p>
      </Alert>
    </div>
  );
}
