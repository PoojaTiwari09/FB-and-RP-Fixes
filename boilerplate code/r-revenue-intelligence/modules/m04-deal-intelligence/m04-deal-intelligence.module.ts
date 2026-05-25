import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';

// Entities
import {
  DealBoard,
  BoardFilter,
  BoardTab,
  BoardColumn,
  BoardPermission,
  Deal,
  DealWarning,
  DealPlaybook,
  DealActivity,
  DealComment,
  DealTask,
  AuditLog,
  User,
  Session,
  UserPreference,
  AnalyticsSnapshot,
} from './entities';
import { SyncLog } from './entities/sync-log.entity';
import { DealSummary } from './entities/deal-summary.entity';

// Controllers
import { DealBoardController } from './controllers/deal-board.controller';
import { DealController } from './controllers/deal.controller';
import {
  DealSummaryController,
  SummaryManagementController,
} from './controllers/deal-summary.controller';
import {
  DealWarningController,
  WarningManagementController,
} from './controllers/deal-warning.controller';
import { SyncController } from './controllers/sync.controller';
import { AuthController } from './controllers/auth.controller';
import { DealPlaybookController } from './controllers/deal-playbook.controller';
import { DealTaskController, TaskManagementController } from './controllers/deal-task.controller';
import { DealCommentController } from './controllers/deal-comment.controller';
import { RiskEscalationController } from './controllers/risk-escalation.controller';
import { AIScoreController } from './controllers/ai-score.controller';
import { DealActivityController } from './controllers/deal-activity.controller';
import { CoachingController } from './controllers/coaching.controller';
import { ExportController } from './controllers/export.controller';
import { WebhookController } from './controllers/webhook.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { SettingsController } from './controllers/settings.controller';

// Services
import { DealBoardService } from './services/deal-board.service';
import { AuditLogService } from './services/audit-log.service';
import { HubSpotClientService } from './services/hubspot-client.service';
import { DealSyncService } from './services/deal-sync.service';
import { AIClientService } from './services/ai-client.service';
import { DealService } from './services/deal.service';
import { DealSummaryService } from './services/deal-summary.service';
import { DealWarningService } from './services/deal-warning.service';
import { AuthService } from './services/auth.service';
import { DealPlaybookService } from './services/deal-playbook.service';
import { DealTaskService } from './services/deal-task.service';
import { DealCommentService } from './services/deal-comment.service';
import { AIScoreService } from './services/ai-score.service';
import { DealActivityService } from './services/deal-activity.service';
import { CoachingService } from './services/coaching.service';
import { ExportService } from './services/export.service';
import { WebhookService } from './services/webhook.service';
import { AnalyticsService } from './services/analytics.service';
import { SettingsService } from './services/settings.service';

// Repositories
import { DealBoardRepository } from './repositories/deal-board.repository';
import { DealRepository } from './repositories/deal.repository';

// Middleware
import { SessionUserMiddleware } from './middleware/session-user.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    HttpModule.register({
      timeout: 30000,
      maxRedirects: 5,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    TypeOrmModule.forFeature([
      DealBoard,
      BoardFilter,
      BoardTab,
      BoardColumn,
      BoardPermission,
      Deal,
      DealWarning,
      DealPlaybook,
      DealActivity,
      DealComment,
      DealTask,
      AuditLog,
      SyncLog,
      DealSummary,
      User,
      Session,
      UserPreference,
      AnalyticsSnapshot,
    ]),
  ],
  controllers: [
    DealBoardController,
    DealController,
    DealSummaryController,
    SummaryManagementController,
    DealWarningController,
    WarningManagementController,
    SyncController,
    AuthController,
    DealPlaybookController,
    DealTaskController,
    TaskManagementController,
    DealCommentController,
    RiskEscalationController,
    AIScoreController,
    DealActivityController,
    CoachingController,
    ExportController,
    WebhookController,
    AnalyticsController,
    SettingsController,
  ],
  providers: [
    // Services
    DealBoardService,
    AuditLogService,
    HubSpotClientService,
    DealSyncService,
    AIClientService,
    DealService,
    DealSummaryService,
    DealWarningService,
    AuthService,
    DealPlaybookService,
    DealTaskService,
    DealCommentService,
    AIScoreService,
    DealActivityService,
    CoachingService,
    ExportService,
    WebhookService,
    AnalyticsService,
    SettingsService,
    // Repositories
    DealBoardRepository,
    DealRepository,
  ],
  exports: [
    DealBoardService,
    AuditLogService,
    DealBoardRepository,
    HubSpotClientService,
    DealSyncService,
    AIClientService,
    DealService,
    DealSummaryService,
    DealWarningService,
    DealRepository,
    AuthService,
  ],
})
export class M04DealIntelligenceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionUserMiddleware).forRoutes('*');
  }
}
