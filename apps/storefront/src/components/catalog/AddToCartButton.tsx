'use client';

import { Button } from '@kairos/ui';
import { useState } from 'react';

import { prepareAddToCart } from '../../catalog/cart-seam';
import { t } from '../../messages/t';

export function AddToCartButton({ variantId }: { variantId: string }) {
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div className="space-y-2">
      <Button
        fullWidth
        onClick={() => {
          const result = prepareAddToCart({ variantId, quantity: 1 });
          setMessage(result.ok ? t('cart.added') : t('catalog.unavailable'));
        }}
      >
        {t('catalog.addToCart')}
      </Button>
      {message ? (
        <p role="status" className="text-caption text-botanical">
          {message}
        </p>
      ) : null}
    </div>
  );
}
