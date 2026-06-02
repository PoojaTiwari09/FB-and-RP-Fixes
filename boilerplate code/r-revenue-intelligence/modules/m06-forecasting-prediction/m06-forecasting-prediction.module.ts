import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { M06ForecastingPredictionController } from './controllers/m06.controller';

import { M06ExecutiveController } from './controllers/executive.controller';
import { HubSpotController } from './controllers/hubspot.controller';
import { AdminForecastBoardsController } from './controllers/admin-forecast-boards.controller';
import { ForecastBoardsController } from './controllers/forecast-boards.controller';
import { M06ForecastingPredictionService } from './services/m06.service';
import { ForecastBoardsService } from './services/forecast-boards.service';
import { AdminForecastBoardsService } from './services/admin-forecast-boards.service';
import { HubSpotService } from './services/hubspot.service';
import { M06PredictionQueueService } from './services/m06-prediction-queue.service';
import { M06ForecastingPredictionWorker } from './workers/m06.worker';
import { M06ForecastingPredictionRepository } from './repositories/m06.repository';
import { ForecastBoardsRepository } from './repositories/forecast-boards.repository';
import { ForecastSubmittedListener } from './listeners/forecast-submitted.listener';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';
import { HubSpotIntegrationModule } from '../platform-core/integrations/hubspot-integration.module';

@Module({
  imports: [
    PrismaModule,
    EventPublisherModule,
    HubSpotIntegrationModule,
    BullModule.registerQueue({ name: 'm06-queue' }),
  ],
  controllers: [

    M06ForecastingPredictionController,
    M06ExecutiveController,
    HubSpotController,
    AdminForecastBoardsController,
    ForecastBoardsController,
  ],
  providers: [
    ForecastBoardsRepository,
    ForecastBoardsService,
    AdminForecastBoardsService,
    M06ForecastingPredictionService,
    M06PredictionQueueService,
    HubSpotService,
    M06ForecastingPredictionWorker,
    M06ForecastingPredictionRepository,
    ForecastSubmittedListener,
  ],
  exports: [
    ForecastBoardsService,
    M06ForecastingPredictionService,
    M06PredictionQueueService,
  ],
})
export class M06ForecastingPredictionModule {}

