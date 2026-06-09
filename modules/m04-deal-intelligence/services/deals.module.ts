import { Module } from '@nestjs/common';
import { DealsService } from './deals.service';
import { DealsController } from '../controllers/deals.controller';

@Module({
  controllers: [DealsController],
  providers: [DealsService],
  exports: [DealsService],
})
export class DealsModule {}
