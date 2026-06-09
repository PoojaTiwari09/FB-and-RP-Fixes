import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M01FrontendCallsService } from './m01-frontend-calls.service';

/**
 * New frontend contract (Figma / Call_List Sales_Rep.txt).
 * Base path: /api/calls — separate from /api/v1/capture-transcription/calls.
 */
@Controller('api/calls')
@UseGuards(TenantGuard)
export class M01FrontendCallsController {
  constructor(private readonly svc: M01FrontendCallsService) {}

  /** 1. Calls list with filters */
  @Get()
  listCalls(@Query() query: Record<string, string>, @Req() req: Record<string, string>) {
    return this.svc.listCalls(req.tenantId, query);
  }

  /** 5. Search — must be before :callId */
  @Get('search')
  searchCalls(@Query() query: Record<string, string>, @Req() req: Record<string, string>) {
    return this.svc.searchCalls(req.tenantId, query);
  }

  /** 3. Account filter dropdown */
  @Get('accounts')
  listAccounts(@Query() query: Record<string, string>, @Req() req: Record<string, string>) {
    return this.svc.listAccounts(req.tenantId, query);
  }

  /** 4. Participants filter dropdown */
  @Get('participants')
  listParticipants(@Query() query: Record<string, string>, @Req() req: Record<string, string>) {
    return this.svc.listParticipants(req.tenantId, query);
  }

  /** 6. Lightweight call header (Briefs / Transcript tabs) */
  @Get(':callId/metadata')
  getCallMetadata(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.svc.getCallMetadata(callId, req.tenantId);
  }

  /** 2. Single call row / detail */
  @Get(':callId')
  getCall(
    @Param('callId') callId: string,
    @Query() query: Record<string, string>,
    @Req() req: Record<string, string>,
  ) {
    return this.svc.getCall(callId, req.tenantId, query);
  }
}
