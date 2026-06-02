// ============================================================
// Mock Coaching Service — Fallback only (API failure)
// Data mirrors exact API response shapes from coaching.types.ts
// Replace data values in future sprint when real datasets arrive.
// ============================================================

import type {
  CoachingFilters,
  ActivityResponse,
  InteractionResponse,
  ResponsivenessResponse,
  ScorecardsResponse,
  AiInsightsResponse,
  TeamVsBenchmarkResponse,
} from '../../types/coaching.types';

export const mockCoachingFilters = (): CoachingFilters => ({
  periods: ['Last 7 days', 'Last 30 days', 'Last quarter', 'This quarter'],
  teams: [
    { id: 'team-west', name: 'West Team' },
    { id: 'team-east', name: 'East Team' },
  ],
});

import type { CoachingParams } from '../../types/coaching.types';

const ALL_ACTIVITY: ActivityResponse = [
  { repId: 'rep-001', repName: 'Marco Rivera',   initials: 'MR', avatarColor: '#6c5ce7', callsCount: 42, emailsCount: 87, meetingsCount: 12, totalActivities: 141 },
  { repId: 'rep-002', repName: 'Sarah Chen',     initials: 'SC', avatarColor: '#00b894', callsCount: 35, emailsCount: 62, meetingsCount:  9, totalActivities: 106 },
  { repId: 'rep-003', repName: 'Jordan Kim',     initials: 'JK', avatarColor: '#fd79a8', callsCount: 28, emailsCount: 55, meetingsCount:  7, totalActivities:  90 },
  { repId: 'rep-004', repName: 'Alex Rivera',    initials: 'AR', avatarColor: '#fdcb6e', callsCount: 51, emailsCount: 73, meetingsCount: 14, totalActivities: 138 },
  { repId: 'rep-005', repName: 'Taylor Morgan',  initials: 'TM', avatarColor: '#74b9ff', callsCount: 22, emailsCount: 41, meetingsCount:  5, totalActivities:  68 },
];

export const mockCoachingActivity = (params?: CoachingParams): ActivityResponse => {
  let list = [...ALL_ACTIVITY];
  // Simulate filtering by team on the frontend
  if (params?.teamId === 'team-west') {
    list = list.slice(0, 3);
  } else if (params?.teamId === 'team-east') {
    list = list.slice(3);
  }
  return list;
};

export const mockCoachingInteraction = (): InteractionResponse => ({
  reps: [
    { repId: 'rep-001', repName: 'Marco Rivera',  initials: 'MR', avatarColor: '#6c5ce7', talkRatio: 68, talkRatioStatus: 'critical',  questionRate: 11, questionRateStatus: 'critical',  interactivity: 4, monologue: '4:12', monologueStatus: 'critical'  },
    { repId: 'rep-002', repName: 'Sarah Chen',    initials: 'SC', avatarColor: '#00b894', talkRatio: 41, talkRatioStatus: 'optimal',   questionRate: 21, questionRateStatus: 'optimal',   interactivity: 8, monologue: '1:45', monologueStatus: 'optimal'   },
    { repId: 'rep-003', repName: 'Jordan Kim',    initials: 'JK', avatarColor: '#fd79a8', talkRatio: 55, talkRatioStatus: 'warning',   questionRate: 16, questionRateStatus: 'warning',   interactivity: 6, monologue: '2:30', monologueStatus: 'warning'   },
    { repId: 'rep-004', repName: 'Alex Rivera',   initials: 'AR', avatarColor: '#fdcb6e', talkRatio: 38, talkRatioStatus: 'optimal',   questionRate: 24, questionRateStatus: 'optimal',   interactivity: 9, monologue: '1:20', monologueStatus: 'optimal'   },
    { repId: 'rep-005', repName: 'Taylor Morgan', initials: 'TM', avatarColor: '#74b9ff', talkRatio: 49, talkRatioStatus: 'warning',   questionRate: 14, questionRateStatus: 'warning',   interactivity: 5, monologue: '3:05', monologueStatus: 'warning'   },
  ],
  benchmarks: {
    talkRatioOptimal: '<43%',
    questionRateOptimal: '18+/hr',
    monologueOptimal: '<2 min',
  },
});

export const mockCoachingResponsiveness = (): ResponsivenessResponse => [
  { repId: 'rep-001', repName: 'Marco Rivera',  avgResponseTime: '4.2 hrs', followUpRate: 62, replyRate: 71 },
  { repId: 'rep-002', repName: 'Sarah Chen',    avgResponseTime: '1.1 hrs', followUpRate: 91, replyRate: 88 },
  { repId: 'rep-003', repName: 'Jordan Kim',    avgResponseTime: '2.8 hrs', followUpRate: 74, replyRate: 79 },
  { repId: 'rep-004', repName: 'Alex Rivera',   avgResponseTime: '0.9 hrs', followUpRate: 95, replyRate: 93 },
  { repId: 'rep-005', repName: 'Taylor Morgan', avgResponseTime: '5.7 hrs', followUpRate: 55, replyRate: 60 },
];

export const mockCoachingScorecards = (): ScorecardsResponse => [
  { repId: 'rep-001', repName: 'Marco Rivera',  overallScore: 58, categories: [{ name: 'Discovery', score: 45 }, { name: 'Closing', score: 61 }, { name: 'Objection Handling', score: 52 }] },
  { repId: 'rep-002', repName: 'Sarah Chen',    overallScore: 89, categories: [{ name: 'Discovery', score: 92 }, { name: 'Closing', score: 88 }, { name: 'Objection Handling', score: 91 }] },
  { repId: 'rep-003', repName: 'Jordan Kim',    overallScore: 74, categories: [{ name: 'Discovery', score: 78 }, { name: 'Closing', score: 70 }, { name: 'Objection Handling', score: 75 }] },
  { repId: 'rep-004', repName: 'Alex Rivera',   overallScore: 93, categories: [{ name: 'Discovery', score: 95 }, { name: 'Closing', score: 94 }, { name: 'Objection Handling', score: 90 }] },
  { repId: 'rep-005', repName: 'Taylor Morgan', overallScore: 62, categories: [{ name: 'Discovery', score: 58 }, { name: 'Closing', score: 65 }, { name: 'Objection Handling', score: 60 }] },
];

export const mockAiInsights = (): AiInsightsResponse => [
  {
    repName: 'Marco Rivera',
    avatarColor: '#6c5ce7',
    insight: 'Marco Rivera dominates conversations with a 68% talk ratio, well above the 43% optimal threshold.',
    recommendation: 'Coach Marco on active listening techniques. Practice question-based discovery in next 1:1.',
  },
  {
    repName: 'Taylor Morgan',
    avatarColor: '#74b9ff',
    insight: "Taylor Morgan's average response time of 5.7 hours is impacting prospect engagement scores.",
    recommendation: 'Set response time SLA targets. Review email templates to enable faster follow-up.',
  },
  {
    repName: 'Sarah Chen',
    avatarColor: '#00b894',
    insight: 'Sarah Chen maintains an optimal talk ratio of 41% with the highest question rate on the team (21/hr).',
    recommendation: 'Feature Sarah as a peer coach for discovery call techniques. Consider shadowing program.',
  },
];

export const mockTeamVsBenchmark = (): TeamVsBenchmarkResponse => [
  { metric: 'talkRatio',    teamAvg: 50,  benchmarkValue: 43,  delta: -7  },
  { metric: 'questionRate', teamAvg: 17,  benchmarkValue: 18,  delta: -1  },
  { metric: 'monologue',    teamAvg: 2.6, benchmarkValue: 2.0, delta: -0.6 },
];
