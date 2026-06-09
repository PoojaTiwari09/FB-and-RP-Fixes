import type { AssemblyInsights } from '@calls/services/assemblyai.service';
import type { TranscriptEntry, AIInsights } from '@calls/data/mockData';

const SPEAKER_LABELS: Record<string, string> = { A: 'Me', B: 'Customer' };

function formatMs(ms: number): string {
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function assemblyInsightsToTranscriptEntries(insights: AssemblyInsights): TranscriptEntry[] {
  if (insights.utterances.length > 0) {
    return insights.utterances.map((u) => ({
      speaker: SPEAKER_LABELS[u.speaker] ?? `Speaker ${u.speaker}`,
      role: u.speaker === 'A' || u.speaker.toLowerCase().includes('rep') ? 'Rep' : 'Customer',
      timestamp: formatMs(u.start),
      text: u.text,
    }));
  }

  if (!insights.fullText.trim()) return [];

  return insights.fullText
    .split(/(?<=[.!?])\s+/)
    .map((text) => text.trim())
    .filter((text) => text.length > 10)
    .map((text, i) => ({
      speaker: i % 2 === 0 ? 'Me' : 'Customer',
      role: i % 2 === 0 ? 'Rep' : 'Customer',
      timestamp: formatMs(i * 15000),
      text,
    }));
}

export function assemblyInsightsToAiInsights(insights: AssemblyInsights): AIInsights {
  const sentiment = insights.sentiment.toLowerCase().includes('positive')
    ? 'Positive'
    : insights.sentiment.toLowerCase().includes('negative') ||
        insights.sentiment.toLowerCase().includes('mixed')
      ? 'Mixed'
      : 'Neutral';

  return {
    summary: insights.summary,
    keyHighlights: insights.highlights,
    talkRatio: insights.talkRatio,
    sentiment,
    topicsDiscussed: insights.topics,
    objectionsDetected: insights.highlights.filter((h) => /objection|concern|pushback/i.test(h)),
    competitorMentions: insights.highlights.filter((h) => /competitor|vendor|alternative/i.test(h)),
    pricingDiscussion: insights.highlights.filter((h) => /pric|budget|cost/i.test(h)),
    nextSteps: insights.actionItems.slice(0, 3),
    actionItems: insights.actionItems,
  };
}
