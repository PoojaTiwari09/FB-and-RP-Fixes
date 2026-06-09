/** Demo seed aligned with Revenue-Intelligence-UI Engage rep mocks. */

// ─── GET /api/engage/tasks ────────────────────────────────────────────────────

export const MOCK_TASKS = [
  {
    taskId: 'task-001',
    contactId: 'contact-001',
    contactName: 'Sarah Chen',
    company: 'Acme Corp',
    channelType: 'CALL',
    sequenceName: 'Enterprise Onboarding Flow',
    sequenceStep: 'Step 1',
    scheduledTime: '2:30 PM PST',
    dueDateTime: '2026-05-28T14:00:00-07:00',
    interactionCount: 6,
    priority: 'HIGH',
    status: 'PENDING',
    isOverdue: false,
    isAtRisk: true,
  },
  {
    taskId: 'task-002',
    contactId: 'contact-001',
    contactName: 'Sarah Chen',
    company: 'Acme Corp',
    channelType: 'CALL',
    sequenceName: 'Enterprise Onboarding Flow',
    sequenceStep: 'Step 2',
    scheduledTime: '2:30 PM PST',
    dueDateTime: '2026-05-28T13:00:00-07:00',
    interactionCount: 6,
    priority: 'HIGH',
    status: 'PENDING',
    isOverdue: false,
    isAtRisk: false,
  },
  {
    taskId: 'task-003',
    contactId: 'contact-002',
    contactName: 'Michael Rodriguez',
    company: 'TechFlow Inc',
    channelType: 'CALL',
    sequenceName: 'Mid-Market Follow-up',
    sequenceStep: 'Step 1',
    scheduledTime: '1:20 PM PST',
    dueDateTime: '2026-05-27T16:30:00-07:00',
    interactionCount: 7,
    priority: 'HIGH',
    status: 'OVERDUE',
    isOverdue: true,
    isAtRisk: true,
  },
  {
    taskId: 'task-004',
    contactId: 'contact-005',
    contactName: 'Karen Taylor',
    company: 'Enterprise Solutions Ltd',
    channelType: 'EMAIL',
    sequenceName: 'Enterprise Onboarding Flow',
    sequenceStep: 'Step 5',
    scheduledTime: '10:00 AM PST',
    dueDateTime: '2026-05-28T13:00:00-07:00',
    interactionCount: 16,
    priority: 'NORMAL',
    status: 'PENDING',
    isOverdue: false,
    isAtRisk: false,
  },
  {
    taskId: 'task-005',
    contactId: 'contact-006',
    contactName: 'Tom Anderson',
    company: 'SalesTech Pro',
    channelType: 'LINKEDIN',
    sequenceName: '',
    sequenceStep: '',
    scheduledTime: '2:00 PM PST',
    dueDateTime: '2026-05-28T17:00:00-07:00',
    interactionCount: 1,
    priority: 'NORMAL',
    status: 'PENDING',
    isOverdue: false,
    isAtRisk: false,
  },
];

// ─── GET /api/engage/tasks/summary ───────────────────────────────────────────

export const MOCK_TASK_SUMMARY = {
  totalTasksToday: 5,
  completedCount: 0,
  inProgressCount: 2,
  upcomingCount: 5,
  atRiskCount: 1,
  dueTodayCount: 4,
  highPriorityCount: 3,
  progressPercent: 0,
};

// ─── GET /api/engage/activity/recent ─────────────────────────────────────────

export const MOCK_RECENT_ACTIVITY = [
  {
    activityId: 'act-001',
    contactId: 'contact-001',
    contactName: 'Sarah Chen',
    company: 'Acme Corp',
    channelType: 'CALL',
    summary: 'Discussed pricing concerns and ROI timeline',
    occurredAt: '2026-05-28T08:00:00-07:00',
    timeAgoLabel: '2h ago',
  },
  {
    activityId: 'act-002',
    contactId: 'contact-002',
    contactName: 'Michael Rodriguez',
    company: 'TechFlow Inc',
    channelType: 'EMAIL',
    summary: 'Requested technical documentation for security review',
    occurredAt: '2026-05-28T05:00:00-07:00',
    timeAgoLabel: '5h ago',
  },
  {
    activityId: 'act-003',
    contactId: 'contact-003',
    contactName: 'Jennifer Kim',
    company: 'DataStream Solutions',
    channelType: 'LINKEDIN',
    summary: 'Shared competitor analysis article',
    occurredAt: '2026-05-27T10:00:00-07:00',
    timeAgoLabel: '1d ago',
  },
  {
    activityId: 'act-004',
    contactId: 'contact-004',
    contactName: 'David Park',
    company: 'CloudBridge',
    channelType: 'CALL',
    summary: 'Weekly pilot program check-in',
    occurredAt: '2026-05-26T10:00:00-07:00',
    timeAgoLabel: '2d ago',
  },
];

// ─── GET /api/engage/tasks/{taskId}/detail ────────────────────────────────────

export const MOCK_TASK_DETAILS: Record<string, Record<string, unknown>> = {
  'task-001': {
    taskId: 'task-001',
    taskTitle: 'Follow up on Q2 contract renewal',
    contactId: 'contact-001',
    contactName: 'Sarah Chen',
    company: 'Acme Corp',
    arrValue: '$240K ARR',
    scheduledDateTime: '2026-05-28T14:00:00-07:00',
    aiInsight:
      'Sarah opened your last email 4 times yesterday and visited the pricing page twice. Strong buying signal — confirm budget authority before this call.',
    recommendedNextSteps: [
      'Address budget concerns with the ROI calculator',
      'Share the Acme-specific case study from the resource hub',
      'Schedule a technical deep-dive with their IT lead',
    ],
    recentActivity: [
      { date: 'May 26', channelType: 'EMAIL', summary: 'Sent proposal follow-up — opened 4x' },
      { date: 'May 24', channelType: 'CALL', summary: 'Discovery call — discussed timeline and budget' },
      { date: 'May 20', channelType: 'EMAIL', summary: 'Intro email sent — replied with questions' },
    ],
    existingNotes:
      'Sarah confirmed they have budget approved but needs sign-off from CFO by end of Q2.',
  },
  'task-002': {
    taskId: 'task-002',
    taskTitle: 'Send product demo recording',
    contactId: 'contact-001',
    contactName: 'Sarah Chen',
    company: 'Acme Corp',
    arrValue: '$240K ARR',
    scheduledDateTime: '2026-05-28T13:00:00-07:00',
    aiInsight:
      'Step 2 of the Enterprise Onboarding Flow. Sarah responded positively to step 1. Personalize this with the use cases she mentioned on the May 24 call.',
    recommendedNextSteps: [
      'Include the 5-minute product demo clip focused on their use case',
      'Reference the ROI numbers she mentioned in the discovery call',
      'Add a clear CTA for a follow-up call next week',
    ],
    recentActivity: [
      { date: 'May 26', channelType: 'CALL', summary: 'Introductory call completed — positive response' },
      { date: 'May 24', channelType: 'EMAIL', summary: 'Step 1 email sent and opened' },
    ],
  },
  'task-003': {
    taskId: 'task-003',
    taskTitle: 'Security requirements review call',
    contactId: 'contact-002',
    contactName: 'Michael Rodriguez',
    company: 'TechFlow Inc',
    arrValue: '$180K ARR',
    scheduledDateTime: '2026-05-27T16:30:00-07:00',
    aiInsight:
      'This task is overdue. Michael last engaged 5h ago requesting security documentation. He is actively evaluating — reach out immediately to avoid losing momentum.',
    recommendedNextSteps: [
      'Call Michael directly — avoid email at this stage',
      'Lead with the security compliance deck (SOC 2, ISO 27001)',
      'Offer to loop in the solutions engineer for a technical deep-dive',
    ],
    recentActivity: [
      {
        date: 'May 28',
        channelType: 'EMAIL',
        summary: 'Requested technical documentation for security review',
      },
      {
        date: 'May 25',
        channelType: 'CALL',
        summary: 'Initial discovery — strong interest in enterprise tier',
      },
      { date: 'May 22', channelType: 'LINKEDIN', summary: 'Connected and opened initial conversation' },
    ],
  },
  'task-004': {
    taskId: 'task-004',
    taskTitle: 'Send onboarding resources — Step 5',
    contactId: 'contact-005',
    contactName: 'Karen Taylor',
    company: 'Enterprise Solutions Ltd',
    arrValue: '$310K ARR',
    scheduledDateTime: '2026-05-28T13:00:00-07:00',
    aiInsight:
      'Karen has completed 4 of 5 onboarding steps with a 92 engagement score. This final step should confirm implementation timeline and introduce the CSM team.',
    recommendedNextSteps: [
      'Send the implementation checklist and CSM intro email',
      'Confirm go-live date and technical POC on their side',
      'Schedule the kickoff call with the CSM team',
    ],
    recentActivity: [
      {
        date: 'May 27',
        channelType: 'EMAIL',
        summary: 'Step 4 completed — Karen replied with follow-up questions',
      },
      { date: 'May 25', channelType: 'CALL', summary: 'Onboarding check-in call — 22 min' },
      { date: 'May 23', channelType: 'EMAIL', summary: 'Step 3 sent and completed' },
    ],
  },
  'task-005': {
    taskId: 'task-005',
    taskTitle: 'Review contract terms with legal',
    contactId: 'contact-006',
    contactName: 'Tom Anderson',
    company: 'SalesTech Pro',
    arrValue: '$85K ARR',
    scheduledDateTime: '2026-05-28T17:00:00-07:00',
    aiInsight:
      'Tom is evaluating pricing at early stage. Low interaction count — prioritize relationship building before pushing contract terms.',
    recommendedNextSteps: [
      'Share redlined contract with legal team',
      'Follow up with Tom after legal review is complete',
      'Prepare competitive comparison if pricing is challenged',
    ],
    recentActivity: [
      { date: 'May 27', channelType: 'CALL', summary: 'Initial discovery call — interested in SMB plan' },
    ],
  },
};

// ─── GET /api/engage/tasks/lookup ─────────────────────────────────────────────

export const MOCK_LOOKUP_RESULTS = [
  { id: 'contact-001', type: 'CONTACT', displayName: 'Sarah Chen', subLabel: 'Acme Corp' },
  { id: 'contact-002', type: 'CONTACT', displayName: 'Michael Rodriguez', subLabel: 'TechFlow Inc' },
  { id: 'contact-003', type: 'CONTACT', displayName: 'Jennifer Kim', subLabel: 'DataStream Solutions' },
  { id: 'contact-004', type: 'CONTACT', displayName: 'David Park', subLabel: 'CloudBridge' },
  { id: 'contact-005', type: 'CONTACT', displayName: 'Karen Taylor', subLabel: 'Enterprise Solutions Ltd' },
  { id: 'contact-006', type: 'CONTACT', displayName: 'Tom Anderson', subLabel: 'SalesTech Pro' },
  { id: 'account-001', type: 'ACCOUNT', displayName: 'Acme Corp', subLabel: 'Enterprise · $240K ARR' },
  { id: 'account-002', type: 'ACCOUNT', displayName: 'TechFlow Inc', subLabel: 'Mid-Market · $180K ARR' },
  { id: 'deal-001', type: 'DEAL', displayName: 'Acme Corp — Q2 Enterprise', subLabel: 'Negotiation · $240K' },
  { id: 'deal-002', type: 'DEAL', displayName: 'TechFlow — Security Suite', subLabel: 'Evaluation · $180K' },
];

// ─── GET /api/engage/users/assignable ─────────────────────────────────────────

export const MOCK_ASSIGNABLE_USERS = [
  { userId: 'rep-001', displayName: 'Alex Chen (Me)', role: 'sales_rep', isCurrentUser: true },
  { userId: 'rep-002', displayName: 'Jordan Kim', role: 'sales_rep', isCurrentUser: false },
  { userId: 'rep-003', displayName: 'Sam Lee', role: 'sales_rep', isCurrentUser: false },
];

// ─── GET /api/engage/tasks/{taskId}/email-draft ───────────────────────────────

export const MOCK_EMAIL_DRAFTS: Record<string, Record<string, unknown>> = {
  'task-002': {
    taskId: 'task-002',
    contactName: 'Sarah Chen',
    contactEmail: 'sarah.chen@acmecorp.com',
    fromEmail: 'alex.chen@company.com',
    fromLabel: 'alex.chen@company.com (Gmail)',
    subject: 'Your personalized product demo — Acme Corp use case',
    bodyHtml: `<p>Hi Sarah,</p>
<p>Following up on our conversation last week — I've put together a short demo walkthrough specifically tailored to the workflow challenges you mentioned.</p>
<p><strong>Key highlights for Acme Corp:</strong></p>
<ul>
  <li>Automated renewal tracking across your 200+ accounts</li>
  <li>Real-time risk signals for at-risk deals</li>
  <li>Integration with your existing Salesforce setup (no migration needed)</li>
</ul>
<p>I've also included the ROI projections we ran based on your current process — the numbers are compelling.</p>
<p>Would you be open to a 20-minute call this week to walk through the demo together?</p>
<p>Best,<br/>Alex</p>`,
    sequenceName: 'Enterprise Onboarding Flow',
    sequenceStep: 'Step 2',
    dueDateTime: '2026-05-28T13:00:00-07:00',
    taskIndex: 1,
    totalTasks: 5,
  },
  'task-004': {
    taskId: 'task-004',
    contactName: 'Karen Taylor',
    contactEmail: 'karen.taylor@enterprisesolutions.com',
    fromEmail: 'alex.chen@company.com',
    fromLabel: 'alex.chen@company.com (Gmail)',
    subject: 'Final onboarding step — meet your CSM team',
    bodyHtml: `<p>Hi Karen,</p>
<p>You've made it to the final step of the onboarding journey — congratulations!</p>
<p>I'd love to introduce you to your dedicated Customer Success Manager, who will be your go-to contact for implementation and beyond.</p>
<p><strong>What's next:</strong></p>
<ol>
  <li>Confirm your go-live date (slots available June 3–7)</li>
  <li>Join the kickoff call with the CSM team (30 min)</li>
  <li>Complete the implementation checklist (attached)</li>
</ol>
<p>You've been an absolute pleasure to work with — looking forward to seeing your results once you're live.</p>
<p>Best,<br/>Alex</p>`,
    sequenceName: 'Enterprise Onboarding Flow',
    sequenceStep: 'Step 5',
    dueDateTime: '2026-05-28T13:00:00-07:00',
    taskIndex: 2,
    totalTasks: 5,
  },
};

// ─── GET /api/engage/email-templates ──────────────────────────────────────────

export const MOCK_EMAIL_TEMPLATES = [
  {
    templateId: 'tpl-001',
    templateName: 'Discovery Follow-up',
    subject: 'Great speaking with you, {{firstName}}',
    bodyHtml: `<p>Hi {{firstName}},</p><p>It was great speaking with you today. As promised, here are the next steps we discussed...</p>`,
    category: 'Follow-up',
  },
  {
    templateId: 'tpl-002',
    templateName: 'Proposal Introduction',
    subject: 'Your custom proposal — {{companyName}}',
    bodyHtml: `<p>Hi {{firstName}},</p><p>Attached is the proposal we discussed, tailored specifically for {{companyName}}.</p>`,
    category: 'Proposal',
  },
  {
    templateId: 'tpl-003',
    templateName: 'ROI Presentation',
    subject: 'The numbers we ran for {{companyName}}',
    bodyHtml: `<p>Hi {{firstName}},</p><p>Based on our conversation, here are the ROI projections for {{companyName}}...</p>`,
    category: 'ROI',
  },
  {
    templateId: 'tpl-004',
    templateName: 'Re-engagement',
    subject: 'Checking back in — {{companyName}}',
    bodyHtml: `<p>Hi {{firstName}},</p><p>A lot has changed since we last spoke, and I think the timing might be better now...</p>`,
    category: 'Re-engagement',
  },
  {
    templateId: 'tpl-005',
    templateName: 'Contract Follow-up',
    subject: 'Quick follow-up on the contract — {{companyName}}',
    bodyHtml: `<p>Hi {{firstName}},</p><p>Wanted to check in on the contract review. Happy to jump on a quick call to address any questions...</p>`,
    category: 'Closing',
  },
];

// ─── GET /api/engage/tasks/{taskId}/linkedin-draft ────────────────────────────

export const MOCK_LINKEDIN_DRAFTS: Record<string, Record<string, unknown>> = {
  'task-005': {
    taskId: 'task-005',
    contactId: 'contact-006',
    contactName: 'Tom Anderson',
    contactTitle: 'VP of Sales',
    contactCompany: 'SalesTech Pro',
    linkedInProfileUrl: 'https://linkedin.com/in/tom-anderson-salestechpro',
    mutualConnections: 5,
    messageScript: `Hi Tom,

I came across your profile and noticed you're leading sales at SalesTech Pro — great work scaling that team.

We help SaaS sales orgs like yours get real-time visibility into deal risk and pipeline health, without adding more admin work for reps.

Would you be open to a quick 15-minute call this week to see if there's a fit?

Best,
Alex`,
    sequenceName: '',
    sequenceStep: '',
    dueDateTime: '2026-05-28T17:00:00-07:00',
    taskIndex: 5,
    totalTasks: 5,
  },
  'task-003': {
    taskId: 'task-003',
    contactId: 'contact-002',
    contactName: 'Michael Rodriguez',
    contactTitle: 'VP of Engineering',
    contactCompany: 'TechFlow Inc',
    linkedInProfileUrl: 'https://linkedin.com/in/michael-rodriguez-techflow',
    mutualConnections: 12,
    messageScript: `Hi Michael,

I noticed you've been looking into our security compliance documentation — happy to help expedite that.

We recently completed SOC 2 Type II certification and our team has done similar security reviews with fintech companies like yours. I can have our solutions engineer share a tailored security overview if that would help speed up your evaluation.

Would 20 minutes this week work to connect?

Best,
Alex`,
    sequenceName: 'Mid-Market Follow-up',
    sequenceStep: 'Step 2',
    dueDateTime: '2026-05-27T16:30:00-07:00',
    taskIndex: 3,
    totalTasks: 5,
  },
};

// ─── GET /api/engage/contacts/{contactId}/details ────────────────────────────

export const MOCK_CONTACT_DETAILS: Record<string, Record<string, unknown>> = {
  'contact-001': {
    contactId: 'contact-001',
    contactName: 'Sarah Chen',
    jobTitle: 'VP of Sales Operations',
    company: 'Acme Corp',
    phone: '+1 (415) 555-0182',
    email: 'sarah.chen@acmecorp.com',
    linkedInUrl: 'https://linkedin.com/in/sarah-chen-acme',
    engagementTimeline: [
      { date: 'May 26', channelType: 'EMAIL', summary: 'Proposal follow-up sent — opened 4 times' },
      { date: 'May 24', channelType: 'CALL', summary: 'Discovery call — discussed timeline and budget' },
      { date: 'May 22', channelType: 'EMAIL', summary: 'Product overview email — link clicked 3x' },
      { date: 'May 20', channelType: 'LINKEDIN', summary: 'Connected and exchanged intro message' },
    ],
    accountInfo: {
      accountName: 'Acme Corp',
      arrValue: '$240K ARR',
      industry: 'Technology',
      website: 'acmecorp.com',
      size: '500–1,000',
    },
    dealInfo: {
      dealName: 'Acme Corp — Q2 Enterprise',
      dealStage: 'Negotiation',
      dealValue: '$240,000',
      closeDate: 'Jun 30, 2026',
    },
  },
  'contact-002': {
    contactId: 'contact-002',
    contactName: 'Michael Rodriguez',
    jobTitle: 'VP of Engineering',
    company: 'TechFlow Inc',
    phone: '+1 (628) 555-0247',
    email: 'michael.rodriguez@techflow.io',
    linkedInUrl: 'https://linkedin.com/in/michael-rodriguez-techflow',
    engagementTimeline: [
      {
        date: 'May 28',
        channelType: 'EMAIL',
        summary: 'Requested technical documentation for security review',
      },
      { date: 'May 25', channelType: 'CALL', summary: 'Initial discovery — strong interest in enterprise tier' },
      { date: 'May 22', channelType: 'LINKEDIN', summary: 'Connected and opened initial conversation' },
    ],
    accountInfo: {
      accountName: 'TechFlow Inc',
      arrValue: '$180K ARR',
      industry: 'FinTech',
      website: 'techflow.io',
      size: '200–500',
    },
    dealInfo: {
      dealName: 'TechFlow — Security Suite',
      dealStage: 'Evaluation',
      dealValue: '$180,000',
      closeDate: 'Jul 15, 2026',
    },
  },
  'contact-003': {
    contactId: 'contact-003',
    contactName: 'Jennifer Kim',
    jobTitle: 'Director of Revenue Operations',
    company: 'DataStream Solutions',
    phone: '+1 (510) 555-0394',
    email: 'jennifer.kim@datastream.co',
    linkedInUrl: 'https://linkedin.com/in/jennifer-kim-datastream',
    engagementTimeline: [
      { date: 'May 27', channelType: 'LINKEDIN', summary: 'Shared competitor analysis article' },
      { date: 'May 23', channelType: 'EMAIL', summary: 'Initial outreach email — no reply yet' },
    ],
    accountInfo: {
      accountName: 'DataStream Solutions',
      arrValue: '$95K ARR',
      industry: 'Data & Analytics',
      website: 'datastream.co',
      size: '100–200',
    },
    dealInfo: {
      dealName: 'DataStream — Starter Plan',
      dealStage: 'Discovery',
      dealValue: '$95,000',
      closeDate: 'Aug 31, 2026',
    },
  },
  'contact-004': {
    contactId: 'contact-004',
    contactName: 'David Park',
    jobTitle: 'Chief Revenue Officer',
    company: 'CloudBridge',
    phone: '+1 (650) 555-0581',
    email: 'david.park@cloudbridge.io',
    linkedInUrl: 'https://linkedin.com/in/david-park-cloudbridge',
    engagementTimeline: [
      { date: 'May 26', channelType: 'CALL', summary: 'Weekly pilot program check-in — positive feedback' },
      { date: 'May 19', channelType: 'CALL', summary: 'Pilot kickoff call — 45 min' },
      { date: 'May 15', channelType: 'EMAIL', summary: 'Pilot agreement and onboarding materials sent' },
    ],
    accountInfo: {
      accountName: 'CloudBridge',
      arrValue: '$420K ARR',
      industry: 'Cloud Infrastructure',
      website: 'cloudbridge.io',
      size: '1,000–5,000',
    },
    dealInfo: {
      dealName: 'CloudBridge — Enterprise Expansion',
      dealStage: 'Negotiation',
      dealValue: '$420,000',
      closeDate: 'Jun 15, 2026',
    },
  },
  'contact-005': {
    contactId: 'contact-005',
    contactName: 'Karen Taylor',
    jobTitle: 'Head of Sales Enablement',
    company: 'Enterprise Solutions Ltd',
    phone: '+1 (212) 555-0729',
    email: 'karen.taylor@enterprisesolutions.com',
    linkedInUrl: 'https://linkedin.com/in/karen-taylor-esl',
    engagementTimeline: [
      {
        date: 'May 27',
        channelType: 'EMAIL',
        summary: 'Step 4 onboarding email — replied with follow-up questions',
      },
      { date: 'May 25', channelType: 'CALL', summary: 'Onboarding check-in — 22 minutes' },
      { date: 'May 23', channelType: 'EMAIL', summary: 'Step 3 onboarding email completed' },
      { date: 'May 21', channelType: 'CALL', summary: 'Step 2 walkthrough call — very engaged' },
    ],
    accountInfo: {
      accountName: 'Enterprise Solutions Ltd',
      arrValue: '$310K ARR',
      industry: 'Professional Services',
      website: 'enterprisesolutions.com',
      size: '500–1,000',
    },
    dealInfo: {
      dealName: 'ESL — Revenue Intelligence Platform',
      dealStage: 'Onboarding',
      dealValue: '$310,000',
      closeDate: 'Jun 1, 2026',
    },
  },
  'contact-006': {
    contactId: 'contact-006',
    contactName: 'Tom Anderson',
    jobTitle: 'VP of Sales',
    company: 'SalesTech Pro',
    phone: '+1 (312) 555-0833',
    email: 'tom.anderson@salestechpro.com',
    linkedInUrl: 'https://linkedin.com/in/tom-anderson-salestechpro',
    engagementTimeline: [
      { date: 'May 27', channelType: 'CALL', summary: 'Initial discovery call — interested in SMB plan' },
    ],
    accountInfo: {
      accountName: 'SalesTech Pro',
      arrValue: '$85K ARR',
      industry: 'SaaS',
      website: 'salestechpro.com',
      size: '50–100',
    },
    dealInfo: {
      dealName: 'SalesTech Pro — SMB Plan',
      dealStage: 'Discovery',
      dealValue: '$85,000',
      closeDate: 'Sep 30, 2026',
    },
  },
};

// ─── GET /api/engage/contacts/{contactId}/engagement-timeline ────────────────

export const MOCK_ENGAGEMENT_TIMELINES: Record<string, unknown[]> = {
  'contact-001': [
    {
      eventId: 'evt-001',
      eventType: 'EMAIL_OPENED',
      eventIcon: 'mail',
      summary: 'Email opened',
      occurredAt: '2026-05-26T09:00:00-07:00',
      timeAgoLabel: '2 hours ago',
    },
    {
      eventId: 'evt-002',
      eventType: 'LINK_CLICKED',
      eventIcon: 'external-link',
      summary: 'Link clicked',
      occurredAt: '2026-05-26T09:05:00-07:00',
      timeAgoLabel: '2 hours ago',
    },
    {
      eventId: 'evt-003',
      eventType: 'PHONE_CALL',
      eventIcon: 'phone',
      summary: 'Phone call · 18 min',
      occurredAt: '2026-05-24T14:00:00-07:00',
      timeAgoLabel: '3 days ago',
    },
    {
      eventId: 'evt-004',
      eventType: 'MEETING_SCHEDULED',
      eventIcon: 'calendar',
      summary: 'Meeting scheduled',
      occurredAt: '2026-05-22T11:00:00-07:00',
      timeAgoLabel: '1 week ago',
    },
  ],
  'contact-002': [
    {
      eventId: 'evt-005',
      eventType: 'EMAIL_SENT',
      eventIcon: 'mail',
      summary: 'Email sent — security docs request',
      occurredAt: '2026-05-28T05:00:00-07:00',
      timeAgoLabel: '5 hours ago',
    },
    {
      eventId: 'evt-006',
      eventType: 'PHONE_CALL',
      eventIcon: 'phone',
      summary: 'Phone call · 25 min discovery',
      occurredAt: '2026-05-25T13:00:00-07:00',
      timeAgoLabel: '3 days ago',
    },
    {
      eventId: 'evt-007',
      eventType: 'LINKEDIN_MESSAGE',
      eventIcon: 'linkedin',
      summary: 'LinkedIn message — initial connection',
      occurredAt: '2026-05-22T10:00:00-07:00',
      timeAgoLabel: '6 days ago',
    },
  ],
};

// ─── GET /api/engage/tasks/{taskId}/crm-fields ────────────────────────────────

export const MOCK_CRM_FIELDS: Record<string, Record<string, unknown>> = {
  'task-001': {
    accountFields: [
      { fieldId: 'acc-f-001', fieldLabel: 'Account Name', fieldValue: 'Acme Corp', isEditable: false, fieldType: 'TEXT' },
      { fieldId: 'acc-f-002', fieldLabel: 'Industry', fieldValue: 'Technology', isEditable: true, fieldType: 'DROPDOWN' },
      { fieldId: 'acc-f-003', fieldLabel: 'ARR', fieldValue: '240000', isEditable: true, fieldType: 'NUMBER' },
      { fieldId: 'acc-f-004', fieldLabel: 'Website', fieldValue: 'acmecorp.com', isEditable: true, fieldType: 'TEXT' },
      { fieldId: 'acc-f-005', fieldLabel: 'Employee Count', fieldValue: '750', isEditable: true, fieldType: 'NUMBER' },
    ],
    dealFields: [
      { fieldId: 'deal-f-001', fieldLabel: 'Deal Name', fieldValue: 'Acme Corp — Q2 Enterprise', isEditable: true, fieldType: 'TEXT' },
      { fieldId: 'deal-f-002', fieldLabel: 'Deal Stage', fieldValue: 'Negotiation', isEditable: true, fieldType: 'DROPDOWN' },
      { fieldId: 'deal-f-003', fieldLabel: 'Deal Value', fieldValue: '240000', isEditable: true, fieldType: 'NUMBER' },
      { fieldId: 'deal-f-004', fieldLabel: 'Close Date', fieldValue: '2026-06-30', isEditable: true, fieldType: 'DATE' },
      { fieldId: 'deal-f-005', fieldLabel: 'Deal Type', fieldValue: 'New Business', isEditable: true, fieldType: 'DROPDOWN' },
    ],
  },
  'task-003': {
    accountFields: [
      { fieldId: 'acc-f-010', fieldLabel: 'Account Name', fieldValue: 'TechFlow Inc', isEditable: false, fieldType: 'TEXT' },
      { fieldId: 'acc-f-011', fieldLabel: 'Industry', fieldValue: 'FinTech', isEditable: true, fieldType: 'DROPDOWN' },
      { fieldId: 'acc-f-012', fieldLabel: 'ARR', fieldValue: '180000', isEditable: true, fieldType: 'NUMBER' },
      { fieldId: 'acc-f-013', fieldLabel: 'Website', fieldValue: 'techflow.io', isEditable: true, fieldType: 'TEXT' },
    ],
    dealFields: [
      { fieldId: 'deal-f-010', fieldLabel: 'Deal Name', fieldValue: 'TechFlow — Security Suite', isEditable: true, fieldType: 'TEXT' },
      { fieldId: 'deal-f-011', fieldLabel: 'Deal Stage', fieldValue: 'Evaluation', isEditable: true, fieldType: 'DROPDOWN' },
      { fieldId: 'deal-f-012', fieldLabel: 'Deal Value', fieldValue: '180000', isEditable: true, fieldType: 'NUMBER' },
      { fieldId: 'deal-f-013', fieldLabel: 'Close Date', fieldValue: '2026-07-15', isEditable: true, fieldType: 'DATE' },
    ],
  },
};

// ─── GET /api/engage/filters/options ─────────────────────────────────────────

export const MOCK_FILTER_OPTIONS = {
  flowNames: [
    { flowId: 'flow-001', flowName: 'Enterprise Outbound Q2 2026' },
    { flowId: 'flow-002', flowName: 'Mid-Market Follow-up' },
    { flowId: 'flow-003', flowName: 'Social Selling Campaign' },
    { flowId: 'flow-004', flowName: 'Product Launch Sequence' },
    { flowId: 'flow-005', flowName: 'Customer Onboarding' },
    { flowId: 'flow-006', flowName: 'Renewal Outreach' },
  ],
  crmFields: {
    account: [
      {
        fieldId: 'a-001',
        fieldLabel: 'Industry',
        fieldType: 'DROPDOWN',
        options: ['Technology', 'FinTech', 'Healthcare', 'Manufacturing', 'Professional Services', 'SaaS'],
      },
      { fieldId: 'a-002', fieldLabel: 'ARR', fieldType: 'NUMBER' },
      { fieldId: 'a-003', fieldLabel: 'Employee Count', fieldType: 'NUMBER' },
      { fieldId: 'a-004', fieldLabel: 'Country', fieldType: 'TEXT' },
    ],
    contact: [
      { fieldId: 'c-001', fieldLabel: 'Job Title', fieldType: 'TEXT' },
      {
        fieldId: 'c-002',
        fieldLabel: 'Seniority Level',
        fieldType: 'DROPDOWN',
        options: ['C-Suite', 'VP', 'Director', 'Manager', 'Individual Contributor'],
      },
      {
        fieldId: 'c-003',
        fieldLabel: 'Department',
        fieldType: 'DROPDOWN',
        options: ['Sales', 'Marketing', 'Engineering', 'Product', 'Finance', 'Operations'],
      },
    ],
    lead: [
      {
        fieldId: 'l-001',
        fieldLabel: 'Lead Source',
        fieldType: 'DROPDOWN',
        options: ['Inbound', 'Outbound', 'Referral', 'Event', 'Partner'],
      },
      { fieldId: 'l-002', fieldLabel: 'Lead Score', fieldType: 'NUMBER' },
    ],
    opportunity: [
      {
        fieldId: 'o-001',
        fieldLabel: 'Deal Stage',
        fieldType: 'DROPDOWN',
        options: ['Discovery', 'Evaluation', 'Proposal', 'Negotiation', 'Closed Won', 'Closed Lost'],
      },
      { fieldId: 'o-002', fieldLabel: 'Deal Value', fieldType: 'NUMBER' },
      { fieldId: 'o-003', fieldLabel: 'Close Date', fieldType: 'DATE' },
      { fieldId: 'o-004', fieldLabel: 'Probability', fieldType: 'NUMBER' },
    ],
  },
};

// ─── GET /api/engage/smart-call/{taskId}/init ─────────────────────────────────

export const MOCK_SMART_CALL_INITS: Record<string, Record<string, unknown>> = {
  'task-001': {
    taskId: 'task-001',
    contactName: 'Sarah Chen',
    contactCompany: 'Acme Corp',
    supportedIntegrations: ['ZOOM', 'MEET', 'TEAMS'],
    preCallBriefing:
      'Sarah is VP of Sales Operations at Acme Corp ($240K ARR, Negotiation stage). She opened your last email 4x and visited the pricing page twice. Budget is approved — needs CFO sign-off. Lead with ROI and push for a close date of June 30.',
  },
  'task-002': {
    taskId: 'task-002',
    contactName: 'Sarah Chen',
    contactCompany: 'Acme Corp',
    supportedIntegrations: ['ZOOM', 'MEET', 'TEAMS'],
    preCallBriefing:
      'Step 2 follow-up with Sarah at Acme Corp. Reference her pain points from the May 24 discovery call: manual renewal tracking and no real-time risk visibility. Use the demo recording as a conversation anchor.',
  },
  'task-003': {
    taskId: 'task-003',
    contactName: 'Michael Rodriguez',
    contactCompany: 'TechFlow Inc',
    supportedIntegrations: ['ZOOM', 'MEET', 'TEAMS'],
    preCallBriefing:
      'Michael is VP of Engineering at TechFlow Inc ($180K ARR, Evaluation). He requested security docs — lead with SOC 2 Type II and ISO 27001 compliance. Have your SE on standby for a technical deep-dive if needed.',
  },
};

// ─── Mock Live Session Data (WebSocket stream snapshot) ───────────────────────

export const MOCK_LIVE_SESSION_DATA = {
  currentStage: 'Initial Greeting and Introduction',
  nextSuggestion: 'Ask about current challenges to move into discovery',
  suggestedResponses: [
    'What are the biggest bottlenecks in your current sales process?',
    'How are you currently tracking deal risk across your team?',
    'What would a successful outcome look like for you in Q2?',
    'Who else on your team would be involved in the final decision?',
  ],
  competitorIntelligence: {
    competitorName: 'Gong',
    insight: 'Contact previously evaluated Gong but cited high pricing as a blocker',
    ourEdge: 'We offer comparable conversation intelligence at 40% lower TCO with no per-seat call recording fees',
    sayThis:
      'I understand you looked at Gong previously. Where we differ is in the total cost — most teams our size save 40% annually with us while getting the same core intelligence capabilities.',
  },
  intentSignals: [
    { label: 'Pricing Interest', value: 'High', severity: 'HIGH', color: 'green' },
    { label: 'Decision Timeline', value: 'Q2 2026', severity: 'INFO', color: 'blue' },
    { label: 'Budget Concern', value: 'Medium', severity: 'MEDIUM', color: 'yellow' },
    { label: 'Feature Request', value: 'CRM Integration', severity: 'LOW', color: 'purple' },
  ],
  talkRatio: { repPercent: 42, customerPercent: 58 },
  conversationMetrics: {
    interruptions: 2,
    speakingPace: 'GOOD',
    wordsPerMinute: 148,
    questionsAsked: 5,
  },
  conversationSummary:
    'Rep opened with rapport building. Customer raised concerns about data migration complexity. Rep addressed with SLA commitment. Currently in pricing discussion.',
};

// ─── GET /api/engage/smart-call/sessions/{sessionId}/summary ─────────────────

export const MOCK_CALL_SUMMARY = {
  sessionId: 'session-001',
  callSummaryId: 'summary-001',
  duration: '18:42',
  callType: 'Follow up on Q2 contract renewal',
  signalLabel: 'Positive Signal',
  signalType: 'POSITIVE',
  overallScore: 78,
  dimensionScores: [
    { dimension: 'DISCOVERY', score: 82, maxScore: 100 },
    { dimension: 'OBJECTION_HANDLING', score: 74, maxScore: 100 },
    { dimension: 'CLOSING', score: 71, maxScore: 100 },
  ],
  aiSummary:
    'Strong call overall. Sarah confirmed budget approval from the CFO and indicated a target go-live of June 15. She raised a concern about data migration complexity — you handled this well by referencing the 48-hour migration SLA. The biggest opportunity missed was not asking for a formal sign-off date before closing the call.',
  keyMoments: [
    {
      timestamp: '2:15',
      type: 'WIN',
      description: 'Successfully reframed pricing concern with 3-year ROI breakdown',
    },
    {
      timestamp: '5:42',
      type: 'OBJECTION',
      description: 'Data migration concern raised — handled with SLA reference',
    },
    {
      timestamp: '9:18',
      type: 'WIN',
      description: 'Sarah confirmed CFO budget approval — key buying signal',
    },
    {
      timestamp: '14:30',
      type: 'RISK',
      description: 'Close date commitment not confirmed before ending call',
    },
    {
      timestamp: '16:05',
      type: 'QUESTION',
      description: 'Asked about integration timeline — good discovery question',
    },
  ],
  improvementSuggestions: [
    'Always confirm a specific close date and document next steps before ending the call',
    'Confirm budget authority earlier — ideally in the first 3 minutes',
    "Use the customer's name more frequently to build rapport throughout the call",
  ],
  conversationTimeline: [
    { startTime: '0:00', endTime: '1:30', topic: 'Introduction and rapport building' },
    { startTime: '1:30', endTime: '5:00', topic: 'Q2 renewal timeline and CFO requirements' },
    { startTime: '5:00', endTime: '8:00', topic: 'Data migration concerns and SLA discussion' },
    { startTime: '8:00', endTime: '11:00', topic: 'Budget confirmation and pricing review' },
    { startTime: '11:00', endTime: '16:00', topic: 'Feature walkthrough and integration questions' },
    { startTime: '16:00', endTime: '18:42', topic: 'Next steps and closing' },
  ],
  transcriptUrl: '/transcripts/session-001',
};
