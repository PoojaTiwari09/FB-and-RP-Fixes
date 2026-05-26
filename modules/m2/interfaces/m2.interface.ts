export interface ScorecardQuestion {
  id: string;
  text: string;
  scoringCondition?: string;
}

export interface Scorecard {
  id: string;
  tenantId: string;
  name: string;
  questions: ScorecardQuestion[];
  scoringConditions?: Record<string, any>;
  isActive: boolean;
  version: string;
  lifecycleState: string; // e.g. "DRAFT", "ACTIVE", "ARCHIVED"
  createdAt: Date;
  updatedAt: Date;
}

export interface AIAnswer {
  questionId: string;
  questionText?: string;
  answer: string;
  score: number;
  confidence: number;
  evidence: string;
}

export interface DerivedCallMetrics {
  talkRatio: { agent: number; customer: number };
  questionRate: number;
  longestMonologue: number;
}

export interface CallScore {
  id: string;
  callId: string;
  tenantId: string;
  scorecardId: string;
  scorecardVersion: string;
  aiAnswers: AIAnswer[];
  totalScore: number;
  confidenceScore: number;
  flaggedReview: boolean;
  scoredAt: Date;
  derivedMetrics: DerivedCallMetrics;
  scoringSource?: 'AI_MODEL' | 'RULE_BASED_FALLBACK';
  tags?: string[];
  summary?: string;
  isReviewed?: boolean;
  reviewerNotes?: string;
  originalScore?: number;
}

export interface DelayedScoringJob {
  key: string; // score:tenantId:callId:scorecardId:scorecardVersion
  tenantId: string;
  callId: string;
  scorecardId: string;
  scorecardVersion: string;
  status: 'PENDING' | 'SCORING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  timer?: any; // setTimeout handle
  linkedEventReceived: boolean;
  transcript?: string;
  speakerSegments?: any[];
}
export interface SmartTracker {
  id: string;
  tenantId: string;
  name: string;
  businessQuestion: string;
  description?: string;
  type: 'pricing' | 'competitor' | 'objection' | 'risk' | 'custom';
  scope: 'calls' | 'emails' | 'both';
  speakerSide: 'customer' | 'rep' | 'any';
  isPublished: boolean;
  status: 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED';
  createdAt: Date;
  updatedAt: Date;
}

export interface TrackerDetection {
  id: string;
  trackerId: string;
  callId?: string;
  emailId?: string;
  tenantId: string;
  dealId?: string;
  contactId?: string;
  snippet: string;
  timestampMs?: number;
  confidenceScore: number;
  detectionSource: 'AI Model' | 'Rule-Based Fallback';
  detectedAt: Date;
  createdAt: Date;
}

// ─── AI Theme Spotter Interfaces ──────────────────────────────────────────────

export interface ThemeAnalysis {
  id: string;
  tenantId: string;
  businessQuestion: string;
  filters: Record<string, any>;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  callCountAnalyzed: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Theme {
  id: string;
  analysisId: string;
  tenantId: string;
  name: string;
  summary: string;
  callCount: number;
  accountCount: number;
  associatedRevenue: number;
  confidenceScore: number;
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED';
  detectionSource: 'GROQ_AI' | 'RULE_BASED_FALLBACK';
  trend: 'RISING' | 'STABLE' | 'DECLINING';
  createdAt: Date;
  updatedAt: Date;
}

export interface ThemeQuote {
  id: string;
  themeId: string;
  tenantId: string;
  conversationId?: string;
  snippet: string;
  speakerSide: 'agent' | 'customer' | 'any';
  confidenceScore: number;
  createdAt: Date;
}

export interface ThemeAlert {
  id: string;
  themeId: string;
  tenantId: string;
  conditionType: 'COUNT_THRESHOLD' | 'TREND_CHANGE';
  thresholdValue: number;
  timeWindowDays: number;
  isActive: boolean;
  lastTriggeredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

