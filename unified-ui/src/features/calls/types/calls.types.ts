export type CallType = 'Discovery' | 'Demo' | 'Negotiation' | 'Closing' | 'Follow-Up' | 'Check-In';
export type Priority = 'High' | 'Medium' | 'Low';
export type ReviewStatus = 'Pending' | 'In Progress' | 'Completed' | 'Overdue' | 'Reopened';
export type SortOption = 'newest' | 'oldest' | 'highestPriority' | 'overdueFirst';

export interface CallReview {
  reviewId: string;
  callTitle: string;
  scorecardName: string;
  account: string;
  callDate: string;
  callType: CallType;
  duration: string;
  priority: Priority;
  status: ReviewStatus;
  aiFlags: string[];
  dueDate: string;
}

export interface Call extends CallReview {
  hasReview: boolean;
}

export interface Participant {
  name: string;
  role: string;
}

export interface QuickStats {
  topics: number;
  actionItems: number;
}

export interface TalkRatio {
  rep: number;
  customer: number;
}

export interface CallReviewDetail {
  reviewId: string;
  callTitle: string;
  salesRep: string;
  customer: string;
  dateTime: string;
  duration: string;
  callType: CallType;
  dealLinked: string;
  callSource: string;
  participants: Participant[];
  aiSummary: string;
  keyHighlights: string[];
  talkRatio: TalkRatio;
  sentimentSummary: string;
  sentimentScore: number;
  risksDetected: string[];
  actionItemsList: string[];
  scorecardName: string;
  scorecardVersion: string;
  reviewMode: string;
  dueDate: string;
  status: ReviewStatus;
  reviewer: string;
  quickStats: QuickStats;
  questions?: any;
  feedback?: any;
  overallScore?: number;
}

export interface Scorecard {
  scorecardId: string;
  scorecardName: string;
}

export interface User {
  userId: string;
  userName: string;
}

export interface AnalyticsSummary {
  repAvgScore: number;
  repScoreTrend: number;
  teamAvgScore: number;
  teamComparison: 'above' | 'below' | 'same';
  completionRate: number;
  totalReviews: number;
}

export interface TrendPoint {
  week: string;
  score: number;
}

export interface FocusArea {
  sectionName: string;
  avgScore: number;
}

export interface TagCount {
  tag: string;
  count: number;
}

export interface ReviewHistoryItem {
  reviewId: string;
  callTitle: string;
  reviewerName: string;
  reviewedAt: string;
  tags: string[];
  score: number;
}

export interface CallReviewsResponse {
  totalCount: number;
  data: CallReview[];
}

export interface CallsResponse {
  totalCount: number;
  data: Call[];
}

export interface ReviewHistoryResponse {
  totalCount: number;
  reviews: ReviewHistoryItem[];
}
