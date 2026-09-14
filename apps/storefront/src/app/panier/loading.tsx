import { Skeleton } from '@kairos/ui';

import { t } from '../../messages/t';

export default function CartLoading() {
  return (
    <div className="px-gutter py-section mx-auto max-w-3xl space-y-4" aria-busy="true">
      <Skeleton className="h-10 w-40" label={t('a11y.loading')} />
      <Skeleton className="h-24 w-full" label={t('a11y.loading')} />
    </div>
  );
}
