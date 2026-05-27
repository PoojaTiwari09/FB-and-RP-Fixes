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
  ],
  providers: [
    Reflector,
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
