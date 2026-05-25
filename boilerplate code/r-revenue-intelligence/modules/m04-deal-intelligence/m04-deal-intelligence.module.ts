import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';

import { SanitizeInterceptor } from './interfaces/audit-sanitize.interceptor';
import { ActivitiesController } from './controllers/activities.controller';
import { ActivitiesService } from './services/activities.service';
import { AiController } from './controllers/ai.controller';
import { AiService } from './services/ai.service';
import { AuditService } from './services/audit.service';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtAuthGuard } from './interfaces/jwt.guard';
import { BoardsController } from './controllers/boards.controller';
import { BoardsService } from './services/boards.service';
import { CommentsController } from './controllers/comments.controller';
import { CommentsService } from './services/comments.service';
import { CrmSyncService } from './services/crm-sync.service';
import { DatabaseService } from './database/database.service';
import { DatasetUploadService } from './services/dataset-upload.service';
import { DealDriversRepository } from './repositories/deal-drivers.repository';
import { DealDriversService } from './services/deal-drivers.service';
import { MatrixCache } from './services/matrix.cache';
import { WebhookSignatureGuard } from './interfaces/webhook-signature.guard';
import { DealsController } from './controllers/deals.controller';
import { DealsService } from './services/deals.service';
import { EscalationsController } from './controllers/escalations.controller';
import { EscalationsService } from './services/escalations.service';
import { ExportController } from './controllers/export.controller';
import { ExportService } from './services/export.service';
import { NextStepsController } from './controllers/next-steps.controller';
import { NextStepsService } from './services/next-steps.service';
import { NotificationsController } from './controllers/notifications.controller';
import { NotificationsService } from './services/notifications.service';
import { PlaybookController } from './controllers/playbook.controller';
import { PlaybookService } from './services/playbook.service';
import { TargetsController } from './controllers/targets.controller';
import { TargetsService } from './services/targets.service';
import { TasksController } from './controllers/tasks.controller';
import { TasksService } from './services/tasks.service';
import { TeamsController } from './controllers/teams.controller';
import { TeamsService } from './services/teams.service';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { WarningsController } from './controllers/warnings.controller';
import { WarningsService } from './services/warnings.service';
import { DealDriversController } from './controllers/deal-drivers.controller';
import { WarningDefinitionsController } from './controllers/warning-definitions.controller';
import { BoardWarningConfigController } from './controllers/board-warning-config.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || '4f8c2e9a7d1b6c3f5a8e0d9c7b2f1a6e4c9d8b7a5f2e1c3d6a9b0e7f4c2d1a8',
      signOptions: { expiresIn: '8h' },
    }),
  ],
  controllers: [
    ActivitiesController,
    AiController,
    AuthController,
    BoardsController,
    CommentsController,
    DealsController,
    EscalationsController,
    ExportController,
    NextStepsController,
    NotificationsController,
    PlaybookController,
    TargetsController,
    TasksController,
    TeamsController,
    UsersController,
    WarningsController,
    DealDriversController,
    WarningDefinitionsController,
    BoardWarningConfigController
  ],
  providers: [
    SanitizeInterceptor,
    ActivitiesService,
    AiService,
    AuditService,
    AuthService,
    JwtAuthGuard,
    BoardsService,
    CommentsService,
    CrmSyncService,
    DatabaseService,
    DatasetUploadService,
    DealDriversRepository,
    DealDriversService,
    MatrixCache,
    WebhookSignatureGuard,
    DealsService,
    EscalationsService,
    ExportService,
    NextStepsService,
    NotificationsService,
    PlaybookService,
    TargetsService,
    TasksService,
    TeamsService,
    UsersService,
    WarningsService
  ],
  exports: [
    SanitizeInterceptor,
    ActivitiesService,
    AiService,
    AuditService,
    AuthService,
    JwtAuthGuard,
    BoardsService,
    CommentsService,
    CrmSyncService,
    DatabaseService,
    DatasetUploadService,
    DealDriversRepository,
    DealDriversService,
    MatrixCache,
    WebhookSignatureGuard,
    DealsService,
    EscalationsService,
    ExportService,
    NextStepsService,
    NotificationsService,
    PlaybookService,
    TargetsService,
    TasksService,
    TeamsService,
    UsersService,
    WarningsService
  ],
})
export class M04DealIntelligenceModule {}
