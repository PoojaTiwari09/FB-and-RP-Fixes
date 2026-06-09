import type { RepDetail, RepForecast, TeamSummary, ActiveDeal } from '../types';
import {
  M06_API_BASE,
  getManagerM06Headers,
} from '@forecast/api';

const headers = () => getManagerM06Headers();

function mapQuarterToPeriodId(quarter: string): string {
  if (quarter === 'Q1 2026' || quarter === 'Q1 FY26') return 'q1-fy26-demo';
  if (quarter === 'Q2 2026' || quarter === 'Q2 FY26') return 'q2-fy26-demo';
  if (quarter === 'Q3 2026' || quarter === 'Q3 FY26') return 'q3-fy26-demo';
  if (quarter === 'Q4 2026' || quarter === 'Q4 FY26') return 'q4-fy26-demo';
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
  const raw = await res.json();
  
  const closingDate = raw.period?.endDate
    ? new Date(raw.period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Jul 1, 2026';

  const deals = mapActiveDeals(raw.aiSnapshot?.explainability?.deals);

  return {
    teamName: raw.period?.name || 'West Team',
    quarter: raw.period?.name || quarter,
    aiProjection: raw.teamAiProjection ?? 0,
    lastUpdated: raw.aiSnapshot?.computedAt 
      ? 'Updated today ' + new Date(raw.aiSnapshot.computedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      : 'Updated today 05:00 PM',
    manualForecast: raw.team?.reduce((sum: number, r: any) => sum + (r.commit ?? 0), 0) ?? 0,
    rangeMin: raw.aiSnapshot?.confidenceRangeLow ?? Math.round((raw.teamAiProjection ?? 0) * 0.9),
    rangeMax: raw.aiSnapshot?.confidenceRangeHigh ?? Math.round((raw.teamAiProjection ?? 0) * 1.1),
    closesOn: closingDate,
    closedWon: raw.breakdown?.closedWon ?? 0,
    weightedPipeline: raw.breakdown?.weightedPipeline ?? 0,
    expectedDeals: raw.breakdown?.expectedDeals ?? 0,
    activeDeals: deals,
    mathData: {
      closedWon: {
        total: raw.breakdown?.closedWon ?? 0,
        deals: (raw.aiSnapshot?.explainability?.closedWonDetails?.deals ?? []).map((d: any) => ({
          name: d.name || d.deal || '',
          amount: d.amount || 0,
        })),
      },
      weightedPipeline: {
        total: raw.breakdown?.weightedPipeline ?? 0,
        stages: (raw.aiSnapshot?.explainability?.pipelineByStage ?? []).map((s: any) => ({
          name: s.stage || '',
          pipeline: s.pipeline || 0,
          conv: Math.round((s.convRate || 0.4) * 100),
          contribution: s.contribution || 0,
        })),
      },
      expectedDeals: {
        total: raw.breakdown?.expectedDeals ?? 0,
        historicalRate: Math.round((raw.aiSnapshot?.explainability?.expectedDeals?.rate || 0.124) * 100),
        addressablePipeline: raw.aiSnapshot?.explainability?.expectedDeals?.addressablePipeline || 0,
      },
      formula: 'Closed Won + Weighted Pipeline + Expected Deals',
    },
  };
}

export async function getRepForecasts(quarter: string, baseline: string, teamId: string): Promise<RepForecast[]> {
  const periodId = mapQuarterToPeriodId(quarter);
  const apiBaseline = mapBaselineToApi(baseline);

  const res = await fetch(
    `${M06_API_BASE}/team/board?periodId=${encodeURIComponent(periodId)}&baseline=${encodeURIComponent(apiBaseline)}`,
    { headers: headers(), cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Failed to fetch rep forecasts: ${res.status}`);
  const raw = await res.json();
  const reps = raw.team ?? [];

  return reps.map((item: any) => {
    let confidence: 'High' | 'Medium' | 'Low' = 'Medium';
    if (item.riskLevel === 'On Track') confidence = 'High';
    else if (item.riskLevel === 'At Risk') confidence = 'Medium';
    else if (item.riskLevel === 'Critical') confidence = 'Low';

    return {
      id: String(item.repId || item.userId || ''),
      repName: String(item.name || ''),
      repInitials: String(item.initials || ''),
      avatarColor: item.repId === 'rep-01' ? '#3B82F6' : item.repId === 'rep-02' ? '#8B5CF6' : item.repId === 'rep-03' ? '#10B981' : item.repId === 'rep-04' ? '#F59E0B' : '#EF4444',
      aiPrediction: Number(item.aiProjection || 0),
      managerOverride: item.submission?.managerOverride ? Number(item.submission.managerOverride) : null,
      finalForecast: Number(item.commit || item.aiProjection || 0),
      confidenceLevel: confidence,
      lastUpdated: item.submission?.submittedAt
        ? 'Updated ' + new Date(item.submission.submittedAt).toLocaleDateString()
        : item.status === 'submitted' || item.status === 'approved' ? '1 day ago' : 'no submission',
    };
  });
}

export async function getRepDetail(repId: string, quarter: string, teamId: string): Promise<RepDetail> {
  const periodId = mapQuarterToPeriodId(quarter);
  const res = await fetch(
    `${M06_API_BASE}/team/reps/${encodeURIComponent(repId)}?periodId=${encodeURIComponent(periodId)}`,
    { headers: headers(), cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Failed to fetch rep detail: ${res.status}`);
  const raw = await res.json();

  const prediction = raw.aiComparison?.aiProjection ?? 0;
  const closedWon = raw.pipelineOverview?.closedWonDetails?.total ?? 0;
  const activeDeals = mapActiveDeals(raw.pipelineOverview?.deals);
  const weightedPipeline = activeDeals.reduce((sum, d) => sum + d.contribution, 0);
  const expectedDeals = raw.pipelineOverview?.expectedDeals?.contribution ?? 0;

  const closesOnDate = raw.period?.endDate
    ? new Date(raw.period.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : 'Jul 1, 2026';

  return {
    repId: String(raw.submission?.repUserId || repId),
    repName: String(raw.submission?.repName || 'Rep'),
    repInitials: String(raw.submission?.repName || 'Rep').split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2),
    avatarColor: repId === 'rep-01' ? '#3B82F6' : repId === 'rep-02' ? '#8B5CF6' : repId === 'rep-03' ? '#10B981' : repId === 'rep-04' ? '#F59E0B' : '#EF4444',
    quarter: raw.period?.name || quarter,
    aiProjection: prediction,
    lastUpdated: 'Updated today ' + new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    rangeMin: Math.round(prediction * 0.9),
    rangeMax: Math.round(prediction * 1.1),
    closesOn: closesOnDate,
    closedWon,
    weightedPipeline,
    expectedDeals,
    activeDeals,
    mathData: {
      closedWon: {
        total: closedWon,
        deals: (raw.pipelineOverview?.closedWonDetails?.deals ?? []).map((d: any) => ({
          name: d.deal || d.name || '',
          amount: d.amount || 0,
        })),
      },
      weightedPipeline: {
        total: weightedPipeline,
        stages: (raw.pipelineOverview?.pipelineByStage ?? []).map((s: any) => ({
          name: s.stage || '',
          pipeline: s.pipeline || 0,
          conv: Math.round((s.convRate || 0.4) * 100),
          contribution: s.contribution || 0,
        })),
      },
      expectedDeals: {
        total: expectedDeals,
        historicalRate: Math.round((raw.pipelineOverview?.expectedDeals?.rate || 0.124) * 100),
        addressablePipeline: raw.pipelineOverview?.expectedDeals?.addressablePipeline || 0,
      },
      formula: 'Closed Won + Weighted Pipeline + Expected Deals',
    },
  };
}

export async function getDedicatedMath(periodId: string = 'current'): Promise<unknown> {
  const res = await fetch(
    `${M06_API_BASE}/periods/${encodeURIComponent(periodId)}/math`,
    { headers: headers(), cache: 'no-store' },
  );
  if (!res.ok) throw new Error(`Failed to fetch math: ${res.status}`);
  return res.json();
}

