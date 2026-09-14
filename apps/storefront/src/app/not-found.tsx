import { EmptyState } from '@kairos/ui';

import { t } from '../messages/t';

export default function NotFound() {
  return (
    <div className="px-gutter py-section mx-auto max-w-3xl">
      <EmptyState title={t('errors.notFound')} action={<a href="/">{t('nav.home')}</a>}>
        {t('errors.notFoundBody')}
      </EmptyState>
    </div>
  );
}
