export class CatalogUnavailableError extends Error {
  constructor(message = 'CATALOG_UNAVAILABLE') {
    super(message);
    this.name = 'CatalogUnavailableError';
  }
}

export class CatalogNotFoundError extends Error {
  constructor(message = 'CATALOG_NOT_FOUND') {
    super(message);
    this.name = 'CatalogNotFoundError';
  }
}
