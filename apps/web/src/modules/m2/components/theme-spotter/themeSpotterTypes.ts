export interface ThemeQuote {
  id: string;
  themeId: string;
  conversationId?: string;
  snippet: string;
  speakerSide: 'agent' | 'customer' | 'any';
  confidenceScore: number;
  createdAt: string;
}

export interface Theme {
  id: string;
  analysisId: string;
  name: string;
  summary: string;
  callCount: number;
  accountCount: number;
  associatedRevenue: number;
  confidenceScore: number;
  status: 'PENDING_REVIEW' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED';
  trend: 'RISING' | 'STABLE' | 'DECLINING';
  createdAt: string;
  updatedAt: string;
  quotes?: ThemeQuote[];
}

export interface ThemeAnalysis {
  id: string;
  businessQuestion: string;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  callCountAnalyzed: number;
  createdAt: string;
}

export interface ThemeAlert {
  id: string;
  themeId: string;
  conditionType: 'COUNT_THRESHOLD' | 'TREND_CHANGE';
  thresholdValue: number;
  timeWindowDays: number;
  isActive: boolean;
  lastTriggeredAt?: string;
  createdAt: string;
}

export interface ThemeFiltersState {
  search: string;
  trend: string;
  minConfidence: number;
}
