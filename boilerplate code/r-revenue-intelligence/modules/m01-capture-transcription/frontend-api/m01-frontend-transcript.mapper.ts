import { formatDuration } from './m01-frontend.mapper';

function formatTimestampMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function mapSpeakerType(speaker: string): 'rep' | 'customer' {
  const s = speaker.toLowerCase();
  if (s.includes('rep') || s.includes('agent') || s === 'a') return 'rep';
  return 'customer';
}

export function mapUtterance(u: any) {
  const confidence = u.isLowConfidence || (u.confidence ?? 1) < 0.8 ? 'low' : 'high';
  return {
    entryId: u.id,
    timestamp: formatTimestampMs(u.startMs ?? 0),
    speakerName: u.speaker,
    speakerType: mapSpeakerType(u.speaker),
    text: u.text,
    confidence,
  };
}

export function mapTalkRatio(talkRatio: any) {
  const repPct = Math.round((talkRatio?.rep?.percentage ?? 0.5) * 100);
  const custPct = 100 - repPct;
  return {
    rep: { percentage: repPct },
    customer: { percentage: custPct },
  };
}

export function mapTopicsFromHighlights(highlights: any[] | null | undefined) {
  if (!Array.isArray(highlights)) return [];
  const colors = ['blue', 'orange', 'green', 'purple', 'red'];
  return highlights.map((h: any, i: number) => ({
    topicId: `topic_${i + 1}`,
    label: h.label || h.topic || 'Highlight',
    timestamp: h.timestampMs != null ? formatTimestampMs(h.timestampMs) : '00:00',
    description: h.text || h.description || '',
    color: colors[i % colors.length],
  }));
}

export function mapAudio(call: any) {
  return {
    audioUrl: call.audioUrl || '',
    duration: formatDuration(call.durationSeconds ?? 0),
    format: 'mp3',
  };
}
