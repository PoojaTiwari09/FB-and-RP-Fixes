export type KpiStatus = 'optimal' | 'warning' | 'critical';

export interface RepKpiMetric {
  value: string;
  optimalText: string;
  status: KpiStatus;
}

export interface RepDetailsHeaderData {
  repId: string;
  name: string;
  initials: string;
  avatarColor: string;
  title: string;
  callsAnalyzed: number;
}

export interface RepKpisData {
  talkRatio: RepKpiMetric;
  questionRate: RepKpiMetric;
  monologue: RepKpiMetric;
}

export interface TrendWeek {
  label: string;
  value: number; // percentage 0-100
  status: KpiStatus;
}

export interface TrendChartData {
  title: string;
  benchmark: number; // e.g., 43
  weeks: TrendWeek[];
  insightText: string;
}

export interface RecentCall {
  id: string;
  title: string;       // e.g. "Discovery — Meridian Logistics"
  dateRange: string;   // e.g. "May 2 · 18 min" or "Apr 20 · 22 min"
  talkRatio: number;   // e.g. 74
  talkRatioStatus: KpiStatus;
  questionRate: string; // e.g. "6/hr"
  duration: string;    // e.g. "18 min"
}

export interface InsightPattern {
  id: string;
  text: string;
  type: 'warning' | 'success';
}

export interface CoachingHistoryItem {
  id: string;
  dateStr: string;     // e.g. "Apr 14"
  notes: string;       // e.g. "Discussed discovery pacing"
  managerInitials: string;
}

export interface CoachingRepFullData {
  header: RepDetailsHeaderData;
  kpis: RepKpisData;
  trend: TrendChartData;
  recentCalls: RecentCall[];
  observedPatterns: InsightPattern[];
  recommendedActions: InsightPattern[];
  coachingHistory: CoachingHistoryItem[];
}
