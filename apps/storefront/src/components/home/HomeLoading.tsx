import { Skeleton } from '@kairos/ui';

import { t } from '../../messages/t';

export function HomeLoading() {
  return (
    <div className="px-gutter py-section mx-auto max-w-7xl space-y-section" aria-busy="true">
      <Skeleton className="h-72 w-full md:h-[28rem]" label={t('a11y.loading')} />
      <Skeleton className="h-24 w-full" label={t('a11y.loading')} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-64 w-full" label={t('a11y.loading')} />
        <Skeleton className="h-64 w-full" label={t('a11y.loading')} />
        <Skeleton className="h-64 w-full" label={t('a11y.loading')} />
      </div>
    </div>
  );
}
