import { Controller, Get, Param } from '@nestjs/common';
import { DealDriversApiService } from '../services/deal-drivers-api.service';

/**
 * Deal Drivers route on /api/deals/:dealId/drivers — separate from DealsController (Deal Boards).
 */
@Controller('api/deals')
export class DealDriversDealController {
  constructor(private readonly dealDrivers: DealDriversApiService) {}

  @Get(':dealId/drivers')
  async listForDeal(@Param('dealId') dealId: string) {
    const data = await this.dealDrivers.listByDealId(dealId);
    return { success: true, data };
  }
}
