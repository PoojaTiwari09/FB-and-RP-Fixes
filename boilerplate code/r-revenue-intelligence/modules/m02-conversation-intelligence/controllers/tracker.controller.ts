import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { TrackerService } from '../services/tracker.service';

/**
 * Tracker management — keyword-trigger detections across calls & emails (TDD: AI Smart Tracker).
 *
 * `TenantGuard` is applied at the class level: missing or unverified tenant context
 * yields a 401 BEFORE any handler runs. Handlers therefore trust `req.tenantId`.
 */
@Controller('api/v1/conversation-intelligence/trackers')
@UseGuards(TenantGuard)
export class TrackerController {
  constructor(private readonly trackerService: TrackerService) {}

  @Post()
  async createTracker(@Req() req: Record<string, any>, @Body() body: any) {
    return this.trackerService.createTracker({ ...body, tenantId: req.tenantId });
  }

  @Get()
  async getTrackers(@Req() req: Record<string, any>) {
    return this.trackerService.getTrackers(req.tenantId);
  }

  @Get('stats')
  async getStats(@Req() req: Record<string, any>) {
    return this.trackerService.getTrackerStats(req.tenantId);
  }

  @Get('detections')
  async getAllDetections(@Req() req: Record<string, any>) {
    return this.trackerService.getAllDetections(req.tenantId);
  }

  @Get('detections/:entityId')
  async getDetectionsForConversation(
    @Req() req: Record<string, any>,
    @Param('entityId') entityId: string,
    @Query('entityType') entityType: string = 'call',
  ) {
    return this.trackerService.getDetectionsForConversation(
      req.tenantId,
      entityId,
      entityType as 'call' | 'email',
    );
  }

  @Put(':id')
  async updateTracker(
    @Req() req: Record<string, any>,
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.trackerService.updateTracker(id, req.tenantId, body);
  }

  @Delete(':id')
  async deleteTracker(@Req() req: Record<string, any>, @Param('id') id: string) {
    return this.trackerService.deleteTracker(id, req.tenantId);
  }
}
