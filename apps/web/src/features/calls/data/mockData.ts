export interface Call {
  id: string;
  callName: string;
  account: string;
  dateTime: string;
  duration: string;
  type: string;
  stage: string;
  score: number;
  status: string;
  tags: string[];
}

export interface CallDetail extends Call {
  participants: { name: string; role: string }[];
}

export interface TranscriptEntry {
  speaker: string;
  role: string;
  timestamp: string;
  text: string;
  highlighted?: boolean;
}

export interface AIInsights {
  summary: string;
  keyHighlights: string[];
  talkRatio: { rep: number; customer: number };
  sentiment: string;
  topicsDiscussed: string[];
  objectionsDetected: string[];
  competitorMentions: string[];
  pricingDiscussion: string[];
  nextSteps: string[];
  actionItems: string[];
}

export interface ScorecardQuestion {
  questionText: string;
  managerAnswer: string;
  score: number;
  maxScore: number;
  managerComments: string;
  aiSuggestion: string;
  transcriptTimestamp: string;
}

export interface ScorecardSection {
  sectionName: string;
  sectionScore: number;
  questions: ScorecardQuestion[];
}

export interface ReviewData {
  scorecardName: string;
  scorecardVersion: string;
  reviewedBy: { name: string; role: string };
  reviewDate: string;
  overallScore: number;
  status: string;
  sections: ScorecardSection[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  assignedBy: string;
  status: string;
  notes: string;
}

export interface FeedbackData {
  tags: string[];
  strengths: string[];
  improvementAreas: string[];
  coachingNotes: string;
  recommendedActions: string[];
  acknowledgement: {
    isAcknowledged: boolean;
    acknowledgedAt: string | null;
    repResponse: string | null;
  };
  actionItems: ActionItem[];
}

export interface CoachingInsights {
  averageScore: number;
  averageScoreDelta: number;
  bestPracticeCalls: { count: number; total: number };
  coachingCompletion: { percentage: number; actionsCompleted: number; totalActions: number };
  needsCoachingCount: number;
  scoreTrend: { month: string; score: number }[];
  sectionPerformance: { section: string; score: number }[];
  tagFrequency: { tag: string; count: number }[];
  strengthAreas: string[];
  commonMistakes: string[];
}

// ─── Calls List ───────────────────────────────────────────────────────────────

export const MOCK_CALLS: Call[] = [
  {
    id: 'call_001',
    callName: 'Discovery Call - Enterprise Plan',
    account: 'Acme Corporation',
    dateTime: '2026-05-14T10:00:00Z',
    duration: '45:23',
    type: 'Discovery',
    stage: 'Qualification',
    score: 85,
    status: 'Reviewed',
    tags: ['Enterprise', 'High Value'],
  },
  {
    id: 'call_002',
    callName: 'Demo Call - Cloud Migration',
    account: 'TechStart Inc',
    dateTime: '2026-05-13T14:00:00Z',
    duration: '60:15',
    type: 'Demo',
    stage: 'Demo',
    score: 72,
    status: 'Feedback Pending',
    tags: ['Technical'],
  },
  {
    id: 'call_003',
    callName: 'Negotiation Call - Annual Contract',
    account: 'Global Solutions Ltd',
    dateTime: '2026-05-12T11:30:00Z',
    duration: '35:45',
    type: 'Negotiation',
    stage: 'Negotiation',
    score: 65,
    status: 'Not Reviewed',
    tags: ['High Value', 'Urgent'],
  },
  {
    id: 'call_004',
    callName: 'Follow-up Call - Implementation',
    account: 'Innovate Corp',
    dateTime: '2026-05-11T09:00:00Z',
    duration: '25:30',
    type: 'Follow-up',
    stage: 'Closed Won',
    score: 88,
    status: 'Acknowledged',
    tags: ['Onboarding'],
  },
  {
    id: 'call_005',
    callName: 'Cold Call - Outbound Prospecting',
    account: 'NextGen Enterprises',
    dateTime: '2026-05-10T15:30:00Z',
    duration: '12:15',
    type: 'Cold Call',
    stage: 'Prospecting',
    score: 55,
    status: 'Reviewed',
    tags: ['Outbound'],
  },
];

// ─── Call Detail ──────────────────────────────────────────────────────────────

export const MOCK_CALL_DETAILS: Record<string, CallDetail> = {
  call_001: {
    id: 'call_001',
    callName: 'Discovery Call - Enterprise Plan',
    account: 'Acme Corporation',
    dateTime: '2026-05-14T10:00:00Z',
    duration: '45:23',
    type: 'Discovery',
    stage: 'Qualification',
    score: 85,
    status: 'Reviewed',
    tags: ['Enterprise', 'High Value'],
    participants: [
      { name: 'John Smith', role: 'Rep' },
      { name: 'Sarah Johnson', role: 'Buyer' },
      { name: 'Mike Chen', role: 'Tech Lead' },
    ],
  },
  call_002: {
    id: 'call_002',
    callName: 'Demo Call - Cloud Migration',
    account: 'TechStart Inc',
    dateTime: '2026-05-13T14:00:00Z',
    duration: '60:15',
    type: 'Demo',
    stage: 'Demo',
    score: 72,
    status: 'Feedback Pending',
    tags: ['Technical'],
    participants: [
      { name: 'John Smith', role: 'Rep' },
      { name: 'David Lee', role: 'Buyer' },
      { name: 'Anna Park', role: 'CTO' },
    ],
  },
  call_003: {
    id: 'call_003',
    callName: 'Negotiation Call - Annual Contract',
    account: 'Global Solutions Ltd',
    dateTime: '2026-05-12T11:30:00Z',
    duration: '35:45',
    type: 'Negotiation',
    stage: 'Negotiation',
    score: 65,
    status: 'Not Reviewed',
    tags: ['High Value', 'Urgent'],
    participants: [
      { name: 'John Smith', role: 'Rep' },
      { name: 'Chris Brown', role: 'Buyer' },
      { name: 'Lisa Wong', role: 'CFO' },
    ],
  },
  call_004: {
    id: 'call_004',
    callName: 'Follow-up Call - Implementation',
    account: 'Innovate Corp',
    dateTime: '2026-05-11T09:00:00Z',
    duration: '25:30',
    type: 'Follow-up',
    stage: 'Closed Won',
    score: 88,
    status: 'Acknowledged',
    tags: ['Onboarding'],
    participants: [
      { name: 'John Smith', role: 'Rep' },
      { name: 'Maria Garcia', role: 'Buyer' },
    ],
  },
  call_005: {
    id: 'call_005',
    callName: 'Cold Call - Outbound Prospecting',
    account: 'NextGen Enterprises',
    dateTime: '2026-05-10T15:30:00Z',
    duration: '12:15',
    type: 'Cold Call',
    stage: 'Prospecting',
    score: 55,
    status: 'Reviewed',
    tags: ['Outbound'],
    participants: [
      { name: 'John Smith', role: 'Rep' },
      { name: 'Tom Harris', role: 'Buyer' },
    ],
  },
};

// ─── Transcripts ──────────────────────────────────────────────────────────────

export const MOCK_TRANSCRIPTS: Record<string, TranscriptEntry[]> = {
  call_001: [
    {
      speaker: 'John Smith',
      role: 'Rep',
      timestamp: '00:00',
      text: "Hi Sarah, thanks for taking the time to meet with me today. I wanted to learn more about your current challenges with sales productivity.",
    },
    {
      speaker: 'Sarah Johnson',
      role: 'Buyer',
      timestamp: '00:15',
      text: "Thanks for reaching out, John. We're definitely struggling with getting our team to adopt new tools. What makes your solution different?",
      highlighted: true,
    },
    {
      speaker: 'John Smith',
      role: 'Rep',
      timestamp: '00:30',
      text: "Great question. Our platform is designed with ease of use in mind. Can you tell me more about what tools you've tried before and what didn't work?",
      highlighted: true,
    },
    {
      speaker: 'Sarah Johnson',
      role: 'Buyer',
      timestamp: '00:45',
      text: "We tried Salesforce but the complexity was overwhelming. We need something simpler but still powerful.",
    },
    {
      speaker: 'Mike Chen',
      role: 'Tech Lead',
      timestamp: '01:00',
      text: "I'm also concerned about integration with our existing tech stack. Do you integrate with HubSpot?",
    },
    {
      speaker: 'John Smith',
      role: 'Rep',
      timestamp: '01:30',
      text: "Absolutely, we have a native HubSpot integration that syncs in real-time. Let me share how a few of our enterprise clients have handled this.",
    },
    {
      speaker: 'Sarah Johnson',
      role: 'Buyer',
      timestamp: '02:15',
      text: "That's great to hear. We've had issues with Salesforce in the past — the implementation took six months and our team barely used it.",
    },
    {
      speaker: 'John Smith',
      role: 'Rep',
      timestamp: '02:45',
      text: "I hear that a lot. Our typical enterprise onboarding is 2–3 weeks. We assign a dedicated success manager and run live training sessions.",
    },
    {
      speaker: 'Sarah Johnson',
      role: 'Buyer',
      timestamp: '03:30',
      text: "What's the pricing like for a team of 50 reps? We have a budget in the $50K range annually.",
    },
    {
      speaker: 'John Smith',
      role: 'Rep',
      timestamp: '04:00',
      text: "At that team size, you'd be looking at our Growth or Enterprise tier. I can put together a tailored proposal. Can we schedule a technical demo for your engineering team?",
    },
    {
      speaker: 'Mike Chen',
      role: 'Tech Lead',
      timestamp: '04:45',
      text: "Yes, I'd love to see the integration documentation and a sandbox environment if possible.",
    },
    {
      speaker: 'John Smith',
      role: 'Rep',
      timestamp: '05:10',
      text: "Absolutely. I'll send over our integration docs and set up a sandbox today. Let's confirm a time for the technical demo.",
    },
  ],
  call_002: [
    {
      speaker: 'John Smith',
      role: 'Rep',
      timestamp: '00:00',
      text: "Hi David, thank you for joining today's demo. I'll walk you through how our platform handles cloud migration workflows.",
    },
    {
      speaker: 'David Lee',
      role: 'Buyer',
      timestamp: '00:20',
      text: "Excited to see it. Anna from our tech team is here as well to evaluate the technical side.",
    },
    {
      speaker: 'Anna Park',
      role: 'CTO',
      timestamp: '00:35',
      text: "Yes, we're especially interested in the data migration capabilities and compliance features.",
    },
  ],
  call_003: [
    {
      speaker: 'John Smith',
      role: 'Rep',
      timestamp: '00:00',
      text: "Chris, Lisa — thanks for being here today. I wanted to walk through the final contract terms and address any outstanding questions.",
    },
    {
      speaker: 'Chris Brown',
      role: 'Buyer',
      timestamp: '00:30',
      text: "We've reviewed the proposal. Lisa has some questions on the payment terms.",
    },
    {
      speaker: 'Lisa Wong',
      role: 'CFO',
      timestamp: '00:55',
      text: "Yes, the net-30 terms are a bit tight for us. Can we discuss net-60 and a possible multi-year discount?",
    },
  ],
  call_004: [
    {
      speaker: 'John Smith',
      role: 'Rep',
      timestamp: '00:00',
      text: "Maria, great to connect. How is the implementation going on your end?",
    },
    {
      speaker: 'Maria Garcia',
      role: 'Buyer',
      timestamp: '00:15',
      text: "The team is loving it so far! We onboarded 20 reps last week and the adoption has been really strong.",
    },
  ],
  call_005: [
    {
      speaker: 'John Smith',
      role: 'Rep',
      timestamp: '00:00',
      text: "Hi Tom, my name is John from Revenue Intelligence. We help sales teams increase win rates by 30% through AI-powered coaching. Is now a good time?",
    },
    {
      speaker: 'Tom Harris',
      role: 'Buyer',
      timestamp: '00:18',
      text: "I have about 5 minutes. What exactly does your product do?",
    },
  ],
};

// ─── AI Insights ──────────────────────────────────────────────────────────────

export const MOCK_AI_INSIGHTS: Record<string, AIInsights> = {
  call_001: {
    summary:
      "Productive discovery call with Acme Corporation. Customer expressed pain points around tool adoption and integration needs. Strong buying signals detected. Next step is to schedule a technical demo.",
    keyHighlights: [
      "Customer mentioned previous failed implementation with Salesforce",
      "Budget discussion indicated $50K+ range",
      "Decision maker Sarah Johnson is highly engaged",
      "Technical requirements: HubSpot integration is critical",
    ],
    talkRatio: { rep: 35, customer: 65 },
    sentiment: 'Positive',
    topicsDiscussed: ['Tool Adoption', 'Integration', 'Budget', 'Technical Requirements'],
    objectionsDetected: ['Complexity concerns', 'Integration questions'],
    competitorMentions: ['Salesforce'],
    pricingDiscussion: ['$50K+ budget range mentioned'],
    nextSteps: ['Schedule technical demo', 'Send integration documentation'],
    actionItems: ['Prepare HubSpot integration demo', 'Loop in solutions engineer'],
  },
  call_002: {
    summary:
      "Comprehensive demo showcasing cloud migration capabilities to TechStart's technical team. CTO Anna Park raised detailed compliance questions. Strong technical engagement throughout.",
    keyHighlights: [
      "CTO personally attended the demo — high-level buy-in",
      "Compliance and data residency are top priorities",
      "Competitor Competitor AWS Migration Hub mentioned twice",
      "Timeline pressure: Q3 migration deadline",
    ],
    talkRatio: { rep: 55, customer: 45 },
    sentiment: 'Neutral',
    topicsDiscussed: ['Cloud Migration', 'Compliance', 'Data Security', 'Timeline'],
    objectionsDetected: ['Compliance requirements unclear', 'Migration timeline concerns'],
    competitorMentions: ['AWS Migration Hub'],
    pricingDiscussion: [],
    nextSteps: ['Send compliance documentation', 'Schedule follow-up with legal team'],
    actionItems: ['Prepare compliance overview deck', 'Get legal sign-off on data terms'],
  },
  call_003: {
    summary:
      "Contract negotiation call with Global Solutions. CFO Lisa Wong introduced payment term requests. Multi-year deal opportunity identified but requires pricing flexibility.",
    keyHighlights: [
      "CFO requesting net-60 payment terms",
      "Multi-year deal possibility (2-3 year contract)",
      "Deal value could increase 40% with multi-year commitment",
      "Decision expected within 2 weeks",
    ],
    talkRatio: { rep: 40, customer: 60 },
    sentiment: 'Neutral',
    topicsDiscussed: ['Payment Terms', 'Multi-year Discount', 'Contract Value'],
    objectionsDetected: ['Payment terms too tight', 'Pricing flexibility needed'],
    competitorMentions: [],
    pricingDiscussion: ['Net-60 payment terms requested', 'Multi-year discount inquiry'],
    nextSteps: ['Prepare revised payment terms proposal', 'Run discount model by finance'],
    actionItems: ['Draft multi-year pricing options', 'Escalate to VP Sales for approval'],
  },
  call_004: {
    summary:
      "Successful follow-up with Innovate Corp post-implementation. Strong adoption metrics reported. Upsell opportunity identified for additional teams.",
    keyHighlights: [
      "20 reps successfully onboarded in one week",
      "Team adoption rate exceeding expectations",
      "Upsell opportunity for engineering team",
      "NPS score of 9/10 from team leads",
    ],
    talkRatio: { rep: 30, customer: 70 },
    sentiment: 'Positive',
    topicsDiscussed: ['Onboarding Success', 'Adoption', 'Upsell', 'Expansion'],
    objectionsDetected: [],
    competitorMentions: [],
    pricingDiscussion: ['Expansion pricing for 30 additional seats'],
    nextSteps: ['Send expansion proposal', 'Schedule QBR with account'],
    actionItems: ['Prepare expansion pricing quote', 'Schedule quarterly review'],
  },
  call_005: {
    summary:
      "Brief cold outbound call to NextGen Enterprises. Prospect showed limited initial interest but did not hang up. Opportunity to follow up with email and case studies.",
    keyHighlights: [
      "Prospect engaged for the full 5 minutes despite initial reluctance",
      "Asked about pricing — positive signal",
      "No identified pain points yet",
      "Request for follow-up email with case studies",
    ],
    talkRatio: { rep: 60, customer: 40 },
    sentiment: 'Neutral',
    topicsDiscussed: ['Intro', 'Product Overview', 'Pricing'],
    objectionsDetected: ['No immediate need identified', 'Time constraints'],
    competitorMentions: [],
    pricingDiscussion: [],
    nextSteps: ['Send follow-up email with relevant case studies', 'Schedule discovery call'],
    actionItems: ['Prepare personalized case study email', 'Add to nurture sequence'],
  },
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const MOCK_REVIEWS: Record<string, ReviewData> = {
  call_001: {
    scorecardName: 'Discovery Call Scorecard',
    scorecardVersion: 'v2.3',
    reviewedBy: { name: 'Lisa Anderson', role: 'Manager' },
    reviewDate: '2026-05-14',
    overallScore: 85,
    status: 'Passed',
    sections: [
      {
        sectionName: 'Opening & Rapport',
        sectionScore: 90,
        questions: [
          {
            questionText: 'Did the rep properly introduce themselves and set the agenda?',
            managerAnswer: 'Yes',
            score: 10,
            maxScore: 10,
            managerComments: 'Strong opening, clear agenda set',
            aiSuggestion: 'Yes — detected proper introduction at 00:00',
            transcriptTimestamp: '00:00',
          },
          {
            questionText: 'Did the rep build rapport with the prospect?',
            managerAnswer: 'Yes',
            score: 10,
            maxScore: 10,
            managerComments: 'Good connection established',
            aiSuggestion: 'Yes — conversational tone detected throughout',
            transcriptTimestamp: '00:15',
          },
        ],
      },
      {
        sectionName: 'Discovery & Questioning',
        sectionScore: 80,
        questions: [
          {
            questionText: 'Did the rep ask open-ended discovery questions?',
            managerAnswer: 'Yes',
            score: 8,
            maxScore: 10,
            managerComments: 'Good questions but could probe deeper on decision process',
            aiSuggestion: 'Partial — open-ended questions detected, but limited follow-up probing',
            transcriptTimestamp: '00:15',
          },
          {
            questionText: 'Did the rep uncover the main pain points?',
            managerAnswer: 'Yes',
            score: 9,
            maxScore: 10,
            managerComments: 'Identified tool adoption and integration concerns clearly',
            aiSuggestion: 'Yes — pain points "tool adoption" and "integration" clearly surfaced at 00:15',
            transcriptTimestamp: '00:15',
          },
        ],
      },
      {
        sectionName: 'Closing & Next Steps',
        sectionScore: 85,
        questions: [
          {
            questionText: 'Did the rep confirm clear next steps?',
            managerAnswer: 'Yes',
            score: 9,
            maxScore: 10,
            managerComments: 'Next steps confirmed — technical demo scheduled',
            aiSuggestion: 'Yes — explicit next step "technical demo" proposed at 04:00',
            transcriptTimestamp: '04:00',
          },
          {
            questionText: 'Did the rep get commitment on timeline?',
            managerAnswer: 'Partial',
            score: 7,
            maxScore: 10,
            managerComments: 'Could have been more specific on timeline',
            aiSuggestion: 'Partial — next meeting proposed but no specific date locked in',
            transcriptTimestamp: '05:10',
          },
        ],
      },
    ],
  },
  call_002: {
    scorecardName: 'Demo Call Scorecard',
    scorecardVersion: 'v2.3',
    reviewedBy: { name: 'Lisa Anderson', role: 'Manager' },
    reviewDate: '2026-05-13',
    overallScore: 72,
    status: 'Needs Improvement',
    sections: [
      {
        sectionName: 'Opening & Rapport',
        sectionScore: 80,
        questions: [
          {
            questionText: 'Did the rep properly introduce themselves and set the agenda?',
            managerAnswer: 'Yes',
            score: 8,
            maxScore: 10,
            managerComments: 'Good intro but agenda could be more structured',
            aiSuggestion: 'Yes — introduction detected at 00:00',
            transcriptTimestamp: '00:00',
          },
        ],
      },
      {
        sectionName: 'Discovery & Questioning',
        sectionScore: 65,
        questions: [
          {
            questionText: 'Did the rep ask open-ended discovery questions?',
            managerAnswer: 'No',
            score: 5,
            maxScore: 10,
            managerComments: 'Rep led with features rather than asking about pain points',
            aiSuggestion: 'No — feature-led presentation detected without discovery questions',
            transcriptTimestamp: '00:00',
          },
        ],
      },
      {
        sectionName: 'Closing & Next Steps',
        sectionScore: 70,
        questions: [
          {
            questionText: 'Did the rep confirm clear next steps?',
            managerAnswer: 'Yes',
            score: 7,
            maxScore: 10,
            managerComments: 'Next steps set but ownership unclear',
            aiSuggestion: 'Partial — follow-up mentioned but no specific owner assigned',
            transcriptTimestamp: '00:35',
          },
        ],
      },
    ],
  },
  call_003: {
    scorecardName: 'Negotiation Call Scorecard',
    scorecardVersion: 'v2.3',
    reviewedBy: { name: 'Lisa Anderson', role: 'Manager' },
    reviewDate: '2026-05-12',
    overallScore: 65,
    status: 'Needs Improvement',
    sections: [
      {
        sectionName: 'Opening & Rapport',
        sectionScore: 70,
        questions: [],
      },
      {
        sectionName: 'Negotiation Technique',
        sectionScore: 60,
        questions: [
          {
            questionText: 'Did the rep maintain value before discounting?',
            managerAnswer: 'No',
            score: 4,
            maxScore: 10,
            managerComments: 'Too quick to offer discounts without defending value',
            aiSuggestion: 'No — discount discussion initiated without value anchoring',
            transcriptTimestamp: '00:55',
          },
        ],
      },
      {
        sectionName: 'Closing & Next Steps',
        sectionScore: 65,
        questions: [],
      },
    ],
  },
  call_004: {
    scorecardName: 'Follow-up Call Scorecard',
    scorecardVersion: 'v2.3',
    reviewedBy: { name: 'Lisa Anderson', role: 'Manager' },
    reviewDate: '2026-05-11',
    overallScore: 88,
    status: 'Passed',
    sections: [
      {
        sectionName: 'Opening & Rapport',
        sectionScore: 92,
        questions: [],
      },
      {
        sectionName: 'Customer Success Check-in',
        sectionScore: 90,
        questions: [
          {
            questionText: 'Did the rep gather measurable success metrics?',
            managerAnswer: 'Yes',
            score: 9,
            maxScore: 10,
            managerComments: 'Good adoption metrics captured — strong upsell setup',
            aiSuggestion: 'Yes — adoption rate and NPS mentioned at 00:15',
            transcriptTimestamp: '00:15',
          },
        ],
      },
      {
        sectionName: 'Closing & Next Steps',
        sectionScore: 85,
        questions: [],
      },
    ],
  },
  call_005: {
    scorecardName: 'Cold Call Scorecard',
    scorecardVersion: 'v2.3',
    reviewedBy: { name: 'Lisa Anderson', role: 'Manager' },
    reviewDate: '2026-05-10',
    overallScore: 55,
    status: 'Failed',
    sections: [
      {
        sectionName: 'Opening Hook',
        sectionScore: 50,
        questions: [
          {
            questionText: 'Did the rep have a compelling opening hook?',
            managerAnswer: 'No',
            score: 5,
            maxScore: 10,
            managerComments: 'Generic opener — no personalization or pattern interrupt',
            aiSuggestion: 'No — opening detected at 00:00 but no personalization signals',
            transcriptTimestamp: '00:00',
          },
        ],
      },
      {
        sectionName: 'Discovery & Questioning',
        sectionScore: 55,
        questions: [],
      },
      {
        sectionName: 'Closing & Next Steps',
        sectionScore: 60,
        questions: [],
      },
    ],
  },
};

// ─── Feedback ─────────────────────────────────────────────────────────────────

export const MOCK_FEEDBACK: Record<string, FeedbackData> = {
  call_001: {
    tags: ['Best Practice', 'Needs Coaching'],
    strengths: [
      'Excellent rapport building and active listening',
      'Strong understanding of customer pain points',
      'Good use of open-ended questions',
      'Professional tone throughout the call',
    ],
    improvementAreas: [
      'Need to probe deeper on decision-making process',
      'Should have identified other stakeholders earlier',
      'Missed opportunity to discuss timeline and urgency',
    ],
    coachingNotes:
      "John did a great job building rapport and understanding the customer's pain points. The call showed strong discovery skills. However, there's room for improvement in understanding the decision-making process. Next time, try to uncover: Who else is involved? What's the timeline? What happens if they don't solve this problem? These questions will help you qualify better and forecast more accurately.",
    recommendedActions: [
      'Review the MEDDIC framework for qualification',
      'Practice timeline discovery questions',
      'Shadow a senior rep on their next discovery call',
    ],
    acknowledgement: {
      isAcknowledged: true,
      acknowledgedAt: '2026-05-14T15:30:00Z',
      repResponse:
        "Thank you for the feedback! I will focus on asking deeper qualification questions, especially around timeline and decision-makers. I've scheduled time to shadow Mark next week.",
    },
    actionItems: [
      {
        id: 'ai_001',
        title: 'Review MEDDIC Framework',
        description:
          'Study the MEDDIC qualification methodology and prepare questions for each component',
        dueDate: '2026-05-20',
        assignedBy: 'Lisa Anderson',
        status: 'Not Started',
        notes: 'Started reviewing materials.',
      },
      {
        id: 'ai_002',
        title: 'Shadow Senior Rep',
        description: "Attend Mark's discovery call to observe qualification techniques",
        dueDate: '2026-05-22',
        assignedBy: 'Lisa Anderson',
        status: 'Not Started',
        notes: '',
      },
    ],
  },
  call_002: {
    tags: ['Needs Coaching', 'Risk'],
    strengths: [
      'Clear and confident product demonstration',
      'Handled technical questions competently',
      'Good follow-up on compliance questions',
    ],
    improvementAreas: [
      'Led with features before understanding pain points',
      'Should have asked discovery questions before the demo',
      'Missed opportunity to qualify budget and timeline',
    ],
    coachingNotes:
      "The demo was technically solid but the approach was product-first rather than customer-first. Before showing features, always uncover what the customer cares most about so you can tailor the demo to their specific pain points.",
    recommendedActions: [
      'Always run a mini-discovery before any demo',
      'Prepare a demo customization checklist',
      'Review "Demo to Win" training module',
    ],
    acknowledgement: {
      isAcknowledged: false,
      acknowledgedAt: null,
      repResponse: null,
    },
    actionItems: [
      {
        id: 'ai_003',
        title: 'Complete Demo Best Practices Training',
        description: 'Review the internal training module on customer-led demos',
        dueDate: '2026-05-25',
        assignedBy: 'Lisa Anderson',
        status: 'In Progress',
        notes: 'Module 1 done, working on Module 2.',
      },
    ],
  },
  call_003: {
    tags: ['Needs Coaching', 'Risk'],
    strengths: [
      'Maintained composure under pressure',
      'Showed flexibility on deal structure',
    ],
    improvementAreas: [
      'Too quick to offer discounts without defending value',
      'Did not involve manager before making pricing concessions',
      'Should have anchored on ROI before discussing price',
    ],
    coachingNotes:
      "Negotiation calls require a value-first approach. Before any pricing discussion, anchor the conversation on the measurable ROI the customer will receive. Always get manager approval before making pricing concessions above 10%.",
    recommendedActions: [
      'Review negotiation playbook — value anchoring section',
      'Practice ROI calculation with the sales calculator tool',
      'Get manager approval before next discount offer',
    ],
    acknowledgement: {
      isAcknowledged: false,
      acknowledgedAt: null,
      repResponse: null,
    },
    actionItems: [
      {
        id: 'ai_004',
        title: 'Review Negotiation Playbook',
        description: 'Study the company negotiation playbook, specifically the value-anchoring section',
        dueDate: '2026-05-19',
        assignedBy: 'Lisa Anderson',
        status: 'Not Started',
        notes: '',
      },
    ],
  },
  call_004: {
    tags: ['Best Practice'],
    strengths: [
      'Excellent customer success check-in with measurable metrics',
      'Identified and pursued expansion opportunity naturally',
      'Strong relationship built with the account',
      'Listened attentively to customer feedback',
    ],
    improvementAreas: [
      'Could have asked more structured questions about other teams',
    ],
    coachingNotes:
      "This is a model follow-up call. John captured clear metrics on adoption and NPS while naturally surfacing an expansion opportunity. This is how we build lasting customer relationships and grow accounts.",
    recommendedActions: [
      'Use this call as a reference for future follow-up best practices',
      'Prepare and send expansion proposal within 48 hours',
    ],
    acknowledgement: {
      isAcknowledged: true,
      acknowledgedAt: '2026-05-12T10:00:00Z',
      repResponse: 'Great feedback! Sending the expansion proposal today.',
    },
    actionItems: [
      {
        id: 'ai_005',
        title: 'Send Expansion Proposal',
        description: 'Prepare and send a tailored expansion pricing proposal to Maria Garcia',
        dueDate: '2026-05-13',
        assignedBy: 'Lisa Anderson',
        status: 'Completed',
        notes: 'Proposal sent on 2026-05-12.',
      },
    ],
  },
  call_005: {
    tags: ['Needs Coaching'],
    strengths: [
      'Maintained confidence despite initial resistance',
      'Kept the prospect engaged for the full call',
    ],
    improvementAreas: [
      'Opening hook lacked personalization',
      'Did not identify a specific pain point',
      'Talked too much — prospect should have spoken more',
    ],
    coachingNotes:
      "Cold calls require a strong, personalized opening hook that creates curiosity. Research the prospect before calling. Your goal in the first 30 seconds is to earn the next 2 minutes — not to pitch the product.",
    recommendedActions: [
      'Study the "Pattern Interrupt" cold call framework',
      'Research prospects using LinkedIn before calling',
      'Practice 30-second value props tailored to different personas',
    ],
    acknowledgement: {
      isAcknowledged: false,
      acknowledgedAt: null,
      repResponse: null,
    },
    actionItems: [
      {
        id: 'ai_006',
        title: 'Practice Cold Call Openers',
        description: 'Record 5 personalized cold call openers using the pattern interrupt technique',
        dueDate: '2026-05-17',
        assignedBy: 'Lisa Anderson',
        status: 'Not Started',
        notes: '',
      },
    ],
  },
};

// ─── Coaching Insights ────────────────────────────────────────────────────────

export const MOCK_COACHING_INSIGHTS: CoachingInsights = {
  averageScore: 73,
  averageScoreDelta: 8,
  bestPracticeCalls: { count: 12, total: 30 },
  coachingCompletion: {
    percentage: 75,
    actionsCompleted: 6,
    totalActions: 8,
  },
  needsCoachingCount: 8,
  scoreTrend: [
    { month: 'Jan', score: 68 },
    { month: 'Feb', score: 68 },
    { month: 'Mar', score: 71 },
    { month: 'Apr', score: 72 },
    { month: 'May', score: 73 },
  ],
  sectionPerformance: [
    { section: 'Opening & Rapport', score: 82 },
    { section: 'Discovery', score: 74 },
    { section: 'Value Delivery', score: 70 },
    { section: 'Objection Handling', score: 68 },
    { section: 'Closing', score: 72 },
  ],
  tagFrequency: [
    { tag: 'Best Practice', count: 12 },
    { tag: 'Needs Coaching', count: 8 },
    { tag: 'High Value', count: 6 },
    { tag: 'Risk', count: 3 },
    { tag: 'Compliance Issue', count: 1 },
  ],
  strengthAreas: ['Building rapport', 'Active listening', 'Professional communication'],
  commonMistakes: [
    'Not identifying decision-makers early',
    'Talking more than listening',
    'Weak opening hooks on cold calls',
  ],
};
