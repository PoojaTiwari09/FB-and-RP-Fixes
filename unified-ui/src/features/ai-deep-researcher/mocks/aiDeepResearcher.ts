// ============================================================
// MOCK DATA — AI Deep Researcher
// Revenue Intelligence UI | Sales Manager
// ------------------------------------------------------------
// Figma-derived mock data for every API endpoint.
// The service layer falls back to these values automatically
// when a real endpoint fails or is not yet available.
//
// TO REMOVE MOCKS: Delete the catch blocks in
//   services/aiDeepResearcher.ts — no other changes needed.
// ============================================================

import type {
  FiltersDefaults,
  ExampleQuestionsResponse,
  RunAnalysisResponse,
  ProgressResponse,
  ReportResponse,
  EvidenceResponse,
  EscalationAnswer,
  ShareRecommendationResponse,
} from '@ai-deep-researcher/types';

// ─── 1. GET /api/ai-deep-researcher/filters/defaults ────────
export const mockFiltersDefaults: FiltersDefaults = {
  dateRange: {
    default: 'Last 60 days',
    options: ['Last 7 days', 'Last 30 days', 'Last 60 days', 'Last 90 days', 'Last 6 Months', 'Custom Range'],
  },
  segment: {
    default: 'Mid-Market',
    options: ['All Segments', 'Enterprise', 'Mid-Market', 'SMB', 'Startup'],
  },
  callStage: {
    default: 'Discovery',
    options: ['All Stages', 'Discovery', 'Demo', 'Proposal', 'Negotiation', 'Closing'],
  },
  region: {
    default: 'West',
    options: ['All Regions', 'North America', 'East', 'West', 'EMEA', 'APAC'],
  },
  repCohort: {
    label: 'My Team (Auto-set)',
    value: 'team_west',
    repCount: 8,
    isAutoSet: true,
  },
};

// ─── 2. GET /api/ai-deep-researcher/example-questions ───────
export const mockExampleQuestions: ExampleQuestionsResponse = {
  questions: [
    'What patterns distinguish our won deals from lost deals this quarter?',
    'Which reps have the highest talk-track adoption rate in discovery?',
    'How is integration complexity being handled across my West team?',
    'What competitor mentions are increasing in mid-market discovery calls?',
    'Why is our win rate dropping in the Mid-Market segment this quarter?',
    'What talk patterns correlate with deals closing in under 30 days?',
  ],
};

// ─── 3. POST /api/ai-deep-researcher/run ────────────────────
export const mockRunAnalysis: RunAnalysisResponse = {
  jobId: 'job_mock_20260527_001',
  status: 'queued',
  estimatedDurationSeconds: 150,
};

// ─── 4. GET /api/ai-deep-researcher/progress/:jobId ─────────
export const mockProgressSteps: ProgressResponse[] = [
  {
    jobId: 'job_mock_20260527_001',
    progressPercent: 0,
    status: 'in_progress',
    steps: [
      { stepId: 's1', label: 'Decomposing query into sub-analyses', status: 'in_progress', detail: 'Breaking query into 4 sub-tasks...' },
      { stepId: 's2', label: 'Scoping data universe (Revenue Graph)', status: 'queued', detail: null },
      { stepId: 's3', label: 'Scanning call transcripts', status: 'queued', detail: null },
      { stepId: 's4', label: 'Scanning email conversations', status: 'queued', detail: null },
      { stepId: 's5', label: 'Pattern detection & objection cross-reference', status: 'queued', detail: null },
      { stepId: 's6', label: 'Synthesising insights & generating report', status: 'queued', detail: null },
    ],
  },
  {
    jobId: 'job_mock_20260527_001',
    progressPercent: 20,
    status: 'in_progress',
    steps: [
      { stepId: 's1', label: 'Decomposing query into sub-analyses', status: 'complete', detail: null },
      { stepId: 's2', label: 'Scoping data universe (Revenue Graph)', status: 'in_progress', detail: 'Scoping 234,561 activity records...' },
      { stepId: 's3', label: 'Scanning call transcripts', status: 'queued', detail: null },
      { stepId: 's4', label: 'Scanning email conversations', status: 'queued', detail: null },
      { stepId: 's5', label: 'Pattern detection & objection cross-reference', status: 'queued', detail: null },
      { stepId: 's6', label: 'Synthesising insights & generating report', status: 'queued', detail: null },
    ],
  },
  {
    jobId: 'job_mock_20260527_001',
    progressPercent: 45,
    status: 'in_progress',
    steps: [
      { stepId: 's1', label: 'Decomposing query into sub-analyses', status: 'complete', detail: null },
      { stepId: 's2', label: 'Scoping data universe (Revenue Graph)', status: 'complete', detail: null },
      { stepId: 's3', label: 'Scanning call transcripts', status: 'in_progress', detail: 'Scanning 234 mid-market call transcripts...' },
      { stepId: 's4', label: 'Scanning email conversations', status: 'queued', detail: null },
      { stepId: 's5', label: 'Pattern detection & objection cross-reference', status: 'queued', detail: null },
      { stepId: 's6', label: 'Synthesising insights & generating report', status: 'queued', detail: null },
    ],
  },
  {
    jobId: 'job_mock_20260527_001',
    progressPercent: 65,
    status: 'in_progress',
    steps: [
      { stepId: 's1', label: 'Decomposing query into sub-analyses', status: 'complete', detail: null },
      { stepId: 's2', label: 'Scoping data universe (Revenue Graph)', status: 'complete', detail: null },
      { stepId: 's3', label: 'Scanning call transcripts', status: 'complete', detail: null },
      { stepId: 's4', label: 'Scanning email conversations', status: 'in_progress', detail: 'Scanning 3,102 email threads...' },
      { stepId: 's5', label: 'Pattern detection & objection cross-reference', status: 'queued', detail: null },
      { stepId: 's6', label: 'Synthesising insights & generating report', status: 'queued', detail: null },
    ],
  },
  {
    jobId: 'job_mock_20260527_001',
    progressPercent: 82,
    status: 'in_progress',
    steps: [
      { stepId: 's1', label: 'Decomposing query into sub-analyses', status: 'complete', detail: null },
      { stepId: 's2', label: 'Scoping data universe (Revenue Graph)', status: 'complete', detail: null },
      { stepId: 's3', label: 'Scanning call transcripts', status: 'complete', detail: null },
      { stepId: 's4', label: 'Scanning email conversations', status: 'complete', detail: null },
      { stepId: 's5', label: 'Pattern detection & objection cross-reference', status: 'in_progress', detail: 'Detecting patterns across 6 objection types...' },
      { stepId: 's6', label: 'Synthesising insights & generating report', status: 'queued', detail: null },
    ],
  },
  {
    jobId: 'job_mock_20260527_001',
    progressPercent: 95,
    status: 'in_progress',
    steps: [
      { stepId: 's1', label: 'Decomposing query into sub-analyses', status: 'complete', detail: null },
      { stepId: 's2', label: 'Scoping data universe (Revenue Graph)', status: 'complete', detail: null },
      { stepId: 's3', label: 'Scanning call transcripts', status: 'complete', detail: null },
      { stepId: 's4', label: 'Scanning email conversations', status: 'complete', detail: null },
      { stepId: 's5', label: 'Pattern detection & objection cross-reference', status: 'complete', detail: null },
      { stepId: 's6', label: 'Synthesising insights & generating report', status: 'in_progress', detail: 'Generating structured report...' },
    ],
  },
  {
    jobId: 'job_mock_20260527_001',
    progressPercent: 100,
    status: 'complete',
    steps: [
      { stepId: 's1', label: 'Decomposing query into sub-analyses', status: 'complete', detail: null },
      { stepId: 's2', label: 'Scoping data universe (Revenue Graph)', status: 'complete', detail: null },
      { stepId: 's3', label: 'Scanning call transcripts', status: 'complete', detail: null },
      { stepId: 's4', label: 'Scanning email conversations', status: 'complete', detail: null },
      { stepId: 's5', label: 'Pattern detection & objection cross-reference', status: 'complete', detail: null },
      { stepId: 's6', label: 'Synthesising insights & generating report', status: 'complete', detail: null },
    ],
  },
];

// ─── 5. GET /api/ai-deep-researcher/report/:jobId ───────────
// Values match the Figma screenshots exactly
export const mockReport: ReportResponse = {
  reportTitle: 'Mid-Market Discovery Objection Patterns — West Team',
  filterTags: ['234 calls', '8 reps', 'Mid-Market', 'Discovery stage', 'West', 'Last 60 days'],
  tabs: ['Key Findings', 'Evidence', 'Trends', 'Risks & Opps', 'Recommendations', 'Escalation'],
  execSummary:
    'Analysis of 234 mid-market discovery calls across 8 West team reps reveals integration complexity and incumbent vendor loyalty are the top objections. Resolution rates for incumbent vendor loyalty objections are critically low at only 28%. Immediate coaching is needed on competitive differentiation and change management value propositions.',
  totalCalls: 234,
  totalReps: 8,
  keyFindings: {
    objections: [
      { rank: 1, objection: 'Integration complexity',   frequencyPct: 71, resolutionRatePct: 43, trend: 'up'   },
      { rank: 2, objection: 'Pricing / budget',         frequencyPct: 58, resolutionRatePct: 61, trend: 'flat' },
      { rank: 3, objection: 'Incumbent vendor loyalty', frequencyPct: 44, resolutionRatePct: 28, trend: 'up'   },
      { rank: 4, objection: 'Security & compliance',    frequencyPct: 39, resolutionRatePct: 82, trend: 'down' },
      { rank: 5, objection: 'Timeline / urgency',       frequencyPct: 31, resolutionRatePct: 54, trend: 'flat' },
    ],
    lowResolutionAlerts: [
      { objection: 'Incumbent vendor loyalty', resolutionRatePct: 28, unaddressedRatePct: 72 },
    ],
    repPerformance: [
      { repId: 'rep_001', repName: 'Jake Morrison', initials: 'JM', avatarColor: '#6366f1', objection: 'Integration Complexity', resolutionRatePct: 78, coachingNeeded: false },
      { repId: 'rep_002', repName: 'Priya Rao',     initials: 'PR', avatarColor: '#0ea5e9', objection: 'Integration Complexity', resolutionRatePct: 69, coachingNeeded: false },
      { repId: 'rep_003', repName: 'Tom Banks',     initials: 'TB', avatarColor: '#f59e0b', objection: 'Integration Complexity', resolutionRatePct: 42, coachingNeeded: true  },
      { repId: 'rep_004', repName: 'Lisa Chen',     initials: 'LC', avatarColor: '#ef4444', objection: 'Integration Complexity', resolutionRatePct: 31, coachingNeeded: true  },
    ],
  },
  recommendations: [
    {
      recommendationId: 'rec_001',
      priority: 'high',
      title: 'Coaching Priority: Incumbent Vendor Objection Handling',
      description:
        'Tom Banks and Lisa Chen are resolving incumbent vendor loyalty objections at only 28-31%. Immediate coaching needed on competitive differentiation and change management value propositions.',
      basedOnTags: ['Key Finding #3', 'Rep Performance Analysis'],
    },
    {
      recommendationId: 'rec_002',
      priority: 'high',
      title: 'Develop Integration Complexity Playbook',
      description:
        'Integration complexity is the #1 objection (71% frequency) but resolution rate is only 43%. Create a standardized response framework with technical resources, customer proof points, and implementation timeline clarity.',
      basedOnTags: ['Key Finding #1', 'Cross-rep pattern analysis'],
    },
    {
      recommendationId: 'rec_003',
      priority: 'medium',
      title: 'Update Discovery Question Bank',
      description:
        'Reps are encountering objections reactively rather than surfacing them proactively in discovery. Add questions that uncover integration concerns and incumbent relationships earlier in the conversation.',
      basedOnTags: ['Trend Analysis', 'Objection timing patterns'],
    },
  ],
  trends:
    "Integration complexity objections have risen 22% over 90 days, correlating with the launch of a competitor's no-code integration suite. Pricing objections have worsened MoM for 3 consecutive months, suggesting a need to revisit discount authorization thresholds. Timeline objections are up 18% in the last 30 days — likely driven by end-of-quarter budget freeze cycles.",
  risksAndOpportunities:
    'RISK: If pricing resolution rates continue to fall, forecasted Q2 close rate will drop by an estimated 8-12%. Three reps are at high churn risk if not coached within 30 days.\n\nOPPORTUNITY: Security & Compliance has an 82% resolution rate — the highest of any objection type. Reps who handle this well can be used as internal coaches. Additionally, deals where integration complexity is resolved in under 2 calls have a 3.2x higher close probability.',
};

// ─── 6. GET /api/ai-deep-researcher/evidence/:jobId ─────────
// Values match the Figma screenshots exactly (CALL-4821, CALL-4789, etc.)
export const mockEvidence: EvidenceResponse = {
  total: 21,
  page: 1,
  totalPages: 4,
  evidence: [
    {
      evidenceId: 'ev_001',
      callId: 'call_4821',
      finding: 'integration_complexity',
      repName: 'Jake Morrison',
      prospectName: 'David Chen',
      accountName: 'TechFlow Inc',
      accountId: 'acc_441',
      callDate: 'Apr 12, 2026',
      quote:
        "We'd need to integrate with our legacy ERP system — that's going to be a heavy lift on our engineering side. Last time we tried something like this, it took 6 months just to get the APIs working.",
      callTimestampSeconds: 863,
    },
    {
      evidenceId: 'ev_002',
      callId: 'call_4789',
      finding: 'integration_complexity',
      repName: 'Priya Rao',
      prospectName: 'Sarah Williams',
      accountName: 'DataCore Systems',
      accountId: 'acc_218',
      callDate: 'Apr 9, 2026',
      quote:
        "Our IT team is already stretched thin. They're telling me any new integration is at least a Q3 project, and frankly I don't know if we have the bandwidth.",
      callTimestampSeconds: 1361,
    },
    {
      evidenceId: 'ev_003',
      callId: 'call_4756',
      finding: 'incumbent_vendor_loyalty',
      repName: 'Tom Banks',
      prospectName: 'Michael Torres',
      accountName: 'CloudNet Solutions',
      accountId: 'acc_309',
      callDate: 'Apr 7, 2026',
      quote:
        "We've been with VendorX for 8 years now. Sure, there are some pain points, but we know how it works and our team is trained on it. Switching would be a big change management challenge.",
      callTimestampSeconds: 1092,
    },
    {
      evidenceId: 'ev_004',
      callId: 'call_4698',
      finding: 'incumbent_vendor_loyalty',
      repName: 'Lisa Chen',
      prospectName: 'Jennifer Park',
      accountName: 'FinServ Partners',
      accountId: 'acc_502',
      callDate: 'Apr 3, 2026',
      quote:
        "Our VP has a long relationship with the current vendor — they've been partners for years. I'd need a really compelling reason to recommend we switch.",
      callTimestampSeconds: 1915,
    },
  ],
};

// ─── 7. POST /api/ai-deep-researcher/escalation ─────────────
export const mockEscalationAnswers: EscalationAnswer[] = [
  {
    question: "Which objections are most common in my team's mid-market calls?",
    answer:
      'Based on recent call analysis, the most common objections in mid-market calls are:\n\n1. **Integration complexity** - mentioned in ~45% of calls\n2. **Pricing concerns** - mentioned in ~38% of calls\n3. **Incumbent vendor relationships** - mentioned in ~31% of calls\n\nThese patterns appear consistently across your team, though resolution rates vary significantly by rep.',
    suggestDeepAnalysis: true,
  },
  {
    question: '',
    answer:
      'Integration complexity is rising fastest among prospects in the SaaS and financial services verticals. Deals that surface this objection in the Discovery stage close at a 42% lower rate than those where it first appears in Demo. Proactive technical enablement in Discovery could significantly improve conversion.',
    suggestDeepAnalysis: false,
  },
];

// ─── 8. POST /api/ai-deep-researcher/recommendation/share ───
export const mockShareRecommendation: ShareRecommendationResponse = {
  message: 'Recommendation successfully shared with your team on Slack.',
  status: 'success',
};
