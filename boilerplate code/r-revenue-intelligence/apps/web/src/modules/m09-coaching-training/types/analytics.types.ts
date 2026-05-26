import { ChatMessage, SessionFeedback } from './session.types';

export interface DashboardStats {
  totalReps?: number;
  activeSessions?: number;
  avgTeamScore?: number;
  repsNeedingAttention?: number;
  completionRate?: number;
  weeklyImprovement?: number;
  trends?: Record<string, number>;
  scoreTrend?: Array<Record<string, string | number>>;
  topPerformers?: Array<Record<string, string | number>>;
  atRiskReps?: Array<Record<string, string | number>>;
  assignmentCompletion?: Array<Record<string, string | number>>;
}

export interface RepStats {
  id: string;
  name: string;
  email?: string;
  overall_score?: number;
  avgScore?: number;
  session_count?: number;
  sessions?: number;
  completionRate?: number;
  trend?: 'up' | 'down' | 'stable';
  status?: string;
}

export interface TeamAnalytics {
  trendData?: Array<Record<string, string | number>>;
  scenarioData?: Array<Record<string, string | number>>;
  heatmapData?: Array<Record<string, string | number>>;
  personaPerformanceData?: Array<Record<string, string | number>>;
  insights?: Array<Record<string, string>>;
  recommendations?: Array<Record<string, string>>;
}

export interface CallDrilldown {
  id?: string;
  sessionId?: string;
  messages_json?: ChatMessage[];
  transcript?: ChatMessage[];
  feedback_json?: SessionFeedback | null;
  talkRatio?: Record<string, number>;
  keywordFrequency?: Array<Record<string, string | number>>;
  segmentScores?: Array<Record<string, string | number>>;
}

export interface BenchmarkData {
  categories?: Array<Record<string, string | number>>;
  distribution?: Array<Record<string, string | number>>;
  comparison?: Array<Record<string, string | number>>;
  openingTarget?: number;
  discoveryTarget?: number;
  closingTarget?: number;
  talkRatioRange?: string;
}

export interface ReviewItem {
  id: string;
  rep?: { name: string };
  repName?: string;
  assignment?: string;
  score?: number;
  submittedDate?: string;
  status?: string;
}

export interface ActivityMetrics {
  callsMade?: number;
  emailsSent?: number;
  activeReps?: number;
  activityTrend?: Array<Record<string, string | number>>;
  engagementRate?: number;
}

export interface InteractionAnalytics {
  talkRatio?: number;
  questionRate?: number;
  responsiveness?: number;
  engagementQuality?: number;
  metricsTrend?: Array<Record<string, string | number>>;
  avgTalkRatio?: number;
  avgQuestionsAsked?: number;
  avgClosingAttempts?: number;
}

export type TopicInsights = Array<{
  topic: string;
  count: number;
  impact: string;
}>;
