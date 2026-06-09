import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import express from 'express';
import { resolveUploadsRoot } from '../../../modules/m01-capture-transcription/lib/upload-paths';

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../../../.env') });

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import * as bcrypt from 'bcrypt';
import { UnifiedAppModule } from './app.module';
import { ZodExceptionFilter } from './zod-exception.filter';
import { FrontendApiExceptionFilter } from '../../../modules/platform-core/filters/frontend-api-exception.filter';
import { M09Repository } from '../../../modules/m09-coaching-training/repositories/m09.repository';

async function bootstrap() {
  const logger = new Logger('Unified-API');
  const app = await NestFactory.create<NestExpressApplication>(UnifiedAppModule);

  const uploadsRoot = resolveUploadsRoot();
  logger.log(`Uploads directory: ${uploadsRoot}`);

  // Serve /uploads/audio/* without SPA index fallback (prevents ENOENT on index.html)
  app.use(
    '/uploads',
    express.static(uploadsRoot, {
      index: false,
      redirect: false,
      fallthrough: true,
    }),
  );
  app.use('/uploads', (_req, res) => {
    res.status(404).json({ error: 'Upload not found' });
  });

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: UnifiedAppModule.corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, x-tenant-id, X-Tenant-ID, x-user-id, x-user-role, x-org-id',
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );
  app.useGlobalFilters(new ZodExceptionFilter(), new FrontendApiExceptionFilter());

  // Do not read monolith PORT from .env (often 3002) — unified demo is always :3001 unless overridden.
  const port = parseInt(process.env.UNIFIED_API_PORT ?? '3001', 10);

  app.getHttpAdapter().get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'unified-api' });
  });

  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      service: 'unified-api',
      status: 'ok',
      modules: ['M01', 'M02', 'M06', 'M08-Engage', 'M09'],
      ui: 'http://localhost:3000',
      samples: {
        m01Calls: `http://localhost:${port}/api/calls?page=1&size=1`,
        m02Search: `http://localhost:${port}/api/search/calls?tab=calls&page=1&size=1`,
        m09Trainings: `http://localhost:${port}/api/trainings`,
      },
    });
  });

  await app.listen(port);

  if (process.env.M09_AUTO_SEED !== 'false') {
    try {
      const repo = app.get(M09Repository);
      const hashed = await bcrypt.hash('password123', 10);
      repo.seedTestData(hashed);
      logger.log('M09 dev seed loaded (manager@example.com / rep@example.com, password: password123)');
    } catch (e) {
      logger.warn(`M09 auto-seed skipped: ${(e as Error).message}`);
    }
  }

  logger.log(`Unified API (M01+M02+M08 Engage+M09) on http://localhost:${port}`);
  logger.log('Frontend: http://localhost:3000');
}

bootstrap().catch((err) => {
  console.error('[UNIFIED-API BOOT FAILED]', err);
  process.exit(1);
});
