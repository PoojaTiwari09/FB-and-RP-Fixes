import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../../../.env') });

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { M05AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('M05-API');
  const app = await NestFactory.create<NestExpressApplication>(M05AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: M05AppModule.corsOrigins,
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

  const port = parseInt(process.env.M05_API_PORT ?? '4012', 10);
  const webUrl = process.env.M05_WEB_URL || 'http://localhost:5179';
  const apiBase = `http://localhost:${port}/api/v1/account-intelligence`;

  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      service: 'm05-api',
      status: 'ok',
      webUrl,
      apiBase,
      health: `${apiBase}/test/health`,
      boards: `${apiBase}/boards`,
      accounts: `${apiBase}/accounts?board_slug=demo`,
      demoBoard: `${webUrl}/board/demo`,
    });
  });

  await app.listen(port);

  logger.log(`M05 API listening on http://localhost:${port}`);
  logger.log(`API base: ${apiBase}`);
  logger.log(`M05 UI: ${webUrl}`);
  logger.log(`Demo board: ${webUrl}/board/demo`);
  logger.log(`Health: ${apiBase}/test/health`);
}

bootstrap().catch((err) => {
  console.error('[M05-API BOOT FAILED]', err);
  process.exit(1);
});
