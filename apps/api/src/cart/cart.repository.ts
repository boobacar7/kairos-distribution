import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import type { CartVariantRow } from './domain/preview.js';

@Injectable()
export class CartRepository {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async findVariantsByIds(ids: readonly string[]): Promise<Map<string, CartVariantRow>> {
    if (ids.length === 0) {
      return new Map();
    }

    const rows = await this.prisma.client.productVariant.findMany({
      where: { id: { in: [...ids] } },
      select: {
        id: true,
        name: true,
        sku: true,
        price: true,
        isActive: true,
        deletedAt: true,
        inventoryItem: {
          select: {
            trackInventory: true,
            availableQty: true,
          },
        },
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            status: true,
            deletedAt: true,
            images: {
              orderBy: [{ isPrimary: 'desc' as const }, { position: 'asc' as const }],
              select: {
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
              },
            },
            variants: {
              select: {
                id: true,
                isDefault: true,
                isActive: true,
                deletedAt: true,
              },
            },
          },
        },
      },
    });

    return new Map(rows.map((row) => [row.id, row as unknown as CartVariantRow]));
  }
}
