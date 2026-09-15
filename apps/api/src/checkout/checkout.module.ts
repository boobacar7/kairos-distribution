import { Module } from '@nestjs/common';

import { CartModule } from '../cart/cart.module.js';
import { CheckoutController } from './checkout.controller.js';
import { CheckoutService } from './checkout.service.js';
import { CommerceController } from './commerce.controller.js';
import { DeliveryService } from './delivery/delivery.service.js';
import { InternalDeliveryProvider } from './delivery/internal-delivery.provider.js';
import { InventoryService } from './inventory/inventory.service.js';
import { OrdersService } from './orders.service.js';
import { PaymentsService } from './payments/payments.service.js';
import { SettingsService } from './settings.service.js';

@Module({
  imports: [CartModule],
  controllers: [CheckoutController, CommerceController],
  providers: [
    SettingsService,
    DeliveryService,
    InternalDeliveryProvider,
    InventoryService,
    CheckoutService,
    OrdersService,
    PaymentsService,
  ],
  exports: [InventoryService, PaymentsService, CheckoutService],
})
export class CheckoutModule {}
