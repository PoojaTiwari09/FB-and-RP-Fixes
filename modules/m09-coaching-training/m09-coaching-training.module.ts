import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './database/prisma.module';
import { JwtModule } from '@nestjs/jwt';

// Controllers
import {
  AppController,
  SessionsController,
  ScenariosController,
  CoachingController,
  TrainingController,
  AnalyticsController,
  TestController,
  JwtAuthGuard,
  RolesGuard,
} from './controllers/m09.controller';
import { AuthController } from './controllers/auth.controller';
import { M09FrontendTrainingsController } from './frontend-api/m09-frontend-trainings.controller';
import { M09FrontendManagerController } from './frontend-api/m09-frontend-manager.controller';
import { M09FrontendRevenueManagerController } from './frontend-api/m09-frontend-revenue-manager.controller';
import { M09FrontendTrainingsService } from './frontend-api/m09-frontend-trainings.service';
import { M09FrontendAuthGuard } from './frontend-api/m09-frontend-auth.guard';

// Services
import {
  LlmService,
  SessionsService,
  ScenariosService,
  CoachingService,
  TrainingService,
  AnalyticsService,
  SchedulerService,
} from './services/m09.service';

// Repositories
import { M09Repository } from './repositories/m09.repository';

// Workers
import { M09Worker } from './workers/m09.worker';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),       // Environment variables for LLM keys
    JwtModule.register({
      global: true,
      // No hardcoded fallback_secret — dev-only default; set JWT_SECRET in production.
      secret:
        process.env.JWT_SECRET ||
        process.env.M09_JWT_SECRET ||
        'dev-only-m09-jwt-secret-change-me',
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN || '7d' },
    }),
    PrismaModule,       // Database access via Prisma
  ],
  controllers: [
    AppController,
    AuthController,
    SessionsController,
    ScenariosController,
    CoachingController,
    TrainingController,
    AnalyticsController,
    TestController,
    M09FrontendTrainingsController,
    M09FrontendManagerController,
    M09FrontendRevenueManagerController,
  ],
  providers: [
    Reflector,
    M09FrontendAuthGuard,
    M09FrontendTrainingsService,
    JwtAuthGuard,
    RolesGuard,
    // Services
    LlmService,
    SessionsService,
    ScenariosService,
    CoachingService,
    TrainingService,
    AnalyticsService,
    SchedulerService,

    // Repositories
    M09Repository,

    // Workers
    M09Worker,
  ],
  exports: [
    SessionsService,
    ScenariosService,
    AnalyticsService,
    TrainingService,
    M09Repository,
  ],
})
export class M09CoachingTrainingModule {}
