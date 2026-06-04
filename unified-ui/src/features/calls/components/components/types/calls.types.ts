// ============================================================
// Calls Module — TypeScript Types
// All interfaces match actual API response shapes exactly.
// ============================================================

// ─── Shared ──────────────────────────────────────────────────

export interface Owner {
  ownerId: string;
  ownerName: string;
  avatarInitials: string;
}

export interface Participant {
  name: string;
}

export type CallStatus = 'completed' | 'processing' | 'failed' | 'skipped';
export type DealType = 'New Business' | 'Renewal' | 'Expansion' | string;
export type DurationFilter = 'all' | 'lt2' | '2to10' | 'gt10';
export type DateRangeFilter = 'all' | 'last7days' | 'last30days' | 'custom';
export type CallType = 'outbound' | 'inbound';
export type ActivityType = 'email' | 'call' | 'meeting';
export type RiskSeverity = 'low' | 'medium' | 'high';
export type AssigneeType = 'rep' | 'customer';
export type SpeakerType = 'rep' | 'customer';
export type ConfidenceLevel = 'high' | 'low';

// ─── Calls List ───────────────────────────────────────────────

export interface CallListItem {
  callId: string;
  callTitle: string;
  dealType: DealType;
  account: string;
  owner: Owner;
  dateTime: string;
  duration: string;
  keyInsight: string;
  status: CallStatus;
  participants?: Participant[];
}

export interface CallsListResponse {
  totalCount: number;
  page: number;
  size: number;
  calls: CallListItem[];
}

export interface CallsListFilters {
  page: number;
  size: number;
  search: string;
  status: CallStatus | 'all';
  duration: DurationFilter;
  dealType: string[];       // multi-select: OR logic within category
  account: string[];        // multi-select: OR logic within category
  participantId: string[];  // multi-select: OR logic within category
  ownerId: string;
  dateRange: DateRangeFilter;
  startDate: string | null;
  endDate: string | null;
}

// ─── Accounts & Participants ──────────────────────────────────

export interface Account {
  accountId: string;
  accountName: string;
}

export interface AccountsResponse {
  accounts: Account[];
}

export interface ParticipantOption {
  participantId: string;
  name: string;
}

export interface ParticipantsResponse {
  participants: ParticipantOption[];
}

// ─── Call Detail ──────────────────────────────────────────────

export interface CallDetail {
  callId: string;
  callTitle: string;
  account: string;
  type: CallType;
  dealType: DealType;
  date: string;
  time: string;
  duration: string;
  source: string;
  participants: Participant[];
  owner: Owner;
  status: CallStatus;
}

// ─── Call Metadata ────────────────────────────────────────────

export interface CallMetadata {
  callId: string;
  callTitle: string;
  account: string;
  type: CallType;
  dealType: DealType;
  date: string;
  time: string;
  duration: string;
  source: string;
  participants: Participant[];
  owner: Owner;
  audioUrl?: string;
}

// ─── Briefs ───────────────────────────────────────────────────

export interface BriefListItem {
  briefId: string;
  briefTemplate: string;
  period: string;
  generatedAt: string;
  generatedFrom: string;
}

export interface BriefsListResponse {
  briefs: BriefListItem[];
}

export interface KeyDiscussionPoint {
  timestamp: string;
  description: string;
}

export interface CustomerNeed {
  title: string;
  description: string;
}

export interface Risk {
  title: string;
  description: string;
  severity: RiskSeverity;
}

export interface Commitment {
  description: string;
  assigneeType: AssigneeType;
  dueDate: string;
}

export interface Stakeholder {
  name: string;
  title: string;
  company: string;
  avatarInitials: string;
}

export interface ActivityContextItem {
  date: string;
  type: ActivityType;
  description: string;
}

export interface BriefDetail {
  briefId: string;
  briefTemplate: string;
  period: string;
  generatedAt: string;
  generatedFrom: string;
  overview: { text: string };
  keyDiscussionPoints: KeyDiscussionPoint[];
  customerNeeds: CustomerNeed[];
  risks: Risk[];
  commitments: Commitment[];
  stakeholders: Stakeholder[];
  activityContext: ActivityContextItem[];
}

// ─── Brief Templates & Periods ───────────────────────────────

export interface BriefTemplate {
  templateId: string;
  templateName: string;
}

export interface BriefTemplatesResponse {
  templates: BriefTemplate[];
}

export interface BriefPeriod {
  periodId: string;
  periodLabel: string;
}

export interface BriefPeriodsResponse {
  periods: BriefPeriod[];
}

export interface GenerateBriefRequest {
  briefTemplate: string;
  period: string;
}

export interface GenerateBriefResponse {
  briefId: string;
  briefTemplate: string;
  period: string;
  generatedAt: string;
  status: 'processing' | 'completed';
}

// ─── Share & Export ───────────────────────────────────────────

export interface ShareLinkResponse {
  shareableLink: string;
  expiresAt: string;
}

export interface ShareInternalRequest {
  recipientEmails: string[];
  message: string;
}

export interface ShareInternalResponse {
  message: string;
  sentTo: string[];
}

export interface FormattedSummaryResponse {
  formattedText: string;
}

// ─── Transcript ───────────────────────────────────────────────

export interface TranscriptEntry {
  entryId: string;
  timestamp: string;
  speakerName: string;
  speakerType: SpeakerType;
  text: string;
  confidence: ConfidenceLevel;
  startTime?: number | string;
  endTime?: number | string;
}

export interface TranscriptResponse {
  totalCount: number;
  transcript: TranscriptEntry[];
}

export interface TranscriptSummary {
  summary: string;
  generatedAt: string;
}

export interface TalkRatio {
  rep: { percentage: number };
  customer: { percentage: number };
}

export interface AudioMeta {
  audioUrl: string;
  duration: string;
  format: string;
}

export interface Topic {
  topicId: string;
  label: string;
  timestamp: string;
  description: string;
  color: string;
}

export interface TopicsResponse {
  topics: Topic[];
}

export interface NextStep {
  stepId: string;
  description: string;
  completed: boolean;
}

export interface NextStepsResponse {
  nextSteps: NextStep[];
}

// ─── UI State ─────────────────────────────────────────────────

export type CallDetailTab = 'briefs' | 'transcript';

// ─── Notes ────────────────────────────────────────────────────

export interface NoteRequest {
  callId: string;
  note: string;
  userId: string;
  timestamp: string;
}

export interface NoteResponse {
  noteId: string;
  callId: string;
  note: string;
  userId: string;
  timestamp: string;
  createdAt: string;
}

// ─── Full Call Share ──────────────────────────────────────────

export interface CallShareResponse {
  shareableLink: string;
  expiresAt: string;
}

// ─── PDF Export ───────────────────────────────────────────────

export interface PdfExportResponse {
  contentType: string;
  fileName: string;
  fileSizeKb: number;
  downloadUrl: string;
}
