import 'reflect-metadata';
import { register } from 'tsconfig-paths';
import * as path from 'path';
register({
  baseUrl: path.join(__dirname, '..'),
  paths: require('../tsconfig.json').compilerOptions.paths,
});
import * as fs from 'fs';

import { NestFactory, Reflector } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ZodExceptionFilter } from './zod-exception.filter';
import { ResponseTransformInterceptor } from './response-transform.interceptor';
import { FrontendApiExceptionFilter } from '../../../modules/platform-core/filters/frontend-api-exception.filter';
import { JwtAuthGuard } from '../../../modules/platform-core/guards/jwt.guard';
import { TenantThrottlerGuard } from './tenant-throttler.guard';
import { TraceAndTenantMiddleware } from './trace-tenant.middleware';

// ─── Upload directory ─────────────────────────────────────────────────────────
// Some flows (M-01 audio upload) need a place to drop files before AssemblyAI
// picks them up. Ensure the dir exists at startup so the controllers can stream
// into it without worrying about ENOENT.
const UPLOAD_DIR = path.resolve(process.cwd(), 'uploads', 'audio');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// ─── Bootstrap ────────────────────────────────────────────────────────────────
async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: false,
  });

  const reflector = app.get(Reflector);

  app.enableCors({ origin: true, credentials: true });
  
  // Register global middleware to inject trace_id and tenant_id
  app.use(TraceAndTenantMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );
  // Transform successful response payloads into standardized success envelopes
  app.useGlobalInterceptors(new ResponseTransformInterceptor());
  // Convert HttpException and ZodError raised inside controllers into structured responses.
  app.useGlobalFilters(new FrontendApiExceptionFilter(), new ZodExceptionFilter());
  
  // Register global auth guard and rate limiting (throttler) guard
  app.useGlobalGuards(new JwtAuthGuard(reflector), new TenantThrottlerGuard(app.get('ThrottlerStorage'), app.get('ThrottlerConfig'), reflector));

  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port);

  logger.log(`API listening on http://localhost:${port}`);
  logger.log('Mounted routes:');
  logger.log('  POST   /api/v1/capture-transcription/calls/upload (multer audio)');
  logger.log('  *      /api/v1/capture-transcription/calls/:id/next-steps (CRUD)');
  logger.log('  *      /api/v1/ai-extractor/fields + /calls/:id/extract');
  logger.log('  Worker queue: m01-queue (when DISABLE_REDIS !== true)');
}

bootstrap().catch((err) => {
  // Surface a real stack trace instead of an unhandled rejection silent-fail.
  // The pre-fix version of this file contained a literal GitHub conflict URL
  // pasted into the source — see doc/execution/implementation_changes.md §A1.
  // eslint-disable-next-line no-console
  console.error('[BOOT FAILED]', err);
  process.exit(1);
});
