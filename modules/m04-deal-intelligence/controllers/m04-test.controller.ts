import { Controller, Get, Post } from '@nestjs/common';
import { DealRepository } from '@m04/repositories/deal.repository';
import { DealBoardRepository } from '@m04/repositories/deal-board.repository';
import { M04_DEV_USER } from '../database/m04-prisma.repository';
import { PrismaService } from '../database/prisma.service';
import { Public } from '../interfaces/jwt.guard';
@Controller('m04-test')
export class M04TestController {
  constructor(
    private readonly deals: DealRepository,
    private readonly boards: DealBoardRepository,
    private readonly prisma: PrismaService,
  ) {}

  @Public()
  @Get('health')
  async health() {
    return {
      success: true,
      storage: 'prisma',
      counts: {
        deals: await this.prisma.deal.count(),
        boards: await this.prisma.m04DealBoard.count(),
        users: await this.prisma.user.count(),
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
