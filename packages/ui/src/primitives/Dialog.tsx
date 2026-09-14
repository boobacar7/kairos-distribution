import type { ReactNode } from 'react';
import { useEffect, useId, useRef } from 'react';

import { cx } from '../lib/cx.js';
import { Button } from './Button.js';

type OverlayProps = {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  closeLabel: string;
};

function useDialogOpen(open: boolean) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (open) {
      if (!node.open) node.showModal();
    } else if (node.open) {
      node.close();
    }
  }, [open]);

  return ref;
}

export function Dialog({ open, onClose, title, children, footer, closeLabel }: OverlayProps) {
  const titleId = useId();
  const ref = useDialogOpen(open);

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-modal="true"
      className={cx(
        'bg-ivory text-ink shadow-raised max-h-[90vh] w-[min(100%-2rem,32rem)] rounded-lg p-0',
        'backdrop:bg-ink/40',
      )}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-serif text-h3 text-aubergine">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={closeLabel}>
            ×
          </Button>
        </div>
        <div className="text-body">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </dialog>
  );
}

export function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
  closeLabel,
  side = 'right',
}: OverlayProps & { side?: 'right' | 'bottom' }) {
  const titleId = useId();
  const ref = useDialogOpen(open);
  const isBottom = side === 'bottom';

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      aria-modal="true"
      className={cx(
        'bg-ivory text-ink shadow-raised m-0 max-h-dvh p-0',
        isBottom
          ? 'mt-auto w-full max-w-none rounded-t-xl'
          : 'ml-auto h-dvh w-[min(100%,24rem)] max-w-none rounded-none',
        'backdrop:bg-ink/40',
      )}
      onClose={onClose}
    >
      <div className="flex h-full flex-col gap-4 p-6">
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="font-serif text-h3 text-aubergine">
            {title}
          </h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label={closeLabel}>
            ×
          </Button>
        </div>
        <div className="text-body min-h-0 flex-1 overflow-auto">{children}</div>
        {footer ? <div className="flex flex-wrap justify-end gap-2">{footer}</div> : null}
      </div>
    </dialog>
  );
}
