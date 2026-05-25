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
  async create(data: CreateTranscriptData) {
    // 1. Redact PII from the full transcript text
    const { redactedText: redactedFullText } = this.pii.redact(data.fullText);

    // 2. Redact PII from every individual utterance
    const redactedUtterances = this.pii.redactUtterances(data.utterances);

    return this.prisma.transcript.create({
      data: {
        tenantId:        data.tenantId,
        callId:          data.callId,
        fullText:        redactedFullText,      // ✅ safe — no raw PII
        assemblyAiJobId: data.assemblyAiJobId,
        utterances: {
          create: redactedUtterances.map((u) => ({
            tenantId:        data.tenantId,     // US-32: RLS tenantId on each row
            speaker:         u.speaker,
            text:            u.text,            // ✅ redacted text stored
            originalText:    u.originalText,    // audit-only field
            startMs:         u.startMs,
            endMs:           u.endMs,
            confidence:      u.confidence,
            isLowConfidence: u.confidence < LOW_CONFIDENCE_THRESHOLD,
            sequenceIndex:   u.sequenceIndex,
          })),
        },
      },
      include: { utterances: { orderBy: { sequenceIndex: 'asc' } } },
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
      where: { callId, tenantId },
      data:  fields,
    });
  }

  // ── Fetch transcript with ordered utterances ──────────────────────────
  async findByCallId(callId: string, tenantId: string) {
    return this.prisma.transcript.findFirst({
      where: { callId, tenantId },
      include: { utterances: { orderBy: { sequenceIndex: 'asc' } } },
    });
  }

  // ── Inline edit: update a single utterance's text ─────────────────────
  async updateUtterance(utteranceId: string, tenantId: string, text: string) {
    // Verify the utterance belongs to this tenant via its transcript
    const utterance = await this.prisma.utterance.findFirst({
      where: { id: utteranceId, transcript: { tenantId } },
    });
    if (!utterance) throw new Error(`Utterance ${utteranceId} not found`);

    return this.prisma.utterance.update({
      where: { id: utteranceId },
      data:  { text: text.trim() },
    });
  }
}

