// src/services/trainingResults.service.ts
import { TRAINING_RESULTS_MOCK } from '@training/mocks/trainingResults.mock';
import {
  TrainingResultsPage,
  PerformanceTier,
  TranscriptMessageQuality,
  PerformanceBreakdownItem,
} from '@training/types/trainingResults.types';
import { ENV } from '@shared/config/env';
import { evaluateSession } from '@training/services/ai/groq.service';
import type { TranscriptMessage } from '@training/types/trainingSession.types';
import type { PlaybookSection } from '@shared/types/shared.types';
import type { SessionContext } from '@training/types/trainingSession.types';

function mapQuality(raw: unknown): TranscriptMessageQuality {
  if (raw === 'good' || raw === 'good-example') return 'good-example';
  if (raw === 'could-improve' || raw === 'missed-opportunity') return 'missed-opportunity';
  return null;
}

function mapPerformanceTier(raw: unknown): PerformanceTier {
  const label = String(raw ?? '').toLowerCase();
  if (label.includes('excellent')) return 'excellent';
  if (label.includes('good')) return 'good';
  return 'needs-improvement';
}

function mapBadgeType(raw: unknown): 'positive' | 'warning' {
  if (raw === 'positive') return 'positive';
  return 'warning';
}

function adaptTrainingResults(raw: Record<string, unknown>, trainingId: string): TrainingResultsPage {
  const overallRating = raw['overallRating'] ?? raw['overall_rating'] ?? null;
  const performanceTier = overallRating
    ? mapPerformanceTier(overallRating)
    : ((raw['performanceTier'] ?? raw['performance_tier'] ?? 'good') as PerformanceTier);
  const tierLabel = overallRating
    ? String(overallRating)
    : String(raw['tierLabel'] ?? raw['tier_label'] ?? '');

  const summaryText = String(
    raw['overallDescription'] ?? raw['overall_description'] ?? raw['summaryText'] ?? raw['summary_text'] ?? ''
  );

  const tagsRaw = (
    raw['highlightBadges'] ?? raw['highlight_badges'] ?? raw['performanceTags'] ?? raw['performance_tags'] ?? []
  ) as Record<string, unknown>[];

  const sectionsRaw = (
    raw['coachingPlaybook'] ?? raw['coaching_playbook'] ?? raw['scoredSections'] ?? raw['scored_sections'] ?? []
  ) as Record<string, unknown>[];

  const breakdownRaw = (
    raw['performanceBreakdown'] ?? raw['performance_breakdown'] ?? []
  ) as Record<string, unknown>[];

  const transcriptRaw = (raw['transcript'] ?? []) as Record<string, unknown>[];

  return {
    trainingId,
    trainingTitle: String(raw['trainingTitle'] ?? raw['training_title'] ?? ''),
    overallScore: Number(raw['overallScore'] ?? raw['overall_score'] ?? 0),
    maxScore: Number(raw['maxScore'] ?? raw['max_score'] ?? 100),
    performanceTier,
    tierLabel,
    summaryText,
    performanceTags: tagsRaw.map((t, i) => ({
      id: String(t['id'] ?? `tag-${i}`),
      label: String(t['label'] ?? ''),
      type: mapBadgeType(t['type']),
    })),
    scoredSections: sectionsRaw.map((s) => ({
      id: String(s['id'] ?? ''),
      title: String(s['categoryName'] ?? s['title'] ?? ''),
      score: Number(s['score'] ?? 0),
      maxScore: Number(s['maxScore'] ?? s['max_score'] ?? 10),
      status: (s['rating'] ?? s['status'] ?? 'needs-practice') as 'needs-practice' | 'on-track' | 'mastered',
      questions: ((s['questions'] ?? []) as Record<string, unknown>[]).map((q) => ({
        id: String(q['id'] ?? ''),
        text: String(q['text'] ?? ''),
        tags: (q['tags'] ?? []) as ('high-impact' | 'missed-last-attempt')[],
      })),
    })),
    performanceBreakdown: breakdownRaw.map((b): PerformanceBreakdownItem => ({
      category: String(b['category'] ?? ''),
      score: Number(b['score'] ?? 0),
      maxScore: Number(b['maxScore'] ?? b['max_score'] ?? 100),
      percentage: Number(b['percentage'] ?? 0),
      description: String(b['description'] ?? ''),
      strengths: (b['strengths'] ?? []) as string[],
      areasForImprovement: (b['areasForImprovement'] ?? b['areas_for_improvement'] ?? []) as string[],
    })),
    transcript: transcriptRaw.map((t) => ({
      timestampSeconds: Number(t['timestamp'] ?? t['timestampSeconds'] ?? t['timestamp_seconds'] ?? 0),
      sender: (t['role'] ?? t['sender'] ?? 'user') as 'user' | 'ai',
      senderLabel: String(t['speakerLabel'] ?? t['speaker_label'] ?? t['senderLabel'] ?? t['sender_label'] ?? ''),
      text: String(t['text'] ?? ''),
      quality: mapQuality(t['quality']),
    })),
  };
}

/**
 * Fetch results for a completed session.
 *
 * In real mode: tries backend first, then falls back to Groq evaluation.
 * The transcript + rubric are passed in from the results page so Groq can evaluate.
 *
 * @param transcript - Full session transcript (passed from results page via sessionStorage)
 * @param rubric     - Playbook sections used as scoring rubric
 * @param ctx        - Session context (persona + training title)
 */
export async function fetchTrainingResults(
  trainingId: string,
  sessionId: string,
  transcript?: TranscriptMessage[],
  rubric?: PlaybookSection[],
  ctx?: SessionContext
): Promise<TrainingResultsPage> {
  // Mock mode: return mock immediately
  if (ENV.USE_MOCK_DATA) {
    return { ...TRAINING_RESULTS_MOCK, trainingId };
  }

  // Try backend first (for when a real backend exists)
  try {
    const res = await fetch(
      `${ENV.M09_API_BASE_URL}/api/trainings/${trainingId}/sessions/${sessionId}/results`,
      { next: { revalidate: 60 } }
    );
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const raw = await res.json();
    return adaptTrainingResults(raw as Record<string, unknown>, trainingId);
  } catch {
    // Backend unavailable — use Groq to evaluate the transcript
    console.info('[TrainingResultsService] Backend unavailable — evaluating via Groq');
  }

  // Groq evaluation path
  if (transcript && transcript.length > 0 && rubric && ctx) {
    try {
      const evaluation = await evaluateSession(transcript, rubric, ctx);

      // Map Groq evaluation result → TrainingResultsPage shape
      return {
        trainingId,
        trainingTitle: ctx.trainingTitle,
        overallScore: evaluation.overallScore,
        maxScore: 100,
        performanceTier: evaluation.performanceTier,
        tierLabel: evaluation.performanceTier === 'excellent' ? 'Excellent'
          : evaluation.performanceTier === 'good' ? 'Good'
          : 'Needs Practice',
        summaryText: evaluation.summaryText,
        performanceTags: [],
        scoredSections: evaluation.sections.map((s) => ({
          id: s.id,
          title: s.title,
          score: s.score,
          maxScore: 10,
          status: s.score >= 8 ? 'mastered' : s.score >= 5 ? 'on-track' : 'needs-practice',
          questions: rubric.find((r) => r.id === s.id)?.questions.map((q) => ({
            id: q.id,
            text: q.text,
            tags: q.tags,
          })) ?? [],
        })),
        performanceBreakdown: evaluation.sections.map((s) => ({
          category: s.title,
          score: s.score,
          maxScore: 10,
          percentage: Math.round((s.score / 10) * 100),
          description: s.comment,
          strengths: [],
          areasForImprovement: [],
        })),
        transcript: transcript.map((msg, i) => ({
          timestampSeconds: msg.timestampSeconds,
          sender: msg.sender,
          senderLabel: msg.sender === 'user' ? 'You' : ctx.persona.name,
          text: msg.text,
          quality: msg.sender === 'user'
            ? (evaluation.perMessageQuality.find((q) => q.messageIndex === i)?.quality ?? null)
            : null,
        })),
      };
    } catch (err) {
      console.warn('[TrainingResultsService] Groq evaluation failed, using mock:', err);
    }
  }

  // Final fallback: return mock data
  return { ...TRAINING_RESULTS_MOCK, trainingId };
}
