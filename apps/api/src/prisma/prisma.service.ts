import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { disconnectPrismaClient, getPrismaClient, type PrismaClient } from '@kairos/database';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  readonly client: PrismaClient = getPrismaClient();

  async onModuleDestroy(): Promise<void> {
    await disconnectPrismaClient();
  }
}
