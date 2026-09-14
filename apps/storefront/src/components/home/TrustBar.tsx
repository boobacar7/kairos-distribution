import { EmptyState } from '@kairos/ui';

import type { TrustItem } from '../../content/contract.js';
import { t } from '../../messages/t.js';
import { HomeSection } from './HomeSection.js';

export function TrustBar({ items }: { items: readonly TrustItem[] }) {
  return (
    <HomeSection id="confiance" title={t('home.trust')}>
      {items.length === 0 ? (
        <EmptyState title={t('home.trust')}>{t('empty.trust')}</EmptyState>
      ) : (
        <ul className="bg-beige text-ink grid gap-4 rounded-lg px-4 py-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li key={item.id} className="space-y-1">
              <p className="font-semibold">{item.title}</p>
              {item.body ? <p className="text-body-sm">{item.body}</p> : null}
            </li>
          ))}
        </ul>
      )}
    </HomeSection>
  );
}
