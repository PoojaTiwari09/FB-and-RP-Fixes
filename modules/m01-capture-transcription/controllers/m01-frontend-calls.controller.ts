import { Controller, Get, Param, Query, Req, UseGuards } from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M01FrontendCallsService } from '../services/m01-frontend-calls.service';
import { S3_RECORDINGS_CATALOG } from '../services/s3-recordings-catalog';

/**
 * New frontend contract (Figma / Call_List Sales_Rep.txt).
 * Base path: /api/calls — separate from /api/v1/capture-transcription/calls.
 */
@Controller('api/v1/capture-transcription/calls')
@UseGuards(TenantGuard)
export class M01FrontendCallsController {
  constructor(private readonly svc: M01FrontendCallsService) {}

  /** 1. Calls list with filters */
  @Get()
  listCalls(@Query() query: Record<string, string>, @Req() req: any) {
    return this.svc.listCalls(req.tenantId, query, req.userId, req.userRole, req.userName);
  }

  /** S3 recordings catalog — static path before :callId */
  @Get('s3-recordings')
  listS3Recordings() {
    return {
      recordings: S3_RECORDINGS_CATALOG.map(({ id, displayName, sourceUrl }) => ({
        id,
        displayName,
        sourceUrl,
      })),
    };
  }

  /** 5. Search — must be before :callId */
  @Get('search')
  searchCalls(@Query() query: Record<string, string>, @Req() req: any) {
    return this.svc.searchCalls(req.tenantId, query, req.userId, req.userRole, req.userName);
  }

  /** 3. Account filter dropdown */
  @Get('accounts')
  listAccounts(@Query() query: Record<string, string>, @Req() req: any) {
    return this.svc.listAccounts(req.tenantId, query, req.userId, req.userRole, req.userName);
  }

  /** 4. Participants filter dropdown */
  @Get('participants')
  listParticipants(@Query() query: Record<string, string>, @Req() req: any) {
    return this.svc.listParticipants(req.tenantId, query, req.userId, req.userRole, req.userName);
  }

  /** 6. Lightweight call header (Briefs / Transcript tabs) */
  @Get(':callId/metadata')
  getCallMetadata(@Param('callId') callId: string, @Req() req: any) {
    return this.svc.getCallMetadata(callId, req.tenantId, req.userId, req.userRole, req.userName);
  }

  /** 2. Single call row / detail */
  @Get(':callId')
  getCall(
    @Param('callId') callId: string,
    @Query() query: Record<string, string>,
    @Req() req: any,
  ) {
    return this.svc.getCall(callId, req.tenantId, query, req.userId, req.userRole, req.userName);
  }
}
