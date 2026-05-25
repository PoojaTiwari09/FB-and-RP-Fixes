export interface AIDealSummaryRequest {
  dealId: string;
  dealName: string;
  stage: string;
  amount: number;
  ownerName: string;
  accountName?: string;
  transcript?: string;
  recentActivities?: string[];
  context?: Record<string, any>;
}

export interface AIDealSummaryResponse {
  summary: string;
  keyPoints: string[];
  nextSteps: string[];
  competitorMentions: string[];
  confidenceScore: number;
  flaggedForReview: boolean;
}

export interface AIWarningsRequest {
  dealId: string;
  dealName: string;
  stage: string;
  amount: number;
  lastActivityDate?: Date;
  contactCount: number;
  activityStrength: number;
  playbookCompletion: number;
  daysInStage: number;
  context?: Record<string, any>;
}

export interface AIWarning {
  type: string;
  severity: 'CRITICAL' | 'CAUTION' | 'INFO';
  message: string;
  recommendedAction: string;
}

export interface AIWarningsResponse {
  warnings: AIWarning[];
  overallRiskScore: number;
  topRisk: AIWarning | null;
}

export interface AIScoreRequest {
  dealId: string;
  dealName: string;
  stage: string;
  amount: number;
  engagementLevel: number;
  playbookCompletion: number;
  contactCount: number;
  activityStrength: number;
  daysInStage: number;
}

export interface AIScoreResponse {
  score: number;
  factors: {
    engagement: number;
    qualification: number;
    momentum: number;
    stakeholders: number;
  };
  explanation: string;
  confidenceScore: number;
}

export interface AINextStepsRequest {
  dealId: string;
  dealName: string;
  stage: string;
  recentActivities: string[];
  warnings: string[];
  playbookGaps: string[];
}

export interface AINextStepsResponse {
  nextSteps: Array<{
    action: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    reasoning: string;
  }>;
  confidenceScore: number;
}

export interface AICoachingPromptsRequest {
  dealId: string;
  dealName: string;
  repName: string;
  stage: string;
  warnings: string[];
  playbookGaps: string[];
  recentActivities: string[];
}

export interface AICoachingPromptsResponse {
  prompts: Array<{
    question: string;
    context: string;
    category: string;
  }>;
  focusAreas: string[];
}
