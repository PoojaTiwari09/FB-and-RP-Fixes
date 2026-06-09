// src/types/trainingResults.types.ts
import { QuestionTag } from '@shared/types/shared.types';

export type PerformanceTier = 'excellent' | 'good' | 'needs-improvement';

export type TranscriptMessageQuality = 'good-example' | 'missed-opportunity' | null;

export interface PerformanceTag {
  id: string;
  label: string; // e.g. "Strong Opening", "Improve Closing"
  type: 'positive' | 'warning'; // aligned with backend spec (was 'negative')
}

export interface ScoredQuestion {
  id: string;
  text: string;
  tags: QuestionTag[]; // reuse from shared.types.ts
}

export interface ScoredPlaybookSection {
  id: string;
  title: string;
  score: number; // e.g. 6
  maxScore: number; // e.g. 10
  status: 'needs-practice' | 'on-track' | 'mastered';
  questions: ScoredQuestion[];
}

export interface TranscriptEntry {
  timestampSeconds: number;
  sender: 'user' | 'ai';
  senderLabel: string; // e.g. "You" or "Sarah Johnson"
  text: string;
  quality: TranscriptMessageQuality;
}

/**
 * Detailed performance breakdown per evaluative dimension.
 * Separate from coaching playbook — these are AI-scored categories.
 */
export interface PerformanceBreakdownItem {
  category: string; // e.g. "Opening & Rapport Building"
  score: number;
  maxScore: number;
  percentage: number;
  description: string;
  strengths: string[];
  areasForImprovement: string[];
}

export interface TrainingResultsPage {
  trainingId: string;
  trainingTitle: string;
  overallScore: number; // e.g. 78
  maxScore: number; // e.g. 100
  performanceTier: PerformanceTier;
  tierLabel: string; // e.g. "Good"
  summaryText: string; // spec: overallDescription — mapped in adapter
  performanceTags: PerformanceTag[];
  scoredSections: ScoredPlaybookSection[];
  performanceBreakdown: PerformanceBreakdownItem[]; // detailed AI-evaluated breakdown
  transcript: TranscriptEntry[];
}
