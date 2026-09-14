import { Skeleton } from '@kairos/ui';

import { t } from '../../messages/t';

export function CatalogLoading() {
  return (
    <div className="px-gutter py-section mx-auto max-w-7xl space-y-6" aria-busy="true">
      <Skeleton className="h-10 w-48" label={t('a11y.loading')} />
      <Skeleton className="h-24 w-full" label={t('a11y.loading')} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-80 w-full" label={t('a11y.loading')} />
        <Skeleton className="h-80 w-full" label={t('a11y.loading')} />
        <Skeleton className="h-80 w-full" label={t('a11y.loading')} />
      </div>
    </div>
  );
}
