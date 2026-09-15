import { add, money, multiply, ZERO, type Money } from '@kairos/types/money';
import { expectedGrandTotal, type OrderTotals, type TaxQuote } from '@kairos/types/tax';
import type { CartLineIssue } from '@kairos/validation/cart';
import type { CheckoutIssue } from '@kairos/validation/checkout';

export type PricingLineInput = {
  variantId: string;
  productId: string | null;
  productName: string | null;
  variantName: string | null;
  productSlug: string | null;
  sku: string | null;
  quantity: number;
  unitPrice: Money | null;
  compareAtPrice: Money | null;
  unitPriceAtAdd: number | null;
  availableQty: number | null;
  trackInventory: boolean | null;
  purchasable: boolean;
  catalogueIssue: CartLineIssue | null;
};

export type PricedLine = {
  variantId: string;
  productId: string | null;
  productName: string | null;
  variantName: string | null;
  productSlug: string | null;
  sku: string | null;
  quantity: number;
  unitPrice: Money | null;
  compareAtPrice: Money | null;
  lineSubtotal: Money | null;
  discountAllocated: Money;
  lineTotal: Money | null;
  purchasable: boolean;
  issue: CartLineIssue | null;
};

export type PricedCartSnapshot = {
  lines: PricedLine[];
  totals: OrderTotals;
  issues: CheckoutIssue[];
};

function issueMessage(code: CartLineIssue): string {
  switch (code) {
    case 'PRICE_CHANGED':
      return 'Le prix a changé depuis l’ajout au panier.';
    case 'QUANTITY_REDUCED':
      return 'La quantité demandée n’est plus disponible.';
    case 'OUT_OF_STOCK':
      return 'Cet article n’est plus en stock.';
    case 'VARIANT_UNAVAILABLE':
      return 'Cette variante n’est plus disponible.';
    case 'PRODUCT_UNAVAILABLE':
      return 'Ce produit n’est plus disponible.';
    case 'MISSING_INVENTORY':
      return 'Stock incohérent pour cet article.';
    case 'MISSING_DEFAULT_VARIANT':
      return 'Variante par défaut manquante.';
    case 'COUPON_INVALID':
      return 'Code promo invalide.';
  }
}

/**
 * Single pricing algorithm for cart, quote, place and admin preview (architecture.md §5.2).
 * Evaluation order: lines → line discounts → order discounts → delivery → tax.
 * V1 discounts are zero; the totals shape still includes discountTotal.
 */
export function priceCart(input: {
  lines: readonly PricingLineInput[];
  shippingTotal: Money;
  taxQuote: TaxQuote;
}): PricedCartSnapshot {
  const issues: CheckoutIssue[] = [];
  const lines: PricedLine[] = input.lines.map((line) => {
    let issue = line.catalogueIssue;
    let purchasable = line.purchasable && issue === null;

    if (purchasable && line.trackInventory && line.availableQty != null) {
      if (line.availableQty <= 0) {
        issue = 'OUT_OF_STOCK';
        purchasable = false;
      } else if (line.quantity > line.availableQty) {
        issue = 'QUANTITY_REDUCED';
        purchasable = false;
      }
    }

    if (
      purchasable &&
      line.unitPrice != null &&
      line.unitPriceAtAdd != null &&
      line.unitPriceAtAdd !== line.unitPrice
    ) {
      issue = 'PRICE_CHANGED';
    }

    if (issue) {
      issues.push({
        code: issue,
        variantId: line.variantId,
        message: issueMessage(issue),
      });
    }

    const unitPrice = line.unitPrice;
    const lineSubtotal =
      unitPrice != null && (purchasable || issue === 'PRICE_CHANGED')
        ? multiply(unitPrice, line.quantity)
        : null;
    const discountAllocated = ZERO;
    const lineTotal = lineSubtotal == null ? null : money(lineSubtotal - discountAllocated);

    return {
      variantId: line.variantId,
      productId: line.productId,
      productName: line.productName,
      variantName: line.variantName,
      productSlug: line.productSlug,
      sku: line.sku,
      quantity: line.quantity,
      unitPrice,
      compareAtPrice: line.compareAtPrice,
      lineSubtotal,
      discountAllocated,
      lineTotal,
      purchasable,
      issue,
    };
  });

  const subtotal = lines.reduce<Money>((total, line) => {
    if (line.lineSubtotal == null) return total;
    if (!line.purchasable && line.issue !== 'PRICE_CHANGED') return total;
    return add(total, line.lineSubtotal);
  }, ZERO);

  const discountTotal = ZERO;
  const shippingTotal = input.shippingTotal;
  const taxTotal = input.taxQuote.total;
  const taxTreatment = input.taxQuote.treatment;
  const grandTotal = money(
    expectedGrandTotal({
      subtotal,
      discountTotal,
      shippingTotal,
      taxTotal,
      taxTreatment,
    }),
  );

  const totals: OrderTotals = {
    subtotal,
    discountTotal,
    shippingTotal,
    taxTotal,
    grandTotal,
    taxTreatment,
    taxBreakdown: input.taxQuote.amounts,
  };

  return { lines, totals, issues };
}

export function hasBlockingIssues(snapshot: PricedCartSnapshot): boolean {
  return snapshot.issues.length > 0 || snapshot.lines.some((line) => !line.purchasable);
}
