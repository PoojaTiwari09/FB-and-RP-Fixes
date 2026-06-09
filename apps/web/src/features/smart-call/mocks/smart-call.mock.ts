import type {
  ContactsResponse,
  PreCallBrief,
  SessionStartResponse,
  SessionEndResponse,
  CallSummary,
  SmartCall,
  LiveGuidanceEvent,
  SuggestedResponsesEvent,
  CompetitorIntelligenceEvent,
  IntentSignalsEvent,
  TalkRatioEvent,
  ConversationMetricsEvent,
  ConversationSummaryEvent,
  OverlayUpdateEvent,
  LogEntry,
} from '@smart-call/types/smart-call.types';

export const MOCK_SMART_CALLS: SmartCall[] = [
  {
    id: 'smart_call_001',
    title: 'Q2 renewal follow-up',
    prospect: 'Sarah Chen',
    company: 'Acme Corp',
    scheduledAt: '2026-05-28T10:30:00.000Z',
    status: 'completed',
    durationMin: 24,
    aiScore: 78,
    talkRatio: 45,
    sentiment: 'positive',
    keyMoments: [
      'Pricing objection handled with ROI framing',
      'IT stakeholder identified for follow-up',
    ],
  },
  {
    id: 'smart_call_002',
    title: 'Technical discovery',
    prospect: 'Michael Rodriguez',
    company: 'TechFlow Inc',
    scheduledAt: '2026-05-28T14:00:00.000Z',
    status: 'scheduled',
    durationMin: null,
    aiScore: null,
    talkRatio: null,
    sentiment: null,
    keyMoments: [],
  },
  {
    id: 'smart_call_003',
    title: 'Operations process review',
    prospect: 'Priya Nair',
    company: 'Vertex AI Solutions',
    scheduledAt: '2026-05-27T16:15:00.000Z',
    status: 'missed',
    durationMin: null,
    aiScore: null,
    talkRatio: null,
    sentiment: null,
    keyMoments: ['Reschedule requested after no-show'],
  },
];

// ─── 1. GET /api/smart-call/contacts ──────────────────────────────────────

export const MOCK_CONTACTS: ContactsResponse = {
  contacts: [
    {
      contactId: 'cnt_001',
      contactName: 'Sarah Chen',
      jobTitle: 'VP of Sales',
      company: 'Acme Corp',
      avatarUrl: null,
      lastInteractionLabel: 'Called 2 days ago',
      phone: '+1 (555) 123-4567',
    },
    {
      contactId: 'cnt_002',
      contactName: 'Michael Rodriguez',
      jobTitle: 'CTO',
      company: 'TechFlow Inc',
      avatarUrl: null,
      lastInteractionLabel: 'Emailed 5 days ago',
      phone: '+1 (555) 987-6543',
    },
    {
      contactId: 'cnt_003',
      contactName: 'Priya Nair',
      jobTitle: 'Head of Operations',
      company: 'Vertex AI Solutions',
      avatarUrl: null,
      lastInteractionLabel: 'Meeting 1 week ago',
      phone: '+1 (555) 456-7890',
    },
    {
      contactId: 'cnt_004',
      contactName: 'Tom Lawson',
      jobTitle: 'Procurement Manager',
      company: 'BlueWave Retail',
      avatarUrl: null,
      lastInteractionLabel: 'Called 3 days ago',
      phone: '+1 (555) 321-0987',
    },
    {
      contactId: 'cnt_005',
      contactName: 'Lisa Fernandez',
      jobTitle: 'Director of Strategy',
      company: 'Orion Pharma',
      avatarUrl: null,
      lastInteractionLabel: 'Emailed yesterday',
      phone: '+1 (555) 654-3210',
    },
  ],
  total: 5,
  hasMore: false,
};

// ─── 2. GET /api/smart-call/contacts/{contactId}/pre-call-brief ───────────

export const MOCK_PRE_CALL_BRIEF: PreCallBrief = {
  contactId: 'cnt_001',
  contactName: 'Sarah Chen',
  contactCompany: 'Acme Corp',
  supportedIntegrations: ['ZOOM', 'MEET', 'TEAMS'],
  preCallBriefing:
    "Sarah has shown high pricing interest. Last call focused on ROI concerns. Lead with the TechCorp case study — similar use case, 3x ROI in 6 months. She's the decision maker but needs IT sign-off.",
  keyObjections: ['Budget', 'Integration complexity'],
  dealStage: 'Negotiation',
  arrValue: '$240K ARR',
};

// ─── 3. POST /api/smart-call/sessions/start ───────────────────────────────

export const MOCK_SESSION_START: SessionStartResponse = {
  sessionId: 'session_001',
  contactId: 'cnt_001',
  contactName: 'Sarah Chen',
  contactCompany: 'Acme Corp',
  taskTitle: 'Follow up on Q2 contract renewal',
  status: 'LIVE',
  wsEndpoint: 'wss://live.relanto.ai/sessions/session_001',
  message: 'Live Assist session started',
};

// ─── 4. WebSocket mock events (streamed during live session) ──────────────

export const MOCK_WS_LIVE_GUIDANCE: LiveGuidanceEvent = {
  eventType: 'LIVE_GUIDANCE',
  currentStage: 'Initial Greeting and Introduction',
  nextSuggestion: 'Ask about current challenges to move into discovery',
};

export const MOCK_WS_SUGGESTED_RESPONSES: SuggestedResponsesEvent = {
  eventType: 'SUGGESTED_RESPONSES',
  responses: [
    "That's a great point. Can you walk me through what your current process looks like when that happens?",
    "I hear you. Many of our customers had the same concern before implementing our solution. What would make this feel less risky for your team?",
    "Help me understand the impact — if we could solve this, what would that mean for your quarterly targets?",
    "That makes sense. Who else on your team should be involved in this conversation to make sure we're addressing everyone's needs?",
  ],
};

export const MOCK_WS_COMPETITOR_INTELLIGENCE: CompetitorIntelligenceEvent = {
  eventType: 'COMPETITOR_INTELLIGENCE',
  competitors: [
    {
      competitorName: 'Garmin',
      badgeColor: 'orange',
      insight: "Client is looking for an update to their vehicle's map",
      ourEdge:
        'Our version 7.7 update provides more accurate and up-to-date mapping information, ensuring a safer and more enjoyable driving experience',
      sayThis:
        'Our version 7.7 update is specifically designed to provide the most accurate and up-to-date mapping information, which is essential for safe and enjoyable driving. Would you like to know more?',
    },
    {
      competitorName: 'HubSpot',
      badgeColor: 'pink',
      insight: 'Client may compare with HubSpot for CRM capabilities',
      ourEdge:
        'Our solution provides a more robust and scalable platform that meets the needs of larger enterprises like Acme Corp.',
      sayThis:
        'While HubSpot may offer some similarities, our solution provides a more robust and scalable platform that meets the needs of larger enterprises like Acme Corp.',
    },
    {
      competitorName: 'Zoho',
      badgeColor: 'green',
      insight: 'Client concerned about integration effort',
      ourEdge:
        'Our solution is designed to integrate seamlessly with existing systems, reducing the need for manual implementation.',
      sayThis:
        'Compared to Zoho, our platform offers deeper integrations and a more enterprise-ready infrastructure, helping your team scale without operational bottlenecks.',
    },
  ],
};

export const MOCK_WS_INTENT_SIGNALS: IntentSignalsEvent = {
  eventType: 'INTENT_SIGNALS',
  signals: [
    { label: 'Pricing Interest', value: 'High',        severity: 'HIGH',   color: 'green'  },
    { label: 'Decision Timeline', value: 'Q2 2026',    severity: 'INFO',   color: 'blue'   },
    { label: 'Budget Concern',    value: 'Medium',     severity: 'MEDIUM', color: 'yellow' },
    { label: 'Feature Request',   value: 'Integration',severity: 'INFO',   color: 'purple' },
  ],
};

export const MOCK_WS_TALK_RATIO: TalkRatioEvent = {
  eventType: 'TALK_RATIO',
  repPercent: 45,
  customerPercent: 55,
};

export const MOCK_WS_CONVERSATION_METRICS: ConversationMetricsEvent = {
  eventType: 'CONVERSATION_METRICS',
  interruptions: 2,
  speakingPace: 'GOOD',
  wordsPerMinute: 128,
  questionsAsked: 7,
};

export const MOCK_WS_CONVERSATION_SUMMARY: ConversationSummaryEvent = {
  eventType: 'CONVERSATION_SUMMARY',
  segments: [
    {
      startTime: '00:30',
      endTime: '01:00',
      summary: 'Discussed pricing concerns and ROI expectations',
      highlightedKeywords: [
        { word: 'pricing', color: 'orange' },
        { word: 'ROI', color: 'blue' },
      ],
      tags: ['Objection', 'Info'],
    },
    {
      startTime: '00:00',
      endTime: '00:30',
      summary: 'Timeline and implementation process clarified',
      highlightedKeywords: [
        { word: 'Timeline', color: 'orange' },
        { word: 'implementation', color: 'blue' },
      ],
      tags: ['Info'],
    },
  ],
};

export const MOCK_WS_OVERLAY_UPDATE: OverlayUpdateEvent = {
  eventType: 'OVERLAY_UPDATE',
  confidenceScore: 88,
  contextSummary: 'Client is inquiring about updating the map in their 2009 Nissan Altima',
  actionSuggestion: 'Provide a code for the map update and walk John through the process.',
  suggestedResponse:
    "That's a great point. Can you walk me through what your current process looks like when that happens?",
  strategicTip:
    'Focus on building rapport and uncovering pain points before moving to pricing.',
  strategicTipScript:
    'What challenges are you currently facing with your existing solution?',
  competitors: [
    {
      competitorName: 'HubSpot',
      ourEdge: 'More robust and scalable platform for enterprise needs',
      sayThis:
        'While HubSpot may offer some similarities, our solution provides a more robust and scalable platform that meets the needs of larger enterprises like Acme Corp.',
    },
    {
      competitorName: 'Zoho',
      ourEdge: 'Deeper integrations, more enterprise-ready infrastructure',
      sayThis:
        'Compared to Zoho, our platform offers deeper integrations and a more enterprise-ready infrastructure, helping your team scale without operational bottlenecks.',
    },
  ],
};

export const MOCK_LOG_ENTRIES: LogEntry[] = [
  { timestamp: '01:23', title: 'Objection detected',   description: 'Price concern raised'          },
  { timestamp: '01:13', title: 'Pricing mentioned',    description: 'Customer asked about costs'    },
  { timestamp: '00:58', title: 'ROI question asked',   description: 'Customer interested in value'  },
  { timestamp: '00:43', title: 'Competitor mentioned', description: 'Garmin comparison initiated'   },
];

// ─── 4b. GET /api/smart-call/sessions/{sessionId}/transcript ─────────────

export const MOCK_TRANSCRIPT = {
  sessionId: 'session_001',
  contactName: 'Sarah Chen',
  duration: '3:46',
  segments: [
    { timestamp: '0:00', speaker: 'REP',      text: "Hi Sarah, thanks for taking the time to connect today. How are you doing?" },
    { timestamp: '0:08', speaker: 'CUSTOMER',  text: "I'm doing well, thanks. I wanted to discuss the renewal terms." },
    { timestamp: '0:15', speaker: 'REP',      text: "Absolutely, let's dive into that. I actually wanted to share some ROI data with you first — our customers in similar industries saw a 3x return within six months." },
    { timestamp: '0:35', speaker: 'CUSTOMER',  text: "That's interesting. Our main concern right now is honestly the pricing. It feels steep for what we're getting." },
    { timestamp: '0:48', speaker: 'REP',      text: "I completely understand, and that's a fair point to raise. Can I walk you through what's included in the renewal that wasn't there before?" },
    { timestamp: '1:02', speaker: 'CUSTOMER',  text: "Sure, go ahead." },
    { timestamp: '1:05', speaker: 'REP',      text: "We've added live AI coaching, real-time competitor intelligence, and the new integration suite — all included at no extra cost. When you factor that in, the cost-per-outcome actually goes down significantly." },
    { timestamp: '1:28', speaker: 'CUSTOMER',  text: "That's a good point. What about the Garmin integration? We've been comparing." },
    { timestamp: '1:34', speaker: 'REP',      text: "Great question. Our version 7.7 update specifically addresses mapping accuracy — it's more up-to-date and safer for enterprise fleets. Garmin hasn't matched that yet." },
    { timestamp: '1:55', speaker: 'CUSTOMER',  text: "Okay, that's useful. What about the onboarding timeline if we renew?" },
    { timestamp: '2:02', speaker: 'REP',      text: "We can have your team fully onboarded within two weeks. You'd have a dedicated success manager from day one." },
    { timestamp: '2:18', speaker: 'CUSTOMER',  text: "And the pricing — is there any flexibility there?" },
    { timestamp: '2:25', speaker: 'REP',      text: "There is. If you commit to a two-year renewal today, I can lock in the current rate plus include the advanced analytics add-on at no cost." },
    { timestamp: '2:44', speaker: 'CUSTOMER',  text: "That sounds more reasonable. I'd need to loop in IT before we finalise anything though." },
    { timestamp: '2:52', speaker: 'REP',      text: "Of course — that makes complete sense. Would it help if I put together a one-pager for your IT team covering the integration specs?" },
    { timestamp: '3:04', speaker: 'CUSTOMER',  text: "Yes, that would actually be very helpful." },
    { timestamp: '3:08', speaker: 'REP',      text: "Perfect. I'll have that over to you by end of day. Is there anything else you'd like to cover before we wrap up?" },
    { timestamp: '3:22', speaker: 'CUSTOMER',  text: "I think that covers it for now. Let's reconnect once IT has had a look." },
    { timestamp: '3:30', speaker: 'REP',      text: "Sounds great, Sarah. I'll send the one-pager now and we can schedule a follow-up for early next week. Thanks for your time today!" },
    { timestamp: '3:40', speaker: 'CUSTOMER',  text: "Thanks. Talk soon." },
  ],
};

// ─── 5. POST /api/smart-call/sessions/{sessionId}/end ─────────────────────

export const MOCK_SESSION_END: SessionEndResponse = {
  sessionId: 'session_001',
  status: 'ENDED',
  callSummaryId: 'summary_001',
  message: 'Session ended. Generating call summary...',
};

// ─── 6. GET /api/smart-call/sessions/{sessionId}/summary ──────────────────

export const MOCK_CALL_SUMMARY: CallSummary = {
  sessionId: 'session_001',
  callSummaryId: 'summary_001',
  duration: '3:46',
  callType: 'Follow up on Q2 contract renewal',
  signalLabel: 'Positive Signal',
  signalType: 'POSITIVE',
  overallScore: 78,
  dimensionScores: [
    { dimension: 'Discovery',          score: 82, maxScore: 100 },
    { dimension: 'Objection Handling', score: 75, maxScore: 100 },
    { dimension: 'Closing',            score: 77, maxScore: 100 },
  ],
  aiSummary:
    'Strong opening with good rapport building. Successfully navigated price sensitivity by focusing on ROI and value proposition. Competitor comparison was handled well with clear differentiation. However, missed opportunities to qualify decision timeline and stakeholders. Overall positive engagement with clear interest signals from Sarah Chen.',
  keyMoments: [
    {
      timestamp: '2:25',
      type: 'OBJECTION',
      color: 'yellow',
      description: 'Price concern raised - handled well with ROI breakdown',
    },
    {
      timestamp: '3:50',
      type: 'INTEREST_SIGNAL',
      color: 'green',
      description: 'Strong buying signal detected when discussing integration capabilities',
    },
    {
      timestamp: '5:10',
      type: 'MISSED_OPPORTUNITY',
      color: 'red',
      description: 'Opportunity to ask about decision timeline was missed',
    },
  ],
  missedOpportunities: {
    title: 'Missed Opportunities',
    subLabel: 'Key questions you could have asked:',
    questions: [
      'When is the decision being made?',
      'Who else is involved in the decision-making process?',
      'What are your must-have features versus nice-to-haves?',
    ],
  },
  suggestedImprovements: [
    'Ask more open-ended questions early to uncover deeper pain points',
    'Confirm budget authority before diving into pricing details',
    "Use customer's name more frequently to build rapport",
  ],
  conversationTimeline: [
    { startTime: '0:00', endTime: '0:30', topic: 'Introduction and rapport building' },
    { startTime: '0:30', endTime: '1:00', topic: 'Discussed current challenges with vehicle mapping systems' },
    { startTime: '1:00', endTime: '1:30', topic: 'Presented Version 7.7 features and benefits' },
    { startTime: '1:30', endTime: '2:00', topic: 'Competitor comparison (Garmin) – highlighted our edge' },
    { startTime: '2:00', endTime: '2:30', topic: 'Price sensitivity discussion and ROI justification' },
    { startTime: '2:30', endTime: '3:00', topic: 'Integration questions and technical capabilities' },
  ],
  transcriptUrl: 'https://app.relanto.ai/transcripts/session_001',
};
