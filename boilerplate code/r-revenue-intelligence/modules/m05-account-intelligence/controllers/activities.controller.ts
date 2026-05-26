import { Controller, Get, Param, Query } from '@nestjs/common';
import { ActivitiesService } from '../services/activities.service';

@Controller('api/v1/account-intelligence/activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get(':companyHubspotId')
  async getActivities(
    @Param('companyHubspotId') companyHubspotId: string,
    @Query('type') type?: string,
    @Query('limit') limit?: string,
    @Query('from_date') fromDate?: string,
    @Query('to_date') toDate?: string,
    @Query('page') page?: string,
    @Query('page_size') pageSize?: string,
  ) {
    return this.activitiesService.getActivities(
      companyHubspotId,
      type,
      limit ? parseInt(limit) : 50,
      fromDate,
      toDate,
      page ? parseInt(page) : 1,
      pageSize ? parseInt(pageSize) : 50,
    );
  }
}
