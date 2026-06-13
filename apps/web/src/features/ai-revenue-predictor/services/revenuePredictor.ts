import type { RepDetail, RepForecast, TeamSummary, ActiveDeal } from '../types';
import {
  M06_API_BASE,
  getManagerM06Headers,
} from '@forecast/api';

const headers = () => getManagerM06Headers();

function mapQuarterToPeriodId(quarter: string): string {
  if (quarter === 'Q1 2026' || quarter === 'Q1 FY26') return '00000000-0000-0000-0000-0000000000b1';
  if (quarter === 'Q2 2026' || quarter === 'Q2 FY26') return '00000000-0000-0000-0000-0000000000b2';
  if (quarter === 'Q3 2026' || quarter === 'Q3 FY26') return '00000000-0000-0000-0000-0000000000b3'; // Fallback to Q4FY25 for demo
  if (quarter === 'Q4 2026' || quarter === 'Q4 FY26') return '00000000-0000-0000-0000-0000000000b4'; // Fallback to Q2FY25 for demo
  return quarter;
}

function mapBaselineToApi(baseline: string): string {
  if (baseline === 'Avg of last 2 periods' || baseline === 'avg_last_2') return 'avg_last_2';
  if (baseline === 'Last period (Q1 FY26)' || baseline === 'last_period') return 'last_period';
  if (baseline === 'Same period last year (Q2 FY25)' || baseline === 'same_period_last_year') return 'same_period_last_year';
  return 'current';
}

function mapActiveDeals(deals: any[]): ActiveDeal[] {
  return (deals ?? []).map((d: any) => ({
    id: String(d.id || d.deal || ''),
    name: String(d.deal || d.dealName || d.name || ''),
    stage: String(d.stage || ''),
    amount: Number(d.amount || 0),
    aiConfidence: (d.aiConf === 'Med' ? 'Medium' : d.aiConf || 'Medium') as any,
    expectedClose: String(d.close || ''),
    factor: Math.round((d.contributionFactor || d.stageRate || 0.4) * 100),
    contribution: Number(d.contribution || 0),
    lob: String(d.lob || 'Enterprise Software'),
  }));
}

export async function getTeamSummary(quarter: string, baseline: string, teamId: string): Promise<TeamSummary> {
  const periodId = mapQuarterToPeriodId(quarter);
  const apiBaseline = mapBaselineToApi(baseline);
  
  const res = await fetch(
    `${M06_API_BASE}/team/board?periodId=${encodeURIComponent(periodId)}&baseline=${encodeURIComponent(apiBaseline)}`,
    { headers: headers(), cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Failed to fetch team summary: ${res.status}`);
  const json = await res.json();
  return json.data || json;
}

export async function getRepForecasts(quarter: string, baseline: string, teamId: string): Promise<RepForecast[]> {
  const periodId = mapQuarterToPeriodId(quarter);
  const apiBaseline = mapBaselineToApi(baseline);

  const res = await fetch(
    `${M06_API_BASE}/team/board?periodId=${encodeURIComponent(periodId)}&baseline=${encodeURIComponent(apiBaseline)}`,
    { headers: headers(), cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Failed to fetch rep forecasts: ${res.status}`);
  const json = await res.json();
  const rawData = json.data || json;
  return rawData.reps || [];
}

export async function getRepDetail(repId: string, quarter: string, teamId: string): Promise<RepDetail> {
  const periodId = mapQuarterToPeriodId(quarter);
  const res = await fetch(
    `${M06_API_BASE}/team/reps/${encodeURIComponent(repId)}?periodId=${encodeURIComponent(periodId)}`,
    { headers: headers(), cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Failed to fetch rep detail: ${res.status}`);
  const json = await res.json();
  return json.data || json;
}

export async function getDedicatedMath(periodId: string = 'current'): Promise<unknown> {
  const res = await fetch(
    `${M06_API_BASE}/periods/${encodeURIComponent(periodId)}/math`,
    { headers: headers(), cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Failed to fetch math: ${res.status}`);
  return res.json();
}

