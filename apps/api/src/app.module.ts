import { Module } from '@nestjs/common';

import { CartModule } from './cart/cart.module.js';
import { CatalogModule } from './catalog/catalog.module.js';
import { CheckoutModule } from './checkout/checkout.module.js';
import { HealthModule } from './health/health.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [PrismaModule, HealthModule, CatalogModule, CartModule, CheckoutModule],
})
export class AppModule {}
