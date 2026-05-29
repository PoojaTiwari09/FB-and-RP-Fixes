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
import { M03AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('M03-API');
  const app = await NestFactory.create<NestExpressApplication>(M03AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  app.enableCors({
    origin: M03AppModule.corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders:
      'Content-Type, Accept, Authorization, x-tenant-id, x-user-id, X-User-Id, x-org-id, X-Org-Id, x-role, X-Role, x-team-id, X-Team-Id, x-email, X-Email',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  const port = parseInt(process.env.M03_API_PORT ?? '4010', 10);
  const webUrl = process.env.M03_WEB_URL || 'http://localhost:5177';
  const apiBase = `http://localhost:${port}/api/v1/ai-summaries-genai`;

  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      service: 'm03-api',
      status: 'ok',
      webUrl,
      apiBase,
      health: `${apiBase}/test/health`,
      demoHeaders: {
        'X-Org-Id': 'a0000000-0000-0000-0000-000000000001',
        'X-User-Id': 'c0000000-0000-0000-0000-000000000001',
        'X-Role': 'SALES_MANAGER',
      },
      pages: {
        research: `${webUrl}/research`,
        askAnything: `${webUrl}/ask-anything`,
        smartSummaries: `${webUrl}/smart-summaries`,
      },
    });
  });

  await app.listen(port);

  logger.log(`M03 API listening on http://localhost:${port}`);
  logger.log(`API base: ${apiBase}`);
  logger.log(`M03 UI (Vite): ${webUrl}`);
  logger.log(`Health: http://localhost:${port}/api/v1/ai-summaries-genai/test/health`);
}

bootstrap().catch((err) => {
  console.error('[M03-API BOOT FAILED]', err);
  process.exit(1);
});
