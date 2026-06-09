import { Module } from '@nestjs/common';
import { AiService } from './ai.service';
import { AiController } from '../controllers/ai.controller';

@Module({
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
