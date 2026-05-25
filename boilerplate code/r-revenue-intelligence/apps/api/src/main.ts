import * as path from 'path';
import * as dotenv from 'dotenv';
// Load .env from root directory relative to this file
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  await app.listen(3001);
  console.log('API Modular Monolith running on port 3001');
}
bootstrap();
