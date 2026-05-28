import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

process.env.M10_STANDALONE_AUTH = process.env.M10_STANDALONE_AUTH ?? 'true';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { M10AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('M10-API');
  const app = await NestFactory.create<NestExpressApplication>(M10AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: M10AppModule.corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, x-tenant-id, x-user-id, x-org-id, x-email',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  const port = parseInt(process.env.M10_API_PORT ?? '4011', 10);
  const webUrl = process.env.M10_WEB_URL || 'http://localhost:5178';
  const apiBase = `http://localhost:${port}/api/v1/m10-data-compliance`;

  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      service: 'm10-api',
      status: 'ok',
      webUrl,
      apiBase,
      health: `${apiBase}/test/health`,
      accounts: `${apiBase}/accounts`,
      deals: `${apiBase}/deals`,
      crmSync: `${apiBase}/crm-sync-status`,
      standaloneAuth: process.env.M10_STANDALONE_AUTH === 'true',
      demoHeaders: {
        'x-tenant-id': '00000000-0000-0000-0000-000000000001',
        'x-user-id': '00000000-0000-0000-0000-000000000002',
      },
    });
  });

  await app.listen(port);

  logger.log(`M10 API listening on http://localhost:${port}`);
  logger.log(`API base: ${apiBase}`);
  logger.log(`M10 UI: ${webUrl}`);
  logger.log(`Health: http://localhost:${port}/api/v1/m10-data-compliance/test/health`);
}

bootstrap().catch((err) => {
  console.error('[M10-API BOOT FAILED]', err);
  process.exit(1);
});
