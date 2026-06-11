import { Prisma } from '@rri/database';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { CallRepository }       from '../repositories/call.repository';
import { TranscriptRepository } from '../repositories/transcript.repository';
import { NotesRepository }      from '../repositories/notes.repository';
import { SearchRepository, ShareRepository, ExtendedSearchQueryDto } from '../repositories/search.repository';
import { EventPublisherService } from '../../platform-core/events/event-publisher.service';
import { M02IngestClient } from './m02-ingest.client';
import {
  CreateCallDto,
  CreateNoteDto,
  UpdateNoteDto,
  ShareCallDto,
  SearchQueryDto,
  ListCallsQueryDto,
  UploadFromS3Dto,
} from '../schemas/m01.schema';
import { getS3RecordingById } from './s3-recordings-catalog';
import { downloadRemoteAudioToLocal } from './fetch-remote-audio';
import { getPublicAudioUrl } from './upload-paths';
import { resolvePublicTranscriptionUrl } from './public-audio-url';
import {
  durationSecondsFromUtterances,
  uniqueSpeakersFromUtterances,
} from './call-duration.util';

@Injectable()
export class CallService {
  constructor(
    private readonly calls:       CallRepository,
    private readonly transcripts: TranscriptRepository,
    private readonly notes:       NotesRepository,
    private readonly search:      SearchRepository,
    private readonly shares:      ShareRepository,
    private readonly events:      EventPublisherService,
    private readonly m02Ingest:   M02IngestClient,
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

  /** Download from curated S3 URL → local disk → same transcribe queue as file upload. */
  async createCallFromS3Recording(dto: UploadFromS3Dto, tenantId: string) {
    const entry = getS3RecordingById(dto.recordingId);
    if (!entry) {
      throw new BadRequestException(`Unknown S3 recording: ${dto.recordingId}`);
    }

    const { filename, fileSizeBytes, mimeType } = await downloadRemoteAudioToLocal(
      entry.sourceUrl,
      entry.displayName,
    );

    const rawName = entry.displayName.replace(/\.[^.]+$/, '');
    const title = rawName
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c: string) => c.toUpperCase())
      .trim() || 'S3 Recording';

    return this.createCallFromUpload(
      {
        title,
        audioUrl: getPublicAudioUrl(filename),
        originalFilename: entry.displayName,
        fileSizeBytes,
        mimeType,
      },
      tenantId,
    );
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

  /** Queue AssemblyAI transcription for an existing call (Calls List open). */
  async enqueueTranscription(callId: string, tenantId: string) {
    const call = await this.calls.findById(callId, tenantId);
    if (!call) throw new NotFoundException(`Call ${callId} not found`);
    if (!call.audioUrl) {
      throw new BadRequestException('Call has no recording to transcribe');
    }
    const audioUrl = resolvePublicTranscriptionUrl(call.audioUrl, callId);
    await this.queue.add('transcribe', { callId, audioUrl, tenantId });
    await this.calls.updateStatus(callId, tenantId, 'processing');
    return { callId, transcriptStatus: 'processing' as const };
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
  async listNotes(callId: string, tenantId: string, authorId?: string) {
    const rows = await this.notes.findByCallId(callId, tenantId, authorId);
    return rows.map((n) => ({
      noteId: n.id,
      callId: n.callId,
      note: n.content,
      userId: n.authorId,
      timestamp: n.createdAt.toISOString(),
      createdAt: n.createdAt.toISOString(),
    }));
  }

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
  /** Persist duration + speakers from transcript (list/detail stay in sync with recording). */
  async syncCallMetadataFromTranscript(callId: string, tenantId: string) {
    const record = await this.getCallDetail(callId, tenantId);
    if (!record) return;
    const utterances = record.transcript?.utterances ?? [];
    const durationSeconds = durationSecondsFromUtterances(utterances);
    if (durationSeconds > 0) {
      await this.calls.updateDurationSeconds(callId, tenantId, durationSeconds);
    }
    const speakers = uniqueSpeakersFromUtterances(utterances);
    if (speakers.length > 0) {
      await this.calls.updateParticipants(callId, tenantId, speakers);
    }
  }

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
      audioDurationSec?: number;
    },
  ) {
    const tx = await this.transcripts.create({ tenantId, callId, ...transcriptData });
    const durationSeconds =
      transcriptData.audioDurationSec && transcriptData.audioDurationSec > 0
        ? transcriptData.audioDurationSec
        : durationSecondsFromUtterances(transcriptData.utterances);
    if (durationSeconds > 0) {
      await this.calls.updateDurationSeconds(callId, tenantId, durationSeconds);
    }
    const speakers = uniqueSpeakersFromUtterances(transcriptData.utterances);
    if (speakers.length > 0) {
      await this.calls.updateParticipants(callId, tenantId, speakers);
    }
    await this.calls.updateStatus(callId, tenantId, 'completed');

    // CT-10: emit BOTH the canonical platform name (`call.transcription.completed`,
    // consumed by M02/M03/M08/M10 per their TDDs) and the legacy short name
    // (`transcription.completed`) for backward compatibility with the in-process
    // AiExtractionSubscriber. Once all consumers move to the canonical name we
    // can drop the legacy emission.
    const envelope = {
      tenantId,
      callId,
      transcriptId: tx?.id,
      sourceType: 'call',
      sourcePlatform: 'm01-capture-transcription',
      sourceRecordId: callId,
      occurredAt: new Date().toISOString(),
      participants: [],
      crmHints: {},
      artifacts: { transcriptId: tx?.id, assemblyAiJobId: transcriptData.assemblyAiJobId },
    };
    await this.events.publish('call.transcription.completed', envelope);
    await this.events.publish('transcription.completed',     envelope);

    await this.m02Ingest.notifyTranscriptionCompleted({
      tenantId,
      callId,
      transcriptId: tx?.id,
      sourcePlatform: 'm01-capture-transcription',
      occurredAt: envelope.occurredAt,
    });
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

  // ── Hard delete (cascade): removes call + transcripts/utterances/notes/shares ──
  async deleteCall(callId: string, tenantId: string) {
    const exists = await this.calls.findById(callId, tenantId);
    if (!exists) throw new NotFoundException(`Call ${callId} not found`);
    const res = await this.calls.deleteById(callId, tenantId);
    return { success: res.count > 0 };
  }

  // ── Manual AI extraction trigger ───────────────────────────────────────
  // Re-fires `transcription.completed` so the AiExtractionSubscriber re-runs
  // the summary / highlights / talk-ratio pipeline. Used by the frontend
  // "Re-run AI" button (CT-15) and as an admin recovery path when the
  // upstream LLM service was temporarily unavailable.
  async triggerAiExtraction(callId: string, tenantId: string) {
    const call = await this.calls.findById(callId, tenantId);
    if (!call) throw new NotFoundException(`Call ${callId} not found`);

    const transcript = await this.transcripts.findByCallId(callId, tenantId);
    if (!transcript) {
      throw new BadRequestException(
        `Call ${callId} has no transcript yet — wait for transcription to complete`,
      );
    }

    const envelope = {
      tenantId,
      callId,
      transcriptId: transcript.id,
      sourceType: 'call',
      sourcePlatform: 'm01-capture-transcription',
      sourceRecordId: callId,
      occurredAt: new Date().toISOString(),
      participants: [],
      crmHints: {},
      artifacts: { transcriptId: transcript.id, manualReplay: true },
    };
    await this.events.publish('call.transcription.completed', envelope);
    await this.events.publish('transcription.completed',     envelope);

    await this.m02Ingest.notifyTranscriptionCompleted({
      tenantId,
      callId,
      transcriptId: transcript.id,
      sourcePlatform: 'm01-capture-transcription',
      occurredAt: envelope.occurredAt,
    });

    return {
      accepted: true,
      callId,
      transcriptId: transcript.id,
      message: 'AI extraction pipeline triggered',
    };
  }

  // ── Internal: called by worker on failure ─────────────────────────────
  async publishTranscriptionFailed(callId: string, tenantId: string, reason: string) {
    await this.events.publish('call.transcription.failed', {
      tenantId, callId, reason, occurredAt: new Date().toISOString(),
    });
  }
}
