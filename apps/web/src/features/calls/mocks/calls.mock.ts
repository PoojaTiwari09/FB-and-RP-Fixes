import { FilterOptions, SearchResponse, CallDetail, AiAskResponse } from '@calls/types';
import type {
  CallReview,
  Call,
  CallReviewDetail,
  Scorecard,
  User,
  AnalyticsSummary,
  TrendPoint,
  FocusArea,
  TagCount,
  ReviewHistoryItem,
} from '@calls/types/calls.types';

export const mockFilterOptions: FilterOptions = {
  teams: [
    { value: "west", label: "West" },
    { value: "east", label: "East" },
    { value: "central", label: "Central" },
    { value: "all", label: "All Teams" }
  ],
  reps: [
    { value: "all", label: "All" },
    { value: "rep_02", label: "Sarah Chen" },
    { value: "rep_03", label: "Michael Rodriguez" },
    { value: "rep_04", label: "Jennifer Kim" },
    { value: "rep_05", label: "David Park" },
    { value: "rep_06", label: "Emily Thompson" }
  ],
  stages: [
    { value: "all", label: "All" },
    { value: "discovery", label: "Discovery" },
    { value: "proposal", label: "Proposal" },
    { value: "negotiation", label: "Negotiation" },
    { value: "closed_won", label: "Closed Won" },
    { value: "closed_lost", label: "Closed Lost" }
  ],
  topics: [
    { value: "all", label: "All" },
    { value: "pricing", label: "Pricing" },
    { value: "product_features", label: "Product Features" },
    { value: "integration", label: "Integration" },
    { value: "technical_support", label: "Technical Support" },
    { value: "renewal_discussion", label: "Renewal Discussion" }
  ],
  trackers: [
    { value: "competition", label: "Competition" },
    { value: "budget_concerns", label: "Budget Concerns" },
    { value: "next_steps", label: "Next Steps" },
    { value: "decision_maker", label: "Decision Maker" },
    { value: "timeline", label: "Timeline" },
    { value: "all", label: "All Trackers" }
  ],
  scorecardResults: [
    { value: "all", label: "All" },
    { value: "excellent", label: "Excellent (90-100)" },
    { value: "good", label: "Good (80-89)" },
    { value: "average", label: "Average (70-79)" },
    { value: "needs_improvement", label: "Needs Improvement (<70)" }
  ],
  callTypes: [
    { value: "all", label: "All" },
    { value: "internal", label: "Internal calls" },
    { value: "customer", label: "Calls with customers" }
  ],
  phraseMatchTypes: [
    { value: "contains", label: "Results contain the term" },
    { value: "mentioned_by_any", label: "Mentioned by any party" },
    { value: "said_anytime", label: "Said anytime in call" }
  ]
};

export const mockSearchResponse: SearchResponse = {
  meta: {
    total: 4800,
    page: 1,
    size: 20,
    totalPages: 240,
    callsCount: 5,
    emailsCount: 3
  },
  chart: {
    days: [
      { label: "10/17", count: 40 }, { label: "10/18", count: 85 }, { label: "10/19", count: 30 },
      { label: "10/20", count: 120 }, { label: "10/21", count: 140 }, { label: "10/22", count: 90 },
      { label: "10/23", count: 160 }, { label: "10/24", count: 70 }, { label: "10/25", count: 110 },
      { label: "10/26", count: 200 }, { label: "10/27", count: 150 }, { label: "10/28", count: 180 },
      { label: "10/29", count: 190 }, { label: "10/30", count: 220 }, { label: "10/31", count: 210 },
      { label: "11/01", count: 240 }, { label: "11/02", count: 170 }, { label: "11/03", count: 260 },
      { label: "11/04", count: 280 }, { label: "11/05", count: 190 }, { label: "11/06", count: 300 }
    ],
    weeks: [
      { label: "Wk 41", count: 850 }, { label: "Wk 42", count: 1120 },
      { label: "Wk 43", count: 940 }, { label: "Wk 44", count: 1350 }
    ],
    months: [
      { label: "Aug", count: 3200 }, { label: "Sep", count: 4100 },
      { label: "Oct", count: 3800 }, { label: "Nov", count: 4800 }
    ],
    quarters: [
      { label: "Q1", count: 9500 }, { label: "Q2", count: 11200 },
      { label: "Q3", count: 12500 }, { label: "Q4", count: 14000 }
    ]
  },
  emailChart: {
    days: [
      { label: "10/17", count: 140 }, { label: "10/18", count: 285 }, { label: "10/19", count: 130 },
      { label: "10/20", count: 320 }, { label: "10/21", count: 440 }, { label: "10/22", count: 290 },
      { label: "10/23", count: 360 }, { label: "10/24", count: 170 }, { label: "10/25", count: 310 },
      { label: "10/26", count: 400 }, { label: "10/27", count: 350 }, { label: "10/28", count: 380 },
      { label: "10/29", count: 290 }, { label: "10/30", count: 420 }, { label: "10/31", count: 410 },
      { label: "11/01", count: 540 }, { label: "11/02", count: 370 }, { label: "11/03", count: 460 },
      { label: "11/04", count: 580 }, { label: "11/05", count: 390 }, { label: "11/06", count: 600 }
    ],
    weeks: [
      { label: "Wk 41", count: 1850 }, { label: "Wk 42", count: 2120 },
      { label: "Wk 43", count: 1940 }, { label: "Wk 44", count: 2350 }
    ],
    months: [
      { label: "Aug", count: 7200 }, { label: "Sep", count: 8100 },
      { label: "Oct", count: 7800 }, { label: "Nov", count: 8800 }
    ],
    quarters: [
      { label: "Q1", count: 19500 }, { label: "Q2", count: 21200 },
      { label: "Q3", count: 22500 }, { label: "Q4", count: 24000 }
    ]
  },
  results: [
    {
      id: "call_001",
      title: "Quick sync with Acme Corp",
      rep: { id: "rep_02", name: "Sarah Chen" },
      date: "2026-11-17",
      durationMinutes: 42,
      score: 89,
      scoreLabel: "Good",
      deal: "Acme Corp",
      type: "call",
      status: "Zoom"
    },
    {
      id: "call_002",
      title: "Initial Discovery - Cloud Migration",
      rep: { id: "rep_03", name: "Michael Rodriguez" },
      date: "2026-11-18",
      durationMinutes: 58,
      score: 92,
      scoreLabel: "Excellent",
      deal: "BetaCo",
      type: "call",
      status: "Zoom"
    },
    {
      id: "call_003",
      title: "Pricing & Contract Review",
      rep: { id: "rep_04", name: "Jennifer Kim" },
      date: "2026-11-19",
      durationMinutes: 35,
      score: 78,
      scoreLabel: "Average",
      deal: "GammaCorp",
      type: "call",
      status: "Zoom"
    },
    {
      id: "call_004",
      title: "Architecture & Security Review",
      rep: { id: "rep_05", name: "David Park" },
      date: "2026-11-20",
      durationMinutes: 67,
      score: 95,
      scoreLabel: "Excellent",
      deal: "DeltaInc",
      type: "call",
      status: "Zoom"
    },
    {
      id: "call_005",
      title: "Post-Implementation Check-in",
      rep: { id: "rep_06", name: "Emily Thompson" },
      date: "2026-11-21",
      durationMinutes: 28,
      score: 84,
      scoreLabel: "Good",
      deal: "EpsilonLLC",
      type: "call",
      status: "Zoom"
    }
  ],
  emailResults: [
    {
      id: "email_001",
      subject: "Follow-up: Q3 Budget Proposal",
      sender: { name: "Sarah Chen", email: "sarah@example.com" },
      date: "2026-11-21",
      preview: "Hi team, following up on the proposal we discussed last week. Have you had a chance to review the numbers?",
      statusTags: ["Follow-up", "Proposal"],
      isRead: false
    },
    {
      id: "email_002",
      subject: "RE: Technical Requirements",
      sender: { name: "Michael Rodriguez", email: "michael@example.com" },
      date: "2026-11-20",
      preview: "The engineering team has reviewed the specs and we are good to proceed with the integration.",
      statusTags: ["Technical"],
      isRead: true
    },
    {
      id: "email_003",
      subject: "Checking in - Next Steps",
      sender: { name: "Jennifer Kim", email: "jennifer@example.com" },
      date: "2026-11-19",
      preview: "Just wanted to bubble this up to the top of your inbox. Let me know if you need anything else from our end.",
      statusTags: ["Check-in"],
      isRead: true
    }
  ]
};

export const mockCallDetails: Record<string, CallDetail> = {
  "call_001": {
    id: "call_001",
    title: "Quick sync with Acme Corp",
    date: "2026-11-17T14:30:00Z",
    durationSeconds: 2528,
    durationLabel: "42m 08s",
    participants: [
      { name: "Sarah Chen", role: "Rep" },
      { name: "Michael", role: "Customer" }
    ],
    account: "Acme Corp",
    type: "Dashboard",
    status: "Zoom",
    score: 89,
    scoreLabel: "Good",
    recordingUrl: "https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3",
    nextSteps: [
      "Send number pricing proposal by 27 Apr",
      "Schedule technical deep dive with Acme IT team",
      "Share ROI calculator"
    ],
    keyHighlights: [
      { label: "Strong buyer signal", text: "Customer expressed urgency around Q3 budget deadline" },
      { label: "Competitor mentioned", text: "Currently evaluating Vend as alternative solution" },
      { label: "Main objection", text: "Stakeholder concerns about migration complexity from spreadsheets" },
      { label: "Next action", text: "Send tailored proposal with ROI calculator by April 27" }
    ],
    conversationHighlights: [
      { timestampSeconds: 502, timestampLabel: "08:22", tag: "Competitor", tagColor: "orange", quote: "We're also looking at Vend — their analytics dashboard..." },
      { timestampSeconds: 944, timestampLabel: "15:44", tag: "Objection", tagColor: "red", quote: "Our stakeholders aren't ready to migrate from spreadsheets yet..." },
      { timestampSeconds: 1192, timestampLabel: "19:52", tag: "Next step", tagColor: "blue", quote: "Can you send a proposal tailored to our team size?" }
    ],
    timelineLabel: "3 months",
    transcript: [
      { timestampSeconds: 270, timestampLabel: "04:30", speaker: "Sarah", role: "Rep", text: "Thanks for the callback today, I wanted to walk you through the platform and understand your current workflow." },
      { timestampSeconds: 524, timestampLabel: "08:44", speaker: "Michael", role: "Customer", text: "Sure. We're currently managing everything in spreadsheets. Right now we're using spreadsheets and our shared on a shared drive." }
    ]
  },
  "call_002": {
    id: "call_002",
    title: "Initial Discovery - Cloud Migration",
    date: "2026-11-18T10:00:00Z",
    durationSeconds: 3480,
    durationLabel: "58m 00s",
    participants: [
      { name: "Michael Rodriguez", role: "Rep" },
      { name: "Amanda", role: "Customer" }
    ],
    account: "BetaCo",
    type: "Discovery",
    status: "Zoom",
    score: 92,
    scoreLabel: "Excellent",
    recordingUrl: "https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3",
    nextSteps: [
      "Follow up with technical whitepaper on AWS migration",
      "Draft custom enterprise agreement",
      "Schedule architecture review with their DevOps lead"
    ],
    keyHighlights: [
      { label: "Positive Sentiment", text: "Very interested in the enterprise single sign-on and native AWS integrations." },
      { label: "Budget Requirement", text: "Need to utilize remaining 2026 budget before end of year." },
      { label: "Current Pain Point", text: "Manual deployment processes are costing them 20+ hours a week." }
    ],
    conversationHighlights: [
      { timestampSeconds: 120, timestampLabel: "02:00", tag: "Feature request", tagColor: "blue", quote: "Does it integrate with Okta natively for SSO?" },
      { timestampSeconds: 450, timestampLabel: "07:30", tag: "Pain point", tagColor: "red", quote: "Right now our team is spending over 20 hours a week just managing deployments." },
      { timestampSeconds: 1100, timestampLabel: "18:20", tag: "Budget", tagColor: "green", quote: "We have some end of year budget we need to allocate by December 15th." }
    ],
    timelineLabel: "1 month",
    transcript: [
      { timestampSeconds: 120, timestampLabel: "02:00", speaker: "Amanda", role: "Customer", text: "Before we get too deep, does it integrate with Okta natively for SSO? That's a hard requirement for our security team." },
      { timestampSeconds: 135, timestampLabel: "02:15", speaker: "Michael", role: "Rep", text: "Yes, absolutely. We have a native Okta integration out of the box, fully SAML 2.0 compliant." },
      { timestampSeconds: 450, timestampLabel: "07:30", speaker: "Amanda", role: "Customer", text: "Right now our team is spending over 20 hours a week just managing deployments. It's a huge bottleneck for us." }
    ]
  },
  "call_003": {
    id: "call_003",
    title: "Pricing & Contract Review",
    date: "2026-11-19T13:15:00Z",
    durationSeconds: 2100,
    durationLabel: "35m 00s",
    participants: [
      { name: "Jennifer Kim", role: "Rep" },
      { name: "David", role: "Customer" }
    ],
    account: "GammaCorp",
    type: "Pricing",
    status: "Zoom",
    score: 78,
    scoreLabel: "Average",
    recordingUrl: "https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3",
    nextSteps: [
      "Send revised pricing tiers with 10% discount applied",
      "Schedule final decision maker meeting with the VP of Engineering"
    ],
    keyHighlights: [
      { label: "Budget Pushback", text: "Current tier pricing is 15% above their allocated budget." },
      { label: "Competitor Mentioned", text: "Noted that a competitor offered a cheaper introductory rate." }
    ],
    conversationHighlights: [
      { timestampSeconds: 300, timestampLabel: "05:00", tag: "Competitor", tagColor: "orange", quote: "Acme Software offered us a 20% discount on their first year." },
      { timestampSeconds: 500, timestampLabel: "08:20", tag: "Objection", tagColor: "red", quote: "Honestly, the pro tier is a bit steep for us given our current headcount." },
      { timestampSeconds: 1250, timestampLabel: "20:50", tag: "Next step", tagColor: "blue", quote: "Let me take this back to the VP of Engineering and see if we can secure more budget." }
    ],
    timelineLabel: "2 weeks",
    transcript: [
      { timestampSeconds: 300, timestampLabel: "05:00", speaker: "David", role: "Customer", text: "Just to be transparent, Acme Software offered us a 20% discount on their first year." },
      { timestampSeconds: 500, timestampLabel: "08:20", speaker: "David", role: "Customer", text: "Honestly, the pro tier is a bit steep for us given our current headcount. We are roughly 15% over budget." },
      { timestampSeconds: 530, timestampLabel: "08:50", speaker: "Jennifer", role: "Rep", text: "I understand. If you're willing to commit to an annual contract today, I can apply a 10% discount." }
    ]
  },
  "call_004": {
    id: "call_004",
    title: "Architecture & Security Review",
    date: "2026-11-20T15:00:00Z",
    durationSeconds: 4020,
    durationLabel: "67m 00s",
    participants: [
      { name: "David Park", role: "Rep" },
      { name: "Kevin", role: "Customer" }
    ],
    account: "DeltaInc",
    type: "Technical",
    status: "Zoom",
    score: 95,
    scoreLabel: "Excellent",
    recordingUrl: "https://recordings-buttons.s3.eu-north-1.amazonaws.com/3mins_sales.mp3",
    nextSteps: [
      "Send sandbox API keys to Kevin",
      "Setup joint slack channel for technical onboarding",
      "Provide SOC2 Type II compliance report"
    ],
    keyHighlights: [
      { label: "Technical win", text: "Customer engineering team approved the architecture." },
      { label: "Compliance Request", text: "Need our SOC2 report before procurement can finalize." },
      { label: "Implementation Plan", text: "Planning to start integration in staging by next Monday." }
    ],
    conversationHighlights: [
      { timestampSeconds: 800, timestampLabel: "13:20", tag: "Security", tagColor: "blue", quote: "We'll need your latest SOC2 Type II report for our compliance checklist." },
      { timestampSeconds: 1500, timestampLabel: "25:00", tag: "Agreement", tagColor: "green", quote: "The API payload structure looks exactly like what we need. It's very clean." },
      { timestampSeconds: 2100, timestampLabel: "35:00", tag: "Next step", tagColor: "blue", quote: "If you can send over the sandbox API keys, we can start testing Monday." }
    ],
    timelineLabel: "1 week",
    transcript: [
      { timestampSeconds: 800, timestampLabel: "13:20", speaker: "Kevin", role: "Customer", text: "We'll need your latest SOC2 Type II report for our compliance checklist before procurement can sign off." },
      { timestampSeconds: 820, timestampLabel: "13:40", speaker: "David", role: "Rep", text: "No problem, I'll send that over along with the penetration test summary right after this call." },
      { timestampSeconds: 1500, timestampLabel: "25:00", speaker: "Kevin", role: "Customer", text: "The API payload structure looks exactly like what we need. It's very clean." }
    ]
  },
  "call_005": {
    id: "call_005",
    title: "Post-Implementation Check-in",
    date: "2026-11-21T09:30:00Z",
    durationSeconds: 1680,
    durationLabel: "28m 00s",
    participants: [
      { name: "Emily Thompson", role: "Rep" },
      { name: "Rachel", role: "Customer" }
    ],
    account: "EpsilonLLC",
    type: "Follow-up",
    status: "Zoom",
    score: 84,
    scoreLabel: "Good",
    recordingUrl: "https://recordings-buttons.s3.eu-north-1.amazonaws.com/2mins_sales.mp3",
    nextSteps: [
      "Check in next quarter to discuss expanding seats",
      "Share webinar link for advanced reporting features"
    ],
    keyHighlights: [
      { label: "Adoption Success", text: "The team is using the tool daily and seeing a 30% reduction in reporting time." },
      { label: "Upsell Opportunity", text: "Mentioned they might need to add 5 more user seats next quarter." }
    ],
    conversationHighlights: [
      { timestampSeconds: 200, timestampLabel: "03:20", tag: "Positive feedback", tagColor: "green", quote: "The team has adopted it really well. It's saving us a ton of time." },
      { timestampSeconds: 600, timestampLabel: "10:00", tag: "Expansion", tagColor: "blue", quote: "We're going to be hiring a few more reps in Q1, so we'll likely need to expand our seat count." }
    ],
    timelineLabel: "4 months",
    transcript: [
      { timestampSeconds: 200, timestampLabel: "03:20", speaker: "Rachel", role: "Customer", text: "The team has adopted it really well. It's saving us a ton of time on our weekly reporting." },
      { timestampSeconds: 220, timestampLabel: "03:40", speaker: "Emily", role: "Rep", text: "That's fantastic to hear! Have you had a chance to look at the advanced custom dashboards yet?" },
      { timestampSeconds: 600, timestampLabel: "10:00", speaker: "Rachel", role: "Customer", text: "Not yet. But we're going to be hiring a few more reps in Q1, so we'll likely need to expand our seat count and we can look at it then." }
    ]
  }
};

export const mockCallDetail: CallDetail = mockCallDetails["call_001"];

export const mockAiResponse: AiAskResponse = {
  callId: "call_001",
  question: "What objections came up most?",
  answer: "Based on the call transcript, the main objection was around migration complexity. The customer mentioned their team isn't ready to move from spreadsheets yet and expressed concerns about the learning curve.",
  suggestedQuestions: [
    "What objections came up most?",
    "Where did the rep struggle?",
    "What were the key customer concerns?"
  ]
};

// ─── Manager call reviews (from aireviewcall-manage) ─────────────────────────

export const MOCK_CALL_REVIEWS: CallReview[] = [
  {
    reviewId: 'rv_001',
    callTitle: 'Discovery Call - Acme Corp Q2 Initiative',
    scorecardName: 'Discovery Call Scorecard',
    account: 'Acme Corporation',
    callDate: '2026-05-14T10:00:00Z',
    callType: 'Discovery',
    duration: '45:23',
    priority: 'High',
    status: 'Pending',
    aiFlags: ['High Risk Deal', 'No Next Steps'],
    dueDate: '2026-05-16T23:59:00Z',
  },
  {
    reviewId: 'rv_002',
    callTitle: 'Product Demo - TechStart Solutions',
    scorecardName: 'Demo Call Scorecard',
    account: 'TechStart Solutions',
    callDate: '2026-05-14T14:30:00Z',
    callType: 'Demo',
    duration: '52:15',
    priority: 'Medium',
    status: 'In Progress',
    aiFlags: ['Objection Issue'],
    dueDate: '2026-05-15T23:59:00Z',
  },
  {
    reviewId: 'rv_003',
    callTitle: 'Negotiation - Global Enterprises Contract',
    scorecardName: 'Negotiation Scorecard',
    account: 'Global Enterprises',
    callDate: '2026-05-13T11:15:00Z',
    callType: 'Negotiation',
    duration: '38:45',
    priority: 'High',
    status: 'Completed',
    aiFlags: [],
    dueDate: '2026-05-14T23:59:00Z',
  },
  {
    reviewId: 'rv_004',
    callTitle: 'Discovery Call - StartupX Series A',
    scorecardName: 'Discovery Call Scorecard',
    account: 'StartupX',
    callDate: '2026-05-12T09:00:00Z',
    callType: 'Discovery',
    duration: '42:30',
    priority: 'High',
    status: 'Overdue',
    aiFlags: ['Negative Sentiment', 'New Rep'],
    dueDate: '2026-05-13T23:59:00Z',
  },
  {
    reviewId: 'rv_005',
    callTitle: 'Closing Call - MegaCorp Deal',
    scorecardName: 'Closing Call Scorecard',
    account: 'MegaCorp',
    callDate: '2026-05-11T13:00:00Z',
    callType: 'Closing',
    duration: '55:40',
    priority: 'High',
    status: 'Completed',
    aiFlags: [],
    dueDate: '2026-05-12T23:59:00Z',
  },
];

export const MOCK_ALL_CALLS: Call[] = [
  {
    reviewId: 'call_001',
    callTitle: 'Demo Call - SmallBiz Solutions',
    scorecardName: 'Demo Call Scorecard',
    account: 'SmallBiz Solutions',
    callDate: '2026-05-15T09:30:00Z',
    callType: 'Demo',
    duration: '38:15',
    priority: 'Medium',
    status: 'Pending',
    aiFlags: [],
    dueDate: '2026-05-18T23:59:00Z',
    hasReview: false,
  },
  {
    reviewId: 'call_002',
    callTitle: 'Check-in Call - ABC Industries',
    scorecardName: 'Check-in Call Scorecard',
    account: 'ABC Industries',
    callDate: '2026-05-15T11:00:00Z',
    callType: 'Check-In',
    duration: '22:45',
    priority: 'Low',
    status: 'Pending',
    aiFlags: [],
    dueDate: '2026-05-19T23:59:00Z',
    hasReview: false,
  },
  { ...MOCK_CALL_REVIEWS[0], hasReview: true },
  {
    reviewId: 'call_003',
    callTitle: 'Follow-up Call - Enterprise Inc.',
    scorecardName: 'Follow-up Call Scorecard',
    account: 'Enterprise Inc.',
    callDate: '2026-05-14T15:45:00Z',
    callType: 'Follow-Up',
    duration: '28:12',
    priority: 'Low',
    status: 'Pending',
    aiFlags: ['QA Sample'],
    dueDate: '2026-05-17T23:59:00Z',
    hasReview: false,
  },
  { ...MOCK_CALL_REVIEWS[1], hasReview: true },
  { ...MOCK_CALL_REVIEWS[2], hasReview: true },
  { ...MOCK_CALL_REVIEWS[3], hasReview: true },
  { ...MOCK_CALL_REVIEWS[4], hasReview: true },
];

export const MOCK_REVIEW_DETAIL: CallReviewDetail = {
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
    { name: 'Mary Johnson', role: 'Ops Manager' },
  ],
  aiSummary:
    'This was a discovery call with Acme Corp to understand their Q2 sales automation needs. The prospect showed strong interest in workflow automation but expressed concerns about implementation timeline and team adoption.',
  keyHighlights: [
    'Prospect has budget approved for Q2',
    'Current CRM causing significant inefficiencies',
    'Timeline pressure - needs solution by June 15',
    'Competing with 2 other vendors',
  ],
  talkRatio: { rep: 45, customer: 55 },
  sentimentSummary: 'Overall positive (65%) with some concerns about implementation complexity',
  sentimentScore: 65,
  risksDetected: [
    'No clear decision-making process established',
    'Budget authority not fully confirmed',
    'Unrealistic timeline expectations',
  ],
  actionItemsList: [
    'Send technical requirements document',
    'Schedule demo with technical team',
    'Provide case study from similar industry',
  ],
  scorecardName: 'Discovery Call Scorecard',
  scorecardVersion: 'v2.3',
  reviewMode: 'AI-Assisted',
  dueDate: '2026-05-16T23:59:00Z',
  status: 'Pending',
  reviewer: 'You',
  quickStats: { topics: 5, actionItems: 3 },
};

export const MOCK_REVIEW_DETAILS: Record<string, CallReviewDetail> = {
  rv_001: MOCK_REVIEW_DETAIL,
  rv_002: {
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
    aiSummary:
      'Michael delivered a solid product demo to TechStart Solutions. The prospect showed strong interest in the automation features but raised objections around pricing and integration complexity.',
    keyHighlights: [
      'Strong product demonstration of core features',
      'Prospect engaged with automation workflow demo',
      'Pricing objection raised mid-call',
      'Integration with existing stack discussed',
    ],
    talkRatio: { rep: 60, customer: 40 },
    sentimentSummary: 'Mixed — positive on product, concern on pricing',
    sentimentScore: 58,
    risksDetected: ['Pricing objection unresolved', 'No follow-up scheduled'],
    actionItemsList: ['Send pricing proposal', 'Schedule technical integration call'],
    scorecardName: 'Demo Call Scorecard',
    scorecardVersion: 'v1.5',
    reviewMode: 'AI-Assisted',
    dueDate: '2026-05-15T23:59:00Z',
    status: 'In Progress',
    reviewer: 'You',
    quickStats: { topics: 4, actionItems: 2 },
  },
  rv_003: {
    reviewId: 'rv_003',
    callTitle: 'Negotiation - Global Enterprises Contract',
    salesRep: 'Jennifer Kim',
    customer: 'Global Enterprises',
    dateTime: '2026-05-13T11:15:00Z',
    duration: '38:45',
    callType: 'Negotiation',
    dealLinked: 'Global Enterprises - Enterprise License',
    callSource: 'Teams',
    participants: [
      { name: 'Jennifer Kim', role: 'Rep' },
      { name: 'Robert Chen', role: 'CFO' },
      { name: 'Anna Williams', role: 'Procurement' },
    ],
    aiSummary:
      'Jennifer led a strong negotiation with Global Enterprises, successfully navigating pricing discussions and contract terms.',
    keyHighlights: [
      'Successfully negotiated enterprise pricing',
      'Contract terms agreed upon',
      'Multi-year deal secured',
    ],
    talkRatio: { rep: 50, customer: 50 },
    sentimentSummary: 'Positive — deal closed successfully',
    sentimentScore: 88,
    risksDetected: [],
    actionItemsList: ['Send signed contract copy', 'Schedule onboarding kickoff'],
    scorecardName: 'Negotiation Scorecard',
    scorecardVersion: 'v2.1',
    reviewMode: 'AI-Assisted',
    dueDate: '2026-05-14T23:59:00Z',
    status: 'Completed',
    reviewer: 'You',
    quickStats: { topics: 3, actionItems: 2 },
  },
  rv_004: {
    reviewId: 'rv_004',
    callTitle: 'Discovery Call - StartupX Series A',
    salesRep: 'Sarah Chen',
    customer: 'StartupX',
    dateTime: '2026-05-12T09:00:00Z',
    duration: '42:30',
    callType: 'Discovery',
    dealLinked: 'StartupX Series A Deal',
    callSource: 'Zoom',
    participants: [
      { name: 'Sarah Chen', role: 'Rep' },
      { name: 'David Lee', role: 'CEO' },
    ],
    aiSummary:
      'Discovery call with StartupX showed mixed signals. The prospect is early stage and budget is not confirmed.',
    keyHighlights: [
      'Early stage company with limited budget clarity',
      'Strong interest in core product features',
      'Timeline mismatch identified',
    ],
    talkRatio: { rep: 55, customer: 45 },
    sentimentSummary: 'Negative — timeline and budget concerns',
    sentimentScore: 42,
    risksDetected: ['Budget not confirmed', 'Timeline mismatch', 'New rep needs coaching'],
    actionItemsList: ['Clarify budget timeline', 'Schedule coaching session', 'Follow up in 2 weeks'],
    scorecardName: 'Discovery Call Scorecard',
    scorecardVersion: 'v2.3',
    reviewMode: 'AI-Assisted',
    dueDate: '2026-05-13T23:59:00Z',
    status: 'Overdue',
    reviewer: 'You',
    quickStats: { topics: 4, actionItems: 4 },
  },
  rv_005: {
    reviewId: 'rv_005',
    callTitle: 'Closing Call - MegaCorp Deal',
    salesRep: 'Michael Rodriguez',
    customer: 'MegaCorp',
    dateTime: '2026-05-11T13:00:00Z',
    duration: '55:40',
    callType: 'Closing',
    dealLinked: 'MegaCorp Enterprise Deal',
    callSource: 'Zoom',
    participants: [
      { name: 'Michael Rodriguez', role: 'Rep' },
      { name: 'Susan Taylor', role: 'VP Procurement' },
    ],
    aiSummary: 'Michael successfully closed the MegaCorp deal after a thorough final negotiation.',
    keyHighlights: ['Deal closed successfully', 'All contract terms finalized'],
    talkRatio: { rep: 40, customer: 60 },
    sentimentSummary: 'Very positive — successful close',
    sentimentScore: 94,
    risksDetected: [],
    actionItemsList: ['Send welcome package'],
    scorecardName: 'Closing Call Scorecard',
    scorecardVersion: 'v1.8',
    reviewMode: 'AI-Assisted',
    dueDate: '2026-05-12T23:59:00Z',
    status: 'Completed',
    reviewer: 'You',
    quickStats: { topics: 3, actionItems: 1 },
  },
  call_001: {
    reviewId: 'call_001',
    callTitle: 'Demo Call - SmallBiz Solutions',
    salesRep: 'Sarah Chen',
    customer: 'SmallBiz Solutions',
    dateTime: '2026-05-15T09:30:00Z',
    duration: '38:15',
    callType: 'Demo',
    dealLinked: 'SmallBiz Solutions Deal',
    callSource: 'Zoom',
    participants: [{ name: 'Sarah Chen', role: 'Rep' }, { name: 'Tom Harris', role: 'Owner' }],
    aiSummary: 'Demo call with SmallBiz Solutions covering core product features.',
    keyHighlights: ['Core features demonstrated successfully', 'Budget evaluation period requested'],
    talkRatio: { rep: 55, customer: 45 },
    sentimentSummary: 'Neutral — interested but cautious',
    sentimentScore: 60,
    risksDetected: ['Budget not confirmed'],
    actionItemsList: ['Send product overview deck', 'Follow up next week'],
    scorecardName: 'Demo Call Scorecard',
    scorecardVersion: 'v1.5',
    reviewMode: 'Manual',
    dueDate: '2026-05-18T23:59:00Z',
    status: 'Pending',
    reviewer: 'You',
    quickStats: { topics: 3, actionItems: 2 },
  },
  call_002: {
    reviewId: 'call_002',
    callTitle: 'Check-in Call - ABC Industries',
    salesRep: 'Jennifer Kim',
    customer: 'ABC Industries',
    dateTime: '2026-05-15T11:00:00Z',
    duration: '22:45',
    callType: 'Check-In',
    dealLinked: 'ABC Industries Renewal',
    callSource: 'Phone',
    participants: [
      { name: 'Jennifer Kim', role: 'Rep' },
      { name: 'Carol White', role: 'Account Manager' },
    ],
    aiSummary: 'Routine check-in call with ABC Industries to review account health and upcoming renewal.',
    keyHighlights: ['Account health confirmed as good', 'Renewal discussion initiated'],
    talkRatio: { rep: 45, customer: 55 },
    sentimentSummary: 'Positive — satisfied customer',
    sentimentScore: 78,
    risksDetected: [],
    actionItemsList: ['Send renewal proposal'],
    scorecardName: 'Check-in Call Scorecard',
    scorecardVersion: 'v1.0',
    reviewMode: 'Manual',
    dueDate: '2026-05-19T23:59:00Z',
    status: 'Pending',
    reviewer: 'You',
    quickStats: { topics: 2, actionItems: 1 },
  },
  call_003: {
    reviewId: 'call_003',
    callTitle: 'Follow-up Call - Enterprise Inc.',
    salesRep: 'Michael Rodriguez',
    customer: 'Enterprise Inc.',
    dateTime: '2026-05-14T15:45:00Z',
    duration: '28:12',
    callType: 'Follow-Up',
    dealLinked: 'Enterprise Inc. Expansion',
    callSource: 'Zoom',
    participants: [
      { name: 'Michael Rodriguez', role: 'Rep' },
      { name: 'Patricia Brown', role: 'Director of IT' },
    ],
    aiSummary: 'Follow-up call with Enterprise Inc. to address questions from the previous demo.',
    keyHighlights: ['Previous demo questions addressed', 'QA sample flagged for quality review'],
    talkRatio: { rep: 50, customer: 50 },
    sentimentSummary: 'Neutral — evaluating options',
    sentimentScore: 55,
    risksDetected: ['Competitor evaluation in progress'],
    actionItemsList: ['Send competitive comparison', 'Schedule technical deep-dive'],
    scorecardName: 'Follow-up Call Scorecard',
    scorecardVersion: 'v1.2',
    reviewMode: 'Manual',
    dueDate: '2026-05-17T23:59:00Z',
    status: 'Pending',
    reviewer: 'You',
    quickStats: { topics: 3, actionItems: 2 },
  },
};

export const MOCK_SCORECARDS: Scorecard[] = [
  { scorecardId: 'sc_01', scorecardName: 'Discovery Call Scorecard' },
  { scorecardId: 'sc_02', scorecardName: 'Demo Call Scorecard' },
  { scorecardId: 'sc_03', scorecardName: 'Negotiation Scorecard' },
  { scorecardId: 'sc_04', scorecardName: 'Closing Call Scorecard' },
  { scorecardId: 'sc_05', scorecardName: 'Follow-up Call Scorecard' },
];

export const MOCK_USERS: User[] = [
  { userId: 'u_001', userName: 'You' },
  { userId: 'u_002', userName: 'Alex Martinez' },
  { userId: 'u_003', userName: 'Priya Nair' },
];

export const MOCK_ANALYTICS_SUMMARY: AnalyticsSummary = {
  repAvgScore: 82,
  repScoreTrend: 4,
  teamAvgScore: 78,
  teamComparison: 'above',
  completionRate: 87,
  totalReviews: 1,
};

export const MOCK_SCORE_TREND: TrendPoint[] = [
  { week: 'Apr 1', score: 74 },
  { week: 'Apr 8', score: 78 },
  { week: 'Apr 15', score: 80 },
  { week: 'Apr 22', score: 76 },
  { week: 'Apr 29', score: 82 },
  { week: 'May 6', score: 85 },
  { week: 'May 13', score: 88 },
];

export const MOCK_FOCUS_AREAS: FocusArea[] = [
  { sectionName: 'Objection Handling', avgScore: 68 },
  { sectionName: 'Discovery - Decision Process', avgScore: 72 },
  { sectionName: 'Next Steps Clarity', avgScore: 75 },
];

export const MOCK_COMMON_TAGS: TagCount[] = [
  { tag: 'Needs Coaching', count: 12 },
  { tag: 'Strong Discovery', count: 8 },
  { tag: 'Best Practice', count: 6 },
  { tag: 'Poor Closing', count: 5 },
];

export const MOCK_REVIEW_HISTORY: ReviewHistoryItem[] = [
  {
    reviewId: 'rv_003',
    callTitle: 'Negotiation - Global Enterprises Contract',
    reviewerName: 'Jennifer Kim',
    reviewedAt: '2026-05-13T14:45:00Z',
    tags: ['Best Practice', 'Strong Closer'],
    score: 88,
  },
];
