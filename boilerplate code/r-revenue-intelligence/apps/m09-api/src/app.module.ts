import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { M09CoachingTrainingModule } from '../../../modules/m09-coaching-training/m09-coaching-training.module';

const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:5176,http://localhost:3005,http://localhost:3000,http://localhost:3010,http://localhost:3011,http://localhost:3012,http://localhost:3013,http://localhost:3014')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
    }),
    M09CoachingTrainingModule,
  ],
})
export class M09AppModule {
  static corsOrigins = corsOrigins;
}
