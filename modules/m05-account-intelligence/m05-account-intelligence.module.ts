import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';

import { M05AccountIntelligenceController } from './controllers/m05.controller';
import { M05TestController } from './controllers/m05-test.controller';
import { assertM05WebhookSecretConfigured } from './config/m05-env';
import { AccountsController } from './controllers/accounts.controller';
import { ActivitiesController } from './controllers/activities.controller';
import { BoardsController } from './controllers/boards.controller';
import { EditsController } from './controllers/edits.controller';
import { PreferencesController } from './controllers/preferences.controller';
import { SyncController } from './controllers/sync.controller';
import { TodosController } from './controllers/todos.controller';
import { WebhookController } from './controllers/webhook.controller';
import { AiController } from './controllers/ai.controller';
import { M05FrontendAccountsController } from './controllers/m05-frontend-accounts.controller';
import { M05FrontendDealsController } from './controllers/m05-frontend-deals.controller';
import { CoachingController } from './controllers/coaching.controller';

import { M05AccountIntelligenceService } from './services/m05.service';
import { AccountsService } from './services/accounts.service';
import { ActivitiesService } from './services/activities.service';
import { BoardsService } from './services/boards.service';
import { EditsService } from './services/edits.service';
import { PreferencesService } from './services/preferences.service';
import { SyncService } from './services/sync.service';
import { TodosService } from './services/todos.service';
import { AiService } from './services/ai.service';

import { M05AccountIntelligenceWorker } from './workers/m05.worker';
import { M05AccountIntelligenceRepository } from './repositories/m05.repository';
import { PrismaModule } from './database/prisma.module';
import { EventPublisherModule } from '../platform-core/events/event-publisher.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    EventPublisherModule,
    BullModule.registerQueue({ name: 'm05-queue' }),
  ],
  controllers: [
    M05AccountIntelligenceController,
    M05TestController,
    AccountsController,
    ActivitiesController,
    BoardsController,
    EditsController,
    PreferencesController,
    SyncController,
    TodosController,
    WebhookController,
    AiController,
    M05FrontendAccountsController,
    M05FrontendDealsController,
    CoachingController,
  ],
  providers: [
    M05AccountIntelligenceService,
    M05AccountIntelligenceWorker,
    M05AccountIntelligenceRepository,
    AccountsService,
    ActivitiesService,
    BoardsService,
    EditsService,
    PreferencesService,
    SyncService,
    TodosService,
    AiService,
  ],
  exports: [M05AccountIntelligenceService],
})
export class M05AccountIntelligenceModule {
  constructor() {
    assertM05WebhookSecretConfigured();
  }
}
