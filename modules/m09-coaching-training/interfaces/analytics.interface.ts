export interface ITrendData {
  date: string;
  score: number;
}

export interface IScenarioData {
  name: string;
  score: number;
}

export interface IDashboardStats {
  totalReps: number;
  activeSessions: number;
  avgTeamScore: number;
  repsNeedingAttention: number;
  completionRate: number;
  weeklyImprovement: number;
  trends: {
    avgScore: number;
    weeklyImprovement: number;
  };
}

export interface ITeamAnalytics {
  trendData: ITrendData[];
  scenarioData: IScenarioData[];
  radarData: {
    subject: string;
    A: number;
    fullMark: number;
  }[];
  heatmapData: any[];
  personaPerformanceData: {
    type: string;
    avgScore: number;
  }[];
  insights: {
    type: string;
    text: string;
    icon: string;
  }[];
  recommendations: {
    action: string;
    text: string;
    priority: string;
  }[];
}

export interface IRepWithStats {
  id: string;
  name: string;
  email: string;
  overall_score: number;
  trend: 'up' | 'down' | 'stable';
  weakest_skill: string;
  strongest_skill: string;
  last_session: string | null;
  session_count: number;
  status: 'Excellent' | 'Improving' | 'High Risk';
}

export interface IInteractionAnalytics {
  avgTalkRatio: number;
  avgQuestionsAsked: number;
  avgClosingAttempts: number;
  totalExchanges: number;
}

export interface IExportOptions {
  format: 'csv' | 'json';
  dateRange?: string;
  filters?: Record<string, any>;
}
