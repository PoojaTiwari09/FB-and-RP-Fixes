import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CallRepository }       from '../repositories/call.repository';
import { TranscriptRepository } from '../repositories/transcript.repository';
import { NotesRepository }      from '../repositories/notes.repository';
import { SearchRepository, ShareRepository, ExtendedSearchQueryDto } from '../repositories/search.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import {
  CreateCallDto,
  CreateNoteDto,
  UpdateNoteDto,
  ShareCallDto,
  SearchQueryDto,
  ListCallsQueryDto,
} from '../schemas/m01.schema';

@Injectable()
export class CallService {
  constructor(
    private readonly calls:       CallRepository,
    private readonly transcripts: TranscriptRepository,
    private readonly notes:       NotesRepository,
    private readonly search:      SearchRepository,
    private readonly shares:      ShareRepository,
    private readonly events:      EventPublisherService,
    @InjectQueue('m01-queue') private readonly queue: Queue,
  ) {}

  // ── CT-01 / CT-02: Register call + enqueue transcription job ─────────
  async createCall(dto: CreateCallDto, tenantId: string) {
    const call = await this.calls.create({ ...dto, tenantId });

    // Auto-queue transcription if audio URL is available (CT-01)
    if (call.audioUrl) {
      await this.queue.add('transcribe', {
        callId:   call.id,
        audioUrl: call.audioUrl,
        tenantId,
      });
      await this.calls.updateStatus(call.id, tenantId, 'processing');
    }

    return call;
  }

  // ── Upload-based call creation: all fields auto-extracted ─────────────
  async createCallFromUpload(
    data: {
      title:            string;
      audioUrl:         string;
      originalFilename: string;
      fileSizeBytes:    number;
      mimeType:         string;
    },
    tenantId: string,
  ) {
    // Create the call record with auto-generated metadata
    const call = await this.calls.create({
      tenantId,
      title:           data.title,
      callDate:        new Date(),
      durationSeconds: 0,               // will be updated after transcription
      callType:        'meeting',        // default; updated after speaker analysis
      callSource:      'manual',         // uploaded manually
      participants:    [],               // extracted from speaker diarization
      callOwner:       'Uploader',       // default for uploaded calls
      audioUrl:        data.audioUrl,
    });

    // Immediately queue transcription job
    await this.queue.add('transcribe', {
      callId:   call.id,
      audioUrl: data.audioUrl,
      tenantId,
    });
    await this.calls.updateStatus(call.id, tenantId, 'processing');

    return call;
  }

  // ── Sortable list (CT sortable list) ─────────────────────────────────
  async listCalls(tenantId: string, query: ListCallsQueryDto) {
    return this.calls.findAll(tenantId, query);
  }

  // ── Full call detail (CT-13) ──────────────────────────────────────────
  async getCallDetail(callId: string, tenantId: string) {
    const call = await this.calls.findById(callId, tenantId);
    if (!call) throw new NotFoundException(`Call ${callId} not found`);
    return call;
  }

  // ── US-22: Extended org-wide search with date/rep/type filters ──────────
  async searchTranscripts(tenantId: string, query: ExtendedSearchQueryDto) {
    return this.search.searchAcrossOrg(tenantId, query);
  }

  // ── CT-21: Search within a specific call ─────────────────────────────
  async searchWithinCall(callId: string, tenantId: string, query: SearchQueryDto) {
    return this.search.searchWithinCall(callId, tenantId, query.q);
  }

  // ── CT-22: Notes ──────────────────────────────────────────────────────
  async createNote(callId: string, tenantId: string, authorId: string, dto: CreateNoteDto) {
    return this.notes.create(callId, tenantId, authorId, dto);
  }

  async updateNote(noteId: string, tenantId: string, dto: UpdateNoteDto) {
    return this.notes.update(noteId, tenantId, dto);
  }

  async deleteNote(noteId: string, tenantId: string) {
    return this.notes.delete(noteId, tenantId);
  }

  // ── CT-23: Share call ─────────────────────────────────────────────────
  async shareCall(callId: string, tenantId: string, userId: string, dto: ShareCallDto) {
    return this.shares.share(callId, tenantId, userId, dto);
  }

  // ── Inline transcript edit: update one utterance's text ──────────────
  async updateUtterance(utteranceId: string, tenantId: string, text: string) {
    return this.transcripts.updateUtterance(utteranceId, tenantId, text);
  }

  // ── Internal: called by worker after transcription completes ─────────
  async onTranscriptionCompleted(
    callId: string,
    tenantId: string,
    transcriptData: {
      fullText:    string;
      utterances:  Array<{
        speaker: string; text: string;
        startMs: number; endMs: number;
        confidence: number; sequenceIndex: number;
      }>;
      assemblyAiJobId?: string;
    },
  ) {
    await this.transcripts.create({ tenantId, callId, ...transcriptData });
    await this.calls.updateStatus(callId, tenantId, 'completed');
    // CT-10: emit event for downstream consumers (M3 AI Summaries etc.)
    await this.events.publish('transcription.completed', { tenantId, callId });
  }

  // ── Internal: called by worker on failure ─────────────────────────────
  async onTranscriptionFailed(callId: string, tenantId: string, reason: string) {
    await this.calls.updateStatus(callId, tenantId, 'failed', reason);
  }

  // ── Internal: called when transcription is intentionally skipped ──────
  // US-09 / US-31: skipped is distinct from failed — it means a deliberate
  // no-op (e.g. call too short, transcription disabled for this user/org).
  // skipReason examples:
  //   'below_minimum_duration' | 'transcription_disabled' |
  //   'unsupported_call_type'  | 'unsupported_call_source'
  async markSkipped(callId: string, tenantId: string, skipReason: string) {
    await this.calls.updateSkipped(callId, tenantId, skipReason);
  }
}
