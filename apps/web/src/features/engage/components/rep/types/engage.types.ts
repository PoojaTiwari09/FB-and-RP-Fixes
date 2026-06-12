// ─── Unions ───────────────────────────────────────────────────────────────────

export type ChannelType = 'EMAIL' | 'CALL' | 'LINKEDIN' | 'CUSTOM';
export type TaskStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'OVERDUE';
export type TaskPriority = 'HIGH' | 'NORMAL' | 'LOW';
export type TodoType = 'FLOW' | 'MANUAL' | 'RECOMMENDED';
export type LinkedEntityType = 'CONTACT' | 'ACCOUNT' | 'DEAL' | 'LEAD';
export type GroupBy = 'NONE' | 'FLOW' | 'STEP_NUMBER';
export type SortBy = 'DUE_DATE' | 'RECENT_ACTIVITY' | 'PRIORITY';
export type TabStatus = 'TODAY' | 'IN_PROGRESS' | 'UPCOMING' | 'COMPLETED' | 'SNOOZED';
export type CrmFieldType = 'TEXT' | 'NUMBER' | 'DATE' | 'DROPDOWN' | 'BOOLEAN';
export type SignalSeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type SignalType = 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE';
export type KeyMomentType = 'OBJECTION' | 'WIN' | 'RISK' | 'QUESTION';
export type CallDimension = 'DISCOVERY' | 'OBJECTION_HANDLING' | 'CLOSING';
export type SpeakingPace = 'GOOD' | 'FAST' | 'SLOW';
export type EngagementEventType =
  | 'EMAIL_OPENED'
  | 'LINK_CLICKED'
  | 'PHONE_CALL'
  | 'MEETING_SCHEDULED'
  | 'EMAIL_SENT'
  | 'EMAIL_REPLIED'
  | 'LINKEDIN_MESSAGE';

// ─── Tasks ────────────────────────────────────────────────────────────────────

export interface Task {
  taskId: string;
  contactId: string;
  contactName: string;
  company: string;
  channelType: ChannelType;
  sequenceName: string;
  sequenceStep: string;
  scheduledTime: string;
  dueDateTime: string;
  interactionCount: number;
  priority: TaskPriority;
  status: TaskStatus;
  isOverdue: boolean;
  isAtRisk: boolean;
  snoozedUntil?: string | null;
  entityType?: string;
  dueDate?: string;
  localTime?: string;
  title?: string;
}

export interface TaskSummary {
  totalTasksToday: number;
  completedCount: number;
  inProgressCount: number;
  upcomingCount: number;
  atRiskCount: number;
  dueTodayCount: number;
  highPriorityCount: number;
  progressPercent: number;
  snoozedCount?: number;
  completedTodayCount?: number;
  totalTodayCount?: number;
}

export interface TaskDetailActivity {
  date: string;
  channelType: ChannelType;
  summary: string;
}

export interface TaskDetail {
  taskId: string;
  taskTitle: string;
  contactId: string;
  contactName: string;
  company: string;
  arrValue: string;
  scheduledDateTime: string;
  aiInsight: string;
  recommendedNextSteps: string[];
  recentActivity: TaskDetailActivity[];
  existingNotes?: string;
}

export interface TaskNote {
  noteId: string;
  note: string;
  authorName: string;
  createdAt: string;
  timestamp?: string;
}

// ─── Recent Activity ──────────────────────────────────────────────────────────

export interface RecentActivity {
  activityId: string;
  contactId: string;
  contactName: string;
  company: string;
  channelType: ChannelType;
  summary: string;
  occurredAt: string;
  timeAgoLabel: string;
}

// ─── Lookup & Users ───────────────────────────────────────────────────────────

export interface LookupResult {
  id: string;
  type: LinkedEntityType;
  displayName: string;
  subLabel: string;
}

export interface AssignableUser {
  userId: string;
  displayName: string;
  role: string;
  isCurrentUser: boolean;
}

// ─── Email ────────────────────────────────────────────────────────────────────

export interface EmailDraft {
  taskId: string;
  contactName: string;
  contactEmail: string;
  fromEmail: string;
  fromLabel: string;
  subject: string;
  bodyHtml: string;
  sequenceName: string;
  sequenceStep: string;
  dueDateTime: string;
  taskIndex: number;
  totalTasks: number;
}

export interface EmailTemplate {
  templateId: string;
  templateName: string;
  subject: string;
  bodyHtml: string;
  category?: string;
}

// ─── LinkedIn ─────────────────────────────────────────────────────────────────

export interface LinkedInDraft {
  taskId: string;
  contactId: string;
  contactName: string;
  contactTitle: string;
  contactCompany: string;
  contactAvatarUrl?: string;
  linkedInProfileUrl: string;
  mutualConnections: number;
  messageScript: string;
  sequenceName: string;
  sequenceStep: string;
  dueDateTime: string;
  taskIndex: number;
  totalTasks: number;
}

// ─── Contacts ─────────────────────────────────────────────────────────────────

export interface AccountInfo {
  accountName: string;
  arrValue: string;
  industry?: string;
  website?: string;
  size?: string;
}

export interface DealInfo {
  dealName?: string;
  dealStage?: string;
  dealValue?: string;
  closeDate?: string;
}

export interface ContactTimelineItem {
  date: string;
  channelType: ChannelType;
  summary: string;
}

export interface ContactDetails {
  contactId: string;
  contactName: string;
  jobTitle: string;
  company: string;
  phone: string;
  email: string;
  linkedInUrl: string;
  avatarUrl?: string;
  engagementTimeline: ContactTimelineItem[];
  accountInfo: AccountInfo;
  dealInfo: DealInfo;
}

export interface EngagementTimelineEvent {
  eventId: string;
  eventType: EngagementEventType;
  eventIcon: string;
  summary: string;
  occurredAt: string;
  timeAgoLabel: string;
}

// ─── CRM Fields ───────────────────────────────────────────────────────────────

export interface CrmField {
  fieldId: string;
  fieldLabel: string;
  fieldValue: string;
  isEditable: boolean;
  fieldType: CrmFieldType;
}

export interface CrmFields {
  accountFields: CrmField[];
  dealFields: CrmField[];
}

// ─── Filters ──────────────────────────────────────────────────────────────────

export interface FlowOption {
  flowId: string;
  flowName: string;
}

export interface CrmFieldDefinition {
  fieldId: string;
  fieldLabel: string;
  fieldType: CrmFieldType;
  options?: string[];
}

export interface FilterOptions {
  flowNames: FlowOption[];
  crmFields: {
    account: CrmFieldDefinition[];
    contact: CrmFieldDefinition[];
    lead: CrmFieldDefinition[];
    opportunity: CrmFieldDefinition[];
  };
}

// ─── Smart Call ───────────────────────────────────────────────────────────────

export interface SmartCallInit {
  taskId: string;
  contactName: string;
  contactCompany: string;
  supportedIntegrations: string[];
  preCallBriefing?: string;
}

export interface IntentSignal {
  label: string;
  value: string;
  severity: SignalSeverity;
  color: string;
}

export interface LiveSessionData {
  currentStage: string;
  nextSuggestion: string;
  suggestedResponses: string[];
  competitorIntelligence?: {
    competitorName: string;
    insight: string;
    ourEdge: string;
    sayThis: string;
  };
  intentSignals: IntentSignal[];
  talkRatio: { repPercent: number; customerPercent: number };
  conversationMetrics: {
    interruptions: number;
    speakingPace: SpeakingPace;
    wordsPerMinute: number;
    questionsAsked: number;
  };
  conversationSummary: string;
}

export interface DimensionScore {
  dimension: CallDimension;
  score: number;
  maxScore: number;
}

export interface KeyMoment {
  timestamp: string;
  type: KeyMomentType;
  description: string;
}

export interface ConversationTimelineSegment {
  startTime: string;
  endTime: string;
  topic: string;
}

export interface CallSummary {
  sessionId: string;
  callSummaryId: string;
  duration: string;
  callType: string;
  signalLabel: string;
  signalType: SignalType;
  overallScore: number;
  dimensionScores: DimensionScore[];
  aiSummary: string;
  keyMoments: KeyMoment[];
  improvementSuggestions: string[];
  conversationTimeline: ConversationTimelineSegment[];
  transcriptUrl: string;
}

// ─── Bulk Actions ─────────────────────────────────────────────────────────────

export interface BulkActionResponse {
  updatedCount: number;
  failedIds?: string[];
  message: string;
}

export interface QueueStartResponse {
  queueId: string;
  totalTasks: number;
  currentTaskId: string;
  status: 'RUNNING';
  message: string;
}
