export type DealStage =
  | 'Qualification'
  | 'Discovery'
  | 'Proposal'
  | 'Negotiation'
  | 'Closed Won'
  | 'Closed Lost';

export type DealCategory =
  | 'Open'
  | 'Commit'
  | 'Most Likely'
  | 'Best Case'
  | 'Closed Won'
  | 'Closed Lost';

export interface DealOwner {
  name: string;
  initials: string;
  color: string;
}

export interface Deal {
  id: string;
  name: string;
  owner: DealOwner;
  stage: DealStage;
  category: DealCategory;
  amount: string;
  aiScore: number;
  warnings: number;
  meddpiccPercent: number;
  contacts: number;
  activityData: number[];
}

export type DealSentiment = 'Positive' | 'Neutral' | 'Negative';

export interface DealDetail {
  dealId: string;
  company: string;
  aiSummary: string;
  weeklyChange: string;
  buyerSentiment: DealSentiment;
  lastInteraction: string;
  keyRisks: string;
  activeWarnings: string[];
  playbookCompletion: number;
  meddic: Array<{
    label: string;
    status: 'Completed' | 'Pending';
    question: string;
    answer: string;
    note?: string;
  }>;
  nextSteps: string[];
  activity: {
    interactionCount: number;
    customerInteractionCount: number;
    totalTime: string;
    timeline: Array<{
      date: string;
      interactions: number;
    }>;
    details: Array<{
      title: string;
      subtitle: string;
      type: 'our' | 'customer';
      duration: string;
      date: string;
      direction?: 'inbound' | 'outbound';
      participants?: string[];
    }>;
  };
  crm: {
    forecastCategory: DealCategory;
    nextStep: string;
  };
}

export interface DealCommentPayload {
  comment: string;
}

export interface DealTaskPayload {
  dealId?: string;
  title: string;
  assignee?: string;
  dueDate?: string;
  description?: string;
}

export interface PipelineSummary {
  label: string;
  amount: string;
  count: number;
  change: string;
}

export interface DealFilterState {
  rep: string;
  stage: string;
  category: string | null;
  startDate: string | null;
  endDate: string | null;
  search: string;
}
