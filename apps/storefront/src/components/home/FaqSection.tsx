'use client';

import { EmptyState } from '@kairos/ui';
import { useState } from 'react';

import type { FaqItem } from '../../content/contract.js';
import { t } from '../../messages/t.js';
import { Accordion } from '../../ui/interactive.js';
import { HomeSection } from './HomeSection.js';

export function FaqSection({ items }: { items: readonly FaqItem[] }) {
  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);

  return (
    <HomeSection id="faq" title={t('home.faq')}>
      {items.length === 0 ? (
        <EmptyState title={t('home.faq')}>{t('empty.faq')}</EmptyState>
      ) : (
        <Accordion
          items={items.map((item) => ({
            id: item.id,
            title: item.question,
            content: item.answer,
          }))}
          openId={openId}
          onChange={setOpenId}
        />
      )}
    </HomeSection>
  );
}
