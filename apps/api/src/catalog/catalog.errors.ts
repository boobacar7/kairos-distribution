export class CatalogInconsistentError extends Error {
  readonly productId: string;
  readonly reason: string;

  constructor(productId: string, reason: string) {
    super(`Catalog inconsistency for product ${productId}: ${reason}`);
    this.name = 'CatalogInconsistentError';
    this.productId = productId;
    this.reason = reason;
  }
}
