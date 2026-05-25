/**
 * Analytics API Client
 * Provides methods to interact with analytics endpoints
 */

export interface AnalyticsRequest {
  scope: 'PERSONAL' | 'TEAM' | 'EXECUTIVE';
  boardId?: string;
  period?: 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'THIS_QUARTER' | 'CUSTOM';
  startDate?: string;
  endDate?: string;
}

export interface TabRollup {
  tabName: string;
  totalValue: number;
  dealCount: number;
  averageDealSize: number;
}

export interface AEAnalytics {
  userId: string;
  totalPipelineValue: number;
  totalDealCount: number;
  averageAiScore: number;
  atRiskDealCount: number;
  tabRollups: TabRollup[];
  topWarnings: string[];
  activitySummary: {
    callsThisWeek: number;
    emailsThisWeek: number;
    meetingsThisWeek: number;
  };
  nextStepsSummary: {
    totalTasks: number;
    completedTasks: number;
    overdueTasks: number;
  };
}

export interface TeamDiagnostics {
  repName: string;
  repId: string;
  totalValue: number;
  dealCount: number;
  averageAiScore: number;
  atRiskCount: number;
  averageMeddpiccCompletion: number;
}

export interface ManagerAnalytics {
  managerId: string;
  teamPipelineValue: number;
  teamDealCount: number;
  teamAverageAiScore: number;
  totalAtRiskDeals: number;
  tabRollups: TabRollup[];
  teamDiagnostics: TeamDiagnostics[];
  coachingActivity: {
    tasksAssigned: number;
    commentsAdded: number;
    dealsEscalated: number;
  };
  riskDistribution: {
    highRisk: number;
    mediumRisk: number;
    lowRisk: number;
  };
}

export interface TopRiskDeal {
  dealId: string;
  dealName: string;
  amount: number;
  primaryRisk: string;
  riskLevel: string;
  ownerName: string;
}

export interface ExecutiveAnalytics {
  forecastMetrics: {
    totalCommit: number;
    targetValue: number;
    gapToTarget: number;
    gapPercentage: number;
    percentageAtRisk: number;
    dealCountByCategory: {
      commit: number;
      bestCase: number;
      pipeline: number;
    };
  };
  tabRollups: TabRollup[];
  topRiskDeals: TopRiskDeal[];
  summaryMetrics: {
    totalDeals: number;
    averageAiScore: number;
    averageDealSize: number;
    winRate: number;
  };
  trendData: Array<{
    date: string;
    commitValue: number;
    atRiskCount: number;
  }>;
}

export class AnalyticsAPI {
  private baseUrl: string;

  constructor(baseUrl: string = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get analytics based on scope
   */
  async getAnalytics(request: AnalyticsRequest): Promise<AEAnalytics | ManagerAnalytics | ExecutiveAnalytics> {
    const response = await fetch(`${this.baseUrl}/analytics`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get AE analytics (shortcut)
   */
  async getAEAnalytics(boardId?: string): Promise<AEAnalytics> {
    const url = boardId 
      ? `${this.baseUrl}/analytics/ae?boardId=${boardId}`
      : `${this.baseUrl}/analytics/ae`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch AE analytics: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get Manager analytics (shortcut)
   */
  async getManagerAnalytics(boardId?: string): Promise<ManagerAnalytics> {
    const url = boardId 
      ? `${this.baseUrl}/analytics/manager?boardId=${boardId}`
      : `${this.baseUrl}/analytics/manager`;

    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Manager analytics: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get Executive analytics (shortcut)
   */
  async getExecutiveAnalytics(): Promise<ExecutiveAnalytics> {
    const response = await fetch(`${this.baseUrl}/analytics/executive`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Executive analytics: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get historical metrics
   */
  async getHistoricalMetrics(days: number = 30, metricTypes?: string[]): Promise<any> {
    const params = new URLSearchParams({ days: days.toString() });
    if (metricTypes && metricTypes.length > 0) {
      params.append('metricTypes', metricTypes.join(','));
    }

    const response = await fetch(`${this.baseUrl}/analytics/historical?${params}`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch historical metrics: ${response.statusText}`);
    }

    return response.json();
  }
}

// Export singleton instance
export const analyticsAPI = new AnalyticsAPI();
