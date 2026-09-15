import { Module } from '@nestjs/common';

import { SettingsService } from '../checkout/settings.service.js';
import { CartController } from './cart.controller.js';
import { CartRepository } from './cart.repository.js';
import { CartService } from './cart.service.js';

@Module({
  controllers: [CartController],
  providers: [CartRepository, CartService, SettingsService],
  exports: [CartRepository, CartService, SettingsService],
})
export class CartModule {}
