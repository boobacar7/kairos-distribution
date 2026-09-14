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
          if (result.code === 'CART_NOT_IMPLEMENTED') {
            setMessage(t('catalog.cartPending'));
            return;
          }
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
        <Alert tone="info">
          <p role="status">{message}</p>
        </Alert>
      ) : null}
    </div>
  );
}
