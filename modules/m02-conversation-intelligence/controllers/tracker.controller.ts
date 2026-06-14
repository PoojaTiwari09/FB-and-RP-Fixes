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
import { M02FrontendTrackersService } from '../services/m02-frontend-trackers.service';

/**
 * Tracker management — keyword-trigger detections across calls & emails.
 */
@Controller('api/v1/conversation-intelligence/trackers')
@UseGuards(TenantGuard)
export class TrackerController {
  constructor(
    private readonly trackerService: TrackerService,
    private readonly frontendSvc: M02FrontendTrackersService,
  ) {}

  @Post()
  async createTracker(@Req() req: Record<string, any>, @Body() body: any) {
    return this.trackerService.createTracker({ ...body, tenantId: req.tenantId });
  }

  @Get()
  async getTrackers(@Req() req: Record<string, any>, @Query() query: any) {
    return this.frontendSvc.listTrackers(req.tenantId, query);
  }

  @Get('admin/list')
  async getAllTrackers(@Req() req: Record<string, any>) {
    const data = await this.trackerService.getTrackers(req.tenantId);
    return { data };
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

  @Get(':trackerId/detail')
  detail(@Param('trackerId') trackerId: string, @Req() req: Record<string, string>, @Query() query: any) {
    return this.frontendSvc.getTrackerDetail(req.tenantId, trackerId, query);
  }

  @Post(':trackerId/ask')
  ask(
    @Param('trackerId') trackerId: string,
    @Body() body: { question?: string },
    @Req() req: Record<string, string>,
    @Query() query: any,
  ) {
    return this.frontendSvc.askTracker(req.tenantId, trackerId, body?.question ?? '', query);
  }


  @Get(':id')
  async getTrackerById(@Req() req: Record<string, any>, @Param('id') id: string) {
    const data = await this.trackerService.getTrackerById(id, req.tenantId);
    return { data };
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
