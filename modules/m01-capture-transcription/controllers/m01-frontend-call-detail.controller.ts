import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TenantGuard } from '../../platform-core/guards/tenant.guard';
import { NotesRepository } from '../repositories/notes.repository';
import { NextStepsRepository } from '../repositories/next-steps.repository';
import { M01FrontendTranscriptService } from '../services/m01-frontend-transcript.service';
import { M01FrontendCallProcessingService } from '../services/m01-frontend-call-processing.service';
import { M01FrontendCallsService } from '../services/m01-frontend-calls.service';
import { CallService } from '../services/call.service';
import {
  CreateNoteSchema,
  UpdateNoteSchema,
  ShareCallSchema,
  AddNextStepSchema,
  UpdateNextStepSchema,
  DeleteNextStepSchema,
  UpdateUtteranceSchema,
} from '../schemas/m01.schema';

/** M01 call detail: transcript, briefs, next-steps (under /api/calls/:callId). */
@Controller('api/v1/capture-transcription/calls/:callId')
@UseGuards(TenantGuard)
export class M01FrontendCallDetailController {
  constructor(
    private readonly svc: M01FrontendTranscriptService,
    private readonly processing: M01FrontendCallProcessingService,
    private readonly callsUi: M01FrontendCallsService,
    private readonly notesRepo: NotesRepository,
    private readonly nextSteps: NextStepsRepository,
    private readonly callService: CallService,
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

  // ── Next Steps CRUD ─────────────────────────────────────────────────

  @Get('next-steps')
  getNextSteps(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.nextSteps.findByCallId(callId, req.tenantId);
  }

  @Post('next-steps')
  addNextStep(
    @Param('callId') callId: string,
    @Body() body: unknown,
    @Req() req: Record<string, string>,
  ) {
    const dto = AddNextStepSchema.parse(body);
    return this.nextSteps.addNextStep(callId, req.tenantId, dto.step);
  }

  @Patch('next-steps')
  updateNextStep(
    @Param('callId') callId: string,
    @Body() body: unknown,
    @Req() req: Record<string, string>,
  ) {
    const dto = UpdateNextStepSchema.parse(body);
    return this.nextSteps.updateNextStep(callId, req.tenantId, dto.index, dto.step);
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

  @Delete('next-steps/:index')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNextStep(
    @Param('callId') callId: string,
    @Param('index') index: string,
    @Req() req: Record<string, string>,
  ) {
    const dto = DeleteNextStepSchema.parse({ index });
    return this.nextSteps.deleteNextStep(callId, req.tenantId, dto.index);
  }

  // ── Briefs ──────────────────────────────────────────────────────────

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

  // ── Brief Sections ──────────────────────────────────────────────────

  @Get('briefs/:briefId/discussion-points')
  async getDiscussionPoints(
    @Param('callId') callId: string,
    @Param('briefId') briefId: string,
    @Req() req: Record<string, string>,
  ) {
    const brief = await this.svc.getBrief(callId, briefId, req.tenantId);
    return { discussionPoints: brief.keyDiscussionPoints || [] };
  }

  @Get('briefs/:briefId/customer-needs')
  async getCustomerNeeds(
    @Param('callId') callId: string,
    @Param('briefId') briefId: string,
    @Req() req: Record<string, string>,
  ) {
    const brief = await this.svc.getBrief(callId, briefId, req.tenantId);
    return { customerNeeds: brief.customerNeeds || [] };
  }

  @Get('briefs/:briefId/risks')
  async getRisks(
    @Param('callId') callId: string,
    @Param('briefId') briefId: string,
    @Req() req: Record<string, string>,
  ) {
    const brief = await this.svc.getBrief(callId, briefId, req.tenantId);
    return { risks: brief.risks || [] };
  }

  @Get('briefs/:briefId/commitments')
  async getCommitments(
    @Param('callId') callId: string,
    @Param('briefId') briefId: string,
    @Req() req: Record<string, string>,
  ) {
    const brief = await this.svc.getBrief(callId, briefId, req.tenantId);
    return { commitments: brief.commitments || [] };
  }

  @Get('briefs/:briefId/stakeholders')
  async getStakeholders(
    @Param('callId') callId: string,
    @Param('briefId') briefId: string,
    @Req() req: Record<string, string>,
  ) {
    const brief = await this.svc.getBrief(callId, briefId, req.tenantId);
    return { stakeholders: brief.stakeholders || [] };
  }

  @Get('briefs/:briefId/activity-context')
  async getActivityContext(
    @Param('callId') callId: string,
    @Param('briefId') briefId: string,
    @Req() req: Record<string, string>,
  ) {
    const brief = await this.svc.getBrief(callId, briefId, req.tenantId);
    return { activities: brief.activityContext || [] };
  }
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

  // ── Notes CRUD ──────────────────────────────────────────────────────

  @Get('notes')
  async getNotes(
    @Param('callId') callId: string,
    @Req() req: Record<string, any>,
  ) {
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
    const authorId = body.userId || req.user?.sub || req.user?.id || req.userId || 'anonymous';
    const tenantId = req.tenantId || req.user?.tenantId;
    if (!tenantId) throw new BadRequestException('Tenant context required');
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

  @Put('notes/:noteId')
  async updateNote(
    @Param('noteId') noteId: string,
    @Body() body: unknown,
    @Req() req: Record<string, string>,
  ) {
    const dto = UpdateNoteSchema.parse(body);
    const updated = await this.notesRepo.update(noteId, req.tenantId, dto);
    return {
      data: {
        noteId: updated.id,
        callId: updated.callId,
        note: updated.content,
        userId: updated.authorId,
        timestamp: updated.createdAt.toISOString(),
        createdAt: updated.createdAt.toISOString(),
      },
    };
  }

  @Delete('notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteNote(
    @Param('noteId') noteId: string,
    @Req() req: Record<string, string>,
  ) {
    await this.notesRepo.delete(noteId, req.tenantId);
  }

  // ── Share Call ──────────────────────────────────────────────────────

  @Post('share')
  shareCall(
    @Param('callId') callId: string,
    @Body() body: unknown,
    @Req() req: Record<string, any>,
  ) {
    const dto = ShareCallSchema.parse(body);
    const userId = req.user?.sub || req.user?.id || req.userId || 'anonymous';
    return this.callService.shareCall(callId, req.tenantId, userId, dto);
  }

  // ── AI Extraction (CT-15) ──────────────────────────────────────────

  @Post('extract-ai')
  @HttpCode(HttpStatus.ACCEPTED)
  extractAi(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.callService.triggerAiExtraction(callId, req.tenantId);
  }

  // ── Delete Call ────────────────────────────────────────────────────

  @Delete()
  @HttpCode(HttpStatus.OK)
  deleteCall(@Param('callId') callId: string, @Req() req: Record<string, string>) {
    return this.callService.deleteCall(callId, req.tenantId);
  }

  // ── Search within Call ─────────────────────────────────────────────

  @Get('search')
  searchWithinCall(
    @Param('callId') callId: string,
    @Query() query: Record<string, string>,
    @Req() req: Record<string, string>,
  ) {
    return this.callService.searchWithinCall(callId, req.tenantId, { q: query.q || '' });
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
