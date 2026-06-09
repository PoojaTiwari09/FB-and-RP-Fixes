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
  ActivityFeedParams,
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
    owner: { id: 'rep-001', name: 'Sarah Chen', initials: 'SC' },
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
    owner: { id: 'rep-001', name: 'Sarah Chen', initials: 'SC' },
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
    owner: { id: 'rep-002', name: 'Jordan Kim', initials: 'JK' },
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
    owner: { id: 'rep-002', name: 'Jordan Kim', initials: 'JK' },
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
    owner: { id: 'rep-003', name: 'Alex Rivera', initials: 'AR' },
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
    owner: { id: 'rep-003', name: 'Alex Rivera', initials: 'AR' },
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

// Helper to query Groq model or fall back to dynamic keywords response
async function getGroqResponse(systemPrompt: string, userMessage: string): Promise<string> {
  const localKey = typeof window !== 'undefined' ? localStorage.getItem('smart_call_groq_api_key') : '';
  const key = localKey || process.env.NEXT_PUBLIC_GROQ_API_KEY;

  if (!key) {
    const msgLower = userMessage.toLowerCase();
    if (msgLower.includes('budget') || msgLower.includes('cost') || msgLower.includes('price')) {
      return `For this account, budget constraints were noted. The customer mentioned that high implementation costs might delay sign-off. Emphasize our ROI calculator and flexible quarterly terms in your next proposal.`;
    }
    if (msgLower.includes('competitor') || msgLower.includes('compete') || msgLower.includes('vendor')) {
      return `Our signals indicate the client is actively evaluating competing products for their enterprise needs. Make sure to schedule a deep-dive call showcasing our unique security integrations and multi-tenant scaling capabilities.`;
    }
    if (msgLower.includes('renewal') || msgLower.includes('date') || msgLower.includes('when')) {
      return `The renewal is scheduled for Dec 16, 2024. The current sentiment is positive, but we need to resolve the pending legal reviews to ensure there are no last-minute delays.`;
    }
    if (msgLower.includes('contact') || msgLower.includes('who') || msgLower.includes('champion')) {
      return `The main contact is Marcus Lee (VP Engineering), who is highly supportive. However, we also need to win over the Finance Director to secure final approval.`;
    }
    return `Based on recent updates for this account, they are currently in negotiation stage for a deal valued at $180,000. Key next step: follow up on the proposal sent yesterday and schedule a review session.`;
  }

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });
    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }
    const data = await response.json();
    return data.choices[0]?.message?.content?.trim() || 'No response from AI.';
  } catch (err) {
    console.error('Failed calling Groq:', err);
    return `Error calling Groq API: ${err instanceof Error ? err.message : String(err)}`;
  }
}

export const mockAccountsList = (params?: AccountListParams): AccountListResponse => {
  let list = [...ALL_ACCOUNTS];

  if (params?.search) {
    const q = params.search.toLowerCase();
    list = list.filter(a => a.accountName.toLowerCase().includes(q));
  }

  if (params?.noActivity) {
    list = list.filter(a => a.activity.length === 0);
  }

  // Filter by Viewing (rep IDs or team IDs)
  if (params?.viewing && params.viewing.length > 0) {
    const selectedReps = new Set<string>();
    params.viewing.forEach(v => {
      if (v === 'team-west') {
        selectedReps.add('rep-001');
        selectedReps.add('rep-002');
      } else if (v === 'team-east') {
        selectedReps.add('rep-003');
      } else {
        selectedReps.add(v);
      }
    });
    list = list.filter(a => selectedReps.has(a.owner.id));
  }

  // Filter by Period
  if (params?.period) {
    const p = params.period;
    if (p === 'Last 7 days') {
      list = list.filter(a => ['Yesterday', '20 min ago', '1 day ago', '3 days ago', '5 days ago'].includes(a.lastActivity));
    } else if (p === 'Last 30 days' || p === 'This month') {
      list = list.filter(a => a.lastActivity !== '66 days ago');
    } else if (p === 'This quarter') {
      list = list.filter(a => a.accountId !== 'acc-006');
    }
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
        return ((valA as number) - (valB as number)) * asc;
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

export const mockAccountActivity = (
  _accountId: string,
  params?: ActivityFeedParams
): ActivityFeedResponse => {
  const allItems = [
    { type: 'Call' as const,    datetime: '2024-12-15T10:00:00Z', with: 'John Doe',   subject: 'Q4 Business Review',    createdBy: 'Sarah Chen' },
    { type: 'Email' as const,   datetime: '2024-12-14T09:00:00Z', with: 'Jane Smith', subject: 'Proposal Follow-up',    createdBy: 'Jordan Kim' },
    { type: 'Meeting' as const, datetime: '2024-12-13T14:00:00Z', with: 'Team',       subject: 'QBR Planning Session',  createdBy: 'Alex Rivera' },
    { type: 'Note' as const,    datetime: '2024-12-12T11:00:00Z', with: '-',          subject: 'Internal CRM note added', createdBy: 'Sarah Chen' },
  ];

  const filtered = params?.type && params.type !== 'all'
    ? allItems.filter(item => item.type === params.type)
    : allItems;

  return {
    items: filtered,
    total: filtered.length,
    page: 1,
    totalPages: 1,
  };
};

export const mockAccountBriefs = async (accountId: string): Promise<AccountBriefs> => {
  const account = ALL_ACCOUNTS.find(a => a.accountId === accountId);
  if (!account) {
    return { briefContent: 'Account not found.' };
  }
  const systemPrompt = `You are a helpful sales coaching assistant. Generate a professional and structured account brief (summary, highlights, recommended actions) in clean markdown format for a sales representative based on the provided account metadata. Keep it professional, structured, and easy to read.`;
  const userMessage = `Generate an account brief for the following account:
Account Name: ${account.accountName}
Exit ARR: $${account.exitARR.toLocaleString()}
Contacts Count: ${account.contactsCount}
Open Deals: $${account.openDeals.toLocaleString()}
Renewal Date: ${account.renewalDate}
Last Activity: ${account.lastActivity}
Manager Note: ${account.managerNote || 'None'}
Activities: ${JSON.stringify(account.activity)}`;

  const briefContent = await getGroqResponse(systemPrompt, userMessage);
  return { briefContent };
};

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

export const mockAiChat = async (message: string, accountName?: string): Promise<AiChatResponse> => {
  const systemPrompt = `You are a helpful sales assistant. Answer the user's question about the account "${accountName || 'this account'}" dynamically based on their query. Keep it concise (2-4 sentences) and professional.`;
  const reply = await getGroqResponse(systemPrompt, message);
  return { reply };
};
