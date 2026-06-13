import {
  BadRequestException,
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
import { NotesRepository } from '../repositories/notes.repository';
import { M01FrontendTranscriptService } from '../services/m01-frontend-transcript.service';
import { M01FrontendCallProcessingService } from '../services/m01-frontend-call-processing.service';
import { M01FrontendCallsService } from '../services/m01-frontend-calls.service';

/** M01 call detail: transcript, briefs, next-steps (under /api/calls/:callId). */
@Controller('api/v1/capture-transcription/calls/:callId')
@UseGuards(TenantGuard)
export class M01FrontendCallDetailController {
  constructor(
    private readonly svc: M01FrontendTranscriptService,
    private readonly processing: M01FrontendCallProcessingService,
    private readonly callsUi: M01FrontendCallsService,
    private readonly notesRepo: NotesRepository,
  ) {}

  @Get('metadata')
  getMetadata(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.callsUi.getCallMetadata(callId, req.tenantId);
  }

  @Get('process-status')
  getProcessStatus(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.processing.getStatus(callId, req.tenantId);
  }

  @Post('process')
  processCall(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.processing.processCall(callId, req.tenantId);
  }

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

  /** Re-run AI pipeline + refresh analyzed brief (UI: Regenerate). */
  @Post('briefs/:briefId/regenerate')
  regenerateBrief(
    @Param('callId') callId: string,
    @Param('briefId') _briefId: string,
    @Req() req: Record<string, string>,
  ) {
    return this.processing.processCall(callId, req.tenantId);
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

  @Get('notes')
  async getNotes(
    @Param('callId') callId: string,
    @Req() req: Record<string, any>,
  ) {
    // Privacy: Only show notes created by the current user (Rep)
    // Managers will not see these personal notes
    const currentUserId = req.user?.sub || req.user?.id || req.userId;
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant context required');
    const notes = await this.notesRepo.findByCallId(callId, tenantId, currentUserId);
    return {
      data: notes.map((n) => ({
        noteId: n.id,
        callId: n.callId,
        note: n.content,
        userId: n.authorId,
        timestamp: n.createdAt.toISOString(),
        createdAt: n.createdAt.toISOString(),
      })),
    };
  }

  @Post('notes')
  async createNote(
    @Param('callId') callId: string,
    @Body() body: { note?: string; content?: string; userId?: string },
    @Req() req: Record<string, any>,
  ) {
    const noteText = body.note || body.content;
    if (!noteText) {
      throw new BadRequestException('Note content is required');
    }
    const authorId = body.userId || req.user?.sub || req.user?.id || req.userId;
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId || !authorId) throw new BadRequestException('Authentication required');
    const created = await this.notesRepo.create(callId, tenantId, authorId, { content: noteText });
    return {
      data: {
        noteId: created.id,
        callId: created.callId,
        note: created.content,
        userId: created.authorId,
        timestamp: created.createdAt.toISOString(),
        createdAt: created.createdAt.toISOString(),
      },
    };
  }
}

@Controller('api/v1/capture-transcription/brief-templates')
@UseGuards(TenantGuard)
export class M01FrontendBriefTemplatesController {
  constructor(private readonly svc: M01FrontendTranscriptService) {}

  @Get()
  list() {
    return this.svc.getBriefTemplates();
  }
}

@Controller('api/v1/capture-transcription/brief-periods')
@UseGuards(TenantGuard)
export class M01FrontendBriefPeriodsController {
  constructor(private readonly svc: M01FrontendTranscriptService) {}

  @Get()
  list() {
    return this.svc.getBriefPeriods();
  }
}
