import { Controller, Get, Inject, NotFoundException, Param, Query } from '@nestjs/common';
import { slugSchema } from '@kairos/validation';
import { parseProductListQuery } from '@kairos/validation/catalog';

import { CatalogService } from './catalog.service.js';

function parsePublicSlug(slug: string): string {
  const parsed = slugSchema.safeParse(slug);
  if (!parsed.success) {
    throw new NotFoundException();
  }
  return parsed.data;
}

@Controller()
export class CatalogController {
  constructor(@Inject(CatalogService) private readonly catalog: CatalogService) {}

  @Get('categories')
  async listCategories() {
    return { data: await this.catalog.listCategories() };
  }

  @Get('categories/:slug')
  async getCategory(@Param('slug') slug: string) {
    return { data: await this.catalog.getCategory(parsePublicSlug(slug)) };
  }

  @Get('products')
  async listProducts(@Query() query: Record<string, unknown>) {
    return this.catalog.listProducts(parseProductListQuery(query));
  }

  @Get('products/:slug')
  async getProduct(@Param('slug') slug: string) {
    return { data: await this.catalog.getProduct(parsePublicSlug(slug)) };
  }
}
