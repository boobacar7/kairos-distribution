import { Inject, Injectable } from '@nestjs/common';
import { TEST_DATA_NAME_PREFIX } from '@kairos/types';
import type { Prisma } from '@kairos/database';
import type { ProductListQuery } from '@kairos/validation/catalog';

import { PrismaService } from '../prisma/prisma.service.js';
import type { CategoryRow, ProductRow } from './catalog.mapper.js';

const variantSelect = {
  id: true,
  name: true,
  sku: true,
  price: true,
  compareAtPrice: true,
  weightGrams: true,
  isDefault: true,
  isActive: true,
  deletedAt: true,
  inventoryItem: {
    select: {
      trackInventory: true,
      availableQty: true,
    },
  },
} as const;

const imageSelect = {
  altOverride: true,
  mediaAsset: {
    select: {
      id: true,
      url: true,
      altText: true,
      width: true,
      height: true,
      blurDataUrl: true,
      deletedAt: true,
    },
  },
} as const;

@Injectable()
export class CatalogRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async listActiveCategories(): Promise<CategoryRow[]> {
    return this.prisma.client.category.findMany({
      where: { isActive: true },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        position: true,
        seoTitle: true,
        seoDescription: true,
        image: {
          select: {
            id: true,
            url: true,
            altText: true,
            width: true,
            height: true,
            blurDataUrl: true,
            deletedAt: true,
          },
        },
      },
    });
  }

  async findActiveCategoryBySlug(slug: string): Promise<CategoryRow | null> {
    return this.prisma.client.category.findFirst({
      where: { slug, isActive: true, deletedAt: null },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        position: true,
        seoTitle: true,
        seoDescription: true,
        image: {
          select: {
            id: true,
            url: true,
            altText: true,
            width: true,
            height: true,
            blurDataUrl: true,
            deletedAt: true,
          },
        },
      },
    });
  }

  async listPublicProducts(
    query: ProductListQuery,
    options: { hideTestProducts: boolean },
  ): Promise<{ rows: ProductRow[]; total: number }> {
    const where = this.publicProductWhere(query, options.hideTestProducts);
    const orderBy = this.orderBy(query.sort);
    const skip = (query.page - 1) * query.limit;

    const [total, rows] = await Promise.all([
      this.prisma.client.product.count({ where }),
      this.prisma.client.product.findMany({
        where,
        orderBy,
        skip,
        take: query.limit,
        select: this.productSelect(),
      }),
    ]);

    return { rows: rows as unknown as ProductRow[], total };
  }

  async findPublicProductBySlug(
    slug: string,
    options: { hideTestProducts: boolean },
  ): Promise<ProductRow | null> {
    const row = await this.prisma.client.product.findFirst({
      where: {
        slug,
        status: 'ACTIVE',
        deletedAt: null,
        ...(options.hideTestProducts
          ? { NOT: { name: { startsWith: TEST_DATA_NAME_PREFIX } } }
          : {}),
      },
      select: this.productSelect(),
    });
    return (row as unknown as ProductRow | null) ?? null;
  }

  private publicProductWhere(
    query: ProductListQuery,
    hideTestProducts: boolean,
  ): Prisma.ProductWhereInput {
    const clauses: Prisma.ProductWhereInput[] = [{ status: 'ACTIVE' }];

    if (hideTestProducts) {
      clauses.push({ NOT: { name: { startsWith: TEST_DATA_NAME_PREFIX } } });
    }

    if (query.category) {
      clauses.push({ category: { slug: query.category, isActive: true, deletedAt: null } });
    }

    if (query.q) {
      const term = query.q;
      clauses.push({
        OR: [
          { name: { contains: term, mode: 'insensitive' } },
          { shortDescription: { contains: term, mode: 'insensitive' } },
          { description: { contains: term, mode: 'insensitive' } },
          {
            variants: {
              some: { sku: { contains: term, mode: 'insensitive' }, deletedAt: null },
            },
          },
        ],
      });
    }

    if (query.minPrice !== undefined) {
      clauses.push({ minPrice: { gte: query.minPrice } });
    }
    if (query.maxPrice !== undefined) {
      clauses.push({ minPrice: { lte: query.maxPrice } });
    }

    if (query.availability === 'in_stock') {
      clauses.push({
        variants: {
          some: {
            isDefault: true,
            isActive: true,
            deletedAt: null,
            inventoryItem: {
              OR: [{ trackInventory: false }, { trackInventory: true, availableQty: { gt: 0 } }],
            },
          },
        },
      });
    }

    if (query.availability === 'out_of_stock') {
      clauses.push({
        variants: {
          some: {
            isDefault: true,
            isActive: true,
            deletedAt: null,
            inventoryItem: { trackInventory: true, availableQty: { lte: 0 } },
          },
        },
      });
    }

    return { AND: clauses };
  }

  private orderBy(sort: ProductListQuery['sort']): Prisma.ProductOrderByWithRelationInput[] {
    if (sort === 'price_asc') {
      return [{ minPrice: { sort: 'asc', nulls: 'last' } }, { name: 'asc' }];
    }
    if (sort === 'price_desc') {
      return [{ minPrice: { sort: 'desc', nulls: 'last' } }, { name: 'asc' }];
    }
    if (sort === 'newest') {
      return [{ publishedAt: { sort: 'desc', nulls: 'last' } }, { createdAt: 'desc' }];
    }
    return [{ name: 'asc' }];
  }

  private productSelect() {
    return {
      id: true,
      slug: true,
      name: true,
      description: true,
      shortDescription: true,
      benefits: true,
      ingredients: true,
      usage: true,
      precautions: true,
      seoTitle: true,
      seoDescription: true,
      canonicalUrl: true,
      publishedAt: true,
      category: { select: { id: true, slug: true, name: true } },
      images: {
        orderBy: [{ isPrimary: 'desc' as const }, { position: 'asc' as const }],
        select: imageSelect,
      },
      variants: {
        where: { deletedAt: null },
        orderBy: [{ isDefault: 'desc' as const }, { position: 'asc' as const }],
        select: variantSelect,
      },
    };
  }
}
