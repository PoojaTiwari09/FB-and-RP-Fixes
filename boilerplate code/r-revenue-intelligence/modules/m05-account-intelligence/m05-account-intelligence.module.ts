import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { M05AccountIntelligenceController } from './controllers/m05.controller';
import { AccountsController } from './controllers/accounts.controller';
import { ActivitiesController } from './controllers/activities.controller';
import { BoardsController } from './controllers/boards.controller';
import { EditsController } from './controllers/edits.controller';
import { PreferencesController } from './controllers/preferences.controller';
import { SyncController } from './controllers/sync.controller';
import { TodosController } from './controllers/todos.controller';
import { WebhookController } from './controllers/webhook.controller';
import { AiController } from './controllers/ai.controller';

import { M05AccountIntelligenceService } from './services/m05.service';
import { AccountsService } from './services/accounts.service';
import { ActivitiesService } from './services/activities.service';
import { BoardsService } from './services/boards.service';
import { EditsService } from './services/edits.service';
import { PreferencesService } from './services/preferences.service';
import { SyncService } from './services/sync.service';
import { TodosService } from './services/todos.service';
import { AiService } from './services/ai.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '../../.env.local',
      isGlobal: true,
    }),
  ],
  controllers: [
    AccountsController,
    ActivitiesController,
    BoardsController,
    EditsController,
    PreferencesController,
    SyncController,
    TodosController,
    WebhookController,
    AiController
  ],
  providers: [
    AccountsService,
    ActivitiesService,
    BoardsService,
    EditsService,
    PreferencesService,
    SyncService,
    TodosService,
    AiService
  ]
})
export class M05AccountIntelligenceModule {}
