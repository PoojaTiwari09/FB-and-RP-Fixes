import { Module } from '@nestjs/common';
import { BoardsService } from './boards.service';
import { BoardsController } from '../controllers/boards.controller';

@Module({
  controllers: [BoardsController],
  providers: [BoardsService],
  exports: [BoardsService],
})
export class BoardsModule {}
