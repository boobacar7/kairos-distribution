'use client';

import { Alert, Button, QuantityStepper } from '@kairos/ui';
import { useState } from 'react';

import { prepareAddToCart } from '../../catalog/cart-seam';
import { t } from '../../messages/t';

export function AddToCartPanel({
  variantId,
  purchasable,
  inventoryIssue,
  inconsistency,
}: {
  variantId: string | null;
  purchasable: boolean;
  inventoryIssue: boolean;
  inconsistency?: boolean;
}) {
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const [tone, setTone] = useState<'success' | 'danger'>('success');

  return (
    <div className="space-y-3">
      <QuantityStepper
        value={quantity}
        min={1}
        onChange={setQuantity}
        decreaseLabel={t('catalog.decrease')}
        increaseLabel={t('catalog.increase')}
        inputLabel={t('catalog.quantity')}
        disabled={!purchasable}
      />
      <Button
        fullWidth
        disabled={!purchasable}
        onClick={() => {
          const result = prepareAddToCart({ variantId: variantId ?? '', quantity });
          if (result.ok) {
            setTone('success');
            setMessage(t('cart.added'));
            return;
          }
          setTone('danger');
          setMessage(t('catalog.unavailable'));
        }}
      >
        {t('catalog.addToCart')}
      </Button>
      {inconsistency ? (
        <Alert tone="warning">{t('catalog.inconsistent')}</Alert>
      ) : inventoryIssue ? (
        <Alert tone="warning">{t('catalog.inventoryError')}</Alert>
      ) : null}
      {message ? (
        <Alert tone={tone}>
          <p role="status">{message}</p>
        </Alert>
      ) : null}
    </div>
  );
}
