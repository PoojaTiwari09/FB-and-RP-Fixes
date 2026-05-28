import 'reflect-metadata';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config({ path: path.join(__dirname, '../.env') });
dotenv.config({ path: path.join(__dirname, '../../../.env') });
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { json, urlencoded } from 'express';
import * as bcrypt from 'bcrypt';
import { M09AppModule } from './app.module';
import { M09Repository } from '../../../modules/m09-coaching-training/repositories/m09.repository';

async function bootstrap() {
  const logger = new Logger('M09-API');
  const app = await NestFactory.create<NestExpressApplication>(M09AppModule);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Controllers already use full paths: api/v1/coaching-training/...
  app.enableCors({
    origin: M09AppModule.corsOrigins,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidUnknownValues: false,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('M09 Sales AI Coaching API')
    .setDescription('Coaching & Training — standalone m09-api')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/v1/coaching-training/docs', app, document);

  const port = parseInt(process.env.M09_API_PORT ?? '4009', 10);
  const webUrl = process.env.M09_WEB_URL || 'http://localhost:5176';
  const apiBase = `http://localhost:${port}/api/v1/coaching-training`;

  app.getHttpAdapter().get('/', (_req, res) => {
    res.json({
      service: 'm09-api',
      status: 'ok',
      webUrl,
      apiBase,
      swagger: `${apiBase}/docs`,
      health: `${apiBase}/test/health`,
      seed: `POST ${apiBase}/test/seed`,
      demoLogin: {
        manager: 'manager@example.com / password123',
        rep: 'rep@example.com / password123',
      },
    });
  });

  await app.listen(port);

  if (process.env.M09_AUTO_SEED !== 'false') {
    try {
      const repo = app.get(M09Repository);
      const hashed = await bcrypt.hash('password123', 10);
      repo.seedTestData(hashed);
      logger.log('Dev seed loaded (manager@example.com / rep@example.com, password: password123)');
    } catch (e) {
      logger.warn(`Auto-seed skipped: ${(e as Error).message}`);
    }
  }

  logger.log(`M09 API listening on http://localhost:${port}`);
  logger.log(`API base: ${apiBase}`);
  logger.log(`M09 UI (Next): ${webUrl}`);
  logger.log(`Swagger: http://localhost:${port}/api/v1/coaching-training/docs`);
}

bootstrap().catch((err) => {
  console.error('[M09-API BOOT FAILED]', err);
  process.exit(1);
});
