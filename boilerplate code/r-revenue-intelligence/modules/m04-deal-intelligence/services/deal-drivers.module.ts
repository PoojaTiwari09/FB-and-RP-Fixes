// src/modules/deal-drivers/deal-drivers.module.ts

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DealDriversController } from '../controllers/deal-drivers.controller';
import { BoardWarningConfigController } from '../controllers/board-warning-config.controller';
import { WarningDefinitionsController } from '../controllers/warning-definitions.controller';
import { DealDriversService } from './deal-drivers.service';
import { DealDriversRepository } from '../repositories/deal-drivers.repository';
import { MatrixCache } from './matrix.cache';
import { WebhookSignatureGuard } from '../interfaces/webhook-signature.guard';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule,   // required by WebhookSignatureGuard → ConfigService
  ],
  controllers: [
    DealDriversController,
    BoardWarningConfigController,
    WarningDefinitionsController,
  ],
  providers: [
    DealDriversService,
    DealDriversRepository,
    MatrixCache,
    WebhookSignatureGuard,  // injectable so NestJS resolves ConfigService
  ],
  exports: [DealDriversService],
})
export class DealDriversModule {}
