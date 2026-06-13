import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { MiddlewareConsumer, NestModule } from '@nestjs/common';
import { M04DatabaseModule } from './database/m04-database.module';

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
import { DealTaskController } from './controllers/deal-task.controller';
import { DealCommentController } from './controllers/deal-comment.controller';
import { RiskEscalationController } from './controllers/risk-escalation.controller';
import { AIScoreController } from './controllers/ai-score.controller';
import { DealActivityController } from './controllers/deal-activity.controller';
import { CoachingController } from './controllers/coaching.controller';
import { ExportController } from './controllers/export.controller';
import { WebhookController } from './controllers/webhook.controller';
import { AnalyticsController } from './controllers/analytics.controller';
import { SettingsController } from './controllers/settings.controller';
import { M04TestController } from './controllers/m04-test.controller';

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

import { DealBoardRepository } from './repositories/deal-board.repository';
import { DealRepository } from './repositories/deal.repository';
import { SessionUserMiddleware } from './middleware/session-user.middleware';

// Deal Drivers API integration
import { PrismaModule } from './database/prisma.module';
import { DealsController } from './controllers/deals.controller';
import { DealBoardsController } from './controllers/deal-boards.controller';
import { ManagerController } from './controllers/manager.controller';
import { NotificationsController } from './controllers/notifications.controller';
import { DealDriversApiController } from './controllers/deal-drivers-api.controller';
import { DealDriversManagerController } from './controllers/deal-drivers-manager.controller';
import { DealDriversDealController } from './controllers/deal-drivers-deal.controller';
import { HubSpotService } from './services/hubspot.service';
import { DealsService } from './services/deals.service';
import { DealMeddpiccService } from './services/deal-meddpicc.service';
import { DealCatalogService } from './services/deal-catalog.service';
import { DealDriversApiRepository } from './repositories/deal-drivers-api.repository';
import { DealDriversApiService } from './services/deal-drivers-api.service';
import { DealDriversAnalyticsService } from './services/deal-drivers-analytics.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    HttpModule.register({ timeout: 30000, maxRedirects: 5 }),
    ScheduleModule.forRoot(),
    M04DatabaseModule,
    PrismaModule,
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
    DealCommentController,
    RiskEscalationController,
    AIScoreController,
    DealActivityController,
    CoachingController,
    ExportController,
    WebhookController,
    AnalyticsController,
    SettingsController,
    M04TestController,
    DealBoardsController,
    DealsController,
    ManagerController,
    NotificationsController,
    DealDriversApiController,
    DealDriversManagerController,
    DealDriversDealController,
  ],
  providers: [
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
    DealBoardRepository,
    DealRepository,
    HubSpotService,
    DealsService,
    DealMeddpiccService,
    DealCatalogService,
    DealDriversApiRepository,
    DealDriversApiService,
    DealDriversAnalyticsService,
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
    HubSpotService,
    DealsService,
    DealMeddpiccService,
    DealDriversApiService,
    DealDriversAnalyticsService,
  ],
})
export class M04DealIntelligenceModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(SessionUserMiddleware).forRoutes('*');
  }
}
