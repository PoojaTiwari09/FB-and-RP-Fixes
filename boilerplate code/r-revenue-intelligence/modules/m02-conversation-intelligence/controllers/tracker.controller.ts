import { Controller, Get, Post, Put, Delete, Body, Param, Headers, UnauthorizedException, Query } from '@nestjs/common';
import { TrackerService } from '../services/tracker.service';

@Controller('api/v1/conversation-intelligence/trackers')
export class TrackerController {
  constructor(private readonly trackerService: TrackerService) {}

  @Post()
  async createTracker(
    @Headers('x-tenant-id') tenantId: string,
    @Body() body: any
  ) {
    if (!tenantId) throw new UnauthorizedException('Tenant ID required');
    return this.trackerService.createTracker({ ...body, tenantId });
  }

  @Get()
  async getTrackers(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new UnauthorizedException('Tenant ID required');
    return this.trackerService.getTrackers(tenantId);
  }

  @Get('stats')
  async getStats(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new UnauthorizedException('Tenant ID required');
    return this.trackerService.getTrackerStats(tenantId);
  }

  @Get('detections')
  async getAllDetections(@Headers('x-tenant-id') tenantId: string) {
    if (!tenantId) throw new UnauthorizedException('Tenant ID required');
    return this.trackerService.getAllDetections(tenantId);
  }

  @Get('detections/:entityId')
  async getDetectionsForConversation(
    @Headers('x-tenant-id') tenantId: string,
    @Param('entityId') entityId: string,
    @Query('entityType') entityType: string = 'call'
  ) {
    if (!tenantId) throw new UnauthorizedException('Tenant ID required');
    return this.trackerService.getDetectionsForConversation(
      tenantId,
      entityId,
      entityType as 'call' | 'email'
    );
  }

  @Put(':id')
  async updateTracker(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string,
    @Body() body: any
  ) {
    if (!tenantId) throw new UnauthorizedException('Tenant ID required');
    return this.trackerService.updateTracker(id, tenantId, body);
  }

  @Delete(':id')
  async deleteTracker(
    @Headers('x-tenant-id') tenantId: string,
    @Param('id') id: string
  ) {
    if (!tenantId) throw new UnauthorizedException('Tenant ID required');
    return this.trackerService.deleteTracker(id, tenantId);
  }
}
