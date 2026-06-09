import type { DiarizedLine, TranscriptSpeaker } from '@smart-call/types/smart-call.types';

const REP_CUES =
  /\b(our (platform|product|solution|team)|let me|i can|we offer|would you like|happy to|demo|pricing starts|follow up|send (you|over))\b/i;
const CUSTOMER_CUES =
  /\b(we need|our budget|our (company|team)|can you|how much|too expensive|not sure|concerned|timeline|decision|procurement|competitor)\b/i;

export function formatLiveTime(ts: number, callStartMs: number): string {
  const sec = Math.max(0, Math.floor((ts - callStartMs) / 1000));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function inferSpeaker(
  text: string,
  lastSpeaker: TranscriptSpeaker,
): TranscriptSpeaker {
  const t = text.trim();
  if (!t) return lastSpeaker;
  if (CUSTOMER_CUES.test(t)) return 'CUSTOMER';
  if (REP_CUES.test(t)) return 'REP';
  return lastSpeaker === 'REP' ? 'CUSTOMER' : 'REP';
}

export function buildDiarizedLine(
  segment: { id: string; ts: number; text: string },
  speaker: TranscriptSpeaker,
  repName: string,
  clientName: string,
  callStartMs: number,
): DiarizedLine {
  return {
    id: segment.id,
    ts: segment.ts,
    timeLabel: formatLiveTime(segment.ts, callStartMs),
    speaker,
    speakerName: speaker === 'REP' ? repName : clientName,
    text: segment.text.trim(),
  };
}

/** Merge consecutive lines from the same speaker for cleaner transcript UI. */
export function mergeDiarizedLines(lines: DiarizedLine[]): DiarizedLine[] {
  const out: DiarizedLine[] = [];
  for (const line of lines) {
    const prev = out[out.length - 1];
    if (prev && prev.speaker === line.speaker) {
      prev.text = `${prev.text} ${line.text}`.trim();
      prev.ts = line.ts;
      prev.timeLabel = line.timeLabel;
    } else {
      out.push({ ...line });
    }
  }
  return out;
}

export function speakerNamesFromInsights(
  insights: Record<string, unknown> | null,
  fallbackRep: string,
  fallbackClient: string,
): { repName: string; clientName: string } {
  const spk = insights?.speakerIdentification as
    | { salesRepName?: string; clientName?: string }
    | undefined;
  return {
    repName: spk?.salesRepName?.trim() || fallbackRep,
    clientName: spk?.clientName?.trim() || fallbackClient,
  };
}
