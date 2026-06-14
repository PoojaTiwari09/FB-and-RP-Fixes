import type { ConversationRecord } from '../interfaces/search.interface';

export function scoreLabel(score: number): string {
  if (score >= 90) return 'Excellent';
  if (score >= 80) return 'Good';
  if (score >= 70) return 'Average';
  return 'Needs Improvement';
}

export function mapSearchResultRow(c: ConversationRecord) {
  const score = Math.round(c.overallScore ?? 75);
  return {
    id: c.id,
    title: c.title,
    rep: { id: 'rep_01', name: c.agentName || 'Unknown' },
    date: c.date?.slice(0, 10) || new Date().toISOString().slice(0, 10),
    durationMinutes: parseDurationMinutes(c.duration),
    score,
    scoreLabel: scoreLabel(score),
    deal: c.customerName || '—',
    type: 'call' as const,
    status: c.channel === 'call' ? 'Zoom' : 'Email',
  };
}

function parseDurationMinutes(duration: string | undefined): number {
  if (!duration) return 0;
  const m = /(\d+)\s*m/.exec(duration);
  if (m) return parseInt(m[1], 10);
  return 0;
}

export function buildChartData(granularity: string, count: number) {
  let labels: string[] = [];
  if (granularity === 'days') {
    labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  } else if (granularity === 'weeks') {
    labels = ['W1', 'W2', 'W3', 'W4'];
  } else if (granularity === 'months') {
    labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  } else if (granularity === 'quarters') {
    labels = ['Q1', 'Q2', 'Q3', 'Q4'];
  } else {
    labels = ['W1', 'W2', 'W3', 'W4'];
  }
  return labels.map((label, i) => ({
    label,
    count: Math.max(0, Math.floor(count / labels.length) + (i % 3) * 10),
  }));
}

