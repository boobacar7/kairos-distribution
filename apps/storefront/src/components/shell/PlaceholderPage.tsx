import { EmptyState } from '@kairos/ui';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

import { t, type MessageKey } from '../../messages/t.js';

export function PlaceholderPage({
  titleKey,
  children,
}: {
  titleKey: MessageKey;
  children?: ReactNode;
}) {
  return (
    <div className="px-gutter py-section mx-auto max-w-3xl">
      <EmptyState title={t(titleKey)}>{children ?? t('empty.page')}</EmptyState>
    </div>
  );
}

export function placeholderMetadata(titleKey: MessageKey): Metadata {
  return { title: t(titleKey) };
}
