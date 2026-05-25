import { Module } from '@nestjs/common';
import { PlaybookService } from './playbook.service';
import { PlaybookController } from '../controllers/playbook.controller';

@Module({
  controllers: [PlaybookController],
  providers: [PlaybookService],
  exports: [PlaybookService],
})
export class PlaybookModule {}
