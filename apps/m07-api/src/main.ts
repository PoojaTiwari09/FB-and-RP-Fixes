import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../../../.env') });

process.env.M07_STANDALONE_AUTH = process.env.M07_STANDALONE_AUTH ?? 'true';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { M07AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('M07-API');
  const app = await NestFactory.create<NestExpressApplication>(M07AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: M07AppModule.corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, x-tenant-id, x-user-id, x-org-id, x-email, x-role, X-Role',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  const port = parseInt(process.env.M07_API_PORT ?? '4013', 10);
  const webUrl = process.env.M07_WEB_URL || 'http://localhost:5180';
  const apiBase = `http://localhost:${port}/api/v1/revenue-dashboards`;

  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      service: 'm07-api',
      status: 'ok',
      webUrl,
      apiBase,
      health: `http://localhost:${port}/api/v1/revenue-dashboards/test/health`,
      dashboardsUi: `${webUrl}/dashboards`,
      standaloneAuth: process.env.M07_STANDALONE_AUTH === 'true',
      demoHeaders: {
        'x-tenant-id': '11111111-1111-1111-1111-111111111111',
        'x-user-id': '22222222-2222-2222-2222-222222222222',
        'x-role': 'ADMIN',
      },
    });
  });

  await app.listen(port);

  logger.log(`M07 API listening on http://localhost:${port}`);
  logger.log(`API base: ${apiBase}`);
  logger.log(`M07 UI: ${webUrl}/dashboards`);
  logger.log(`Health: http://localhost:${port}/api/v1/revenue-dashboards/test/health`);
}

bootstrap().catch((err) => {
  console.error('[M07-API BOOT FAILED]', err);
  process.exit(1);
});
