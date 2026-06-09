import { Module } from '@nestjs/common';
import { NextStepsService } from './next-steps.service';
import { NextStepsController } from '../controllers/next-steps.controller';

@Module({
  controllers: [NextStepsController],
  providers: [NextStepsService],
  exports: [NextStepsService],
})
export class NextStepsModule {}
