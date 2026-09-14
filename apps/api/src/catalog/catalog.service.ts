import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type {
  CatalogCategory,
  CatalogProductDetail,
  CatalogProductListItem,
  ListMeta,
  ProductListQuery,
} from '@kairos/validation/catalog';

import { CatalogInconsistentError } from './catalog.errors.js';
import { mapCategory, mapProductDetail, mapProductListItem } from './catalog.mapper.js';
import { CatalogRepository } from './catalog.repository.js';

@Injectable()
export class CatalogService {
  constructor(@Inject(CatalogRepository) private readonly repository: CatalogRepository) {}

  async listCategories(): Promise<CatalogCategory[]> {
    const rows = await this.repository.listActiveCategories();
    return rows.map(mapCategory);
  }

  async getCategory(slug: string): Promise<CatalogCategory> {
    const row = await this.repository.findActiveCategoryBySlug(slug);
    if (!row) {
      throw new NotFoundException();
    }
    return mapCategory(row);
  }

  async listProducts(query: ProductListQuery): Promise<{
    data: CatalogProductListItem[];
    meta: ListMeta;
  }> {
    const { rows, total } = await this.repository.listPublicProducts(query, {
      hideTestProducts: this.hideTestProducts,
    });
    const data: CatalogProductListItem[] = [];
    for (const row of rows) {
      try {
        data.push(mapProductListItem(row));
      } catch (error) {
        if (error instanceof CatalogInconsistentError) {
          console.error(error);
          continue;
        }
        throw error;
      }
    }
    const pageCount = total === 0 ? 0 : Math.ceil(total / query.limit);
    return {
      data,
      meta: { page: query.page, limit: query.limit, total, pageCount },
    };
  }

  async getProduct(slug: string): Promise<CatalogProductDetail> {
    const row = await this.repository.findPublicProductBySlug(slug, {
      hideTestProducts: this.hideTestProducts,
    });
    if (!row) {
      throw new NotFoundException();
    }
    return mapProductDetail(row);
  }

  private get hideTestProducts(): boolean {
    return process.env['NODE_ENV'] === 'production';
  }
}
