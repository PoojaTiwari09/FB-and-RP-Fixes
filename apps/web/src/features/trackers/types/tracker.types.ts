export interface Tracker {
  id: string;
  name: string;
  percentage: number;
  trend: number;
}

export interface TrackerDetail {
  percentage: number;
  mentions: number;
  topAccounts: any[];
  topReps: any[];
  aiInsight: string;
}

export interface Filters {
  teamId: string;
  dateRange: string;
  interactionType: string;
  search: string;
}
