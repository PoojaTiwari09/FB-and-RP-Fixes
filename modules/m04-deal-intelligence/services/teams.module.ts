import { Module } from '@nestjs/common';
import { TeamsService } from './teams.service';
import { TeamsController } from '../controllers/teams.controller';

@Module({
  controllers: [TeamsController],
  providers: [TeamsService],
  exports: [TeamsService],
})
export class TeamsModule {}
