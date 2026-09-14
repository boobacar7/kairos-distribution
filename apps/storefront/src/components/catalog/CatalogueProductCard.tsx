import { Badge, Card, CardBody, CardMedia, PriceDisplay, StockBadge } from '@kairos/ui';
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

function inconsistencyCopy(product: CatalogProductListItem): string | null {
  if (product.availability.issue === 'MISSING_DEFAULT_VARIANT') {
    return t('catalog.inconsistent');
  }
  if (product.availability.status === 'UNKNOWN') {
    return t('catalog.inventoryError');
  }
  return null;
}

export function CatalogueProductCard({ product }: { product: CatalogProductListItem }) {
  const stock = stockProps(product);
  const inconsistency = inconsistencyCopy(product);
  return (
    <Card>
      <div className="relative">
        <a href={`/produit/${product.slug}`} className="block" aria-label={product.name}>
          <CardMedia>
            {product.image ? (
              <img
                src={product.image.url}
                alt=""
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
          <p className="font-serif text-h4 text-aubergine">{product.name}</p>
        </a>
        {product.price != null ? (
          <PriceDisplay
            amount={money(product.price)}
            compareAt={product.compareAtPrice != null ? money(product.compareAtPrice) : undefined}
          />
        ) : null}
        {stock.stock && stock.stockLabel ? (
          <StockBadge tone={stock.stock}>{stock.stockLabel}</StockBadge>
        ) : inconsistency ? (
          <p className="text-caption text-ink" role="status">
            {inconsistency}
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
