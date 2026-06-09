export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterOptions {
  teams: FilterOption[];
  reps: FilterOption[];
  stages: FilterOption[];
  topics: FilterOption[];
  trackers: FilterOption[];
  scorecardResults: FilterOption[];
  callTypes: FilterOption[];
  phraseMatchTypes: FilterOption[];
}

export interface CallResult {
  id: string;
  title: string;
  rep: { id: string; name: string };
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  score: number;
  scoreLabel: string;
  deal: string;
  type: string;
  status: string;
}

export interface EmailResult {
  id: string;
  subject: string;
  sender: { name: string; email: string; avatar?: string };
  date: string;
  preview: string;
  statusTags: string[];
  isRead: boolean;
}

export interface SearchResponse {
  meta: {
    total: number;
    page: number;
    size: number;
    totalPages: number;
    callsCount: number;
    emailsCount: number;
  };
  chart: {
    days: { label: string; count: number }[];
    weeks: { label: string; count: number }[];
    months: { label: string; count: number }[];
    quarters: { label: string; count: number }[];
  };
  emailChart: {
    days: { label: string; count: number }[];
    weeks: { label: string; count: number }[];
    months: { label: string; count: number }[];
    quarters: { label: string; count: number }[];
  };
  results: CallResult[];
  emailResults: EmailResult[]; // Not in original breakdown but needed for Emails tab
}

export interface CallDetail {
  id: string;
  title: string;
  date: string; // ISO
  durationSeconds: number;
  durationLabel: string;
  participants: { name: string; role: string }[];
  account: string;
  type: string;
  status: string;
  score: number;
  scoreLabel: string;
  recordingUrl: string;
  nextSteps: string[];
  keyHighlights: { label: string; text: string }[];
  conversationHighlights: {
    timestampSeconds: number;
    timestampLabel: string;
    tag: string;
    tagColor: string;
    quote: string;
  }[];
  timelineLabel: string;
  transcript: {
    timestampSeconds: number;
    timestampLabel: string;
    speaker: string;
    role: string;
    text: string;
  }[];
}

export interface AiAskResponse {
  callId: string;
  question: string;
  answer: string;
  suggestedQuestions: string[];
}
