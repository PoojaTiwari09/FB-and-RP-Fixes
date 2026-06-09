const { PrismaClient } = require('../node_modules/.prisma/client');

const prisma = new PrismaClient();

const TENANT_ID = '00000000-0000-0000-0000-000000000001';

async function main() {
  console.log('--- Database Seeding Started ---');

  // 1. Seed Tenant
  console.log('Seeding Tenant...');
  const tenant = await prisma.tenant.upsert({
    where: { id: TENANT_ID },
    update: {},
    create: {
      id: TENANT_ID,
      name: 'Default Tenant',
      slug: 'default',
    },
  });

  // 2. Seed Users
  console.log('Seeding Users...');
  const usersToSeed = [
    {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'admin@company.com',
      name: 'Admin User',
      role: 'ADMIN',
      passwordHash: 'admin_hash',
    },
    {
      id: 'me',
      email: 'alex.morgan@relanto.ai',
      name: 'Alex Morgan',
      role: 'SALES_REP',
      passwordHash: 'alex_hash',
    },
    {
      id: 'sarah',
      email: 'sarah.chen@company.com',
      name: 'Sarah Chen',
      role: 'SALES_REP',
      passwordHash: 'sarah_hash',
    },
    {
      id: 'michael',
      email: 'michael.rod@company.com',
      name: 'Michael Rodriguez',
      role: 'SALES_REP',
      passwordHash: 'michael_hash',
    },
    {
      id: 'jennifer',
      email: 'jennifer.kim@company.com',
      name: 'Jennifer Kim',
      role: 'MANAGER',
      passwordHash: 'jennifer_hash',
    },
    {
      id: 'david',
      email: 'david.park@company.com',
      name: 'David Park',
      role: 'SALES_REP',
      passwordHash: 'david_hash',
    },
    {
      id: 'emily',
      email: 'emily.thompson@company.com',
      name: 'Emily Thompson',
      role: 'SALES_REP',
      passwordHash: 'emily_hash',
    },
  ];

  for (const u of usersToSeed) {
    await prisma.user.upsert({
      where: { tenantId_email: { tenantId: TENANT_ID, email: u.email } },
      update: { name: u.name, role: u.role },
      create: {
        id: u.id,
        tenantId: TENANT_ID,
        email: u.email,
        name: u.name,
        role: u.role,
        passwordHash: u.passwordHash,
      },
    });
  }

  // 3. Seed Engage Contacts
  console.log('Seeding Engage Contacts...');
  const contactsData = [
    {
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
    {
      contactId: 'contact-002',
      contactName: 'Michael Rodriguez',
      jobTitle: 'VP of Engineering',
      company: 'TechFlow Inc',
      phone: '+1 (628) 555-0247',
      email: 'michael.rodriguez@techflow.io',
      linkedInUrl: 'https://linkedin.com/in/michael-rodriguez-techflow',
      engagementTimeline: [
        { date: 'May 28', channelType: 'EMAIL', summary: 'Requested technical documentation for security review' },
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
    {
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
    {
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
    {
      contactId: 'contact-005',
      contactName: 'Karen Taylor',
      jobTitle: 'Head of Sales Enablement',
      company: 'Enterprise Solutions Ltd',
      phone: '+1 (212) 555-0729',
      email: 'karen.taylor@enterprisesolutions.com',
      linkedInUrl: 'https://linkedin.com/in/karen-taylor-esl',
      engagementTimeline: [
        { date: 'May 27', channelType: 'EMAIL', summary: 'Step 4 onboarding email — replied with follow-up questions' },
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
    {
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
  ];

  for (const c of contactsData) {
    await prisma.engageContact.upsert({
      where: { contactId: c.contactId },
      update: c,
      create: {
        tenantId: TENANT_ID,
        ...c,
      },
    });
  }

  // 4. Seed Engage Tasks (Merged Rep and Manager Mock Tasks)
  console.log('Seeding Engage Tasks...');
  const tasksData = [
    // Rep Tasks
    {
      taskId: 'task-001',
      contactId: 'contact-001',
      contactName: 'Sarah Chen',
      companyName: 'Acme Corp',
      channel: 'CALL',
      sequenceName: 'Enterprise Onboarding Flow',
      sequenceStep: 'Step 1',
      scheduledTime: '2:30 PM PST',
      dueDateTime: '2026-05-28T14:00:00-07:00',
      isOverdue: false,
      isAtRisk: true,
      interactionCount: 6,
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: '2026-05-28',
      arr: '$240K ARR',
      aiInsight: 'Sarah opened your last email 4 times yesterday and visited the pricing page twice. Strong buying signal — confirm budget authority before this call.',
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
      notes: 'Sarah confirmed they have budget approved but needs sign-off from CFO by end of Q2.',
    },
    {
      taskId: 'task-002',
      contactId: 'contact-001',
      contactName: 'Sarah Chen',
      companyName: 'Acme Corp',
      channel: 'CALL',
      sequenceName: 'Enterprise Onboarding Flow',
      sequenceStep: 'Step 2',
      scheduledTime: '2:30 PM PST',
      dueDateTime: '2026-05-28T13:00:00-07:00',
      isOverdue: false,
      isAtRisk: false,
      interactionCount: 6,
      priority: 'HIGH',
      status: 'PENDING',
      dueDate: '2026-05-28',
      arr: '$240K ARR',
      aiInsight: 'Step 2 of the Enterprise Onboarding Flow. Sarah responded positively to step 1. Personalize this with the use cases she mentioned on the May 24 call.',
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
    {
      taskId: 'task-003',
      contactId: 'contact-002',
      contactName: 'Michael Rodriguez',
      companyName: 'TechFlow Inc',
      channel: 'CALL',
      sequenceName: 'Mid-Market Follow-up',
      sequenceStep: 'Step 1',
      scheduledTime: '1:20 PM PST',
      dueDateTime: '2026-05-27T16:30:00-07:00',
      isOverdue: true,
      isAtRisk: true,
      interactionCount: 7,
      priority: 'HIGH',
      status: 'OVERDUE',
      dueDate: '2026-05-27',
      arr: '$180K ARR',
      aiInsight: 'This task is overdue. Michael last engaged 5h ago requesting security documentation. He is actively evaluating — reach out immediately to avoid losing momentum.',
      recommendedNextSteps: [
        'Call Michael directly — avoid email at this stage',
        'Lead with the security compliance deck (SOC 2, ISO 27001)',
        'Offer to loop in the solutions engineer for a technical deep-dive',
      ],
      recentActivity: [
        { date: 'May 28', channelType: 'EMAIL', summary: 'Requested technical documentation for security review' },
        { date: 'May 25', channelType: 'CALL', summary: 'Initial discovery — strong interest in enterprise tier' },
        { date: 'May 22', channelType: 'LINKEDIN', summary: 'Connected and opened initial conversation' },
      ],
    },
    {
      taskId: 'task-004',
      contactId: 'contact-005',
      contactName: 'Karen Taylor',
      companyName: 'Enterprise Solutions Ltd',
      channel: 'EMAIL',
      sequenceName: 'Enterprise Onboarding Flow',
      sequenceStep: 'Step 5',
      scheduledTime: '10:00 AM PST',
      dueDateTime: '2026-05-28T13:00:00-07:00',
      isOverdue: false,
      isAtRisk: false,
      interactionCount: 16,
      priority: 'NORMAL',
      status: 'PENDING',
      dueDate: '2026-05-28',
      arr: '$310K ARR',
      aiInsight: 'Karen has completed 4 of 5 onboarding steps with a 92 engagement score. This final step should confirm implementation timeline and introduce the CSM team.',
      recommendedNextSteps: [
        'Send the implementation checklist and CSM intro email',
        'Confirm go-live date and technical POC on their side',
        'Schedule the kickoff call with the CSM team',
      ],
      recentActivity: [
        { date: 'May 27', channelType: 'EMAIL', summary: 'Step 4 completed — Karen replied with follow-up questions' },
        { date: 'May 25', channelType: 'CALL', summary: 'Onboarding check-in call — 22 min' },
        { date: 'May 23', channelType: 'EMAIL', summary: 'Step 3 sent and completed' },
      ],
    },
    {
      taskId: 'task-005',
      contactId: 'contact-006',
      contactName: 'Tom Anderson',
      companyName: 'SalesTech Pro',
      channel: 'LINKEDIN',
      sequenceName: '',
      sequenceStep: '',
      scheduledTime: '2:00 PM PST',
      dueDateTime: '2026-05-28T17:00:00-07:00',
      isOverdue: false,
      isAtRisk: false,
      interactionCount: 1,
      priority: 'NORMAL',
      status: 'PENDING',
      dueDate: '2026-05-28',
      arr: '$85K ARR',
      aiInsight: 'Tom is evaluating pricing at early stage. Low interaction count — prioritize relationship building before pushing contract terms.',
      recommendedNextSteps: [
        'Share redlined contract with legal team',
        'Follow up with Tom after legal review is complete',
        'Prepare competitive comparison if pricing is challenged',
      ],
      recentActivity: [
        { date: 'May 27', channelType: 'CALL', summary: 'Initial discovery call — interested in SMB plan' },
      ],
    },

    // Manager Tasks
    {
      taskId: 'task_001',
      contactId: 'contact-001',
      contactName: 'Sarah Chen',
      companyName: 'Acme Corp',
      channel: 'call',
      scheduledTime: '2:30 PM (PST)',
      dueDateTime: 'Today, 2:00 PM',
      isOverdue: false,
      isAtRisk: true,
      interactionCount: 6,
      priority: 'high',
      status: 'pending',
      dueDate: '2026-05-28',
      dueTime: '02:00 PM',
      assigneeId: 'me',
      assigneeName: 'Alex Morgan',
      assigneeRole: 'Account Executive',
      arr: '$240K ARR',
      todoType: 'flow',
      entityType: 'deal',
      workflowName: 'Enterprise Onboarding Flow',
      workflowStep: '1',
      totalWorkflowSteps: 5,
      aiSignal: 'Deal may go cold — no response in 5 days',
      aiSignalType: 'risk',
      aiInsight: 'Sarah Chen opened your last proposal email 3 times in the past 48 hours and clicked the pricing link twice. Budget approval cycle at Acme Corp typically closes end of Q2. Decision committee includes IT Director and CFO — address ROI and security compliance to accelerate sign-off.',
      recommendedNextSteps: [
        'Address budget concerns with ROI calculator — highlight 3x efficiency gain vs current stack',
        'Share case study from DataStream Solutions (similar industry, 500-1000 employees, closed $195K)',
        'Schedule technical deep-dive with IT team to resolve security compliance questions'
      ],
      recentActivity: [
        { date: 'Apr 18', activityType: 'call', description: 'Discussed pricing and timeline — Sarah confirmed Q2 budget window' },
        { date: 'Apr 15', activityType: 'email', description: 'Sent proposal v2 with updated enterprise tier pricing' },
        { date: 'Apr 12', activityType: 'demo', description: 'Product walkthrough (45 min) — IT Director and VP of Sales attended' }
      ],
      notes: 'Sarah mentioned CFO approval needed before final sign-off. Follow up after board meeting on May 28.'
    },
    {
      taskId: 'task_002',
      contactId: 'contact-001',
      contactName: 'Sarah Chen',
      companyName: 'Acme Corp',
      channel: 'email',
      scheduledTime: '2:30 PM (PST)',
      dueDateTime: 'Today, 3:00 PM',
      isOverdue: false,
      isAtRisk: false,
      interactionCount: 6,
      priority: 'high',
      status: 'pending',
      dueDate: '2026-05-28',
      dueTime: '03:00 PM',
      assigneeId: 'me',
      assigneeName: 'Alex Morgan',
      assigneeRole: 'Account Executive',
      arr: '$240K ARR',
      todoType: 'flow',
      entityType: 'deal',
      workflowName: 'Enterprise Onboarding Flow',
      workflowStep: '2',
      totalWorkflowSteps: 5,
      aiSignal: 'Follow immediately after call while context is fresh',
      aiSignalType: 'opportunity',
    },
    {
      taskId: 'task_003',
      contactId: 'contact-002',
      contactName: 'Michael Rodriguez',
      companyName: 'TechFlow Inc',
      channel: 'call',
      scheduledTime: '1:30 PM (PST)',
      dueDateTime: 'Today, 4:30 PM',
      isOverdue: true,
      isAtRisk: false,
      interactionCount: 7,
      priority: 'high',
      status: 'in_progress',
      dueDate: '2026-05-28',
      dueTime: '04:30 PM',
      assigneeId: 'me',
      assigneeName: 'Alex Morgan',
      assigneeRole: 'Account Executive',
      arr: '$180K ARR',
      todoType: 'manual',
      entityType: 'deal',
      aiSignal: 'High-value account nearing decision stage ($180K ARR)',
      aiSignalType: 'opportunity',
      aiInsight: 'Michael Rodriguez requested SOC 2 and GDPR compliance documentation 5 hours ago via email. TechFlow Inc is in the Proposal stage with a June 15 close date. Delay in providing compliance docs increases risk of losing to a competitor.',
      recommendedNextSteps: [
        'Send SOC 2 Type II report and GDPR compliance summary to michael.rodriguez@techflowinc.com',
        'Schedule a 30-minute technical security review call with TechFlow IT team for next Tuesday',
        'Loop in Solutions Engineer to handle advanced compliance questions on the call'
      ],
      recentActivity: [
        { date: 'May 26', activityType: 'email', description: 'Requested technical documentation for security review' },
        { date: 'May 21', activityType: 'call', description: 'Discovery call — confirmed interest in enterprise plan, blocker is security audit' },
        { date: 'May 15', activityType: 'demo', description: 'Product demo (60 min) — full IT team attended, positive feedback' }
      ],
      notes: 'Michael needs SOC 2 docs urgently — IT team meeting is May 28. Must deliver before that.'
    },
    {
      taskId: 'task_004',
      contactId: 'contact-005',
      contactName: 'Karen Taylor',
      companyName: 'Enterprise Solutions Ltd',
      channel: 'call',
      scheduledTime: '10:00 AM (PST)',
      dueDateTime: 'Today, 1:00 PM',
      isOverdue: false,
      isAtRisk: false,
      interactionCount: 10,
      priority: 'normal',
      status: 'in_progress',
      dueDate: '2026-05-28',
      dueTime: '01:00 PM',
      assigneeId: 'me',
      assigneeName: 'Alex Morgan',
      assigneeRole: 'Account Executive',
      arr: '$120K ARR',
      todoType: 'flow',
      entityType: 'deal',
      workflowName: 'Enterprise Onboarding Flow',
      workflowStep: '5',
      totalWorkflowSteps: 5,
      aiSignal: 'Contract review needed before signing',
      aiSignalType: 'opportunity',
    },
    {
      taskId: 'task_005',
      contactId: 'contact-006',
      contactName: 'Tom Anderson',
      companyName: 'SalesTech Pro',
      channel: 'linkedin',
      scheduledTime: '2:00 PM (PST)',
      dueDateTime: 'Today, 5:00 PM',
      isOverdue: false,
      isAtRisk: false,
      interactionCount: 1,
      priority: 'normal',
      status: 'pending',
      dueDate: '2026-05-28',
      dueTime: '05:00 PM',
      assigneeId: 'sarah',
      assigneeName: 'Sarah Chen',
      assigneeRole: 'Senior AE',
      arr: '$45K ARR',
      todoType: 'recommended',
      entityType: 'lead',
      aiSignal: 'Mutual connection introduced you',
      aiSignalType: 'opportunity',
    },
    {
      taskId: 'task_006',
      contactId: 'contact-004',
      contactName: 'David Park',
      companyName: 'CloudBridge',
      channel: 'linkedin',
      scheduledTime: '10:00 AM (PST)',
      dueDateTime: 'Due: Tomorrow, 10:00 AM',
      isOverdue: false,
      isAtRisk: false,
      interactionCount: 5,
      priority: 'normal',
      status: 'in_progress',
      dueDate: '2026-05-29',
      dueTime: '10:00 AM',
      assigneeId: 'michael',
      assigneeName: 'Michael Rodriguez',
      assigneeRole: 'Account Executive',
      arr: '$75K ARR',
      todoType: 'recommended',
      entityType: 'lead',
      aiSignal: 'Engagement increasing — pilot metrics positive',
      aiSignalType: 'momentum',
    },
    {
      taskId: 'task_007',
      contactId: 'contact-005',
      contactName: 'Patricia Williams',
      companyName: 'MegaCorp Industries',
      channel: 'call',
      scheduledTime: '9:00 AM (EST)',
      dueDateTime: 'Due: May 26, 9:00 AM',
      isOverdue: true,
      isAtRisk: false,
      interactionCount: 2,
      priority: 'high',
      status: 'pending',
      dueDate: '2026-05-26',
      dueTime: '09:00 AM',
      assigneeId: 'me',
      assigneeName: 'Alex Morgan',
      assigneeRole: 'Account Executive',
      arr: '$300K ARR',
      todoType: 'flow',
      entityType: 'account',
      workflowName: 'Sales Follow-up Flow',
      workflowStep: '1',
      totalWorkflowSteps: 4,
      aiSignal: 'High priority prospect went cold - overdue follow-up',
      aiSignalType: 'risk'
    },
    {
      taskId: 'task_008',
      contactId: 'contact-003',
      contactName: 'Jennifer Kim',
      companyName: 'DataStream Solutions',
      channel: 'call',
      scheduledTime: '12:00 PM (PST)',
      dueDateTime: 'Due: Jun 2, 3:00 PM',
      isOverdue: false,
      isAtRisk: false,
      interactionCount: 4,
      priority: 'high',
      status: 'pending',
      dueDate: '2026-06-02',
      dueTime: '03:00 PM',
      assigneeId: 'sarah',
      assigneeName: 'Sarah Chen',
      assigneeRole: 'Senior AE',
      arr: '$150K ARR',
      todoType: 'flow',
      entityType: 'deal',
      workflowName: 'Enterprise Onboarding Flow',
      workflowStep: '3',
      totalWorkflowSteps: 5,
      aiSignal: 'Engineering team wants architecture overview',
      aiSignalType: 'opportunity'
    },
    {
      taskId: 'task_014',
      contactId: 'contact-006',
      contactName: 'Lisa Martinez',
      companyName: 'StartupHub',
      channel: 'call',
      scheduledTime: '8:00 AM (PST)',
      dueDateTime: 'Today, 11:00 AM',
      isOverdue: false,
      isAtRisk: false,
      interactionCount: 8,
      priority: 'normal',
      status: 'completed',
      dueDate: '2026-05-28',
      dueTime: '11:00 AM',
      assigneeId: 'me',
      assigneeName: 'Alex Morgan',
      assigneeRole: 'Account Executive',
      arr: '$35K ARR',
      todoType: 'manual',
      entityType: 'lead',
      aiSignal: 'Call completed, next steps outlined',
      aiSignalType: 'opportunity'
    },
    {
      taskId: 'task_015',
      contactId: 'contact-004',
      contactName: 'Robert Johnson',
      companyName: 'GlobalTech',
      channel: 'email',
      scheduledTime: '9:00 AM (EST)',
      dueDateTime: 'Today, 9:00 AM',
      isOverdue: false,
      isAtRisk: false,
      interactionCount: 12,
      priority: 'normal',
      status: 'completed',
      dueDate: '2026-05-28',
      dueTime: '09:00 AM',
      assigneeId: 'me',
      assigneeName: 'Alex Morgan',
      assigneeRole: 'Account Executive',
      arr: '$200K ARR',
      todoType: 'flow',
      entityType: 'account',
      aiSignal: 'Meeting completed successfully',
      aiSignalType: 'opportunity'
    }
  ];

  for (const t of tasksData) {
    const dataObj = {
      contactId: t.contactId,
      contactName: t.contactName,
      companyName: t.companyName,
      channel: t.channel.toUpperCase(),
      scheduledTime: t.scheduledTime,
      dueDateTime: t.dueDateTime,
      isOverdue: t.isOverdue,
      isAtRisk: t.isAtRisk,
      interactionCount: t.interactionCount,
      priority: t.priority.toUpperCase(),
      status: t.status.toUpperCase(),
      dueDate: t.dueDate,
      dueTime: t.dueTime || null,
      assigneeId: t.assigneeId || 'me',
      assigneeName: t.assigneeName || 'Alex Morgan',
      assigneeRole: t.assigneeRole || 'Account Executive',
      aiSignal: t.aiSignal || null,
      aiSignalType: t.aiSignalType || null,
      arr: t.arr,
      aiInsight: t.aiInsight || null,
      notes: t.notes || null,
      todoType: t.todoType || null,
      entityType: t.entityType || null,
      workflowName: t.workflowName || null,
      workflowStep: t.workflowStep || null,
      totalWorkflowSteps: t.totalWorkflowSteps || null,
      sequenceName: t.sequenceName || null,
      sequenceStep: t.sequenceStep || null,
      recentActivity: t.recentActivity ? t.recentActivity : null,
      recommendedNextSteps: t.recommendedNextSteps || [],
    };

    await prisma.engageTask.upsert({
      where: { taskId: t.taskId },
      update: dataObj,
      create: {
        tenantId: TENANT_ID,
        taskId: t.taskId,
        ...dataObj,
      },
    });
  }

  // 5. Seed Email Drafts
  console.log('Seeding Email Drafts...');
  const draftsData = [
    {
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
    },
    {
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
    },
    {
      taskId: 'task_002',
      contactName: 'Sarah Chen',
      contactEmail: 'sarah.chen@acmecorp.com',
      fromEmail: 'alex.morgan@relanto.ai',
      fromLabel: 'alex.morgan@relanto.ai (Gmail)',
      subject: 'Following up on Q2 contract renewal — Acme Corp',
      bodyHtml: `Hi Sarah,\n\nI wanted to follow up on our conversation about the Q2 contract renewal. Based on our last call, I understand the primary concerns are around ROI justification and security compliance for your IT team.\n\nI've attached an updated ROI calculator that maps directly to your current workflow — based on companies of similar size in the Technology sector, our customers typically see a 3x efficiency gain within the first 90 days.\n\nWould you be open to a 30-minute call this week to walk through the numbers together before your board meeting on May 28?\n\nLooking forward to hearing from you.\n\nBest regards,\nAlex Morgan\nAccount Executive, Relanto`,
    },
  ];

  for (const d of draftsData) {
    await prisma.emailDraft.upsert({
      where: { taskId: d.taskId },
      update: d,
      create: {
        tenantId: TENANT_ID,
        ...d,
      },
    });
  }

  // 6. Seed Email Templates
  console.log('Seeding Email Templates...');
  const templatesData = [
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
      templateId: 'tmpl_001',
      templateName: 'Q2 Renewal Follow-up',
      subject: 'Following up on your Q2 contract renewal',
      bodyHtml: 'Hi {{firstName}},\n\nI wanted to circle back on your Q2 renewal. Our enterprise plan includes priority support, SSO, and advanced analytics.\n\nWould a 30-minute call this week work?\n\nBest,\n{{senderName}}',
      category: 'Follow-up',
    },
  ];

  for (const t of templatesData) {
    await prisma.emailTemplate.upsert({
      where: { templateId: t.templateId },
      update: t,
      create: {
        tenantId: TENANT_ID,
        ...t,
      },
    });
  }

  // 7. Seed Engage Activities
  console.log('Seeding Engage Activities...');
  const activitiesData = [
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
      activityId: 'act_003',
      contactId: 'contact-003',
      contactName: 'Jennifer Kim',
      company: 'DataStream Solutions',
      channelType: 'LINKEDIN',
      summary: 'Shared competitor analysis article',
      occurredAt: '2026-05-27T10:00:00-07:00',
      timeAgoLabel: '1d ago',
    },
  ];

  for (const a of activitiesData) {
    await prisma.engageActivity.upsert({
      where: { activityId: a.activityId },
      update: a,
      create: {
        tenantId: TENANT_ID,
        ...a,
      },
    });
  }

  // 8. Seed CallRecords + Transcripts
  console.log('Seeding Call Records...');
  const callRecordsData = [
    {
      id: 'call_001',
      title: 'Discovery Call - Acme Corp Q2 Initiative',
      callOwner: 'Sarah Chen',
      accountId: 'Acme Corp',
      callDate: new Date('2026-05-14T10:00:00Z'),
      durationSeconds: 2723,
      callType: 'Discovery',
      callSource: 'Zoom',
      participants: ['Sarah Chen', 'John Smith'],
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3',
      transcriptStatus: 'completed',
    },
    {
      id: 'call_002',
      title: 'Product Demo - TechStart Solutions',
      callOwner: 'Michael Rodriguez',
      accountId: 'TechStart Solutions',
      callDate: new Date('2026-05-14T14:30:00Z'),
      durationSeconds: 3135,
      callType: 'Demo',
      callSource: 'Zoom',
      participants: ['Michael Rodriguez', 'Lisa Park'],
      audioUrl: 'https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3',
      transcriptStatus: 'completed',
    },
  ];

  for (const c of callRecordsData) {
    const rec = await prisma.callRecord.upsert({
      where: { id: c.id },
      update: c,
      create: {
        tenantId: TENANT_ID,
        ...c,
      },
    });

    await prisma.transcript.upsert({
      where: { callId: rec.id },
      update: {},
      create: {
        callId: rec.id,
        tenantId: TENANT_ID,
        fullText: 'This is a seeded full transcript.',
        summary: `Seeded transcript for ${rec.title}. Prospect showed interest in key features.`,
      },
    });
  }

  // 9. Seed Call Reviews
  console.log('Seeding Call Reviews...');
  const reviewsData = [
    {
      reviewId: 'rv_001',
      callTitle: 'Discovery Call - Acme Corp Q2 Initiative',
      salesRep: 'Sarah Chen',
      customer: 'Acme Corporation',
      dateTime: '2026-05-14T10:00:00Z',
      duration: '45:23',
      callType: 'Discovery',
      dealLinked: 'Acme Corp - Q2 Sales Automation',
      callSource: 'Zoom',
      participants: [
        { name: 'Sarah Chen', role: 'Rep' },
        { name: 'John Smith', role: 'VP Sales' },
      ],
      aiSummary: 'This was a discovery call with Acme Corp to understand their Q2 sales automation needs.',
      keyHighlights: ['Prospect has budget approved for Q2', 'Competing with 2 other vendors'],
      talkRatio: { rep: 45, customer: 55 },
      sentimentSummary: 'Overall positive (65%) with some concerns about implementation complexity',
      sentimentScore: 65,
      risksDetected: ['No clear decision-making process established'],
      actionItemsList: ['Send technical requirements document'],
      scorecardName: 'Discovery Call Scorecard',
      scorecardVersion: 'v2.3',
      reviewMode: 'AI-Assisted',
      dueDate: '2026-05-16T23:59:00Z',
      status: 'Pending',
      reviewer: 'You',
      quickStats: { topics: 5, actionItems: 3 },
      aiFlags: ['High Risk Deal', 'No Next Steps'],
      hasReview: true,
      questions: [],
      feedback: [],
    },
    {
      reviewId: 'rv_002',
      callTitle: 'Product Demo - TechStart Solutions',
      salesRep: 'Michael Rodriguez',
      customer: 'TechStart Solutions',
      dateTime: '2026-05-14T14:30:00Z',
      duration: '52:15',
      callType: 'Demo',
      dealLinked: 'TechStart Solutions Deal',
      callSource: 'Zoom',
      participants: [
        { name: 'Michael Rodriguez', role: 'Rep' },
        { name: 'Lisa Park', role: 'CTO' },
      ],
      aiSummary: 'Michael delivered a solid product demo to TechStart Solutions.',
      keyHighlights: ['Strong product demonstration of core features'],
      talkRatio: { rep: 60, customer: 40 },
      sentimentSummary: 'Mixed — positive on product, concern on pricing',
      sentimentScore: 58,
      risksDetected: ['Pricing objection unresolved'],
      actionItemsList: ['Send pricing proposal'],
      scorecardName: 'Demo Call Scorecard',
      scorecardVersion: 'v1.5',
      reviewMode: 'AI-Assisted',
      dueDate: '2026-05-15T23:59:00Z',
      status: 'In Progress',
      reviewer: 'You',
      quickStats: { topics: 4, actionItems: 2 },
      aiFlags: ['Objection Issue'],
      hasReview: true,
      questions: [],
      feedback: [],
    },
  ];

  for (const r of reviewsData) {
    await prisma.callReview.upsert({
      where: { reviewId: r.reviewId },
      update: r,
      create: {
        tenantId: TENANT_ID,
        ...r,
      },
    });
  }

  // 10. Seed Training Scenarios
  console.log('Seeding Training Scenarios...');
  const scenariosToSeed = [
    {
      scenarioid: 'e4b6c3d5-e2d6-4a41-8664-df8953cb7c01',
      name: 'Angry Client - Downtime Discussion',
      personadescription: 'Upset IT Executive dealing with downtime issues.',
      context: 'Client is upset about recent downtime and wants to cancel contract.',
      difficulty: 'advanced',
      createdby: '00000000-0000-0000-0000-000000000001',
    },
    {
      scenarioid: 'e4b6c3d5-e2d6-4a41-8664-df8953cb7c02',
      name: 'Pricing Objection - SaaS Expansion',
      personadescription: 'Procurement manager trying to negotiate 25% discount.',
      context: 'Prospect loves the tool but claims budget is tight.',
      difficulty: 'medium',
      createdby: '00000000-0000-0000-0000-000000000001',
    },
  ];

  for (const s of scenariosToSeed) {
    await prisma.trainerscenarios.upsert({
      where: { scenarioid: s.scenarioid },
      update: s,
      create: {
        tenantid: TENANT_ID,
        ...s,
      },
    });
  }

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
