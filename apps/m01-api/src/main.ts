import 'reflect-metadata';
import * as path from 'path';
import * as fs from 'fs';
import * as dotenv from 'dotenv';

// Module port first — do not use shared PORT=3002 from monolith .env
dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../../../.env') });

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { M01AppModule } from './app.module';
import { ZodExceptionFilter } from './zod-exception.filter';
import { FrontendApiExceptionFilter } from '../../../modules/platform-core/filters/frontend-api-exception.filter';

const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'audio');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

async function bootstrap() {
  const logger = new Logger('M01-API');
  const app = await NestFactory.create<NestExpressApplication>(M01AppModule);

  app.enableCors({
    origin: M01AppModule.corsOrigins,
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

  const port = parseInt(process.env.M01_API_PORT ?? '3001', 10);
  const webUrl = process.env.M01_WEB_URL || 'http://localhost:5174';

  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      service: 'm01-api',
      status: 'ok',
      message: 'This is the M01 API only. Open the UI in your browser at the webUrl below.',
      webUrl,
      sampleApi: `http://localhost:${port}/api/v1/capture-transcription/calls`,
    });
  });

  await app.listen(port);

  logger.log(`M01 API listening on http://localhost:${port}`);
  logger.log(`M01 UI (Vite): ${webUrl}`);
  logger.log(`M02 ingest target: ${process.env.M02_API_URL || 'http://localhost:3002'}`);
}

bootstrap().catch((err) => {
  console.error('[M01-API BOOT FAILED]', err);
  process.exit(1);
});
