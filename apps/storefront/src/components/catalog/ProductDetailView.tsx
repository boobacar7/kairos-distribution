import { Badge, Breadcrumb, PriceDisplay, StockBadge } from '@kairos/ui';
import { isTestDataName } from '@kairos/types';
import { money } from '@kairos/types/money';
import type { CatalogProductDetail } from '@kairos/validation/catalog';

import { displayOffer } from '../../catalog/offer';
import { t } from '../../messages/t';
import { AddToCartPanel } from './AddToCartPanel';

export function ProductDetailView({ product }: { product: CatalogProductDetail }) {
  const offer = displayOffer(product);
  const purchasable = offer.availability.purchasable;
  const narrative = [
    { key: 'description', title: t('catalog.description'), body: product.description },
    { key: 'benefits', title: t('catalog.benefits'), body: product.benefits },
    { key: 'composition', title: t('catalog.composition'), body: product.composition },
    { key: 'usage', title: t('catalog.usage'), body: product.usage },
    { key: 'precautions', title: t('catalog.precautions'), body: product.precautions },
  ].filter((section) => section.body);

  return (
    <div className="px-gutter py-section mx-auto max-w-7xl space-y-8 md:px-gutter-lg">
      <Breadcrumb
        label={t('catalog.breadcrumb')}
        items={[
          { href: '/', label: t('nav.home') },
          { href: '/boutique', label: t('pages.shop.title') },
          {
            href: `/boutique/${product.category.slug}`,
            label: product.category.name,
          },
          { label: product.name },
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-label={t('catalog.gallery')} className="space-y-3">
          {product.images.length === 0 ? (
            <div className="bg-soft-green aspect-[4/5] w-full rounded-lg" aria-hidden="true" />
          ) : (
            <ul className="space-y-3">
              {product.images.map((image, index) => (
                <li key={image.id}>
                  <img
                    src={image.url}
                    alt={image.alt}
                    width={image.width ?? 800}
                    height={image.height ?? 1000}
                    className="border-beige h-auto w-full rounded-lg border object-cover"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    fetchPriority={index === 0 ? 'high' : undefined}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
        <div className="space-y-4">
          <p className="text-caption text-botanical">{product.category.name}</p>
          <h1 className="font-serif text-h2 text-aubergine md:text-h1">{product.name}</h1>
          {isTestDataName(product.name) ? <Badge tone="warning">{t('test.badge')}</Badge> : null}
          {offer.price != null ? (
            <PriceDisplay
              amount={money(offer.price)}
              compareAt={offer.compareAtPrice != null ? money(offer.compareAtPrice) : undefined}
            />
          ) : null}
          {offer.availability.status === 'UNKNOWN' ? null : (
            <StockBadge tone={purchasable ? 'inStock' : 'out'}>
              {purchasable ? t('stock.available') : t('stock.out')}
            </StockBadge>
          )}
          {offer.sku ? (
            <p className="text-body-sm text-botanical">
              {t('catalog.sku')}: {offer.sku}
            </p>
          ) : null}
          {product.shortDescription ? (
            <p className="text-body text-ink max-w-prose">{product.shortDescription}</p>
          ) : null}
          <AddToCartPanel
            variantId={offer.variantId}
            purchasable={purchasable}
            inventoryIssue={offer.availability.status === 'UNKNOWN'}
            inconsistency={offer.availability.issue === 'MISSING_DEFAULT_VARIANT'}
          />
        </div>
      </div>
      {narrative.length > 0 ? (
        <div className="space-y-6">
          {narrative.map((section) => (
            <section key={section.key} className="max-w-prose space-y-2">
              <h2 className="font-serif text-h3 text-aubergine">{section.title}</h2>
              <p className="text-body text-ink whitespace-pre-line">{section.body}</p>
            </section>
          ))}
        </div>
      ) : null}
    </div>
  );
}
