import { Inject, Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service.js';
import type { CartVariantRow } from './domain/preview.js';

export type CartRecord = {
  id: string;
  status: string;
  expiresAt: Date;
  items: Array<{
    id: string;
    cartId: string;
    productId: string;
    variantId: string;
    quantity: number;
    unitPriceAtAdd: number;
    addedAt: Date;
  }>;
};

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
        compareAtPrice: true,
        cost: true,
        isActive: true,
        deletedAt: true,
        inventoryItem: {
          select: {
            id: true,
            trackInventory: true,
            availableQty: true,
            onHandQty: true,
          },
        },
        product: {
          select: {
            id: true,
            slug: true,
            name: true,
            status: true,
            deletedAt: true,
            description: true,
            benefits: true,
            ingredients: true,
            usage: true,
            precautions: true,
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

  async findActiveCart(id: string): Promise<CartRecord | null> {
    return this.prisma.client.cart.findUnique({
      where: { id },
      include: { items: { orderBy: { addedAt: 'asc' } } },
    }) as Promise<CartRecord | null>;
  }

  async createCart(input: {
    expiresAt: Date;
    items: Array<{
      productId: string;
      variantId: string;
      quantity: number;
      unitPriceAtAdd: number;
    }>;
  }): Promise<CartRecord> {
    return this.prisma.client.cart.create({
      data: {
        expiresAt: input.expiresAt,
        items: { create: input.items },
      },
      include: { items: true },
    }) as Promise<CartRecord>;
  }

  async replaceCartItems(
    cartId: string,
    items: Array<{
      productId: string;
      variantId: string;
      quantity: number;
      unitPriceAtAdd: number;
    }>,
  ): Promise<CartRecord | null> {
    await this.prisma.client.$transaction(async (tx) => {
      await tx.cartItem.deleteMany({ where: { cartId } });
      if (items.length > 0) {
        await tx.cartItem.createMany({ data: items.map((item) => ({ ...item, cartId })) });
      }
      await tx.cart.update({
        where: { id: cartId },
        data: { lastActivityAt: new Date() },
      });
    });
    return this.findActiveCart(cartId);
  }
}
