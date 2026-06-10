import { Prisma } from '@rri/database';
import { Injectable } from '@nestjs/common';
import { PrismaService }       from '../database/prisma.service';
import { PiiRedactionService } from '../services/pii-redaction.service';

interface CreateTranscriptData {
  tenantId:        string;
  callId:          string;
  fullText:        string;
  utterances:      UtteranceData[];
  assemblyAiJobId?: string;
}

interface UtteranceData {
  speaker:         string;
  text:            string;
  startMs:         number;
  endMs:           number;
  confidence:      number;
  sequenceIndex:   number;
}

const LOW_CONFIDENCE_THRESHOLD = 0.80;

@Injectable()
export class TranscriptRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pii:    PiiRedactionService,
  ) {}

  // ── CT-03 / CT-04: Store transcript + utterances atomically ──────────
  // US-04: PII redaction runs here — before ANY data is written to the DB.
  // Idempotent: on retry (worker re-runs) we overwrite text + recreate
  // utterances cleanly without orphaning the previous batch.
  async create(data: CreateTranscriptData) {
    const { redactedText: redactedFullText } = this.pii.redact(data.fullText);
    const redactedUtterances = this.pii.redactUtterances(data.utterances);

    const utteranceRows = redactedUtterances.map((u) => ({
      tenantid:        data.tenantId,
      speaker:         u.speaker,
      text:            u.text,
      originalText:    u.originalText,
      startMs:         u.startMs,
      endMs:           u.endMs,
      confidence:      u.confidence,
      isLowConfidence: u.confidence < LOW_CONFIDENCE_THRESHOLD,
      sequenceIndex:   u.sequenceIndex,
    }));

    // callId is @unique on Transcript so we can safely upsert.
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.transcript.findUnique({
        where: { callId: data.callId },
        select: { id: true },
      });

      if (existing) {
        // Wipe old utterances + replace; preserves the transcript ID so
        // downstream extraction results that link by callId stay aligned.
        await tx.utterance.deleteMany({ where: { transcriptId: existing.id } });
        return tx.transcript.update({
          where: { id: existing.id },
          data: {
            fullText:        redactedFullText,
            assemblyAiJobId: data.assemblyAiJobId,
            utterances: { create: utteranceRows },
          },
          include: { utterances: { orderBy: { sequenceIndex: 'asc' } } },
        });
      }

      return tx.transcript.create({
        data: {
          tenantid:        data.tenantId,
          callId:          data.callId,
          fullText:        redactedFullText,
          assemblyAiJobId: data.assemblyAiJobId,
          utterances: { create: utteranceRows },
        },
        include: { utterances: { orderBy: { sequenceIndex: 'asc' } } },
      });
    });
  }

  // ── Patch AI-generated fields (summary, highlights, nextSteps, talkRatio) ──
  // tenantId added to where clause to enforce multi-tenant scoping (Golden Rule #9)
  async patchAiFields(
    callId:   string,
    tenantId: string,
    fields: {
      summary?:       string;
      keyHighlights?: object;
      nextSteps?:     string[];
      talkRatio?:     object;
    },
  ) {
    return this.prisma.transcript.updateMany({
      where: { callId, tenantid: tenantId },
      data:  fields,
    });
  }

  // ── Fetch transcript with ordered utterances ──────────────────────────
  async findByCallId(callId: string, tenantId: string) {
    return this.prisma.transcript.findFirst({
      where: { callId, tenantid: tenantId },
      include: { utterances: { orderBy: { sequenceIndex: 'asc' } } },
    });
  }

  // ── Inline edit: update a single utterance's text ─────────────────────
  async updateUtterance(utteranceId: string, tenantId: string, text: string) {
    // Verify the utterance belongs to this tenant via its transcript
    const utterance = await this.prisma.utterance.findFirst({
      where: { id: utteranceId, transcript: { tenantid: tenantId } },
    });
    if (!utterance) throw new Error(`Utterance ${utteranceId} not found`);

    return this.prisma.utterance.update({
      where: { id: utteranceId },
      data:  { text: text.trim() },
    });
  }
}

