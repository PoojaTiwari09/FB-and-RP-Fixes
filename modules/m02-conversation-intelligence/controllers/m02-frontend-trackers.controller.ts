import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M02FrontendTrackersService } from '../services/m02-frontend-trackers.service';

/** Trackers rep UI — GET /api/trackers */
@Controller('api/v1/conversation-intelligence/trackers')
@UseGuards(TenantGuard)
export class M02FrontendTrackersController {
  constructor(private readonly svc: M02FrontendTrackersService) {}

  @Get()
  list(@Query() query: Record<string, string>, @Req() req: Record<string, string>) {
    return this.svc.listTrackers(req.tenantId, query);
  }

  @Get(':trackerId/detail')
  detail(@Param('trackerId') trackerId: string, @Req() req: Record<string, string>) {
    return this.svc.getTrackerDetail(req.tenantId, trackerId);
  }

  @Post(':trackerId/ask')
  ask(
    @Param('trackerId') trackerId: string,
    @Body() body: { question?: string },
    @Req() req: Record<string, string>,
  ) {
    return this.svc.askTracker(req.tenantId, trackerId, body?.question ?? '');
  }
}
