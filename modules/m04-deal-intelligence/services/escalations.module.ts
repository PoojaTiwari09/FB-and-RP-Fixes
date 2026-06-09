import { Module } from '@nestjs/common';
import { EscalationsService } from './escalations.service';
import { EscalationsController } from '../controllers/escalations.controller';

@Module({
  controllers: [EscalationsController],
  providers: [EscalationsService],
  exports: [EscalationsService],
})
export class EscalationsModule {}
