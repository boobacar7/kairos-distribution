import type { KeyboardEvent, ReactNode } from 'react';
import { useId } from 'react';

import { cx } from '../lib/cx.js';

export type TabItem = {
  id: string;
  label: ReactNode;
  panel: ReactNode;
};

export function Tabs({
  tabs,
  value,
  onChange,
  label,
}: {
  tabs: readonly TabItem[];
  value: string;
  onChange: (id: string) => void;
  label: string;
}) {
  const baseId = useId();

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const ids = tabs.map((tab) => tab.id);
    const index = ids.indexOf(value);
    if (index < 0) return;
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      onChange(ids[(index + 1) % ids.length] ?? value);
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      onChange(ids[(index - 1 + ids.length) % ids.length] ?? value);
    }
  }

  return (
    <div>
      <div
        role="tablist"
        aria-label={label}
        className="border-beige flex gap-1 border-b"
        onKeyDown={onKeyDown}
        tabIndex={0}
      >
        {tabs.map((tab) => {
          const selected = tab.id === value;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              id={`${baseId}-tab-${tab.id}`}
              aria-controls={`${baseId}-panel-${tab.id}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              className={cx(
                'px-3 py-2 text-body-sm font-semibold',
                selected ? 'border-botanical text-botanical border-b-2' : 'text-ink/70',
              )}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      {tabs.map((tab) =>
        tab.id === value ? (
          <div
            key={tab.id}
            role="tabpanel"
            id={`${baseId}-panel-${tab.id}`}
            aria-labelledby={`${baseId}-tab-${tab.id}`}
            className="py-4"
            tabIndex={0}
          >
            {tab.panel}
          </div>
        ) : null,
      )}
    </div>
  );
}

export type AccordionItem = {
  id: string;
  title: ReactNode;
  content: ReactNode;
};

export function Accordion({
  items,
  openId,
  onChange,
}: {
  items: readonly AccordionItem[];
  openId: string | null;
  onChange: (id: string | null) => void;
}) {
  return (
    <div className="border-beige divide-beige divide-y rounded-lg border">
      {items.map((item) => {
        const open = item.id === openId;
        const panelId = `accordion-panel-${item.id}`;
        const buttonId = `accordion-button-${item.id}`;
        return (
          <div key={item.id}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={open}
                aria-controls={panelId}
                className="hover:bg-soft-green flex w-full items-center justify-between px-4 py-3 text-left font-semibold text-ink"
                onClick={() => onChange(open ? null : item.id)}
              >
                {item.title}
                <span aria-hidden="true">{open ? '−' : '+'}</span>
              </button>
            </h3>
            {open ? (
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className="text-body px-4 pb-4"
              >
                {item.content}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
