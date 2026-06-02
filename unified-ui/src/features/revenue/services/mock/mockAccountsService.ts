// ============================================================
// Mock Accounts Service — Fallback only (API failure)
// Data mirrors exact API response shapes from accounts.types.ts
// Replace data values in future sprint when real datasets arrive.
// ============================================================

import type {
  AlertBannerData,
  KpiSummaryResponse,
  ViewersResponse,
  AccountListResponse,
  RecentActivity,
  AccountOverviewData,
  ActivityFeedResponse,
  AccountBriefs,
  TodosResponse,
  NotesData,
  CrmData,
  AiChatResponse,
  AccountListParams,
  AccountRow,
} from '../../types/accounts.types';

export const mockAlertBanner = (): AlertBannerData => ({
  totalARR: 2100000,
  accountCount: 18,
  inactiveDays: 14,
});

export const mockAccountsSummary = (): KpiSummaryResponse => [
  { label: 'Accounts', value: 920000, count: 125 },
  { label: 'Renewal',  value: 240000, count: 40  },
  { label: 'Upsell',   value: 240000, count: 40  },
  { label: 'Churn',    value: 187000, count: 38  },
];

export const mockViewers = (): ViewersResponse => ({
  teams: [
    { id: 'team-west',  name: 'West Team',  memberCount: 4 },
    { id: 'team-east',  name: 'East Team',  memberCount: 3 },
  ],
  reps: [
    { id: 'rep-001', name: 'Sarah Chen',   initials: 'SC' },
    { id: 'rep-002', name: 'Jordan Kim',   initials: 'JK' },
    { id: 'rep-003', name: 'Alex Rivera',  initials: 'AR' },
  ],
});

const ALL_ACCOUNTS: AccountRow[] = [
    {
      accountId: 'acc-001',
      accountName: 'Technology Pacific',
      owner: { id: 'rep-001', name: 'Unassigned', initials: 'U' },
      exitARR: 180000,
      contactsCount: 5,
      activity: [
        { type: 'Call',    timestamp: '2024-12-15T10:00:00Z', label: 'Call' },
        { type: 'Email',   timestamp: '2024-12-14T09:00:00Z', label: 'Email' },
        { type: 'Meeting', timestamp: '2024-12-13T14:00:00Z', label: 'Meeting' },
      ],
      lastActivity: 'Yesterday',
      managerNote: 'Please contact...',
      openDeals: 20000,
      renewalDate: '2024-12-16',
    },
    {
      accountId: 'acc-002',
      accountName: 'Parker Smith',
      owner: { id: 'rep-001', name: 'Unassigned', initials: 'U' },
      exitARR: 100000,
      contactsCount: 3,
      activity: [
        { type: 'Email', timestamp: '2024-12-15T08:00:00Z', label: 'Email' },
        { type: 'Call',  timestamp: '2024-12-14T11:00:00Z', label: 'Call' },
      ],
      lastActivity: '20 min ago',
      managerNote: null,
      openDeals: 300000,
      renewalDate: '2024-12-16',
    },
    {
      accountId: 'acc-003',
      accountName: 'Southern Provider',
      owner: { id: 'rep-002', name: 'Unassigned', initials: 'U' },
      exitARR: 100000,
      contactsCount: 2,
      activity: [
        { type: 'Meeting', timestamp: '2024-12-11T10:00:00Z', label: 'Meeting' },
        { type: 'Note',    timestamp: '2024-12-10T09:00:00Z', label: 'Note' },
      ],
      lastActivity: '5 days ago',
      managerNote: null,
      openDeals: 275000,
      renewalDate: '2024-12-16',
    },
    {
      accountId: 'acc-004',
      accountName: 'Fusion Connect',
      owner: { id: 'rep-002', name: 'Unassigned', initials: 'U' },
      exitARR: 100000,
      contactsCount: 1,
      activity: [
        { type: 'Call', timestamp: '2024-12-13T15:00:00Z', label: 'Call' },
      ],
      lastActivity: '3 days ago',
      managerNote: null,
      openDeals: 25000,
      renewalDate: '2024-12-16',
    },
    {
      accountId: 'acc-005',
      accountName: 'CyberByte Systems',
      owner: { id: 'rep-003', name: 'Unassigned', initials: 'U' },
      exitARR: 100000,
      contactsCount: 0,
      activity: [],
      lastActivity: '66 days ago',
      managerNote: null,
      openDeals: 300000,
      renewalDate: '2024-12-16',
    },
    {
      accountId: 'acc-006',
      accountName: 'Legend Homes',
      owner: { id: 'rep-003', name: 'Unassigned', initials: 'U' },
      exitARR: 100000,
      contactsCount: 0,
      activity: [
        { type: 'Email', timestamp: '2024-12-15T07:00:00Z', label: 'Email' },
      ],
      lastActivity: '1 day ago',
      managerNote: null,
      openDeals: 0,
      renewalDate: '2024-12-16',
    },
];

export const mockAccountsList = (params?: AccountListParams): AccountListResponse => {
  let list = [...ALL_ACCOUNTS];

  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter(a => a.accountName.toLowerCase().includes(q));
  }

  if (params?.noActivity) {
    list = list.filter(a => a.activity.length === 0);
  }

  if (params?.sortBy) {
    const asc = params.sortOrder === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      const valA = a[params.sortBy as keyof AccountRow];
      const valB = b[params.sortBy as keyof AccountRow];
      if (typeof valA === 'string' && typeof valB === 'string') {
        return valA.localeCompare(valB) * asc;
      }
      if (typeof valA === 'number' && typeof valB === 'number') {
        return (valA - valB) * asc;
      }
      return 0;
    });
  }

  return {
    total: list.length,
    page: 1,
    size: 25,
    totalPages: 1,
    accounts: list,
  };
};

export const mockRecentActivities = (_accountId: string): RecentActivity[] => [
  { type: 'Call',    datetime: '2024-12-15T10:00:00Z', with: 'John Doe',    subject: 'Q4 Review'         },
  { type: 'Email',   datetime: '2024-12-14T09:00:00Z', with: 'Jane Smith',  subject: 'Proposal Follow-up' },
  { type: 'Meeting', datetime: '2024-12-13T14:00:00Z', with: 'Team',        subject: 'QBR Meeting'        },
];

export const mockAccountOverview = (_accountId: string): AccountOverviewData => ({
  risksAndObjections: [
    { title: 'Budget concerns raised',  severity: 'HIGH',   mentionedCount: 4, lastMentioned: '2 days ago' },
    { title: 'Champion left company',   severity: 'HIGH',   mentionedCount: 2, lastMentioned: '1 week ago' },
    { title: 'Competing vendor demos',  severity: 'MEDIUM', mentionedCount: 3, lastMentioned: '3 days ago' },
    { title: 'Legal review delays',     severity: 'LOW',    mentionedCount: 1, lastMentioned: '5 days ago' },
  ],
});

export const mockAccountActivity = (_accountId: string): ActivityFeedResponse => ({
  items: [
    { type: 'Call',    datetime: '2024-12-15T10:00:00Z', with: 'John Doe',   subject: 'Q4 Business Review',    createdBy: 'Sarah Chen' },
    { type: 'Email',   datetime: '2024-12-14T09:00:00Z', with: 'Jane Smith', subject: 'Proposal Follow-up',    createdBy: 'Jordan Kim' },
    { type: 'Meeting', datetime: '2024-12-13T14:00:00Z', with: 'Team',       subject: 'QBR Planning Session',  createdBy: 'Alex Rivera' },
    { type: 'Note',    datetime: '2024-12-12T11:00:00Z', with: '-',          subject: 'Internal CRM note added', createdBy: 'Sarah Chen' },
  ],
  total: 4,
  page: 1,
  totalPages: 1,
});

export const mockAccountBriefs = (_accountId: string): AccountBriefs => ({
  briefContent: `**Account Summary**\n\nTechnology Pacific is a mid-market software company with 450 employees. They are currently evaluating our enterprise plan for a Q1 expansion.\n\n**Key Highlights**\n- Active renewal conversation since October\n- Champion: Marcus Lee (VP Engineering)\n- Key risk: competing vendor evaluation in progress\n\n**Recommended Actions**\n- Schedule executive sponsor meeting\n- Send ROI analysis before Dec 20`,
});

export const mockAccountTodos = (_accountId: string): TodosResponse => ({
  todos: [
    { id: 'todo-1', title: 'Send renewal proposal',   dueDate: '2024-12-20', assignee: 'Sarah Chen',  completed: false },
    { id: 'todo-2', title: 'Schedule exec meeting',   dueDate: '2024-12-18', assignee: 'Jordan Kim',  completed: false },
    { id: 'todo-3', title: 'Update CRM opportunity',  dueDate: '2024-12-16', assignee: 'Sarah Chen',  completed: true  },
  ],
});

export const mockAccountNotes = (_accountId: string): NotesData => ({
  notes: 'Key stakeholder Marcus Lee is supportive. Budget approved for Q1. Need to get legal sign-off by EOY.',
  updatedAt: '2024-12-15T08:30:00Z',
});

export const mockAccountCrm = (_accountId: string): CrmData => ({
  crmFields: [
    { label: 'CRM Stage',       value: 'Negotiation'     },
    { label: 'Close Date',      value: 'Dec 31, 2024'    },
    { label: 'Deal Value',      value: '$180,000'        },
    { label: 'Forecast Cat.',   value: 'Commit'          },
    { label: 'Lead Source',     value: 'Inbound'         },
    { label: 'Account Tier',    value: 'Enterprise'      },
  ],
});

export const mockAiChat = (_message: string): AiChatResponse => ({
  reply: 'Based on recent activity, this account has shown strong engagement with your renewal proposal. The champion Marcus Lee last responded 2 days ago and flagged budget as a key concern. I recommend scheduling a call to address the ROI model directly.',
});
