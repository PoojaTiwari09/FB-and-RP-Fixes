import type {
  HighlightsResult,
  SummarizeResult,
  TalkRatioResult,
  UtterancePayload,
} from './ai-extraction.client';

/** Local fallbacks when Python ai-services is not running (demo / dev). */

export function computeTalkRatioLocal(utterances: UtterancePayload[]): TalkRatioResult {
  const speakerMs = new Map<string, number>();

  for (const u of utterances) {
    const duration = Math.max(0, u.end_ms - u.start_ms);
    speakerMs.set(u.speaker, (speakerMs.get(u.speaker) ?? 0) + duration);
  }

  const totalMs = [...speakerMs.values()].reduce((a, b) => a + b, 0) || 1;

  const speakers = [...speakerMs.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([speaker, duration_ms]) => ({
      speaker,
      duration_ms,
      percentage: Math.round((duration_ms / totalMs) * 10000) / 10000,
    }));

  return { speakers, total_duration_ms: totalMs };
}

export function summarizeLocal(fullText: string): SummarizeResult {
  const trimmed = fullText.trim();
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);

  const summary =
    sentences.slice(0, 4).join(' ') ||
    (trimmed.length > 400 ? `${trimmed.slice(0, 397)}...` : trimmed) ||
    'No transcript text available for summary.';

  const nextSteps = sentences
    .filter((s) =>
      /\b(follow up|next step|action item|we will|i will|schedule|send over|circle back)\b/i.test(s),
    )
    .slice(0, 5)
    .map((s) => s.replace(/\s+/g, ' ').trim());

  return {
    summary,
    next_steps: nextSteps.length ? nextSteps : ['Review transcript and confirm follow-ups.'],
    confidence_score: 0.75,
    flagged_for_review: false,
  };
}

const HIGHLIGHT_PATTERNS: { label: string; re: RegExp }[] = [
  { label: 'pricing', re: /\b(price|pricing|budget|cost|fee|discount)\b/i },
  { label: 'objection', re: /\b(concern|worried|hesitant|not sure|pushback|objection)\b/i },
  { label: 'competitor', re: /\b(competitor|alternative|vendor|other tool)\b/i },
  { label: 'risk', re: /\b(risk|delay|blocker|legal|security|compliance)\b/i },
  { label: 'timeline', re: /\b(timeline|deadline|quarter|go-live|implementation)\b/i },
];

export function extractHighlightsLocal(utterances: UtterancePayload[]): HighlightsResult {
  const highlights: HighlightsResult['highlights'] = [];

  for (const u of utterances) {
    for (const { label, re } of HIGHLIGHT_PATTERNS) {
      if (re.test(u.text)) {
        highlights.push({
          label,
          text: u.text.trim(),
          timestamp_ms: u.start_ms,
          speaker: u.speaker,
        });
        break;
      }
    }
    if (highlights.length >= 8) break;
  }

  if (!highlights.length && utterances.length) {
    const longest = [...utterances].sort((a, b) => b.text.length - a.text.length)[0];
    highlights.push({
      label: 'general',
      text: longest.text.trim(),
      timestamp_ms: longest.start_ms,
      speaker: longest.speaker,
    });
  }

  return {
    highlights,
    confidence_score: 0.75,
    flagged_for_review: false,
  };
}
