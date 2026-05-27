import {
  Controller, Get, Post, Put, Patch, Delete,
  Body, Param, Query, Req, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { TenantGuard }   from '../../platform-core/guards/tenant.guard';
import { CallService }   from '../services/call.service';
import { NextStepsRepository } from '../repositories/next-steps.repository';
import {
  CreateCallSchema,
  CreateNoteSchema,
  UpdateNoteSchema,
  ShareCallSchema,
  SearchQuerySchema,
  ListCallsQuerySchema,
  AddNextStepSchema,
  UpdateNextStepSchema,
  DeleteNextStepSchema,
  UpdateUtteranceSchema,
} from '../schemas/m01.schema';

@Controller('api/v1/capture-transcription')
@UseGuards(TenantGuard)
export class CallsController {
  constructor(
    private readonly svc:       CallService,
    private readonly nextSteps: NextStepsRepository,
  ) {}

  // ── GET /calls — sortable list with transcript status ─────────────────
  @Get('calls')
  listCalls(@Query() query: Record<string, string>, @Req() req: Record<string, string>) {
    const parsed = ListCallsQuerySchema.parse(query);
    return this.svc.listCalls(req.tenantId, parsed);
  }

  // ── POST /calls — register call + auto-queue transcription (CT-01/02) ─
  @Post('calls')
  createCall(@Body() body: unknown, @Req() req: Record<string, string>) {
    const dto = CreateCallSchema.parse(body);
    return this.svc.createCall(dto, req.tenantId);
  }

  // ── GET /calls/search?q=keyword — org-wide search (CT-05) ────────────
  // IMPORTANT: this MUST be registered before /calls/:id, otherwise Express
  // matches the literal "search" segment as a value for :id and returns 404.
  @Get('calls/search')
  searchTranscripts(@Query() query: Record<string, string>, @Req() req: Record<string, string>) {
    const parsed = SearchQuerySchema.parse(query);
    return this.svc.searchTranscripts(req.tenantId, parsed);
  }

  // ── GET /calls/:id — full call detail (CT-13 through CT-24) ──────────
  @Get('calls/:id')
  getCall(@Param('id') id: string, @Req() req: Record<string, string>) {
    return this.svc.getCallDetail(id, req.tenantId);
  }

  // ── DELETE /calls/:id — hard delete call + cascade transcripts/notes/shares ──
  @Delete('calls/:id')
  @HttpCode(HttpStatus.OK)
  deleteCall(@Param('id') id: string, @Req() req: Record<string, string>) {
    return this.svc.deleteCall(id, req.tenantId);
  }

  // ── POST /calls/:id/extract-ai — manual re-run of AI extraction (CT-15) ─
  @Post('calls/:id/extract-ai')
  @HttpCode(HttpStatus.ACCEPTED)
  extractAi(@Param('id') id: string, @Req() req: Record<string, string>) {
    return this.svc.triggerAiExtraction(id, req.tenantId);
  }

  // ── GET /calls/:id/search?q=keyword — in-call search (CT-21) ─────────
  @Get('calls/:id/search')
  searchWithinCall(
    @Param('id') id: string,
    @Query() query: Record<string, string>,
    @Req() req: Record<string, string>,
  ) {
    const parsed = SearchQuerySchema.parse(query);
    return this.svc.searchWithinCall(id, req.tenantId, parsed);
  }

  // ── POST /calls/:id/notes — create note (CT-22) ───────────────────────
  @Post('calls/:id/notes')
  createNote(@Param('id') id: string, @Body() body: unknown, @Req() req: Record<string, string>) {
    const dto = CreateNoteSchema.parse(body);
    return this.svc.createNote(id, req.tenantId, req.userId ?? 'anonymous', dto);
  }

  // ── PUT /calls/:id/notes/:noteId — update note (CT-22) ───────────────
  @Put('calls/:id/notes/:noteId')
  updateNote(
    @Param('noteId') noteId: string,
    @Body() body: unknown,
    @Req() req: Record<string, string>,
  ) {
    const dto = UpdateNoteSchema.parse(body);
    return this.svc.updateNote(noteId, req.tenantId, dto);
  }

  // ── DELETE /calls/:id/notes/:noteId — delete note (CT-22) ────────────
  @Delete('calls/:id/notes/:noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNote(@Param('noteId') noteId: string, @Req() req: Record<string, string>) {
    return this.svc.deleteNote(noteId, req.tenantId);
  }

  // ── POST /calls/:id/share — share call with user/team (CT-23) ────────
  @Post('calls/:id/share')
  shareCall(@Param('id') id: string, @Body() body: unknown, @Req() req: Record<string, string>) {
    const dto = ShareCallSchema.parse(body);
    return this.svc.shareCall(id, req.tenantId, req.userId ?? 'anonymous', dto);
  }

  // ── PATCH /utterances/:id — inline transcript edit ─────────────────────
  @Patch('utterances/:id')
  updateUtterance(
    @Param('id') id: string,
    @Body() body: unknown,                              // US-04: typed via Zod
    @Req() req: Record<string, string>,
  ) {
    const dto = UpdateUtteranceSchema.parse(body);      // ✅ Zod validated
    return this.svc.updateUtterance(id, req.tenantId, dto.text);
  }

  // ──────────────────────────────────────────────────────────────────────
  // US-11: Next Steps CRUD
  // ──────────────────────────────────────────────────────────────────────

  // GET /calls/:id/next-steps — list all next steps for a call
  @Get('calls/:id/next-steps')
  getNextSteps(
    @Param('id') callId: string,
    @Req() req: Record<string, string>,
  ) {
    return this.nextSteps.findByCallId(callId, req.tenantId);
  }

  // POST /calls/:id/next-steps — add a single next step
  @Post('calls/:id/next-steps')
  addNextStep(
    @Param('id') callId: string,
    @Body() body: unknown,
    @Req() req: Record<string, string>,
  ) {
    const dto = AddNextStepSchema.parse(body);
    return this.nextSteps.addNextStep(callId, req.tenantId, dto.step);
  }

  // PATCH /calls/:id/next-steps — update a next step by index
  @Patch('calls/:id/next-steps')
  updateNextStep(
    @Param('id') callId: string,
    @Body() body: unknown,
    @Req() req: Record<string, string>,
  ) {
    const dto = UpdateNextStepSchema.parse(body);
    return this.nextSteps.updateNextStep(callId, req.tenantId, dto.index, dto.step);
  }

  // DELETE /calls/:id/next-steps/:index — remove a next step by index
  @Delete('calls/:id/next-steps/:index')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteNextStep(
    @Param('id') callId: string,
    @Param('index') index: string,
    @Req() req: Record<string, string>,
  ) {
    const dto = DeleteNextStepSchema.parse({ index });
    return this.nextSteps.deleteNextStep(callId, req.tenantId, dto.index);
  }
}
