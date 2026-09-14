import { Badge, Card, CardBody, CardMedia, CardTitle, PriceDisplay, StockBadge } from '@kairos/ui';
import { isTestDataName } from '@kairos/types';
import { money } from '@kairos/types/money';
import type { CatalogProductListItem } from '@kairos/validation/catalog';

import { t } from '../../messages/t';

function stockProps(product: CatalogProductListItem): {
  stock?: 'inStock' | 'out';
  stockLabel?: string;
} {
  if (product.availability.status === 'UNKNOWN') {
    return {};
  }
  if (product.availability.purchasable) {
    return { stock: 'inStock', stockLabel: t('stock.available') };
  }
  return { stock: 'out', stockLabel: t('stock.out') };
}

export function CatalogueProductCard({ product }: { product: CatalogProductListItem }) {
  const stock = stockProps(product);
  return (
    <Card>
      <div className="relative">
        <a href={`/produit/${product.slug}`} className="block">
          <CardMedia>
            {product.image ? (
              <img
                src={product.image.url}
                alt={product.image.alt}
                width={product.image.width ?? 600}
                height={product.image.height ?? 750}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <span className="bg-soft-green block h-full min-h-56 w-full" aria-hidden="true" />
            )}
          </CardMedia>
        </a>
        {isTestDataName(product.name) ? (
          <span className="absolute top-3 left-3">
            <Badge tone="warning">{t('test.badge')}</Badge>
          </span>
        ) : null}
      </div>
      <CardBody>
        <p className="text-caption text-botanical">{product.category.name}</p>
        <a href={`/produit/${product.slug}`} className="hover:text-botanical">
          <CardTitle>{product.name}</CardTitle>
        </a>
        <PriceDisplay
          amount={money(product.price)}
          compareAt={product.compareAtPrice != null ? money(product.compareAtPrice) : undefined}
        />
        {stock.stock && stock.stockLabel ? (
          <StockBadge tone={stock.stock}>{stock.stockLabel}</StockBadge>
        ) : product.availability.status === 'UNKNOWN' ? (
          <p className="text-caption text-ink" role="status">
            {t('catalog.inventoryError')}
          </p>
        ) : null}
        <a
          href={`/produit/${product.slug}`}
          className="text-botanical text-body-sm font-semibold underline-offset-4 hover:underline"
        >
          {t('catalog.viewProduct', { name: product.name })}
        </a>
      </CardBody>
    </Card>
  );
}
