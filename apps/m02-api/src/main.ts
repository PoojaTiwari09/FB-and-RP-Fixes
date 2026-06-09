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
import { M02AppModule } from './app.module';
import { ZodExceptionFilter } from './zod-exception.filter';
import { FrontendApiExceptionFilter } from '../../../modules/platform-core/filters/frontend-api-exception.filter';

async function bootstrap() {
  const logger = new Logger('M02-API');
  const app = await NestFactory.create<NestExpressApplication>(M02AppModule);

  app.enableCors({
    origin: M02AppModule.corsOrigins,
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );
  app.useGlobalFilters(new ZodExceptionFilter(), new FrontendApiExceptionFilter());

  const port = parseInt(process.env.M02_API_PORT ?? '3002', 10);
  const webUrl = process.env.M02_WEB_URL || 'http://localhost:5175';

  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      service: 'm02-api',
      status: 'ok',
      message: 'This is the M02 API only. Open the UI in your browser at the webUrl below.',
      webUrl,
      sampleApi: `http://localhost:${port}/api/v1/conversation-intelligence/conversations`,
      docs: 'Set header x-tenant-id: 00000000-0000-0000-0000-000000000001',
    });
  });

  await app.listen(port);

  logger.log(`M02 API listening on http://localhost:${port}`);
  logger.log(`M02 UI (Vite): ${webUrl}`);
}

bootstrap().catch((err) => {
  console.error('[M02-API BOOT FAILED]', err);
  process.exit(1);
});
