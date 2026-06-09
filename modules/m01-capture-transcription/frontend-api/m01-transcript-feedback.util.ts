import { buildReviewFromTranscript } from './m01-transcript-review.util';

type Highlight = { label?: string; text?: string };

export type GeneratedFeedback = {
  tags: string[];
  strengths: string[];
  improvementAreas: string[];
  coachingNotes: string;
  recommendedActions: string[];
  acknowledgement: {
    isAcknowledged: boolean;
    acknowledgedAt: string | null;
    repResponse: string | null;
  };
  actionItems: Array<{
    id: string;
    title: string;
    description: string;
    dueDate: string;
    assignedBy: string;
    status: string;
    notes: string;
  }>;
};

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function uniqueNonEmpty(items: string[], limit: number): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const item = raw.trim();
    if (!item || seen.has(item.toLowerCase())) continue;
    seen.add(item.toLowerCase());
    out.push(item);
    if (out.length >= limit) break;
  }
  return out;
}

function addDaysIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function actionTitle(step: string): string {
  const cleaned = step.replace(/^[-•]\s*/, '').trim();
  const firstSentence = cleaned.split(/[.;]/)[0]?.trim() || cleaned;
  return truncate(firstSentence, 72);
}

/** Build coaching feedback from transcript + derived scorecard review. */
export function buildFeedbackFromTranscript(record: {
  id?: string;
  callOwner?: string;
  transcript?: {
    summary?: string;
    keyHighlights?: Highlight[];
    nextSteps?: string[];
  } | null;
  transcriptStatus?: string;
}): GeneratedFeedback | null {
  const review = buildReviewFromTranscript(record);
  const transcript = record.transcript;
  if (!review || !transcript) return null;

  const highlights = transcript.keyHighlights ?? [];
  const nextSteps = transcript.nextSteps ?? [];

  const strengths: string[] = [];
  for (const section of review.sections) {
    for (const q of section.questions) {
      if (q.score >= 4 && q.managerComments) {
        strengths.push(`${section.sectionName}: ${truncate(q.managerComments, 110)}`);
      }
    }
  }
  for (const h of highlights) {
    const label = String(h.label ?? '').toLowerCase();
    if (['next_step', 'product', 'roi', 'security', 'timeline'].some((k) => label.includes(k))) {
      if (h.text) strengths.push(h.text);
    }
  }

  const improvementAreas: string[] = [];
  for (const section of review.sections) {
    for (const q of section.questions) {
      if (q.aiSuggestion) {
        improvementAreas.push(q.aiSuggestion);
      } else if (q.score <= 3 && q.managerComments) {
        improvementAreas.push(`${q.questionText} — ${truncate(q.managerComments, 90)}`);
      }
    }
  }

  const tags: string[] = [];
  if (review.overallScore >= 85) tags.push('Best Practice');
  if (review.overallScore < 82) tags.push('Needs Coaching');
  if (highlights.some((h) => /objection/i.test(String(h.label ?? '')))) tags.push('Objection Handling');
  if (highlights.some((h) => /pricing|budget|cost/i.test(String(h.label ?? '')))) tags.push('Pricing');
  if (highlights.some((h) => /pain|discovery|product/i.test(String(h.label ?? '')))) tags.push('Discovery');
  if (tags.length === 0) tags.push('Discovery');

  const summary = transcript.summary?.trim() || 'Call transcript analyzed for coaching feedback.';
  const coachingNotes = `${summary} Scorecard overall: ${review.overallScore}/100. ${
    improvementAreas.length > 0
      ? 'Priority focus: ' + improvementAreas.slice(0, 2).join(' ')
      : 'Maintain current discovery and closing habits on upcoming calls.'
  }`;

  const recommendedActions = uniqueNonEmpty(
    [...nextSteps, ...improvementAreas.map((s) => s.replace(/^Ask about /i, 'Practice '))],
    5,
  );

  const callId = String(record.id ?? 'call');
  const actionItems = nextSteps.map((step, index) => ({
    id: `action-${callId}-${index + 1}`,
    title: actionTitle(step),
    description: step,
    dueDate: addDaysIso(index + 1),
    assignedBy: 'AI Call Reviewer',
    status: 'Not Started',
    notes: '',
  }));

  return {
    tags: uniqueNonEmpty(tags, 4),
    strengths: uniqueNonEmpty(strengths, 5),
    improvementAreas: uniqueNonEmpty(improvementAreas, 5),
    coachingNotes,
    recommendedActions,
    acknowledgement: {
      isAcknowledged: false,
      acknowledgedAt: null,
      repResponse: null,
    },
    actionItems,
  };
}
