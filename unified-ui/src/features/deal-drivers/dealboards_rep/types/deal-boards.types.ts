// ============================================================
// mockSeeds.ts — Seed data extracted from Figma video walkthrough
// All values match exactly what is visible in the UI screens.
//
// HOW TO USE:
//   Import mock constants into apiHandler.ts (already done).
//   When backend is ready → this file can be deleted entirely.
// ============================================================

// ─── Types ───────────────────────────────────────────────────

export interface DealBoard {
  boardId: string;
  name: string;
  description: string;
  owner: string;
  lastModified: string;
  canEdit: boolean;
}

export interface BoardSummaryCard {
  label: string;
  amount: number;
  count: number;
  changePercent: number;
}

export interface BoardDetail {
  boardId: string;
  name: string;
  ownerTag: string;
  summaryCards: BoardSummaryCard[];
}

export interface Deal {
  dealId: string;
  dealName: string;
  company: string;
  stage: string;
  amount: number;
  forecastCategory: string;
  closeDate: string;
  assignedRep: string;
  assignedRepEmail?: string;
  contacts: number;
  notificationCount: number;
  aiWarningCount: number;
  flagCount: number;
  flagReason?: string;
  activityOverTime?: DealActivity[];
  playbookScore: number;
  playbookColor: "green" | "orange" | "red";
  aiSuggestedNextStep: string;
}

export interface DealActivity {
  dateLabel: string;
  count: number;
  interactions: {
    id: string;
    type: "customer" | "rep";
    size: number;
    positionPercent: number; // 0 to 100 on the timeline
  }[];
}

export interface Warning {
  warningId: string;
  severity: "HIGH" | "MEDIUM" | "LOW";
  title: string;
  description: string;
  suggestedAction: string;
  status: "active" | "resolved";
}

export interface PlaybookCriterion {
  criterionId: string;
  criterionName: string;
  question: string;
  status: "Completed" | "Pending" | "N/A";
  notes: string;
  aiSuggestedNote?: string;
  /** Exact answer extracted from call transcripts; shown in preference to AI suggestion */
  transcriptAnswer?: string;
}

export interface PlaybookData {
  framework: string;
  scorePercentage: number;
  completedCount: number;
  totalCount: number;
  criteria: PlaybookCriterion[];
}

export interface ActivityEvent {
  activityId: string;
  date: string;
  type: string;
  duration: number;
  direction: "outbound" | "inbound";
  participants: string[];
  notes: string;
}

export interface ActivityData {
  ourInteractions: number;
  customerInteractions: number;
  totalMinutes: number;
  events: ActivityEvent[];
}

export interface BriefData {
  aiSummary?: string;
  whatChangedThisWeek?: string;
  buyerSentiment?: "Positive" | "Neutral" | "Negative";
  lastInteraction?: string;
  keyRisks?: string;

  overview?: string;
  keyDiscussionPoints?: string[];
  customerNeeds?: { title: string; description: string }[];
  risks?: { title: string; description: string; severity: string }[];
  commitments?: { description: string; assigneeType: string; dueDate: string }[];
  stakeholders?: { name: string; title: string; company: string; avatarInitials: string }[];
  activityContext?: { type: string; description: string; date: string }[];
}

export interface CrmFields {
  stage: string;
  amount: number;
  forecastCategory: string;
  nextStep: string;
  closeDate: string;
}

export interface Notification {
  id: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: string;
}

export interface StageOptions {
  stages: string[];
  forecastCategories: string[];
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

// ─── Seed: GET /api/deal-boards ───────────────────────────────

