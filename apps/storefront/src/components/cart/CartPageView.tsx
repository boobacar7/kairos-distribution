'use client';

import { Alert, Button, EmptyState, PriceDisplay, QuantityStepper, Skeleton } from '@kairos/ui';
import { money } from '@kairos/types/money';
import type { CartPreviewLine, CartPreviewResponse } from '@kairos/validation/cart';
import { useEffect, useState } from 'react';

import { useCart } from '../../cart/cart-provider';
import { previewGuestCart } from '../../cart/preview-client';
import { t } from '../../messages/t';

function lineIssueCopy(line: CartPreviewLine): string | null {
  if (line.purchasable) return null;
  if (line.issue === 'MISSING_DEFAULT_VARIANT') return t('catalog.inconsistent');
  if (line.issue === 'MISSING_INVENTORY') return t('catalog.inventoryError');
  if (line.issue === 'OUT_OF_STOCK') return t('stock.out');
  if (line.issue === 'VARIANT_UNAVAILABLE') return t('cart.variantUnavailable');
  return t('cart.unavailable');
}

function CartLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <Skeleton className="h-24 w-full" label={t('a11y.loading')} />
      <Skeleton className="h-24 w-full" label={t('a11y.loading')} />
    </div>
  );
}

function CartLineRow({
  line,
  onQuantity,
  onRemove,
}: {
  line: CartPreviewLine;
  onQuantity: (quantity: number) => void;
  onRemove: () => void;
}) {
  const name = line.productName ?? t('cart.unknownItem');
  const issue = lineIssueCopy(line);
  const showVariant = line.variantName && line.variantName !== 'Default';

  return (
    <li className="border-beige flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-start">
      <div className="bg-soft-green h-24 w-24 shrink-0 overflow-hidden rounded-md">
        {line.image ? (
          <img
            src={line.image.url}
            alt=""
            width={line.image.width ?? 96}
            height={line.image.height ?? 96}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="block h-full w-full" aria-hidden="true" />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-2">
        {line.productSlug ? (
          <a href={`/produit/${line.productSlug}`} className="font-serif text-h4 text-aubergine">
            {name}
          </a>
        ) : (
          <p className="font-serif text-h4 text-aubergine">{name}</p>
        )}
        {showVariant ? <p className="text-caption text-botanical">{line.variantName}</p> : null}
        {line.sku ? (
          <p className="text-caption text-botanical">{t('cart.sku', { sku: line.sku })}</p>
        ) : null}
        {line.unitPrice != null ? (
          <p>
            <span className="sr-only">{t('cart.unitPrice')}</span>
            <PriceDisplay amount={money(line.unitPrice)} />
          </p>
        ) : null}
        {issue ? <Alert tone="warning">{issue}</Alert> : null}
        <div className="flex flex-wrap items-center gap-3">
          <QuantityStepper
            value={line.quantity}
            min={1}
            onChange={onQuantity}
            decreaseLabel={t('catalog.decrease')}
            increaseLabel={t('catalog.increase')}
            inputLabel={t('catalog.quantity')}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            aria-label={t('cart.remove', { name })}
          >
            {t('cart.remove', { name })}
          </Button>
        </div>
      </div>
      <p className="text-body font-semibold sm:min-w-28 sm:text-right">
        <span className="sr-only">{t('cart.lineSubtotal')}</span>
        {line.lineSubtotal != null ? (
          <PriceDisplay amount={money(line.lineSubtotal)} />
        ) : (
          <span aria-hidden="true">—</span>
        )}
      </p>
    </li>
  );
}

export function CartPageView() {
  const cart = useCart();
  const [mounted, setMounted] = useState(false);
  const [preview, setPreview] = useState<CartPreviewResponse | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    if (cart.items.length === 0) {
      setPreview(null);
      setStatus('ready');
      return;
    }
    setStatus('loading');
    previewGuestCart(cart.items)
      .then((result) => {
        if (!cancelled) {
          setPreview(result);
          setStatus('ready');
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error');
      });
    return () => {
      cancelled = true;
    };
  }, [cart.items, mounted]);

  return (
    <div className="px-gutter py-section mx-auto max-w-3xl space-y-6 md:px-gutter-lg">
      <h1 className="font-serif text-h2 text-aubergine md:text-h1">{t('pages.cart.title')}</h1>
      {!mounted || (status === 'loading' && cart.items.length > 0 && !preview) ? (
        <CartLoading />
      ) : null}
      {mounted && cart.items.length === 0 ? (
        <EmptyState
          title={t('cart.empty')}
          action={
            <a
              href="/boutique"
              className="bg-botanical text-ivory inline-flex min-h-11 items-center justify-center rounded-md px-4 text-body font-semibold"
            >
              {t('cart.continue')}
            </a>
          }
        >
          {t('cart.emptyBody')}
        </EmptyState>
      ) : null}
      {mounted && cart.items.length > 0 && status === 'error' ? (
        <Alert tone="danger" title={t('errors.title')}>
          <div className="space-y-3">
            <p>{t('cart.error')}</p>
            <Button
              variant="secondary"
              onClick={() => {
                setStatus('loading');
                previewGuestCart(cart.items)
                  .then((result) => {
                    setPreview(result);
                    setStatus('ready');
                  })
                  .catch(() => setStatus('error'));
              }}
            >
              {t('errors.retry')}
            </Button>
          </div>
        </Alert>
      ) : null}
      {mounted && preview && cart.items.length > 0 && status !== 'error' ? (
        <>
          {status === 'loading' ? <CartLoading /> : null}
          <ul className="divide-beige">
            {preview.items.map((line) => (
              <CartLineRow
                key={line.variantId}
                line={line}
                onQuantity={(quantity) => cart.setQuantity(line.variantId, quantity)}
                onRemove={() => cart.remove(line.variantId)}
              />
            ))}
          </ul>
          <div className="border-beige flex items-center justify-between border-t pt-4">
            <p className="text-body font-semibold">{t('cart.subtotal')}</p>
            <p className="text-lead font-semibold" aria-live="polite">
              <PriceDisplay amount={money(preview.subtotal)} />
            </p>
          </div>
          <a
            href="/boutique"
            className="text-botanical text-body-sm font-semibold underline-offset-4 hover:underline"
          >
            {t('cart.continue')}
          </a>
        </>
      ) : null}
    </div>
  );
}
