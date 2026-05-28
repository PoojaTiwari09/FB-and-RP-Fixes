import { NestFactory } from '@nestjs/core';
import { ValidationPipe, ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { M09CoachingTrainingModule } from './m09-coaching-training.module';
import { ConfigService } from '@nestjs/config';
import { json, urlencoded, Response } from 'express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      message = typeof res === 'object' && res['message'] ? res['message'] : res;
    } else if (exception instanceof Error) {
      message = exception.message;
    }

    response.status(status).json({
      success: false,
      message: Array.isArray(message) ? message[0] : message,
      statusCode: status,
      timestamp: new Date().toISOString(),
    });
  }
}

async function bootstrap() {
  const app = await NestFactory.create(M09CoachingTrainingModule);
  const configService = app.get(ConfigService);

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ extended: true, limit: '50mb' }));

  // Routes are declared on controllers as api/v1/coaching-training/* (no extra global prefix).

  // 2. Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // 3. Global Exception Filter
  app.useGlobalFilters(new HttpExceptionFilter());

  // 4. CORS Configuration
  app.enableCors({
    origin: '*',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // 5. Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('M09 Sales AI Coaching API')
    .setDescription('Sales AI Coaching & Training Backend')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  // 6. Start Server
  const port = configService.get<number>('M09_API_PORT') || configService.get<number>('PORT') || 4009;
  await app.listen(port);
  
  console.log(`\x1b[32m[NestJS]\x1b[0m M09 Coaching & Training is running on: \x1b[34mhttp://localhost:${port}/api/v1/coaching-training\x1b[0m`);
  console.log(`\x1b[32m[NestJS]\x1b[0m Submit to manager: POST /api/training/submit-session or POST /api/sessions/submit-to-manager`);
}
bootstrap();
