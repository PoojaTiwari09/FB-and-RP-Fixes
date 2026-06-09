import type { CoachingRepFullData } from '../../types/coaching-rep.types';

export const getMockRepDetails = (repId: string): CoachingRepFullData => {
  // If Marco Rivera, return exact data from screenshot.
  // Otherwise, return generic data.
  
  const isMarco = repId === 'rep-001';

  return {
    header: {
      repId,
      name: isMarco ? 'Marco Rivera' : 'Sarah Chen',
      initials: isMarco ? 'MR' : 'SC',
      avatarColor: isMarco ? '#f6c23e' : '#1cc88a', // Using yellow/orange for Marco as in screenshot "NR" (Wait, screenshot says NR but name is Marco Rivera... let's use yellow)
      title: 'Interaction Coaching',
      callsAnalyzed: 42,
    },
    kpis: {
      talkRatio: {
        value: isMarco ? '68%' : '41%',
        optimalText: 'Optimal <43%',
        status: isMarco ? 'critical' : 'optimal',
      },
      questionRate: {
        value: isMarco ? '9/hr' : '21/hr',
        optimalText: 'Optimal 18+/hr',
        status: isMarco ? 'critical' : 'optimal',
      },
      monologue: {
        value: isMarco ? '3m 45s' : '1m 45s',
        optimalText: 'Optimal <2 min',
        status: isMarco ? 'critical' : 'optimal',
      },
    },
    trend: {
      title: 'Talk ratio — 8 week trend',
      benchmark: 43,
      insightText: 'Coaching conversation on talk ratio — Week 3. Trend improving since W4.',
      weeks: [
        { label: 'W1', value: 72, status: 'critical' },
        { label: 'W2', value: 70, status: 'critical' },
        { label: 'W3', value: 74, status: 'critical' },
        { label: 'W4', value: 71, status: 'critical' },
        { label: 'W5', value: 68, status: 'warning' },
        { label: 'W6', value: 65, status: 'warning' },
        { label: 'W7', value: 62, status: 'warning' },
        { label: 'W8', value: 57, status: 'optimal' }, // Based on screenshot colors: red -> amber -> green
      ],
    },
    recentCalls: [
      {
        id: 'call-1',
        title: 'Discovery — Meridian Logistics',
        dateRange: 'May 2 · 18 min',
        talkRatio: 74,
        talkRatioStatus: 'critical',
        questionRate: '6/hr',
        duration: '18 min',
      },
      {
        id: 'call-2',
        title: 'Demo — Apex Solutions',
        dateRange: 'Apr 20 · 34 min',
        talkRatio: 56,
        talkRatioStatus: 'warning',
        questionRate: '11/hr',
        duration: '34 min',
      },
      {
        id: 'call-3',
        title: 'Discovery — Kova Group',
        dateRange: 'Apr 20 · 22 min',
        talkRatio: 65,
        talkRatioStatus: 'warning',
        questionRate: '8/hr',
        duration: '22 min',
      },
    ],
    observedPatterns: [
      { id: 'pat-1', text: 'Rep interrupts prospects frequently during discovery calls', type: 'warning' },
      { id: 'pat-2', text: 'Question pacing improves in shorter calls', type: 'warning' },
      { id: 'pat-3', text: 'Long monologues happen mostly during pricing discussions', type: 'warning' },
    ],
    recommendedActions: [
      { id: 'rec-1', text: 'Pause after every 2-3 sentences', type: 'success' },
      { id: 'rec-2', text: 'Increase discovery questioning cadence', type: 'success' },
      { id: 'rec-3', text: 'Use recap prompts before pricing discussions', type: 'success' },
    ],
    coachingHistory: [
      { id: 'hist-1', dateStr: 'Apr 14', notes: 'Discussed discovery pacing', managerInitials: 'SM' },
      { id: 'hist-2', dateStr: 'Apr 25', notes: 'Reviewed long monologue patterns', managerInitials: 'SM' },
    ],
  };
};
