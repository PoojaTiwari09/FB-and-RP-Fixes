import { PrismaClient } from '../node_modules/.prisma/client';

const prisma = new PrismaClient();
const TENANT_ID = '00000000-0000-0000-0000-000000000001';

// Rep UUID constants aligned with seed-m06.ts
const ALEX_MORGAN_UUID = '00000000-0000-0000-0000-000000000003';
const SARAH_CHEN_UUID = '00000000-0000-0000-0000-000000000004';
const MICHAEL_RODRIGUEZ_UUID = '00000000-0000-0000-0000-000000000005';
const DAVID_PARK_UUID = '00000000-0000-0000-0000-000000000006';
const EMILY_THOMPSON_UUID = '00000000-0000-0000-0000-000000000007';

async function main() {
  console.log('--- Seeding Revenue Manager Accounts & Coaching Data ---');

  // 1. Seed Accounts Config
  await prisma.managerAccountsConfig.upsert({
    where: { id: '00000000-0000-0000-0000-000000000000' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      tenantid: TENANT_ID,
      alertBanner: {
        totalARR: 2100000,
        accountCount: 18,
        inactiveDays: 14
      },
      kpiSummary: [
        { label: 'Accounts', value: 920000, count: 125 },
        { label: 'Renewal',  value: 240000, count: 40  },
        { label: 'Upsell',   value: 240000, count: 40  },
        { label: 'Churn',    value: 187000, count: 38  }
      ],
      viewers: {
        teams: [
          { id: 'team-west',  name: 'West Team',  memberCount: 4 },
          { id: 'team-east',  name: 'East Team',  memberCount: 3 }
        ],
        reps: [
          { id: SARAH_CHEN_UUID, name: 'Sarah Chen',   initials: 'SC' },
          { id: ALEX_MORGAN_UUID, name: 'Alex Morgan',   initials: 'AM' },
          { id: MICHAEL_RODRIGUEZ_UUID, name: 'Michael Rodriguez',  initials: 'MR' }
        ]
      }
    }
  });
  console.log('✔ ManagerAccountsConfig seeded.');

  // 2. Seed ManagerAccounts
  const accounts = [
    {
      id: '00000000-0000-0000-0000-000000000081',
      name: 'Technology Pacific',
      ownerId: SARAH_CHEN_UUID,
      ownerName: 'Sarah Chen',
      ownerInitials: 'SC',
      exitARR: 180000,
      contactsCount: 5,
      lastActivity: 'Yesterday',
      managerNote: 'Please contact...',
      openDeals: 20000,
      renewalDate: '2024-12-16',
      activity: [
        { type: 'Call',    timestamp: '2024-12-15T10:00:00Z', label: 'Call' },
        { type: 'Email',   timestamp: '2024-12-14T09:00:00Z', label: 'Email' },
        { type: 'Meeting', timestamp: '2024-12-13T14:00:00Z', label: 'Meeting' }
      ],
      recentActivities: [
        { type: 'Call',    datetime: '2024-12-15T10:00:00Z', with: 'John Doe',    subject: 'Q4 Review' },
        { type: 'Email',   datetime: '2024-12-14T09:00:00Z', with: 'Jane Smith',  subject: 'Proposal Follow-up' },
        { type: 'Meeting', datetime: '2024-12-13T14:00:00Z', with: 'Team',        subject: 'QBR Meeting' }
      ],
      overview: {
        risksAndObjections: [
          { title: 'Budget concerns raised',  severity: 'HIGH',   mentionedCount: 4, lastMentioned: '2 days ago' },
          { title: 'Champion left company',   severity: 'HIGH',   mentionedCount: 2, lastMentioned: '1 week ago' },
          { title: 'Competing vendor demos',  severity: 'MEDIUM', mentionedCount: 3, lastMentioned: '3 days ago' },
          { title: 'Legal review delays',     severity: 'LOW',    mentionedCount: 1, lastMentioned: '5 days ago' }
        ]
      },
      activityFeed: {
        items: [
          { type: 'Call',    datetime: '2024-12-15T10:00:00Z', with: 'John Doe',   subject: 'Q4 Business Review',    createdBy: 'Sarah Chen' },
          { type: 'Email',   datetime: '2024-12-14T09:00:00Z', with: 'Jane Smith', subject: 'Proposal Follow-up',    createdBy: 'Alex Morgan' },
          { type: 'Meeting', datetime: '2024-12-13T14:00:00Z', with: 'Team',       subject: 'QBR Planning Session',  createdBy: 'Michael Rodriguez' },
          { type: 'Note',    datetime: '2024-12-12T11:00:00Z', with: '-',          subject: 'Internal CRM note added', createdBy: 'Sarah Chen' }
        ],
        total: 4,
        page: 1,
        totalPages: 1
      },
      briefContent: `**Account Summary**\n\nTechnology Pacific is a mid-market software company with 450 employees. They are currently evaluating our enterprise plan for a Q1 expansion.\n\n**Key Highlights**\n- Active renewal conversation since October\n- Champion: Marcus Lee (VP Engineering)\n- Key risk: competing vendor evaluation in progress\n\n**Recommended Actions**\n- Schedule executive sponsor meeting\n- Send ROI analysis before Dec 20`,
      todos: {
        todos: [
          { id: 'todo-1', title: 'Send renewal proposal',   dueDate: '2024-12-20', assignee: 'Sarah Chen',  completed: false },
          { id: 'todo-2', title: 'Schedule exec meeting',   dueDate: '2024-12-18', assignee: 'Alex Morgan',  completed: false },
          { id: 'todo-3', title: 'Update CRM opportunity',  dueDate: '2024-12-16', assignee: 'Sarah Chen',  completed: true  }
        ]
      },
      notes: 'Key stakeholder Marcus Lee is supportive. Budget approved for Q1. Need to get legal sign-off by EOY.',
      notesUpdatedAt: new Date('2024-12-15T08:30:00Z'),
      crmFields: {
        crmFields: [
          { label: 'CRM Stage',       value: 'Negotiation' },
          { label: 'Close Date',      value: 'Dec 31, 2024' },
          { label: 'Deal Value',      value: '$180,000' },
          { label: 'Forecast Cat.',   value: 'Commit' },
          { label: 'Lead Source',     value: 'Inbound' },
          { label: 'Account Tier',    value: 'Enterprise' }
        ]
      },
      aiChatHistory: []
    },
    {
      id: '00000000-0000-0000-0000-000000000082',
      name: 'Parker Smith',
      ownerId: SARAH_CHEN_UUID,
      ownerName: 'Sarah Chen',
      ownerInitials: 'SC',
      exitARR: 100000,
      contactsCount: 3,
      lastActivity: '20 min ago',
      managerNote: null,
      openDeals: 300000,
      renewalDate: '2024-12-16',
      activity: [
        { type: 'Email', timestamp: '2024-12-15T08:00:00Z', label: 'Email' },
        { type: 'Call',  timestamp: '2024-12-14T11:00:00Z', label: 'Call' }
      ],
      recentActivities: [],
      overview: { risksAndObjections: [] },
      activityFeed: { items: [], total: 0, page: 1, totalPages: 0 },
      briefContent: '',
      todos: { todos: [] },
      notes: '',
      notesUpdatedAt: null,
      crmFields: { crmFields: [] },
      aiChatHistory: []
    },
    {
      id: '00000000-0000-0000-0000-000000000083',
      name: 'Southern Provider',
      ownerId: ALEX_MORGAN_UUID,
      ownerName: 'Alex Morgan',
      ownerInitials: 'AM',
      exitARR: 100000,
      contactsCount: 2,
      lastActivity: '5 days ago',
      managerNote: null,
      openDeals: 275000,
      renewalDate: '2024-12-16',
      activity: [
        { type: 'Meeting', timestamp: '2024-12-11T10:00:00Z', label: 'Meeting' },
        { type: 'Note',    timestamp: '2024-12-10T09:00:00Z', label: 'Note' }
      ],
      recentActivities: [],
      overview: { risksAndObjections: [] },
      activityFeed: { items: [], total: 0, page: 1, totalPages: 0 },
      briefContent: '',
      todos: { todos: [] },
      notes: '',
      notesUpdatedAt: null,
      crmFields: { crmFields: [] },
      aiChatHistory: []
    },
    {
      id: '00000000-0000-0000-0000-000000000084',
      name: 'Fusion Connect',
      ownerId: ALEX_MORGAN_UUID,
      ownerName: 'Alex Morgan',
      ownerInitials: 'AM',
      exitARR: 100000,
      contactsCount: 1,
      lastActivity: '3 days ago',
      managerNote: null,
      openDeals: 25000,
      renewalDate: '2024-12-16',
      activity: [
        { type: 'Call', timestamp: '2024-12-13T15:00:00Z', label: 'Call' }
      ],
      recentActivities: [],
      overview: { risksAndObjections: [] },
      activityFeed: { items: [], total: 0, page: 1, totalPages: 0 },
      briefContent: '',
      todos: { todos: [] },
      notes: '',
      notesUpdatedAt: null,
      crmFields: { crmFields: [] },
      aiChatHistory: []
    },
    {
      id: '00000000-0000-0000-0000-000000000085',
      name: 'CyberByte Systems',
      ownerId: MICHAEL_RODRIGUEZ_UUID,
      ownerName: 'Michael Rodriguez',
      ownerInitials: 'MR',
      exitARR: 100000,
      contactsCount: 0,
      lastActivity: '66 days ago',
      managerNote: null,
      openDeals: 300000,
      renewalDate: '2024-12-16',
      activity: [],
      recentActivities: [],
      overview: { risksAndObjections: [] },
      activityFeed: { items: [], total: 0, page: 1, totalPages: 0 },
      briefContent: '',
      todos: { todos: [] },
      notes: '',
      notesUpdatedAt: null,
      crmFields: { crmFields: [] },
      aiChatHistory: []
    },
    {
      id: '00000000-0000-0000-0000-000000000086',
      name: 'Legend Homes',
      ownerId: MICHAEL_RODRIGUEZ_UUID,
      ownerName: 'Michael Rodriguez',
      ownerInitials: 'MR',
      exitARR: 100000,
      contactsCount: 0,
      lastActivity: '1 day ago',
      managerNote: null,
      openDeals: 0,
      renewalDate: '2024-12-16',
      activity: [
        { type: 'Email', timestamp: '2024-12-15T07:00:00Z', label: 'Email' }
      ],
      recentActivities: [],
      overview: { risksAndObjections: [] },
      activityFeed: { items: [], total: 0, page: 1, totalPages: 0 },
      briefContent: '',
      todos: { todos: [] },
      notes: '',
      notesUpdatedAt: null,
      crmFields: { crmFields: [] },
      aiChatHistory: []
    }
  ];

  for (const acc of accounts) {
    await prisma.managerAccount.upsert({
      where: { id: acc.id },
      update: {
        name: acc.name,
        ownerId: acc.ownerId,
        ownerName: acc.ownerName,
        ownerInitials: acc.ownerInitials,
        exitARR: acc.exitARR,
        contactsCount: acc.contactsCount,
        lastActivity: acc.lastActivity,
        managerNote: acc.managerNote,
        openDeals: acc.openDeals,
        renewalDate: acc.renewalDate,
        activity: acc.activity,
        recentActivities: acc.recentActivities,
        overview: acc.overview,
        activityFeed: acc.activityFeed,
        briefContent: acc.briefContent,
        todos: acc.todos,
        notes: acc.notes,
        notesUpdatedAt: acc.notesUpdatedAt,
        crmFields: acc.crmFields,
        aiChatHistory: acc.aiChatHistory
      },
      create: {
        tenantid: TENANT_ID,
        ...acc
      }
    });
  }
  console.log('✔ 6 ManagerAccount records seeded.');

  // 3. Seed Coaching Config
  await prisma.managerCoachingConfig.upsert({
    where: { id: '00000000-0000-0000-0000-000000000000' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000000',
      tenantid: TENANT_ID,
      filters: {
        periods: ['Last 7 days', 'Last 30 days', 'Last quarter', 'This quarter'],
        teams: [
          { id: 'team-west', name: 'West Team' },
          { id: 'team-east', name: 'East Team' }
        ]
      },
      activity: [
        { repId: ALEX_MORGAN_UUID, repName: 'Alex Morgan',   initials: 'AM', avatarColor: '#6c5ce7', callsCount: 42, emailsCount: 87, meetingsCount: 12, totalActivities: 141 },
        { repId: SARAH_CHEN_UUID, repName: 'Sarah Chen',     initials: 'SC', avatarColor: '#00b894', callsCount: 35, emailsCount: 62, meetingsCount:  9, totalActivities: 106 },
        { repId: MICHAEL_RODRIGUEZ_UUID, repName: 'Michael Rodriguez',     initials: 'MR', avatarColor: '#fd79a8', callsCount: 28, emailsCount: 55, meetingsCount:  7, totalActivities:  90 },
        { repId: DAVID_PARK_UUID, repName: 'David Park',    initials: 'DP', avatarColor: '#fdcb6e', callsCount: 51, emailsCount: 73, meetingsCount: 14, totalActivities: 138 },
        { repId: EMILY_THOMPSON_UUID, repName: 'Emily Thompson',  initials: 'ET', avatarColor: '#74b9ff', callsCount: 22, emailsCount: 41, meetingsCount:  5, totalActivities:  68 }
      ],
      interaction: {
        reps: [
          { repId: ALEX_MORGAN_UUID, repName: 'Alex Morgan',  initials: 'AM', avatarColor: '#6c5ce7', talkRatio: 68, talkRatioStatus: 'critical',  questionRate: 11, questionRateStatus: 'critical',  interactivity: 4, monologue: '4:12', monologueStatus: 'critical'  },
          { repId: SARAH_CHEN_UUID, repName: 'Sarah Chen',    initials: 'SC', avatarColor: '#00b894', talkRatio: 41, talkRatioStatus: 'optimal',   questionRate: 21, questionRateStatus: 'optimal',   interactivity: 8, monologue: '1:45', monologueStatus: 'optimal'   },
          { repId: MICHAEL_RODRIGUEZ_UUID, repName: 'Michael Rodriguez',    initials: 'MR', avatarColor: '#fd79a8', talkRatio: 55, talkRatioStatus: 'warning',   questionRate: 16, questionRateStatus: 'warning',   interactivity: 6, monologue: '2:30', monologueStatus: 'warning'   },
          { repId: DAVID_PARK_UUID, repName: 'David Park',   initials: 'DP', avatarColor: '#fdcb6e', talkRatio: 38, talkRatioStatus: 'optimal',   questionRate: 24, questionRateStatus: 'optimal',   interactivity: 9, monologue: '1:20', monologueStatus: 'optimal'   },
          { repId: EMILY_THOMPSON_UUID, repName: 'Emily Thompson', initials: 'ET', avatarColor: '#74b9ff', talkRatio: 49, talkRatioStatus: 'warning',   questionRate: 14, questionRateStatus: 'warning',   interactivity: 5, monologue: '3:05', monologueStatus: 'warning'   }
        ],
        benchmarks: {
          talkRatioOptimal: '<43%',
          questionRateOptimal: '18+/hr',
          monologueOptimal: '<2 min'
        }
      },
      responsiveness: [
        { repId: ALEX_MORGAN_UUID, repName: 'Alex Morgan',  avgResponseTime: '4.2 hrs', followUpRate: 62, replyRate: 71 },
        { repId: SARAH_CHEN_UUID, repName: 'Sarah Chen',    avgResponseTime: '1.1 hrs', followUpRate: 91, replyRate: 88 },
        { repId: MICHAEL_RODRIGUEZ_UUID, repName: 'Michael Rodriguez',  avgResponseTime: '2.8 hrs', followUpRate: 74, replyRate: 79 },
        { repId: DAVID_PARK_UUID, repName: 'David Park',   avgResponseTime: '0.9 hrs', followUpRate: 95, replyRate: 93 },
        { repId: EMILY_THOMPSON_UUID, repName: 'Emily Thompson', avgResponseTime: '5.7 hrs', followUpRate: 55, replyRate: 60 }
      ],
      scorecards: [
        { repId: ALEX_MORGAN_UUID, repName: 'Alex Morgan',  overallScore: 58, categories: [{ name: 'Discovery', score: 45 }, { name: 'Closing', score: 61 }, { name: 'Objection Handling', score: 52 }] },
        { repId: SARAH_CHEN_UUID, repName: 'Sarah Chen',    overallScore: 89, categories: [{ name: 'Discovery', score: 92 }, { name: 'Closing', score: 88 }, { name: 'Objection Handling', score: 91 }] },
        { repId: MICHAEL_RODRIGUEZ_UUID, repName: 'Michael Rodriguez',    overallScore: 74, categories: [{ name: 'Discovery', score: 78 }, { name: 'Closing', score: 70 }, { name: 'Objection Handling', score: 75 }] },
        { repId: DAVID_PARK_UUID, repName: 'David Park',   overallScore: 93, categories: [{ name: 'Discovery', score: 95 }, { name: 'Closing', score: 94 }, { name: 'Objection Handling', score: 90 }] },
        { repId: EMILY_THOMPSON_UUID, repName: 'Emily Thompson', overallScore: 62, categories: [{ name: 'Discovery', score: 58 }, { name: 'Closing', score: 65 }, { name: 'Objection Handling', score: 60 }] }
      ],
      aiInsights: [
        {
          repName: 'Alex Morgan',
          avatarColor: '#6c5ce7',
          insight: 'Alex Morgan dominates conversations with a 68% talk ratio, well above the 43% optimal threshold.',
          recommendation: 'Coach Alex on active listening techniques. Practice question-based discovery in next 1:1.'
        },
        {
          repName: 'Emily Thompson',
          avatarColor: '#74b9ff',
          insight: "Emily Thompson's average response time of 5.7 hours is impacting prospect engagement scores.",
          recommendation: 'Set response time SLA targets. Review email templates to enable faster follow-up.'
        },
        {
          repName: 'Sarah Chen',
          avatarColor: '#00b894',
          insight: 'Sarah Chen maintains an optimal talk ratio of 41% with the highest question rate on the team (21/hr).',
          recommendation: 'Feature Sarah as a peer coach for discovery call techniques. Consider shadowing program.'
        }
      ],
      teamVsBenchmark: [
        { metric: 'talkRatio',    teamAvg: 50,  benchmarkValue: 43,  delta: -7  },
        { metric: 'questionRate', teamAvg: 17,  benchmarkValue: 18,  delta: -1  },
        { metric: 'monologue',    teamAvg: 2.6, benchmarkValue: 2.0, delta: -0.6 }
      ]
    }
  });
  console.log('✔ ManagerCoachingConfig seeded.');

  // 4. Seed ManagerCoachingReps (e.g. Alex Morgan, Sarah Chen)
  const coachingReps = [
    {
      id: ALEX_MORGAN_UUID,
      header: {
        repId: ALEX_MORGAN_UUID,
        name: 'Alex Morgan',
        initials: 'AM',
        avatarColor: '#f6c23e',
        title: 'Interaction Coaching',
        callsAnalyzed: 42
      },
      kpis: {
        talkRatio: { value: '68%', optimalText: 'Optimal <43%', status: 'critical' },
        questionRate: { value: '9/hr', optimalText: 'Optimal 18+/hr', status: 'critical' },
        monologue: { value: '3m 45s', optimalText: 'Optimal <2 min', status: 'critical' }
      },
      trend: {
        title: 'Talk ratio — 8 week trend',
        benchmark: 43,
        insightText: 'Coaching conversation on talk ratio — Week 3. Trend improving since W4.',
        weeks: [
          { label: 'W1', value: 72, status: 'critical' },
          { label: 'W2', value: 70, status: 'critical' },
          { label: 'W3', value: 74, status: 'critical' },
          { label: 'W4', value: 71, status: 'critical' },
          { label: 'W5', value: 68, status: 'warning' },
          { label: 'W6', value: 65, status: 'warning' },
          { label: 'W7', value: 62, status: 'warning' },
          { label: 'W8', value: 57, status: 'optimal' }
        ]
      },
      recentCalls: [
        { id: 'call-1', title: 'Discovery — Meridian Logistics', dateRange: 'May 2 · 18 min', talkRatio: 74, talkRatioStatus: 'critical', questionRate: '6/hr', duration: '18 min' },
        { id: 'call-2', title: 'Demo — Apex Solutions', dateRange: 'Apr 20 · 34 min', talkRatio: 56, talkRatioStatus: 'warning', questionRate: '11/hr', duration: '34 min' },
        { id: 'call-3', title: 'Discovery — Kova Group', dateRange: 'Apr 20 · 22 min', talkRatio: 65, talkRatioStatus: 'warning', questionRate: '8/hr', duration: '22 min' }
      ],
      observedPatterns: [
        { id: 'pat-1', text: 'Rep interrupts prospects frequently during discovery calls', type: 'warning' },
        { id: 'pat-2', text: 'Question pacing improves in shorter calls', type: 'warning' },
        { id: 'pat-3', text: 'Long monologues happen mostly during pricing discussions', type: 'warning' }
      ],
      recommendedActions: [
        { id: 'rec-1', text: 'Pause after every 2-3 sentences', type: 'success' },
        { id: 'rec-2', text: 'Increase discovery questioning cadence', type: 'success' },
        { id: 'rec-3', text: 'Use recap prompts before pricing discussions', type: 'success' }
      ],
      coachingHistory: [
        { id: 'hist-1', dateStr: 'Apr 14', notes: 'Discussed discovery pacing', managerInitials: 'SM' },
        { id: 'hist-2', dateStr: 'Apr 25', notes: 'Reviewed long monologue patterns', managerInitials: 'SM' }
      ]
    },
    {
      id: SARAH_CHEN_UUID,
      header: {
        repId: SARAH_CHEN_UUID,
        name: 'Sarah Chen',
        initials: 'SC',
        avatarColor: '#1cc88a',
        title: 'Interaction Coaching',
        callsAnalyzed: 35
      },
      kpis: {
        talkRatio: { value: '41%', optimalText: 'Optimal <43%', status: 'optimal' },
        questionRate: { value: '21/hr', optimalText: 'Optimal 18+/hr', status: 'optimal' },
        monologue: { value: '1m 45s', optimalText: 'Optimal <2 min', status: 'optimal' }
      },
      trend: {
        title: 'Talk ratio — 8 week trend',
        benchmark: 43,
        insightText: 'Maintaining optimal talk ratio.',
        weeks: [
          { label: 'W1', value: 45, status: 'optimal' },
          { label: 'W2', value: 43, status: 'optimal' },
          { label: 'W3', value: 42, status: 'optimal' },
          { label: 'W4', value: 44, status: 'optimal' },
          { label: 'W5', value: 41, status: 'optimal' },
          { label: 'W6', value: 40, status: 'optimal' },
          { label: 'W7', value: 42, status: 'optimal' },
          { label: 'W8', value: 41, status: 'optimal' }
        ]
      },
      recentCalls: [
        { id: 'call-1', title: 'QBR — Delta Energy', dateRange: 'Jun 1 · 45 min', talkRatio: 42, talkRatioStatus: 'optimal', questionRate: '20/hr', duration: '45 min' }
      ],
      observedPatterns: [
        { id: 'pat-1', text: 'Excellent pacing and active listening', type: 'success' }
      ],
      recommendedActions: [
        { id: 'rec-1', text: 'Shadow less experienced reps as a peer coach', type: 'success' }
      ],
      coachingHistory: [
        { id: 'hist-1', dateStr: 'May 10', notes: 'Excellent call handling discussion', managerInitials: 'SM' }
      ]
    }
  ];

  for (const rep of coachingReps) {
    await prisma.managerCoachingRep.upsert({
      where: { id: rep.id },
      update: {
        header: rep.header,
        kpis: rep.kpis,
        trend: rep.trend,
        recentCalls: rep.recentCalls,
        observedPatterns: rep.observedPatterns,
        recommendedActions: rep.recommendedActions,
        coachingHistory: rep.coachingHistory
      },
      create: {
        tenantid: TENANT_ID,
        ...rep
      }
    });
  }
  console.log('✔ Coaching rep details seeded.');
  console.log('--- Database Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
