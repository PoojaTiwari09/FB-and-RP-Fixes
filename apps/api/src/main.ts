import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { register } from 'tsconfig-paths';
import * as path from 'path';
import * as fs from 'fs';

dotenv.config({
  path: [
    path.resolve(__dirname, '../../../.env'),
    path.resolve(__dirname, '../../../../.env'),
    path.resolve(process.cwd(), '.env'),
  ].find((p) => fs.existsSync(p)),
});

const tsConfigPath = fs.existsSync(path.join(__dirname, '../tsconfig.json'))
  ? path.join(__dirname, '../tsconfig.json')
  : path.join(__dirname, '../../../../tsconfig.json');

const baseUrl = fs.existsSync(path.join(__dirname, '../tsconfig.json'))
  ? path.join(__dirname, '..')
  : path.join(__dirname, '../../../..'); // in dist/apps/api/src, go up 4 levels to root, but wait. The compiled files are inside dist/. So baseUrl for paths should point to dist/ ?
  
// Actually, if we're in dist, baseUrl should be `__dirname/../../` which is `dist/apps/api`
register({
  baseUrl: fs.existsSync(path.join(__dirname, '../tsconfig.json')) ? path.join(__dirname, '..') : path.join(__dirname, '../..'),
  paths: require(tsConfigPath).compilerOptions.paths,
});

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ZodExceptionFilter } from './zod-exception.filter';
import { ResponseTransformInterceptor } from './response-transform.interceptor';
import { FrontendApiExceptionFilter } from '../../../modules/platform-core/filters/frontend-api-exception.filter';
import { TraceAndTenantMiddleware } from './trace-tenant.middleware';
import { rejectSpoofHeadersMiddleware } from '../../../modules/platform-core/middleware/reject-spoof-headers.middleware';

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

  app.enableCors({ origin: true, credentials: true });

  app.use(rejectSpoofHeadersMiddleware);
  app.use(TraceAndTenantMiddleware);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );
  // Transform successful response payloads into standardized success envelopes
  // Also inject AsyncLocalStorage tenant context for RLS
  const { TenantContextInterceptor } = require('../../../modules/platform-core/interceptors/tenant-context.interceptor');
  app.useGlobalInterceptors(new ResponseTransformInterceptor(), new TenantContextInterceptor());
  // Convert HttpException and ZodError raised inside controllers into structured responses.
  app.useGlobalFilters(new FrontendApiExceptionFilter(), new ZodExceptionFilter());
  
  const port = parseInt(process.env.PORT || '3001', 10);
  await app.listen(port);

  logger.log(`API listening on http://localhost:${port}`);
  logger.log('Auth routes:');
  logger.log('  POST   /api/v1/auth/register');
  logger.log('  POST   /api/v1/auth/login');
  logger.log('  POST   /api/v1/auth/refresh');
  logger.log('  POST   /api/v1/auth/logout');
  logger.log('  GET    /api/v1/auth/me');
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
