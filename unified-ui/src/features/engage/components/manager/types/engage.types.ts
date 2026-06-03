export interface Task {
  id: string;
  title: string;
  contactName: string;
  companyName: string;
  channel: 'call' | 'email' | 'linkedin' | 'custom';
  scheduledTime: string;
  dueDateTime: string;
  isOverdue: boolean;
  interactionCount: number;
  priority: 'high' | 'normal' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'reassigned';
  dueDate: string; // YYYY-MM-DD
  dueTime: string;
  assigneeId: string;
  assigneeName: string;
  assigneeRole: string;
  aiSignal?: string;
  aiSignalType?: 'risk' | 'opportunity' | 'inactivity' | 'momentum';
  arr?: string;
  aiInsight?: string;
  recommendedNextSteps?: string[];
  recentActivity?: {
    date: string;
    activityType: 'call' | 'email' | 'demo' | 'linkedin_profile_viewed' | 'link_clicked' | 'meeting_scheduled';
    description: string;
  }[];
  notes?: string;
  todoType?: 'flow' | 'manual' | 'recommended';
  entityType?: 'account' | 'deal' | 'lead';
  workflowName?: string;
  workflowStep?: number;
  totalWorkflowSteps?: number;
  mutualConnections?: number;
  emailDraft?: {
    to: string;
    fromOptions: string[];
    subject: string;
    body: string;
  };
  linkedinScript?: {
    messageScript: string;
  };
  snoozedUntil?: string;
  updatedAt?: string;
  createdAt?: string;
  localTime?: string;
}

export interface FilterState {
  dueDate: 'today' | 'tomorrow' | 'this-week' | 'overdue' | 'custom' | null;
  dueDateFrom?: string;
  dueDateTo?: string;
  todoTypes: Set<'flow' | 'manual' | 'recommended'>;
  flowNames: Set<string>;
  entityTypes: Set<'account' | 'deal' | 'lead'>;
  localTime: 'morning' | 'business_hours' | 'custom' | null;
}

export type TaskType = 'all' | 'email' | 'call' | 'linkedin' | 'custom';
export type GroupByOption = 'none' | 'flow' | 'step_number';
export type SortOption = 'due_date' | 'recent_activity' | 'priority';
export type StatusTab = 'today' | 'inProgress' | 'upcoming' | 'completed' | 'snoozed';
