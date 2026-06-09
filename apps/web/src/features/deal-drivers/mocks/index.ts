import type {
  SummaryResponse, RiskMatrixResponse, ComparePeriodsResponse,
  AtRiskDealsResponse, AiInsightsResponse, DrilldownResponse
} from '../types';

export const summaryMock: SummaryResponse = {
  totalActiveDeals: { value: 24, deltaVsLast30Days: 4 },
  dealsWithWarnings: { count: 9, pctOfTotal: 37 },
  highestRiskWarning: { label: 'No Next Step', warningType: 'no_next_step', priority: 'high' },
  mostImpactedStage: { stage: 'Proposal / Quote', pctImpacted: 56 },
  warningTrend: { value: 12, direction: 'up' },
};

export const riskMatrixMock: RiskMatrixResponse = {
  reps: [
    {
      repId: 'rep-1', repName: 'James Okafor', role: 'Mid-market AE', totalDeals: 12,
      warnings: {
        noNextStep: { pct: 75, needsTraining: true },
        singleThreaded: { pct: 33, needsTraining: true },
        noClosePlan: { pct: 58, needsTraining: true },
        staleGt14d: { pct: 17 },
        championLeft: { pct: 8 },
      },
    },
    {
      repId: 'rep-2', repName: 'Priya Sharma', role: 'Mid-market AE', totalDeals: 9,
      warnings: {
        noNextStep: { pct: 56, needsTraining: true },
        singleThreaded: { pct: 78, needsTraining: true },
        noClosePlan: { pct: 67, needsTraining: true },
        staleGt14d: { pct: 33 },
        championLeft: { pct: 0 },
      },
    },
    {
      repId: 'rep-3', repName: 'Leo Nguyen', role: 'SMB AE', totalDeals: 15,
      warnings: {
        noNextStep: { pct: 40, needsTraining: true },
        singleThreaded: { pct: 20, needsTraining: true },
        noClosePlan: { pct: 40, needsTraining: true },
        staleGt14d: { pct: 53 },
        championLeft: { pct: 27 },
      },
    },
    {
      repId: 'rep-4', repName: 'Dana Mills', role: 'SMB AE', totalDeals: 7,
      warnings: {
        noNextStep: { pct: 14, needsTraining: true },
        singleThreaded: { pct: 57, needsTraining: true },
        noClosePlan: { pct: 14, needsTraining: true },
        staleGt14d: { pct: 43 },
        championLeft: { pct: 43 },
      },
    },
    {
      repId: 'rep-5', repName: 'Anika Patel', role: 'Mid-market AE', totalDeals: 11,
      warnings: {
        noNextStep: { pct: 18 },
        singleThreaded: { pct: 36, needsTraining: true },
        noClosePlan: { pct: 18 },
        staleGt14d: { pct: 36 },
        championLeft: { pct: 18 },
      },
    },
  ],
};

export const teamAverageMock = {
  noNextStep: 46, singleThreaded: 47, noClosePlan: 45, staleGt14d: 37, championLeft: 20,
};

export const compareperiodsMock: ComparePeriodsResponse = {
  comparisons: [
    { warningType: 'no_next_step', periodAValue: 39.1, periodBValue: 44.8, delta: -5.7, trend: 'down' },
    { warningType: 'single_threaded', periodAValue: 28.7, periodBValue: 26.2, delta: 2.5, trend: 'up' },
    { warningType: 'no_close_plan', periodAValue: 33.3, periodBValue: 33.3, delta: 0.0, trend: 'flat' },
    { warningType: 'stale_gt14d', periodAValue: 15.6, periodBValue: 19.4, delta: -3.8, trend: 'down' },
    { warningType: 'champion_left', periodAValue: 10.3, periodBValue: 8.9, delta: 1.4, trend: 'up' },
  ],
};

export const atRiskDealsMock: AtRiskDealsResponse = {
  totalCount: 5,
  deals: [
    { dealId: 'deal-1', accountName: 'Globex Corporation', repName: 'James Okafor', dealAmount: 240000, crmStage: 'Proposal/Quote', closeDate: '2026-06-30', warningTypes: ['no_next_step', 'single_threaded'], daysFlagged: 21, riskScore: 88 },
    { dealId: 'deal-2', accountName: 'Initech', repName: 'Priya Sharma', dealAmount: 185000, crmStage: 'Value Proposition', closeDate: '2026-07-15', warningTypes: ['single_threaded', 'no_close_plan'], daysFlagged: 14, riskScore: 74 },
    { dealId: 'deal-3', accountName: 'Umbrella Corp', repName: 'Leo Nguyen', dealAmount: 125000, crmStage: 'Negotiation', closeDate: '2026-06-10', warningTypes: ['champion_left', 'no_next_step'], daysFlagged: 9, riskScore: 71 },
    { dealId: 'deal-4', accountName: 'Stark Industries', repName: 'John Smith', dealAmount: 98000, crmStage: 'Proposal/Quote', closeDate: '2026-06-25', warningTypes: ['no_next_step'], daysFlagged: 6, riskScore: 55 },
    { dealId: 'deal-5', accountName: 'Meridian Health', repName: 'Sarah Chen', dealAmount: 84000, crmStage: 'Proposal', closeDate: '2026-07-20', warningTypes: [], daysFlagged: 0, riskScore: 10 },
  ],
};

export const aiInsightsMock: AiInsightsResponse = {
  insights: [
    {
      id: 'i1', priority: 'high', avatarColor: '#E53935', type: 'SYSTEMIC RISK',
      insight: '3 of 5 warning columns show team-wide patterns — "No next step", "Single-threaded", "No close plan" all show ⚠. Team training needed. Systemic process gap — escalate to enablement.',
      recommendation: 'Schedule team-wide enablement session',
      tags: ['3 of 5 columns affected team-wide'],
    },
    {
      id: 'i2', priority: 'high', avatarColor: '#FB8C00', type: 'REVENUE RISK',
      insight: 'James Okafor: $350K of $620K pipeline at risk (56%). 56% of James\'s pipeline has active warnings — 7 of 12 deals flagged at late stages.',
      recommendation: "Prioritise James's top 3 deals by value in next 1-on-1",
      rep: 'James Okafor', tags: ['$350K / $620K (56%)'],
    },
    {
      id: 'i3', priority: 'high', avatarColor: '#E53935', type: 'MULTI-WARNING',
      insight: 'Globex Corporation has 2 simultaneous warnings — Risk score 85/100. Deals with 2+ warnings close at 35% rate vs 55% without.',
      recommendation: 'Review all warnings on Globex in next 1-on-1',
      rep: 'James Okafor', account: 'Globex Corporation', score: 85,
      tags: ['2 warnings · Risk score 85/100'],
    },
    {
      id: 'i4', priority: 'high', avatarColor: '#E53935', type: 'WIN RATE IMPACT',
      insight: '"No next step" reduces win rate by 38% — team-wide at ~13%. Historically, deals with "No next step" active win 38% less often.',
      recommendation: 'Prioritise "No next step" resolution — highest win rate impact',
      tags: ['Win rate impact: -38% · Team exposure: ~13%'],
    },
    {
      id: 'i5', priority: 'medium', avatarColor: '#FB8C00', type: 'BENCHMARK',
      insight: 'Dana Mills is 20% above team average on Single-threaded. Dana\'s Single-threaded rate (33%) is 20% above team average (13%). Deals with this warning win 27% less often.',
      recommendation: 'Focus next 1-on-1 on stakeholder mapping — 20% gap vs team',
      rep: 'Dana Mills', tags: ['33% vs 13% team avg (+20%)'],
    },
    {
      id: 'i6', priority: 'medium', avatarColor: '#FB8C00', type: 'SLIP RISK',
      insight: 'Initech likely to slip 12 days past close date. Based on warning patterns, Initech ($185K) is predicted to slip ~12 days.',
      recommendation: 'Accelerate close plan for Initech to prevent quarter-end slip',
      rep: 'Priya Sharma', account: 'Initech', tags: ['Predicted slip: +12 days'],
    },
  ],
};

export const drilldownMock: DrilldownResponse = {
  rep: { id: 'rep-1', name: 'Anika Patel', role: 'Enterprise AE', initials: 'AP' },
  summary: { dealsFlagged: 3, totalValueAtRisk: 2396000, avgCloseDate: '2026-06-22', warningTrend: 8.3 },
  flaggedDeals: [
    { rank: 1, dealId: 'deal-1', accountName: 'InMobi', dealAmount: 754000, crmStage: 'Prospecting', closeDate: '2026-06-15', closeDateStatus: 'soon', daysFlagged: 21, daysFlaggedStatus: 'high' },
    { rank: 2, dealId: 'deal-2', accountName: 'Wipro', dealAmount: 927000, crmStage: 'Qualification', closeDate: '2026-05-20', closeDateStatus: 'overdue', daysFlagged: 10, daysFlaggedStatus: 'medium' },
    { rank: 3, dealId: 'deal-3', accountName: 'Razorpay', dealAmount: 715000, crmStage: 'Prospecting', closeDate: '2026-07-01', closeDateStatus: 'ok', daysFlagged: 4, daysFlaggedStatus: 'low' },
  ],
  repSidebar: {
    warningRate: 25, dealsInPipeline: 12, avgCloseRate: 31.2,
    aiCoachingTip: '3 deals single-threaded — map all stakeholders before next call. Identify champion and economic buyer for each deal. Multi-thread by engaging IT, finance, and end-user teams.',
  },
};

// ─── Compare Periods extended mock (per-rep, per-warning, side-by-side) ───────
export const comparePeriodsDetailMock = {
  summary: {
    warningsImproved: 4,
    warningsRegressed: 0,
    biggestDrop: { warning: 'Single-threaded', pct: -9 },
    biggestIncrease: { warning: 'None', label: 'No regression' },
    activeDeals: 12,
    repRole: 'Mid-market AE',
  },
  reps: [
    { repId: 'rep-2', repName: 'James Okafor', role: 'Mid-market AE' },
    { repId: 'rep-1', repName: 'Anika Patel', role: 'Enterprise AE' },
    { repId: 'rep-3', repName: 'Dana Mills', role: 'SMB AE' },
    { repId: 'rep-4', repName: 'David Park', role: 'Mid-market AE' },
    { repId: 'rep-5', repName: 'Jennifer Kim', role: 'Enterprise AE' },
  ],
  periodAData: {
    'rep-2': { noNextStep: 83, singleThreaded: 42, noClosePlan: 67, staleGt14d: 25, championLeft: 0 },
    'rep-1': { noNextStep: 75, singleThreaded: 50, noClosePlan: 58, staleGt14d: 20, championLeft: 8 },
    'rep-3': { noNextStep: 90, singleThreaded: 38, noClosePlan: 60, staleGt14d: 30, championLeft: 0 },
    'rep-4': { noNextStep: 70, singleThreaded: 45, noClosePlan: 55, staleGt14d: 18, championLeft: 5 },
    'rep-5': { noNextStep: 80, singleThreaded: 40, noClosePlan: 62, staleGt14d: 22, championLeft: 3 },
  } as Record<string, Record<string, number>>,
  periodBData: {
    'rep-2': { noNextStep: 75, singleThreaded: 33, noClosePlan: 58, staleGt14d: 17, championLeft: 0 },
    'rep-1': { noNextStep: 67, singleThreaded: 25, noClosePlan: 50, staleGt14d: 15, championLeft: 5 },
    'rep-3': { noNextStep: 82, singleThreaded: 30, noClosePlan: 52, staleGt14d: 25, championLeft: 0 },
    'rep-4': { noNextStep: 63, singleThreaded: 38, noClosePlan: 48, staleGt14d: 14, championLeft: 3 },
    'rep-5': { noNextStep: 72, singleThreaded: 33, noClosePlan: 55, staleGt14d: 18, championLeft: 2 },
  } as Record<string, Record<string, number>>,
};
