import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env from project root
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env.local') });

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = process.env.NESTJS_PORT || 3001;
  await app.listen(port);
  console.log(`🚀 NestJS API running on http://localhost:${port}`);
}
bootstrap();
