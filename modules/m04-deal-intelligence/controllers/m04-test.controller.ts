import { Controller, Get, Post } from '@nestjs/common';
import { DealRepository } from '@/repositories/deal.repository';
import { DealBoardRepository } from '@/repositories/deal-board.repository';
import { M04MemoryStore, M04_DEV_USER } from '../database/m04-memory.store';
@Controller('m04-test')
export class M04TestController {
  constructor(
    private readonly deals: DealRepository,
    private readonly boards: DealBoardRepository,
    private readonly store: M04MemoryStore,
  ) {}

  @Get('health')
  health() {
    return {
      success: true,
      storage: 'memory',
      counts: {
        deals: this.store.deals.size,
        boards: this.store.boards.size,
        users: this.store.users.size,
      },
      timestamp: new Date().toISOString(),
    };
  }

  @Post('smoke')
  async smoke() {
    const [deals] = await this.deals.findAll({}, 1, 10);
    const [boards] = await this.boards.findAll({}, 1, 10);
    const deal = deals[0] ? await this.deals.findById(deals[0].id) : null;
    return {
      success: true,
      dealCount: deals.length,
      boardCount: boards.length,
      sampleDealId: deal?.id,
      devUserId: M04_DEV_USER,
    };
  }
}
