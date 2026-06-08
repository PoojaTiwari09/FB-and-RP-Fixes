import { DealActivity, DealBoard, BoardDetail, BoardSummaryCard, Deal, Warning, PlaybookCriterion, PlaybookData, ActivityEvent, ActivityData, BriefData, CrmFields, Notification, StageOptions, NotificationsResponse } from '../types/deal-boards.types';

function generateRandomActivity(): DealActivity[] {
  const dates = ['MAY 5', 'MAY 8', 'MAY 10', 'MAY 13', 'MAY 14', 'MAY 15'];
  const activities: DealActivity[] = [];
  dates.forEach((d, idx) => {
    if (Math.random() > 0.3) {
      const count = Math.floor(Math.random() * 3) + 1;
      const interactions = [];
      for (let i = 0; i < count; i++) {
        interactions.push({
          id: Math.random().toString(),
          type: Math.random() > 0.5 ? 'customer' : ('rep' as 'customer' | 'rep'),
          size: Math.floor(Math.random() * 16) + 8,
          positionPercent: (idx * 16) + Math.floor(Math.random() * 15)
        });
      }
      activities.push({ dateLabel: d, count, interactions });
    }
  });
  return activities;
}
// ─── Seed: GET /api/deal-boards ───────────────────────────────

export const MOCK_DEAL_BOARDS: DealBoard[] = [
  {
    boardId: "board-1",
    name: "My Deals",
    description: "Personal deal tracking and management",
    owner: "John Smith",
    lastModified: "2026-05-16T10:30:00",
    canEdit: true,
  },
  {
    boardId: "board-2",
    name: "Enterprise Deals Q2",
    description: "All enterprise opportunities for Q2 2026",
    owner: "Sarah Chen",
    lastModified: "2026-05-15T15:45:00",
    canEdit: false,
  },
  {
    boardId: "board-3",
    name: "Team Pipeline - West",
    description: "Western region team pipeline overview",
    owner: "Michael Rodriguez",
    lastModified: "2026-05-14T09:20:00",
    canEdit: false,
  },
  {
    boardId: "board-4",
    name: "Strategic Accounts",
    description: "High-value strategic account opportunities",
    owner: "Jennifer Kim",
    lastModified: "2026-05-13T14:15:00",
    canEdit: true,
  },
];

// ─── Seed: GET /api/deal-boards/:boardId ─────────────────────

export const MOCK_BOARD_DETAIL: Record<string, BoardDetail> = {
  "board-1": {
    boardId: "board-1",
    name: "My Deals — Q2",
    ownerTag: "Owner = Me - locked",
    summaryCards: [
      { label: "Open", amount: 880000, count: 4, changePercent: 12 },
      { label: "Commit", amount: 335000, count: 2, changePercent: 12 },
      { label: "Most Likely", amount: 380000, count: 3, changePercent: 12 },
      { label: "Best Case", amount: 45000, count: 1, changePercent: 12 },
      { label: "Closed Won", amount: 125000, count: 1, changePercent: 12 },
      { label: "Closed Lost", amount: 0, count: 0, changePercent: 12 },
    ],
  },
  "board-2": {
    boardId: "board-2",
    name: "Enterprise Deals Q2",
    ownerTag: "Owner = Sarah Chen",
    summaryCards: [
      { label: "Open", amount: 1200000, count: 6, changePercent: 8 },
      { label: "Commit", amount: 450000, count: 3, changePercent: 8 },
      { label: "Most Likely", amount: 620000, count: 4, changePercent: 8 },
      { label: "Best Case", amount: 95000, count: 2, changePercent: 8 },
      { label: "Closed Won", amount: 310000, count: 2, changePercent: 8 },
      { label: "Closed Lost", amount: 75000, count: 1, changePercent: 8 },
    ],
  },
  "board-3": {
    boardId: "board-3",
    name: "Team Pipeline - West",
    ownerTag: "Owner = Michael Rodriguez",
    summaryCards: [
      { label: "Open", amount: 540000, count: 3, changePercent: 5 },
      { label: "Commit", amount: 180000, count: 1, changePercent: 5 },
      { label: "Most Likely", amount: 250000, count: 2, changePercent: 5 },
      { label: "Best Case", amount: 70000, count: 1, changePercent: 5 },
      { label: "Closed Won", amount: 95000, count: 1, changePercent: 5 },
      { label: "Closed Lost", amount: 40000, count: 1, changePercent: 5 },
    ],
  },
  "board-4": {
    boardId: "board-4",
    name: "Strategic Accounts",
    ownerTag: "Owner = Jennifer Kim",
    summaryCards: [
      { label: "Open", amount: 2100000, count: 5, changePercent: 15 },
      { label: "Commit", amount: 750000, count: 2, changePercent: 15 },
      { label: "Most Likely", amount: 900000, count: 3, changePercent: 15 },
      { label: "Best Case", amount: 300000, count: 1, changePercent: 15 },
      { label: "Closed Won", amount: 450000, count: 2, changePercent: 15 },
      { label: "Closed Lost", amount: 0, count: 0, changePercent: 15 },
    ],
  },
};

// ─── Seed: GET /api/deal-boards/:boardId/deals ───────────────
// NOTE: All filtering (stage, forecastCategory, amount, closeDate)
//       and grouping (by stage / by rep) is done client-side.
//       Only this one base endpoint is required from the backend.

export const MOCK_DEALS: Record<string, Deal[]> = {
  "board-1": [
    {
      dealId: "deal-1",
      dealName: "Acme Corp - Enterprise Platform",
      company: "Acme Corporation",
      stage: "Proposal",
      amount: 250000,
      forecastCategory: "Commit",
      closeDate: "2026-04-28",
      assignedRep: "Lakshmi Prasanna Dara",
      contacts: 3,
      notificationCount: 3,
      aiWarningCount: 1,
      flagCount: 1,
      flagReason: "Manager has escalated this deal due to lack of recent progress.",
      activityOverTime: generateRandomActivity(),
      playbookScore: 67,
      playbookColor: "orange",
      aiSuggestedNextStep: "Schedule budget approval meeting with CFO",
    },
    {
      dealId: "deal-2",
      dealName: "TechStart Inc - Growth Package",
      company: "TechStart Inc",
      stage: "Negotiation",
      amount: 85000,
      forecastCategory: "Commit",
      closeDate: "2026-06-15",
      assignedRep: "Lakshmi Prasanna Dara",
      contacts: 2,
      notificationCount: 0,
      aiWarningCount: 0,
      flagCount: 0,
      activityOverTime: generateRandomActivity(),
      playbookScore: 95,
      playbookColor: "green",
      aiSuggestedNextStep: "Send contract for signature",
    },
    {
      dealId: "deal-3",
      dealName: "Global Solutions - Multi-Year Deal",
      company: "Global Solutions Ltd",
      stage: "Discovery",
      amount: 500000,
      forecastCategory: "Pipeline",
      closeDate: "2026-07-31",
      assignedRep: "Lakshmi Prasanna Dara",
      contacts: 1,
      notificationCount: 1,
      aiWarningCount: 2,
      flagCount: 2,
      flagReason: "Escalated by VP of Sales � requires immediate action.",
      activityOverTime: generateRandomActivity(),
      playbookScore: 33,
      playbookColor: "red",
      aiSuggestedNextStep: "Re-engage with new contact immediately",
    },
    {
      dealId: "deal-4",
      dealName: "NextGen Enterprises - Pilot",
      company: "NextGen Enterprises",
      stage: "Qualification",
      amount: 45000,
      forecastCategory: "Pipeline",
      closeDate: "2026-08-30",
      assignedRep: "Lakshmi Prasanna Dara",
      contacts: 1,
      notificationCount: 0,
      aiWarningCount: 1,
      flagCount: 0,
      activityOverTime: generateRandomActivity(),
      playbookScore: 50,
      playbookColor: "orange",
      aiSuggestedNextStep: "Multi-thread - engage VP and IT stakeholders",
    },
  ],
  "board-2": [
    {
      dealId: "deal-5",
      dealName: "MegaCorp - Cloud Migration",
      company: "MegaCorp Inc",
      stage: "Proposal",
      amount: 420000,
      forecastCategory: "Best Case",
      closeDate: "2026-06-30",
      assignedRep: "Revenue Intelligence Demo",
      contacts: 4,
      notificationCount: 2,
      aiWarningCount: 1,
      flagCount: 1,
      flagReason: "Manager has escalated this deal: close date is at risk.",
      activityOverTime: generateRandomActivity(),
      playbookScore: 72,
      playbookColor: "orange",
      aiSuggestedNextStep: "Present revised pricing to procurement",
    },
    {
      dealId: "deal-6",
      dealName: "Horizon Labs - Analytics Suite",
      company: "Horizon Labs",
      stage: "Negotiation",
      amount: 195000,
      forecastCategory: "Commit",
      closeDate: "2026-05-31",
      assignedRep: "Revenue Intelligence Demo",
      contacts: 3,
      notificationCount: 1,
      aiWarningCount: 0,
      flagCount: 0,
      activityOverTime: generateRandomActivity(),
      playbookScore: 88,
      playbookColor: "green",
      aiSuggestedNextStep: "Confirm legal redlines and set signing date",
    },
  ],
  "board-3": [
    {
      dealId: "deal-7",
      dealName: "Pinnacle Group - Security Platform",
      company: "Pinnacle Group",
      stage: "Discovery",
      amount: 310000,
      forecastCategory: "Pipeline",
      closeDate: "2026-08-15",
      assignedRep: "Revenue Intelligence Demo",
      contacts: 2,
      notificationCount: 0,
      aiWarningCount: 1,
      flagCount: 0,
      activityOverTime: generateRandomActivity(),
      playbookScore: 40,
      playbookColor: "red",
      aiSuggestedNextStep: "Complete technical discovery session",
    },
  ],
  "board-4": [
    {
      dealId: "deal-8",
      dealName: "Vertex Capital - Enterprise Suite",
      company: "Vertex Capital",
      stage: "Proposal",
      amount: 850000,
      forecastCategory: "Most Likely",
      closeDate: "2026-06-30",
      assignedRep: "Lakshmi Prasanna Dara",
      contacts: 5,
      notificationCount: 2,
      aiWarningCount: 1,
      flagCount: 1,
      flagReason: "Regional Director escalated this opportunity for priority review.",
      activityOverTime: generateRandomActivity(),
      playbookScore: 78,
      playbookColor: "green",
      aiSuggestedNextStep: "Schedule exec alignment call with CRO",
    },
  ],
};

// ─── Seed: GET /api/deals/:dealId/brief ──────────────────────

export const MOCK_BRIEF: Record<string, BriefData> = {
  "deal-1": {
    aiSummary:
      "The deal is stalled in negotiation. Buyer raised pricing concerns on Apr 20 — no follow-up has occurred since. The CFO (economic buyer) has never joined a recorded call. Close date has passed. Sentiment is negative.",
    whatChangedThisWeek:
      "Close date crossed on Apr 28 with deal still open. Warning count increased from 2 → 3. No new activity logged since Apr 21.",
    buyerSentiment: "Negative",
    lastInteraction: "Apr 21 — email sent, no reply",
    keyRisks: "CFO not engaged • No next steps • Close date past",
  },
  "deal-2": {
    aiSummary:
      "Deal is progressing well. Contract review is underway and champion is actively engaged. Legal review expected to complete by end of week.",
    whatChangedThisWeek:
      "Legal team received contract draft on May 20. Champion confirmed budget approval. No blockers identified.",
    buyerSentiment: "Positive",
    lastInteraction: "May 22 — call with champion, 30 min",
    keyRisks: "None identified",
  },
  "deal-3": {
    aiSummary:
      "Deal engagement has stalled. Primary contact changed roles last week. No executive sponsor identified yet. Discovery is incomplete.",
    whatChangedThisWeek:
      "Primary contact (Jane Lee) moved to different division. No replacement contact assigned. Last call was May 10.",
    buyerSentiment: "Neutral",
    lastInteraction: "May 10 — intro call with new contact",
    keyRisks: "Contact change • No exec sponsor • Incomplete discovery",
  },
  "deal-4": {
    aiSummary:
      "Early-stage deal with strong initial interest. Champion engaged but no economic buyer identified yet. Need to multi-thread into VP and IT decision-makers.",
    whatChangedThisWeek:
      "Champion requested technical deep-dive for May 30. IT team added to evaluation committee.",
    buyerSentiment: "Positive",
    lastInteraction: "May 24 — email exchange with champion",
    keyRisks: "No economic buyer • Single-threaded • Budget not confirmed",
  },
  "deal-5": {
    aiSummary:
      "Strong enterprise deal with active procurement engagement. Pricing has been challenged — revised proposal sent May 22. Technical evaluation passed.",
    whatChangedThisWeek:
      "Procurement requested volume discount on May 21. Revised proposal submitted May 22. Awaiting response.",
    buyerSentiment: "Neutral",
    lastInteraction: "May 22 — revised proposal sent",
    keyRisks: "Pricing sensitivity • Procurement delay • Competing vendor in evaluation",
  },
};

// ─── Seed: GET /api/deals/:dealId/warnings ───────────────────

export const MOCK_WARNINGS: Record<string, Warning[]> = {
  "deal-1": [
    {
      warningId: "warn-1",
      severity: "HIGH",
      title: "No activity — 10 days",
      description:
        "No calls or emails since Apr 21. Threshold for Negotiation stage: 7 days.",
      suggestedAction: "Schedule follow-up call with champion",
      status: "resolved",
    },
    {
      warningId: "warn-2",
      severity: "HIGH",
      title: "Decision maker not engaged",
      description:
        "CFO has not appeared on any recorded interaction. Only John (Manager) engaged.",
      suggestedAction: "Request introduction to CFO through champion",
      status: "active",
    },
    {
      warningId: "warn-3",
      severity: "HIGH",
      title: "Close date in the past",
      description: "CRM close date was Apr 28. Deal is still open. Update or escalate.",
      suggestedAction: "Update close date or escalate to manager",
      status: "active",
    },
  ],
  "deal-2": [],
  "deal-3": [
    {
      warningId: "warn-4",
      severity: "HIGH",
      title: "Primary contact changed",
      description:
        "Jane Lee moved to a different division. No replacement assigned in CRM.",
      suggestedAction: "Identify and reach out to new primary contact",
      status: "active",
    },
    {
      warningId: "warn-5",
      severity: "MEDIUM",
      title: "No executive sponsor",
      description: "No VP or C-suite contact recorded for a $500K deal.",
      suggestedAction: "Request exec sponsor introduction from champion",
      status: "active",
    },
  ],
  "deal-4": [
    {
      warningId: "warn-6",
      severity: "MEDIUM",
      title: "No economic buyer identified",
      description: "Deal is in Qualification. Economic buyer field is empty in CRM.",
      suggestedAction: "Ask champion to identify budget owner",
      status: "active",
    },
  ],
  "deal-5": [
    {
      warningId: "warn-7",
      severity: "MEDIUM",
      title: "Competing vendor identified",
      description: "Procurement mentioned shortlisting two vendors. Competitor not named.",
      suggestedAction: "Request competitive differentiation meeting with champion",
      status: "active",
    },
  ],
};

// ─── Seed: GET /api/deals/:dealId/playbook ───────────────────

export const MOCK_PLAYBOOK: Record<string, PlaybookData> = {
  "deal-1": {
    framework: "MEDDIC",
    scorePercentage: 67,
    completedCount: 4,
    totalCount: 6,
    criteria: [
      {
        criterionId: "crit-1",
        criterionName: "METRICS",
        question: "What are the quantifiable business metrics driving this purchase?",
        status: "Completed",
        notes: "Increase sales productivity by 30%, reduce sales cycle by 2 weeks",
      },
      {
        criterionId: "crit-2",
        criterionName: "ECONOMIC BUYER",
        question: "Who has budget authority and final approval?",
        status: "Pending",
        notes: "Robert Davis (CFO) - meeting scheduled",
        aiSuggestedNote: "Confirm budget amount and approval timeline in upcoming CFO meeting",
      },
      {
        criterionId: "crit-3",
        criterionName: "DECISION CRITERIA",
        question: "What are the formal decision criteria?",
        status: "Completed",
        notes:
          "Ease of use, integration with HubSpot, pricing, implementation timeline",
      },
      {
        criterionId: "crit-4",
        criterionName: "DECISION PROCESS",
        question: "What is the formal decision-making process?",
        status: "Completed",
        notes: "Technical eval → Budget approval → Legal review → Final decision",
      },
      {
        criterionId: "crit-5",
        criterionName: "IDENTIFY PAIN",
        question: "What is the compelling event or pain?",
        status: "Completed",
        notes:
          "Current CRM causing low adoption rates, losing deals due to poor tracking",
      },
      {
        criterionId: "crit-6",
        criterionName: "CHAMPION",
        question: "Who is your internal champion and how influential are they?",
        status: "Pending",
        notes: "Sarah (VP Sales) - strong advocate but limited exec influence",
        aiSuggestedNote: "Validate champion's access to CFO before next meeting",
      },
    ],
  },
  "deal-2": {
    framework: "MEDDIC",
    scorePercentage: 95,
    completedCount: 6,
    totalCount: 6,
    criteria: [
      {
        criterionId: "crit-7",
        criterionName: "METRICS",
        question: "What are the quantifiable business metrics driving this purchase?",
        status: "Completed",
        notes: "15% reduction in churn, 20% increase in upsell revenue",
      },
      {
        criterionId: "crit-8",
        criterionName: "ECONOMIC BUYER",
        question: "Who has budget authority and final approval?",
        status: "Completed",
        notes: "Mark Chen (CTO) — confirmed on May 18 call",
      },
      {
        criterionId: "crit-9",
        criterionName: "DECISION CRITERIA",
        question: "What are the formal decision criteria?",
        status: "Completed",
        notes: "API reliability, onboarding speed, pricing flexibility",
      },
      {
        criterionId: "crit-10",
        criterionName: "DECISION PROCESS",
        question: "What is the formal decision-making process?",
        status: "Completed",
        notes: "Legal review → Sign-off by CTO → PO issued",
      },
      {
        criterionId: "crit-11",
        criterionName: "IDENTIFY PAIN",
        question: "What is the compelling event or pain?",
        status: "Completed",
        notes: "Current tool contract expires Jun 30. Must switch before renewal.",
      },
      {
        criterionId: "crit-12",
        criterionName: "CHAMPION",
        question: "Who is your internal champion and how influential are they?",
        status: "Completed",
        notes: "Lisa Park (Head of RevOps) — full authority to push deal through",
      },
    ],
  },
  "deal-3": {
    framework: "MEDDIC",
    scorePercentage: 33,
    completedCount: 2,
    totalCount: 6,
    criteria: [
      {
        criterionId: "crit-13",
        criterionName: "METRICS",
        question: "What are the quantifiable business metrics driving this purchase?",
        status: "Completed",
        notes: "Reduce manual reporting time by 40%",
      },
      {
        criterionId: "crit-14",
        criterionName: "ECONOMIC BUYER",
        question: "Who has budget authority and final approval?",
        status: "Pending",
        notes: "Unknown — contact change disrupted access",
        aiSuggestedNote: "Re-identify economic buyer after contact reassignment",
      },
      {
        criterionId: "crit-15",
        criterionName: "DECISION CRITERIA",
        question: "What are the formal decision criteria?",
        status: "Pending",
        notes: "Not fully defined yet",
        aiSuggestedNote: "Ask new contact to share evaluation criteria checklist",
      },
      {
        criterionId: "crit-16",
        criterionName: "DECISION PROCESS",
        question: "What is the formal decision-making process?",
        status: "Pending",
        notes: "Unknown",
        aiSuggestedNote: "Map buying committee and approval chain with new contact",
      },
      {
        criterionId: "crit-17",
        criterionName: "IDENTIFY PAIN",
        question: "What is the compelling event or pain?",
        status: "Completed",
        notes: "Multi-site reporting is fully manual, causing weekly errors",
      },
      {
        criterionId: "crit-18",
        criterionName: "CHAMPION",
        question: "Who is your internal champion and how influential are they?",
        status: "Pending",
        notes: "Jane Lee — now in different division, no replacement identified",
        aiSuggestedNote: "Identify new champion after contact change",
      },
    ],
  },
  "deal-4": {
    framework: "MEDDIC",
    scorePercentage: 50,
    completedCount: 3,
    totalCount: 6,
    criteria: [
      {
        criterionId: "crit-19",
        criterionName: "METRICS",
        question: "What are the quantifiable business metrics driving this purchase?",
        status: "Completed",
        notes: "Reduce sales cycle by 20%, improve pipeline visibility",
      },
      {
        criterionId: "crit-20",
        criterionName: "ECONOMIC BUYER",
        question: "Who has budget authority and final approval?",
        status: "Pending",
        notes: "Not identified yet",
        aiSuggestedNote: "Ask champion to introduce budget owner before next call",
      },
      {
        criterionId: "crit-21",
        criterionName: "DECISION CRITERIA",
        question: "What are the formal decision criteria?",
        status: "Completed",
        notes: "Ease of onboarding, CRM integrations, reporting dashboards",
      },
      {
        criterionId: "crit-22",
        criterionName: "DECISION PROCESS",
        question: "What is the formal decision-making process?",
        status: "Completed",
        notes: "IT review → VP approval → Procurement sign-off",
      },
      {
        criterionId: "crit-23",
        criterionName: "IDENTIFY PAIN",
        question: "What is the compelling event or pain?",
        status: "Pending",
        notes: "Stated general dissatisfaction — no compelling event confirmed",
      },
      {
        criterionId: "crit-24",
        criterionName: "CHAMPION",
        question: "Who is your internal champion and how influential are they?",
        status: "Pending",
        notes: "Tom (Sales Ops) — engaged but no budget authority",
        aiSuggestedNote: "Multi-thread to VP and IT as agreed in last call",
      },
    ],
  },
};

// ─── Seed: GET /api/deals/:dealId/activity ───────────────────

export const MOCK_ACTIVITY: Record<string, ActivityData> = {
  "deal-1": {
    ourInteractions: 6,
    customerInteractions: 3,
    totalMinutes: 265,
    events: [
      {
        activityId: "act-1",
        date: "2026-05-05",
        type: "Quick Update",
        duration: 10,
        direction: "outbound",
        participants: ["John Smith"],
        notes: "Sent pricing summary via email",
      },
      {
        activityId: "act-2",
        date: "2026-05-08",
        type: "Discovery Call",
        duration: 45,
        direction: "outbound",
        participants: ["John Smith", "Sarah (Champion)"],
        notes: "Discussed integration requirements and timeline",
      },
      {
        activityId: "act-3",
        date: "2026-05-10",
        type: "Technical Demo",
        duration: 60,
        direction: "outbound",
        participants: ["John Smith", "Sarah (Champion)", "IT Team"],
        notes: "Full product demo — positive reception from IT",
      },
      {
        activityId: "act-4",
        date: "2026-05-13",
        type: "Follow-up Email",
        duration: 5,
        direction: "outbound",
        participants: ["John Smith"],
        notes: "Sent follow-up with proposal deck",
      },
      {
        activityId: "act-5",
        date: "2026-05-14",
        type: "Inbound Call",
        duration: 30,
        direction: "inbound",
        participants: ["Sarah (Champion)", "John Smith"],
        notes: "Champion called with pricing questions",
      },
      {
        activityId: "act-6",
        date: "2026-05-15",
        type: "Email Reply",
        duration: 5,
        direction: "inbound",
        participants: ["Sarah (Champion)"],
        notes: "Requested revised proposal with multi-year option",
      },
      {
        activityId: "act-7",
        date: "2026-05-15",
        type: "Proposal Sent",
        duration: 10,
        direction: "outbound",
        participants: ["John Smith"],
        notes: "Sent multi-year proposal with 3-year discount",
      },
      {
        activityId: "act-8",
        date: "2026-05-15",
        type: "Inbound Email",
        duration: 5,
        direction: "inbound",
        participants: ["Sarah (Champion)"],
        notes: "Acknowledged receipt, escalating to CFO",
      },
      {
        activityId: "act-9",
        date: "2026-05-15",
        type: "Internal Note",
        duration: 95,
        direction: "outbound",
        participants: ["John Smith"],
        notes: "CFO introduction expected next week",
      },
    ],
  },
  "deal-2": {
    ourInteractions: 4,
    customerInteractions: 3,
    totalMinutes: 120,
    events: [
      {
        activityId: "act-10",
        date: "2026-05-18",
        type: "Discovery Call",
        duration: 45,
        direction: "outbound",
        participants: ["John Smith", "Lisa Park"],
        notes: "Confirmed technical requirements and timeline",
      },
      {
        activityId: "act-11",
        date: "2026-05-20",
        type: "Contract Sent",
        duration: 10,
        direction: "outbound",
        participants: ["John Smith"],
        notes: "Sent MSA and order form for legal review",
      },
      {
        activityId: "act-12",
        date: "2026-05-22",
        type: "Champion Call",
        duration: 30,
        direction: "inbound",
        participants: ["Lisa Park", "John Smith"],
        notes: "Confirmed budget approval, awaiting legal sign-off",
      },
      {
        activityId: "act-13",
        date: "2026-05-22",
        type: "Follow-up Email",
        duration: 5,
        direction: "outbound",
        participants: ["John Smith"],
        notes: "Sent revised order form with updated terms",
      },
      {
        activityId: "act-14",
        date: "2026-05-23",
        type: "Inbound Email",
        duration: 10,
        direction: "inbound",
        participants: ["Lisa Park"],
        notes: "Legal has two minor redlines — will share by May 25",
      },
      {
        activityId: "act-15",
        date: "2026-05-25",
        type: "Inbound Email",
        duration: 20,
        direction: "inbound",
        participants: ["Lisa Park"],
        notes: "Redlines received — minor, accepting both",
      },
    ],
  },
  "deal-3": {
    ourInteractions: 3,
    customerInteractions: 2,
    totalMinutes: 80,
    events: [
      {
        activityId: "act-16",
        date: "2026-05-05",
        type: "Intro Call",
        duration: 30,
        direction: "outbound",
        participants: ["John Smith", "Jane Lee"],
        notes: "Initial discovery with primary contact",
      },
      {
        activityId: "act-17",
        date: "2026-05-10",
        type: "Intro Call",
        duration: 20,
        direction: "outbound",
        participants: ["John Smith", "New Contact (TBD)"],
        notes: "Intro call with replacement contact — limited context",
      },
      {
        activityId: "act-18",
        date: "2026-05-10",
        type: "Inbound Email",
        duration: 10,
        direction: "inbound",
        participants: ["New Contact (TBD)"],
        notes: "Said they would review the deck and follow up",
      },
      {
        activityId: "act-19",
        date: "2026-05-12",
        type: "Follow-up Email",
        duration: 5,
        direction: "outbound",
        participants: ["John Smith"],
        notes: "Sent follow-up — no response yet",
      },
      {
        activityId: "act-20",
        date: "2026-05-15",
        type: "Inbound Email",
        duration: 15,
        direction: "inbound",
        participants: ["New Contact (TBD)"],
        notes: "Brief reply — contact still getting up to speed",
      },
    ],
  },
  "deal-4": {
    ourInteractions: 3,
    customerInteractions: 2,
    totalMinutes: 65,
    events: [
      {
        activityId: "act-21",
        date: "2026-05-20",
        type: "Intro Call",
        duration: 30,
        direction: "outbound",
        participants: ["John Smith", "Tom (Sales Ops)"],
        notes: "Initial qualification call — strong interest from champion",
      },
      {
        activityId: "act-22",
        date: "2026-05-22",
        type: "Inbound Email",
        duration: 5,
        direction: "inbound",
        participants: ["Tom (Sales Ops)"],
        notes: "Requested product overview deck",
      },
      {
        activityId: "act-23",
        date: "2026-05-23",
        type: "Email Sent",
        duration: 10,
        direction: "outbound",
        participants: ["John Smith"],
        notes: "Sent product overview and pricing guide",
      },
      {
        activityId: "act-24",
        date: "2026-05-24",
        type: "Email Exchange",
        duration: 10,
        direction: "inbound",
        participants: ["Tom (Sales Ops)"],
        notes: "Asked about IT integration support — replied same day",
      },
      {
        activityId: "act-25",
        date: "2026-05-24",
        type: "Email Reply",
        duration: 10,
        direction: "outbound",
        participants: ["John Smith"],
        notes: "Confirmed IT integration details, proposed technical deep-dive",
      },
    ],
  },
};

// ─── Seed: GET /api/deals/:dealId/crm-fields ─────────────────

export const MOCK_CRM_FIELDS: Record<string, CrmFields> = {
  "deal-1": {
    stage: "Proposal",
    amount: 250000,
    forecastCategory: "Commit",
    nextStep: "Budget approval meeting with CFO",
    closeDate: "2026-06-30",
  },
  "deal-2": {
    stage: "Negotiation",
    amount: 85000,
    forecastCategory: "Commit",
    nextStep: "Send contract for signature",
    closeDate: "2026-06-15",
  },
  "deal-3": {
    stage: "Discovery",
    amount: 500000,
    forecastCategory: "Pipeline",
    nextStep: "Re-engage with new contact immediately",
    closeDate: "2026-07-31",
  },
  "deal-4": {
    stage: "Qualification",
    amount: 45000,
    forecastCategory: "Pipeline",
    nextStep: "Multi-thread - engage VP and IT stakeholders",
    closeDate: "2026-08-30",
  },
  "deal-5": {
    stage: "Proposal",
    amount: 420000,
    forecastCategory: "Best Case",
    nextStep: "Present revised pricing to procurement",
    closeDate: "2026-06-30",
  },
};

// ─── Seed: GET /api/deals/stage-options ──────────────────────

export const MOCK_STAGE_OPTIONS: StageOptions = {
  stages: [
    "Qualification",
    "Discovery",
    "Proposal",
    "Negotiation",
    "Closed Won",
    "Closed Lost",
  ],
  forecastCategories: [
    "Pipeline",
    "Best Case",
    "Most Likely",
    "Commit",
    "Closed",
    "Omitted",
  ],
};

// ─── Seed: GET /api/notifications ────────────────────────────

export const MOCK_NOTIFICATIONS: NotificationsResponse = {
  unreadCount: 3,
  notifications: [
    {
      id: "notif-1",
      message: "Acme Corp - Enterprise Platform: Close date has passed",
      timestamp: "2026-05-27T08:00:00",
      read: false,
      type: "warning",
    },
    {
      id: "notif-2",
      message: "Global Solutions - Multi-Year Deal: New warning added",
      timestamp: "2026-05-26T17:30:00",
      read: false,
      type: "warning",
    },
    {
      id: "notif-3",
      message: "TechStart Inc - Growth Package: Contract ready for review",
      timestamp: "2026-05-26T14:00:00",
      read: false,
      type: "info",
    },
    {
      id: "notif-4",
      message: "NextGen Enterprises - Pilot: Activity logged by rep",
      timestamp: "2026-05-25T11:00:00",
      read: true,
      type: "activity",
    },
  ],
};



