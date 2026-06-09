import { Controller, Get, Param, Query, UseGuards, Req } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';

@Controller('api/v1/account-intelligence/accounts')
@UseGuards(TenantGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async getAccounts(
    @Req() req: any,
    @Query('board_slug') board_slug: string,
    @Query('tab_id') tab_id?: string,
    @Query('rep_id') rep_id?: string,
    @Query('period') period?: string,
    @Query('sort_field') sort_field?: string,
    @Query('sort_dir') sort_dir?: 'asc' | 'desc',
    @Query('page') page?: string,
    @Query('page_size') page_size?: string,
  ) {
    if (!board_slug) {
      return { error: 'board_slug is required' };
    }

    return this.accountsService.getAccounts(req.tenantId, {
      board_slug,
      tab_id,
      rep_id: rep_id || (req.userRole === 'sales_rep' ? req.userId : undefined),
      period,
      sort_field,
      sort_dir,
      page: page ? parseInt(page) : 1,
      page_size: page_size ? parseInt(page_size) : 20,
    }, req.userId, req.userRole);
  }

  @Get('engagement-gap')
  async getEngagementGap(
    @Req() req: any,
    @Query('board_slug') board_slug: string,
    @Query('days') days?: string,
  ) {
    if (!board_slug) return { error: 'board_slug is required' };
    return this.accountsService.getEngagementGap(req.tenantId, board_slug, days ? parseInt(days) : 21, req.userId, req.userRole);
  }

  @Get('sparklines')
  async getSparklines(
    @Req() req: any,
    @Query('board_slug') board_slug: string,
    @Query('hubspot_ids') hubspot_ids?: string,
  ) {
    if (!board_slug) return { error: 'board_slug is required' };
    const ids = hubspot_ids ? hubspot_ids.split(',').map(s => s.trim()) : [];
    return this.accountsService.getSparklineData(req.tenantId, board_slug, ids, req.userId, req.userRole);
  }

  @Get(':hubspotId')
  async getAccountDetail(@Req() req: any, @Param('hubspotId') hubspotId: string) {
    return this.accountsService.getAccountDetail(req.tenantId, hubspotId, req.userId, req.userRole);
  }
}
