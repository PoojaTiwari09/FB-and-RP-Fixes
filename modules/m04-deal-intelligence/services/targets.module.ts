import { Module } from '@nestjs/common';
import { TargetsService } from './targets.service';
import { TargetsController } from '../controllers/targets.controller';

@Module({
  controllers: [TargetsController],
  providers: [TargetsService],
  exports: [TargetsService],
})
export class TargetsModule {}
