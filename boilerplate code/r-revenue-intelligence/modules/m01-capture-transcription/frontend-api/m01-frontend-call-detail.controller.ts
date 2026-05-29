import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { M01FrontendTranscriptService } from './m01-frontend-transcript.service';

/** M01 call detail: transcript, briefs, next-steps (under /api/calls/:callId). */
@Controller('api/calls/:callId')
@UseGuards(TenantGuard)
export class M01FrontendCallDetailController {
  constructor(private readonly svc: M01FrontendTranscriptService) {}

  @Get('transcript')
  getTranscript(
    @Param('callId') callId: string,
    @Query() query: Record<string, string>,
    @Req() req: Record<string, string>,
  ) {
    return this.svc.getTranscript(callId, req.tenantId, query);
  }

  @Get('transcript/summary')
  getSummary(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.svc.getSummary(callId, req.tenantId);
  }

  @Get('transcript/talk-ratio')
  getTalkRatio(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.svc.getTalkRatio(callId, req.tenantId);
  }

  @Get('transcript/audio')
  getAudio(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.svc.getAudio(callId, req.tenantId);
  }

  @Get('transcript/topics')
  getTopics(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.svc.getTopics(callId, req.tenantId);
  }

  @Get('next-steps')
  getNextSteps(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.svc.getNextSteps(callId, req.tenantId);
  }

  @Patch('next-steps/:stepId')
  patchNextStep(
    @Param('callId') callId: string,
    @Param('stepId') stepId: string,
    @Body() body: unknown,
    @Req() req: Record<string, string>,
  ) {
    return this.svc.patchNextStep(callId, stepId, req.tenantId, body);
  }

  @Get('briefs')
  listBriefs(
    @Param('callId') callId: string,
    @Query() query: Record<string, string>,
    @Req() req: Record<string, string>,
  ) {
    return this.svc.listBriefs(callId, req.tenantId, query);
  }

  @Get('briefs/:briefId')
  getBrief(
    @Param('callId') callId: string,
    @Param('briefId') briefId: string,
    @Req() req: Record<string, string>,
  ) {
    return this.svc.getBrief(callId, briefId, req.tenantId);
  }

  @Post('briefs')
  generateBrief(
    @Param('callId') callId: string,
    @Body() body: unknown,
    @Req() req: Record<string, string>,
  ) {
    return this.svc.generateBrief(callId, req.tenantId, body);
  }

  @Post('briefs/:briefId/share-link')
  shareLink(
    @Param('callId') callId: string,
    @Param('briefId') briefId: string,
  ) {
    return this.svc.shareLink(callId, briefId);
  }

  @Post('briefs/:briefId/share-internal')
  shareInternal(
    @Param('callId') callId: string,
    @Param('briefId') briefId: string,
    @Body() body: unknown,
  ) {
    return this.svc.shareInternal(callId, briefId, body);
  }

  @Get('briefs/:briefId/export/pdf')
  exportPdf(@Param('callId') callId: string, @Param('briefId') briefId: string) {
    return this.svc.exportPdf(callId, briefId);
  }

  @Get('briefs/:briefId/formatted-summary')
  formattedSummary(
    @Param('callId') callId: string,
    @Param('briefId') briefId: string,
    @Req() req: Record<string, string>,
  ) {
    return this.svc.formattedSummary(callId, briefId, req.tenantId);
  }
}

@Controller('api/brief-templates')
@UseGuards(TenantGuard)
export class M01FrontendBriefTemplatesController {
  constructor(private readonly svc: M01FrontendTranscriptService) {}

  @Get()
  list() {
    return this.svc.getBriefTemplates();
  }
}

@Controller('api/brief-periods')
@UseGuards(TenantGuard)
export class M01FrontendBriefPeriodsController {
  constructor(private readonly svc: M01FrontendTranscriptService) {}

  @Get()
  list() {
    return this.svc.getBriefPeriods();
  }
}
