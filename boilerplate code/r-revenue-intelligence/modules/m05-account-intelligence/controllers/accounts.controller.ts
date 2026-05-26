import { Controller, Get, Param, Query } from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';

@Controller('api/v1/account-intelligence/accounts')
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async getAccounts(
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

    return this.accountsService.getAccounts({
      board_slug,
      tab_id,
      rep_id,
      period,
      sort_field,
      sort_dir,
      page: page ? parseInt(page) : 1,
      page_size: page_size ? parseInt(page_size) : 20,
    });
  }

  @Get('engagement-gap')
  async getEngagementGap(
    @Query('board_slug') board_slug: string,
    @Query('days') days?: string,
  ) {
    if (!board_slug) return { error: 'board_slug is required' };
    return this.accountsService.getEngagementGap(board_slug, days ? parseInt(days) : 21);
  }

  @Get('sparklines')
  async getSparklines(
    @Query('board_slug') board_slug: string,
    @Query('hubspot_ids') hubspot_ids?: string,
  ) {
    if (!board_slug) return { error: 'board_slug is required' };
    const ids = hubspot_ids ? hubspot_ids.split(',').map(s => s.trim()) : [];
    return this.accountsService.getSparklineData(board_slug, ids);
  }

  @Get(':hubspotId')
  async getAccountDetail(@Param('hubspotId') hubspotId: string) {
    return this.accountsService.getAccountDetail(hubspotId);
  }
}
