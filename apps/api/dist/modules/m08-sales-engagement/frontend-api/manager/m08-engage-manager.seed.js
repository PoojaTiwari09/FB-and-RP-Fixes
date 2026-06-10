"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.INITIAL_MOCK_TASKS = exports.MOCK_EMAIL_TEMPLATES = exports.MOCK_RECENT_ACTIVITY = exports.MOCK_TEAM_MEMBERS = void 0;
exports.mockFetchTasksResponse = mockFetchTasksResponse;
exports.mockFetchSummaryResponse = mockFetchSummaryResponse;
exports.mockFetchTaskDetailResponse = mockFetchTaskDetailResponse;
exports.mockFetchRecentActivityResponse = mockFetchRecentActivityResponse;
exports.mockCreateTaskApiResponse = mockCreateTaskApiResponse;
exports.mockReassignTaskApiResponse = mockReassignTaskApiResponse;
exports.mockSkipTaskResponse = mockSkipTaskResponse;
exports.mockDismissTaskResponse = mockDismissTaskResponse;
exports.mockActionResponse = mockActionResponse;
exports.mockSearchLinkedEntitiesResponse = mockSearchLinkedEntitiesResponse;
exports.mockFetchEmailDraftResponse = mockFetchEmailDraftResponse;
exports.mockFetchLinkedInScriptResponse = mockFetchLinkedInScriptResponse;
exports.mockFetchContactDetailResponse = mockFetchContactDetailResponse;
exports.mockFetchTeamMembersResponse = mockFetchTeamMembersResponse;
exports.mockFetchFiltersConfigResponse = mockFetchFiltersConfigResponse;
const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
};
const getRelativeDate = (daysOffset) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0];
};
exports.MOCK_TEAM_MEMBERS = [
    { id: 'me', name: 'Alex Morgan', role: 'Account Executive' },
    { id: 'sarah', name: 'Sarah Chen', role: 'Senior AE' },
    { id: 'michael', name: 'Michael Rodriguez', role: 'Account Executive' },
    { id: 'jennifer', name: 'Jennifer Kim', role: 'Team Lead' },
    { id: 'david', name: 'David Park', role: 'Account Executive' },
    { id: 'emily', name: 'Emily Thompson', role: 'Senior AE' },
    { id: 'james', name: 'James Wilson', role: 'Account Executive' },
];
exports.MOCK_RECENT_ACTIVITY = [
    {
        id: 'act_001',
        contactName: 'Sarah Chen',
        companyName: 'Acme Corp',
        activityType: 'call',
        description: 'Discussed pricing concerns and ROI timeline',
        timeAgo: '2h ago',
    },
    {
        id: 'act_002',
        contactName: 'Michael Rodriguez',
        companyName: 'TechFlow Inc',
        activityType: 'email',
        description: 'Requested technical documentation for security review',
        timeAgo: '5h ago',
    },
    {
        id: 'act_003',
        contactName: 'Jennifer Kim',
        companyName: 'DataStream Solutions',
        activityType: 'linkedin_profile_viewed',
        description: 'Shared competitor analysis article',
        timeAgo: '1d ago',
    },
    {
        id: 'act_004',
        contactName: 'David Park',
        companyName: 'CloudBridge',
        activityType: 'call',
        description: 'Weekly pilot program check-in',
        timeAgo: '2d ago',
    },
];
exports.MOCK_EMAIL_TEMPLATES = [
    {
        id: 'tmpl_001',
        name: 'Q2 Renewal Follow-up',
        subject: 'Following up on your Q2 contract renewal',
        body: 'Hi {{firstName}},\n\nI wanted to circle back on your Q2 renewal. Our enterprise plan includes priority support, SSO, and advanced analytics.\n\nWould a 30-minute call this week work?\n\nBest,\n{{senderName}}',
    },
    {
        id: 'tmpl_002',
        name: 'Post-Demo Follow-up',
        subject: 'Great connecting — next steps for {{companyName}}',
        body: 'Hi {{firstName}},\n\nThank you for attending the demo. I\'m sending the DataStream Solutions case study and updated pricing sheet as promised.\n\nBest,\n{{senderName}}',
    },
    {
        id: 'tmpl_003',
        name: 'Compliance Documentation',
        subject: 'Security & Compliance Documentation — {{companyName}}',
        body: 'Hi {{firstName}},\n\nAttached please find our SOC 2 Type II report and GDPR compliance summary for your IT team\'s review.\n\nHappy to schedule a technical call if needed.\n\nBest,\n{{senderName}}',
    },
];
const INITIAL_MOCK_TASKS = () => {
    const today = getTodayDate();
    const tomorrow = getRelativeDate(1);
    const yesterday = getRelativeDate(-1);
    const nextWeek = getRelativeDate(7);
    return [
        {
            id: 'task_001',
            title: 'Follow up on Q2 contract renewal',
            contactName: 'Sarah Chen',
            companyName: 'Acme Corp',
            channel: 'call',
            scheduledTime: '2:30 PM (PST)',
            dueDateTime: 'Today, 2:00 PM',
            isOverdue: false,
            interactionCount: 6,
            priority: 'high',
            status: 'pending',
            dueDate: today,
            dueTime: '02:00 PM',
            assigneeId: 'me',
            assigneeName: 'Alex Morgan',
            assigneeRole: 'Account Executive',
            arr: '$240K ARR',
            todoType: 'flow',
            entityType: 'deal',
            workflowName: 'Enterprise Onboarding Flow',
            workflowStep: 1,
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
            id: 'task_002',
            title: 'Send follow-up email with pricing',
            contactName: 'Sarah Chen',
            companyName: 'Acme Corp',
            channel: 'email',
            scheduledTime: '2:30 PM (PST)',
            dueDateTime: 'Today, 3:00 PM',
            isOverdue: false,
            interactionCount: 6,
            priority: 'high',
            status: 'pending',
            dueDate: today,
            dueTime: '03:00 PM',
            assigneeId: 'me',
            assigneeName: 'Alex Morgan',
            assigneeRole: 'Account Executive',
            arr: '$240K ARR',
            todoType: 'flow',
            entityType: 'deal',
            workflowName: 'Enterprise Onboarding Flow',
            workflowStep: 2,
            totalWorkflowSteps: 5,
            aiSignal: 'Follow immediately after call while context is fresh',
            aiSignalType: 'opportunity',
            emailDraft: {
                to: 'sarah.chen@acmecorp.com',
                fromOptions: ['alex.morgan@relanto.ai (Gmail)', 'alex.morgan@relanto.ai (Office 365)'],
                subject: 'Following up on Q2 contract renewal — Acme Corp',
                body: 'Hi Sarah,\n\nI wanted to follow up on our conversation about the Q2 contract renewal. Based on our last call, I understand the primary concerns are around ROI justification and security compliance for your IT team.\n\nI\'ve attached an updated ROI calculator that maps directly to your current workflow — based on companies of similar size in the Technology sector, our customers typically see a 3x efficiency gain within the first 90 days.\n\nWould you be open to a 30-minute call this week to walk through the numbers together before your board meeting on May 28?\n\nLooking forward to hearing from you.\n\nBest regards,\nAlex Morgan\nAccount Executive, Relanto'
            }
        },
        {
            id: 'task_003',
            title: 'Demo product roadmap for enterprise tier',
            contactName: 'Michael Rodriguez',
            companyName: 'TechFlow Inc',
            channel: 'call',
            scheduledTime: '1:30 PM (PST)',
            dueDateTime: 'Today, 4:30 PM',
            isOverdue: true,
            interactionCount: 7,
            priority: 'high',
            status: 'in_progress',
            dueDate: today,
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
            id: 'task_004',
            title: 'Review contract terms with legal',
            contactName: 'Karen Taylor',
            companyName: 'Enterprise Solutions Ltd',
            channel: 'call',
            scheduledTime: '10:00 AM (PST)',
            dueDateTime: 'Today, 1:00 PM',
            isOverdue: false,
            interactionCount: 10,
            priority: 'normal',
            status: 'in_progress',
            dueDate: today,
            dueTime: '01:00 PM',
            assigneeId: 'me',
            assigneeName: 'Alex Morgan',
            assigneeRole: 'Account Executive',
            arr: '$120K ARR',
            todoType: 'flow',
            entityType: 'deal',
            workflowName: 'Enterprise Onboarding Flow',
            workflowStep: 5,
            totalWorkflowSteps: 5,
            aiSignal: 'Contract review needed before signing',
            aiSignalType: 'opportunity',
        },
        {
            id: 'task_005',
            title: 'LinkedIn connection request',
            contactName: 'Tom Anderson',
            companyName: 'SalesTech Pro',
            channel: 'linkedin',
            scheduledTime: '2:00 PM (PST)',
            dueDateTime: 'Today, 5:00 PM',
            isOverdue: false,
            interactionCount: 1,
            priority: 'normal',
            status: 'pending',
            dueDate: today,
            dueTime: '05:00 PM',
            assigneeId: 'sarah',
            assigneeName: 'Sarah Chen',
            assigneeRole: 'Senior AE',
            arr: '$45K ARR',
            todoType: 'recommended',
            entityType: 'lead',
            aiSignal: 'Mutual connection introduced you',
            aiSignalType: 'opportunity',
            mutualConnections: 4,
            linkedinScript: {
                messageScript: 'Hi Tom,\n\nI noticed we share several mutual connections in the RevOps space and came across your recent post on pipeline forecasting — great insights on the signal-to-noise problem in CRM data.\n\nI work with revenue teams at companies like Acme Corp and DataStream Solutions to solve exactly that challenge. Would love to connect and share a few ideas.\n\nBest,\nAlex Morgan'
            }
        },
        {
            id: 'task_006',
            title: 'Check in on pilot program progress',
            contactName: 'David Park',
            companyName: 'CloudBridge',
            channel: 'linkedin',
            scheduledTime: '10:00 AM (PST)',
            dueDateTime: 'Due: Tomorrow, 10:00 AM',
            isOverdue: false,
            interactionCount: 5,
            priority: 'normal',
            status: 'in_progress',
            dueDate: tomorrow,
            dueTime: '10:00 AM',
            assigneeId: 'michael',
            assigneeName: 'Michael Rodriguez',
            assigneeRole: 'Account Executive',
            arr: '$75K ARR',
            todoType: 'recommended',
            entityType: 'lead',
            aiSignal: 'Engagement increasing — pilot metrics positive',
            aiSignalType: 'momentum',
            mutualConnections: 12,
            linkedinScript: {
                messageScript: 'Hi David,\n\nI hope the pilot is going well! I saw the activity metrics are up 15% since our integration setup. Would love to connect for 10 minutes to grab initial feedback.\n\nBest,\nAlex'
            }
        },
        {
            id: 'task_007',
            title: 'Schedule discovery call',
            contactName: 'Patricia Williams',
            companyName: 'MegaCorp Industries',
            channel: 'call',
            scheduledTime: '9:00 AM (EST)',
            dueDateTime: 'Due: May 26, 9:00 AM',
            isOverdue: true,
            interactionCount: 2,
            priority: 'high',
            status: 'pending',
            dueDate: yesterday,
            dueTime: '09:00 AM',
            assigneeId: 'me',
            assigneeName: 'Alex Morgan',
            assigneeRole: 'Account Executive',
            arr: '$300K ARR',
            todoType: 'flow',
            entityType: 'account',
            workflowName: 'Sales Follow-up Flow',
            workflowStep: 1,
            totalWorkflowSteps: 4,
            aiSignal: 'High priority prospect went cold - overdue follow-up',
            aiSignalType: 'risk'
        },
        {
            id: 'task_008',
            title: 'Technical deep dive session',
            contactName: 'Jennifer Kim',
            companyName: 'DataStream Solutions',
            channel: 'call',
            scheduledTime: '12:00 PM (PST)',
            dueDateTime: 'Due: Jun 2, 3:00 PM',
            isOverdue: false,
            interactionCount: 4,
            priority: 'high',
            status: 'pending',
            dueDate: nextWeek,
            dueTime: '03:00 PM',
            assigneeId: 'sarah',
            assigneeName: 'Sarah Chen',
            assigneeRole: 'Senior AE',
            arr: '$150K ARR',
            todoType: 'flow',
            entityType: 'deal',
            workflowName: 'Enterprise Onboarding Flow',
            workflowStep: 3,
            totalWorkflowSteps: 5,
            aiSignal: 'Engineering team wants architecture overview',
            aiSignalType: 'opportunity'
        },
        {
            id: 'task_009',
            title: 'Custom follow-up task',
            contactName: 'Emily White',
            companyName: 'Innovation Labs',
            channel: 'custom',
            scheduledTime: '10:00 AM (PST)',
            dueDateTime: 'Due: Tomorrow, 1:00 PM',
            isOverdue: false,
            interactionCount: 3,
            priority: 'normal',
            status: 'pending',
            dueDate: tomorrow,
            dueTime: '01:00 PM',
            assigneeId: 'michael',
            assigneeName: 'Michael Rodriguez',
            assigneeRole: 'Account Executive',
            arr: '$25K ARR',
            todoType: 'recommended',
            entityType: 'lead',
            aiSignal: 'Prospect requested product comparison',
            aiSignalType: 'opportunity'
        },
        {
            id: 'task_010',
            title: 'Share case study with stakeholder',
            contactName: 'Amanda Foster',
            companyName: 'InnovateCo',
            channel: 'email',
            scheduledTime: '11:00 AM (PST)',
            dueDateTime: 'Due: Tomorrow, 2:00 PM',
            isOverdue: false,
            interactionCount: 9,
            priority: 'normal',
            status: 'pending',
            dueDate: tomorrow,
            dueTime: '02:00 PM',
            assigneeId: 'me',
            assigneeName: 'Alex Morgan',
            assigneeRole: 'Account Executive',
            arr: '$90K ARR',
            todoType: 'recommended',
            entityType: 'lead',
            aiSignal: 'CFO requested proof of ROI in similar company size',
            aiSignalType: 'opportunity',
            emailDraft: {
                to: 'amanda.foster@innovateco.com',
                fromOptions: ['alex.morgan@relanto.ai (Gmail)'],
                subject: 'CFO requested proof of ROI — InnovateCo',
                body: 'Hi Amanda,\n\nFollowing up on our conversation, I\'m sharing our latest customer case study showing typical ROI for companies of your scale.\n\nBest,\nAlex'
            }
        },
        {
            id: 'task_011',
            title: 'Connect on LinkedIn and share insights',
            contactName: 'Christopher Davis',
            companyName: 'Digital Innovations',
            channel: 'linkedin',
            scheduledTime: '7:00 AM (PST)',
            dueDateTime: 'Due: May 30, 10:00 AM',
            isOverdue: false,
            interactionCount: 0,
            priority: 'normal',
            status: 'pending',
            dueDate: getRelativeDate(3),
            dueTime: '10:00 AM',
            assigneeId: 'sarah',
            assigneeName: 'Sarah Chen',
            assigneeRole: 'Senior AE',
            arr: '$60K ARR',
            todoType: 'recommended',
            entityType: 'lead',
            aiSignal: 'Warm lead from referral - high conversion potential',
            aiSignalType: 'opportunity'
        },
        {
            id: 'task_012',
            title: 'Quarterly business review preparation',
            contactName: 'Michelle Garcia',
            companyName: 'TechVentures Corp',
            channel: 'email',
            scheduledTime: '11:00 AM (PST)',
            dueDateTime: 'Due: Jun 1, 2:00 PM',
            isOverdue: false,
            interactionCount: 15,
            priority: 'normal',
            status: 'pending',
            dueDate: getRelativeDate(5),
            dueTime: '02:00 PM',
            assigneeId: 'michael',
            assigneeName: 'Michael Rodriguez',
            assigneeRole: 'Account Executive',
            arr: '$110K ARR',
            todoType: 'flow',
            entityType: 'account',
            workflowName: 'Sales Follow-up Flow',
            workflowStep: 3,
            totalWorkflowSteps: 4,
            aiSignal: 'Scheduled QBR next week - prepare metrics',
            aiSignalType: 'momentum',
            emailDraft: {
                to: 'michelle.garcia@techventures.com',
                fromOptions: ['alex.morgan@relanto.ai (Gmail)'],
                subject: 'QBR Prep and Scheduling Checklist',
                body: 'Hi Michelle,\n\nAhead of our business review next week, I wanted to coordinate standard check points. Let me know if the draft agenda works.\n\nBest,\nAlex'
            }
        },
        {
            id: 'task_013',
            title: 'Send product demo video',
            contactName: 'James Brown',
            companyName: 'Velocity Systems',
            channel: 'email',
            scheduledTime: '8:30 AM (PST)',
            dueDateTime: 'Due: Jun 3, 11:30 AM',
            isOverdue: false,
            interactionCount: 4,
            priority: 'normal',
            status: 'pending',
            dueDate: nextWeek,
            dueTime: '11:30 AM',
            assigneeId: 'me',
            assigneeName: 'Alex Morgan',
            assigneeRole: 'Account Executive',
            arr: '$80K ARR',
            todoType: 'flow',
            entityType: 'deal',
            workflowName: 'Sales Follow-up Flow',
            workflowStep: 2,
            totalWorkflowSteps: 4,
            aiSignal: 'Requested async demo before team presentation',
            aiSignalType: 'opportunity',
            emailDraft: {
                to: 'james.brown@velocity.com',
                fromOptions: ['alex.morgan@relanto.ai (Gmail)'],
                subject: 'Velocity Systems async product demo resource',
                body: 'Hi James,\n\nHere is the video detailing integrations and standard security compliance features we spoke about.\n\nBest,\nAlex'
            }
        },
        {
            id: 'task_014',
            title: 'Follow up on pricing discussion',
            contactName: 'Lisa Martinez',
            companyName: 'StartupHub',
            channel: 'call',
            scheduledTime: '8:00 AM (PST)',
            dueDateTime: 'Today, 11:00 AM',
            isOverdue: false,
            interactionCount: 8,
            priority: 'normal',
            status: 'completed',
            dueDate: today,
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
            id: 'task_015',
            title: 'Send quarterly business review deck',
            contactName: 'Robert Johnson',
            companyName: 'GlobalTech',
            channel: 'email',
            scheduledTime: '9:00 AM (EST)',
            dueDateTime: 'Today, 9:00 AM',
            isOverdue: false,
            interactionCount: 12,
            priority: 'normal',
            status: 'completed',
            dueDate: today,
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
};
exports.INITIAL_MOCK_TASKS = INITIAL_MOCK_TASKS;
function mockFetchTasksResponse(groups, tabCounts, statusPills, pagination) {
    return {
        status: 'success',
        data: {
            groups,
            tabCounts,
            statusPills,
            pagination,
        },
    };
}
function mockFetchSummaryResponse(summary) {
    return {
        status: 'success',
        data: summary,
    };
}
function mockFetchTaskDetailResponse(task) {
    return {
        status: 'success',
        data: task,
    };
}
function mockFetchRecentActivityResponse(activities) {
    return {
        status: 'success',
        data: activities,
    };
}
function mockCreateTaskApiResponse(task) {
    return {
        status: 'success',
        data: {
            taskId: task.id,
            status: task.status,
            createdAt: task.createdAt || new Date().toISOString(),
        },
    };
}
function mockReassignTaskApiResponse(task) {
    return {
        status: 'success',
        data: {
            taskId: task.id,
            assigneeId: task.assigneeId,
            assigneeName: task.assigneeName,
            assigneeRole: task.assigneeRole,
            updatedAt: task.updatedAt || new Date().toISOString(),
        },
    };
}
function mockSkipTaskResponse(taskId) {
    return {
        status: 'success',
        data: {
            taskId,
            status: 'completed',
            action: 'skipped',
            updatedAt: new Date().toISOString(),
        },
    };
}
function mockDismissTaskResponse(taskId) {
    return {
        status: 'success',
        data: {
            taskId,
            status: 'completed',
            action: 'dismissed',
            updatedAt: new Date().toISOString(),
        },
    };
}
function mockActionResponse(taskId, action) {
    return {
        status: 'success',
        data: {
            taskId,
            action,
            loggedAt: new Date().toISOString(),
        },
    };
}
function mockSearchLinkedEntitiesResponse(results) {
    return {
        status: 'success',
        data: {
            results,
        },
    };
}
function mockFetchEmailDraftResponse(emailDraft) {
    return {
        status: 'success',
        data: emailDraft,
    };
}
function mockFetchLinkedInScriptResponse(script) {
    return {
        status: 'success',
        data: script,
    };
}
function mockFetchContactDetailResponse(contact) {
    return {
        status: 'success',
        data: contact,
    };
}
function mockFetchTeamMembersResponse(members) {
    return {
        status: 'success',
        data: members,
    };
}
function mockFetchFiltersConfigResponse(config) {
    return {
        status: 'success',
        data: config,
    };
}
//# sourceMappingURL=m08-engage-manager.seed.js.map