// ─── Contact Selection ─────────────────────────────────────────────────────

export interface Contact {
  contactId: string;
  contactName: string;
  jobTitle: string;
  company: string;
  avatarUrl: string | null;
  lastInteractionLabel: string;
  phone: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
  hasMore: boolean;
}

// ─── Pre-Call Brief ────────────────────────────────────────────────────────

export type Integration = 'ZOOM' | 'MEET' | 'TEAMS';

export interface PreCallBrief {
  contactId: string;
  contactName: string;
  contactCompany: string;
  supportedIntegrations: Integration[];
  preCallBriefing: string;
  keyObjections: string[];
  dealStage: string;
  arrValue: string;
}

// ─── Session ───────────────────────────────────────────────────────────────

export interface SessionStartResponse {
  sessionId: string;
  contactId: string;
  contactName: string;
  contactCompany: string;
  taskTitle: string;
  status: 'LIVE';
  wsEndpoint: string;
  message: string;
}

export interface SessionEndResponse {
  sessionId: string;
  status: 'ENDED';
  callSummaryId: string;
  message: string;
}

// ─── WebSocket Events ──────────────────────────────────────────────────────

export interface LiveGuidanceEvent {
  eventType: 'LIVE_GUIDANCE';
  currentStage: string;
  nextSuggestion: string;
}

export interface SuggestedResponsesEvent {
  eventType: 'SUGGESTED_RESPONSES';
  responses: string[];
}

export interface Competitor {
  competitorName: string;
  badgeColor: string;
  insight: string;
  ourEdge: string;
  sayThis: string;
}

export interface CompetitorIntelligenceEvent {
  eventType: 'COMPETITOR_INTELLIGENCE';
  competitors: Competitor[];
}

export type SignalSeverity = 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
export type SignalColor = 'green' | 'blue' | 'yellow' | 'purple' | 'red';

export interface IntentSignal {
  label: string;
  value: string;
  severity: SignalSeverity;
  color: SignalColor;
}

export interface IntentSignalsEvent {
  eventType: 'INTENT_SIGNALS';
  signals: IntentSignal[];
}

export interface TalkRatioEvent {
  eventType: 'TALK_RATIO';
  repPercent: number;
  customerPercent: number;
}

export interface ConversationMetricsEvent {
  eventType: 'CONVERSATION_METRICS';
  interruptions: number;
  speakingPace: string;
  wordsPerMinute: number;
  questionsAsked: number;
}

export interface HighlightedKeyword {
  word: string;
  color: string;
}

export interface ConversationSegment {
  startTime: string;
  endTime: string;
  summary: string;
  highlightedKeywords: HighlightedKeyword[];
  tags: string[];
}

export interface ConversationSummaryEvent {
  eventType: 'CONVERSATION_SUMMARY';
  segments: ConversationSegment[];
}

export interface OverlayCompetitor {
  competitorName: string;
  ourEdge: string;
  sayThis: string;
}

export interface OverlayUpdateEvent {
  eventType: 'OVERLAY_UPDATE';
  confidenceScore: number;
  contextSummary: string;
  actionSuggestion: string;
  suggestedResponse: string;
  strategicTip: string;
  strategicTipScript: string;
  competitors: OverlayCompetitor[];
}

export type WSEvent =
  | LiveGuidanceEvent
  | SuggestedResponsesEvent
  | CompetitorIntelligenceEvent
  | IntentSignalsEvent
  | TalkRatioEvent
  | ConversationMetricsEvent
  | ConversationSummaryEvent
  | OverlayUpdateEvent;

// ─── Live Session Aggregated State ─────────────────────────────────────────

export interface LogEntry {
  timestamp: string; // MM:SS display format
  title: string;
  description: string;
}

export interface LiveSessionData {
  guidance: LiveGuidanceEvent | null;
  responses: string[];
  competitors: Competitor[];
  signals: IntentSignal[];
  talkRatio: TalkRatioEvent | null;
  metrics: ConversationMetricsEvent | null;
  summarySegments: ConversationSegment[];
  overlay: OverlayUpdateEvent | null;
  logEntries: LogEntry[];
}

// ─── Transcript ────────────────────────────────────────────────────────────

export type TranscriptSpeaker = 'REP' | 'CUSTOMER';

export interface TranscriptSegment {
  timestamp: string;
  speaker: TranscriptSpeaker;
  text: string;
}

export interface TranscriptData {
  sessionId: string;
  contactName: string;
  duration: string;
  segments: TranscriptSegment[];
}

// ─── Call Summary ──────────────────────────────────────────────────────────

export interface DimensionScore {
  dimension: string;
  score: number;
  maxScore: number;
}

export interface KeyMoment {
  timestamp: string;
  type: 'OBJECTION' | 'INTEREST_SIGNAL' | 'MISSED_OPPORTUNITY';
  color: string;
  description: string;
}

export interface MissedOpportunities {
  title: string;
  subLabel: string;
  questions: string[];
}

export interface TimelineEntry {
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
  signalType: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
  overallScore: number;
  dimensionScores: DimensionScore[];
  aiSummary: string;
  keyMoments: KeyMoment[];
  missedOpportunities: MissedOpportunities;
  suggestedImprovements: string[];
  conversationTimeline: TimelineEntry[];
  transcriptUrl: string;
}

// ─── App Screen Flow ───────────────────────────────────────────────────────

export type SmartCallScreen =
  | 'contact-selection'
  | 'pre-call'
  | 'loading'
  | 'live-session'
  | 'generating-summary'
  | 'call-summary';

// Legacy dashboard list types used by SmartCallCard/useSmartCalls.
export type CallStatus = 'completed' | 'scheduled' | 'in_progress' | 'missed';
export type CallSentiment = 'positive' | 'neutral' | 'negative';

export interface SmartCall {
  id: string;
  title: string;
  prospect: string;
  company: string;
  scheduledAt: string;
  status: CallStatus;
  durationMin: number | null;
  aiScore: number | null;
  talkRatio: number | null;
  sentiment: CallSentiment | null;
  keyMoments: string[];
}
