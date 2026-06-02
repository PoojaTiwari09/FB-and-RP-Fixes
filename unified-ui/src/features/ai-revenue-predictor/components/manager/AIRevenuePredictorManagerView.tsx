'use client';

import React, { useCallback, useEffect, useState } from 'react';
import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';
import MathDrawer from '@forecast/MathDrawer';
import PeriodToggle from '@forecast/PeriodToggle';
import {
  DEMO_TENANT_ID,
  fetchAtRiskDeals,
  fetchPeriods,
  fetchTeamBoard,
  getManagerM06Headers,
  resolveM06PeriodId,
  type ForecastPeriod,
} from '@forecast/api';

const BASELINES = [
  { label: 'Current baseline', value: '' },
  { label: 'Avg of last 2 periods', value: 'avg_last_2' },
  { label: 'Last period', value: 'last_period' },
  { label: 'Same period last year', value: 'same_period_last_year' },
];

function fL(v = 0) {
  return `${(v / 100000).toFixed(0)}L`;
}
function fCr(v = 0) {
  return `${(v / 10000000).toFixed(1)}Cr`;
}

const statusStyle: Record<string, string> = {
  submitted: 'bg-blue-50 text-blue-700',
  approved: 'bg-green-50 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  reopened: 'bg-orange-50 text-orange-700',
  resubmitted: 'bg-blue-50 text-blue-700',
  no_submission: 'bg-gray-100 text-gray-500',
};

const riskStyle: Record<string, string> = {
  'On Track': 'text-green-600',
  'At Risk': 'text-amber-600',
  Critical: 'text-red-600',
};

function BreakdownBar({ breakdown }: { breakdown?: { closedWon?: number; weightedPipeline?: number; expectedDeals?: number } }) {
  if (!breakdown) return null;
  const closed = breakdown.closedWon ?? 0;
  const pipeline = breakdown.weightedPipeline ?? 0;
  const expected = breakdown.expectedDeals ?? 0;
  const total = closed + pipeline + expected || 1;
  return (
    <div className="mt-4">
      <div className="w-full h-3 flex rounded-full overflow-hidden gap-0.5">
        <div className="bg-blue-600" style={{ width: `${(closed / total) * 100}%` }} />
        <div className="bg-blue-400" style={{ width: `${(pipeline / total) * 100}%` }} />
        <div className="bg-blue-200" style={{ width: `${(expected / total) * 100}%` }} />
      </div>
      <div className="flex gap-6 text-sm flex-wrap mt-3 text-gray-600">
        <span><b className="text-blue-700">Closed-won</b> ₹{fCr(closed)}</span>
        <span><b className="text-blue-700">Weighted pipeline</b> ₹{fCr(pipeline)}</span>
        <span><b className="text-blue-700">Expected deals</b> ₹{fCr(expected)}</span>
      </div>
    </div>
  );
}

export default function AIRevenuePredictorManagerView() {
  const [board, setBoard] = useState<Record<string, unknown> | null>(null);
  const [atRiskDeals, setAtRiskDeals] = useState<Record<string, unknown>[]>([]);
  const [periods, setPeriods] = useState<ForecastPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mathOpen, setMathOpen] = useState(false);
  const [baseline, setBaseline] = useState(BASELINES[0].value);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  const loadBoard = useCallback(
    async (selectedBaseline?: string, periodId: string = selectedPeriod) => {
      setError(null);
      const headers = getManagerM06Headers();
      const periodList = await fetchPeriods(DEMO_TENANT_ID, headers).catch(() => [] as ForecastPeriod[]);
      const resolvedPeriodId =
        periodList.length > 0 ? resolveM06PeriodId(periodId, periodList) : periodId || 'current';

      const [teamBoard, atRisk] = await Promise.all([
        fetchTeamBoard(resolvedPeriodId, selectedBaseline || undefined, headers),
        fetchAtRiskDeals(headers).catch(() => []),
      ]);

      if (periodList.length > 0) {
        setPeriods(periodList);
      } else if (teamBoard && typeof teamBoard === 'object' && 'period' in teamBoard) {
        const p = (teamBoard as {
          period: {
            id: string;
            name?: string;
            startDate?: string;
            endDate?: string;
            revenueTarget?: number;
            isLocked?: boolean;
          };
        }).period;
        if (p?.id) {
          setPeriods([
            {
              periodId: p.id,
              tenantId: DEMO_TENANT_ID,
              name: p.name ?? p.id,
              startDate: p.startDate?.slice(0, 10) ?? '',
              endDate: p.endDate?.slice(0, 10) ?? '',
              revenueTarget: p.revenueTarget ?? 0,
              isLocked: Boolean(p.isLocked),
            },
          ]);
        }
      }
      setBoard(teamBoard as Record<string, unknown>);
      setAtRiskDeals(Array.isArray(atRisk) ? atRisk : []);
    },
    [selectedPeriod],
  );

  useEffect(() => {
    setLoading(true);
    loadBoard(baseline, selectedPeriod)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load team board'))
      .finally(() => setLoading(false));
  }, [baseline, selectedPeriod, loadBoard]);

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 mt-3">Loading AI revenue predictor...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="flex flex-col flex-1">
        <PageHeader
          title="AI Revenue Predictor"
          subtitle="ML-powered forecast — predict team attainment and surface pipeline gaps early."
          badge={<RoleBadge role="sales_manager" />}
        />
        <div className="flex-1 p-6">
          <div className="bg-white border border-red-200 rounded-xl p-6 max-w-lg">
            <p className="text-sm font-semibold text-gray-900">Unable to load team forecast</p>
            <p className="text-xs text-gray-500 mt-2">{error ?? 'No data returned from API.'}</p>
            <button
              type="button"
              onClick={() => {
                setLoading(true);
                loadBoard(baseline, selectedPeriod)
                  .catch((e) => setError(e instanceof Error ? e.message : 'Failed'))
                  .finally(() => setLoading(false));
              }}
              className="mt-4 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const team = (board.team as Record<string, unknown>[]) ?? [];
  const periodName = (board.period as { name?: string } | undefined)?.name ?? 'Current period';
  const math = (board.aiSnapshot as { explainability?: unknown } | undefined)?.explainability;
  const teamCommitTotal = team.reduce((sum, rep) => sum + Number(rep.commit ?? 0), 0);
  const teamAiProjection = Number(board.teamAiProjection ?? 0);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader
        title="AI Revenue Predictor"
        subtitle="ML-powered forecast — predict team attainment and surface pipeline gaps early."
        badge={<RoleBadge role="sales_manager" />}
        actions={
          <PeriodToggle selectedPeriod={selectedPeriod} onChange={setSelectedPeriod} periods={periods} />
        }
      />

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Team AI Projection</span>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹{fCr(teamAiProjection)}</p>
            <p className="text-xs text-gray-400 mt-1">{periodName}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Team Commit</span>
            <p className="text-2xl font-bold text-gray-900 mt-1">₹{fCr(teamCommitTotal)}</p>
            <p className="text-xs text-gray-400 mt-1">{team.length} reps</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">At-risk deals</span>
            <p className="text-2xl font-bold text-gray-900 mt-1">{atRiskDeals.length}</p>
            <p className="text-xs text-gray-400 mt-1">Needs manager attention</p>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">AI prediction breakdown</p>
              {board.baselineNote && (
                <p className="text-xs text-gray-500 mt-1">{String(board.baselineNote)}</p>
              )}
            </div>
            <div className="flex gap-2 flex-wrap">
              {BASELINES.map((b) => (
                <button
                  key={b.value || 'current'}
                  type="button"
                  onClick={() => setBaseline(b.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border ${
                    baseline === b.value
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-600 border-gray-200'
                  }`}
                >
                  {b.label}
                </button>
              ))}
              {math && (
                <button
                  type="button"
                  onClick={() => setMathOpen(true)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600"
                >
                  See the math
                </button>
              )}
            </div>
          </div>
          <BreakdownBar breakdown={board.breakdown as { closedWon?: number; weightedPipeline?: number; expectedDeals?: number }} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <p className="text-sm font-semibold text-gray-800">Team forecast board</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-left text-xs text-gray-500 uppercase">
                <tr>
                  <th className="px-5 py-3">Rep</th>
                  <th className="px-5 py-3">Quota</th>
                  <th className="px-5 py-3">AI Projection</th>
                  <th className="px-5 py-3">Commit</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Risk</th>
                </tr>
              </thead>
              <tbody>
                {team.map((rep) => (
                  <tr key={String(rep.userId ?? rep.repId)} className="border-t border-gray-100">
                    <td className="px-5 py-3 font-medium text-gray-900">{String(rep.name)}</td>
                    <td className="px-5 py-3">₹{fL(Number(rep.quota ?? 0))}</td>
                    <td className="px-5 py-3 text-blue-700 font-semibold">₹{fL(Number(rep.aiProjection ?? 0))}</td>
                    <td className="px-5 py-3">₹{fL(Number(rep.commit ?? 0))}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs ${statusStyle[String(rep.status)] ?? statusStyle.no_submission}`}>
                        {String(rep.status).replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`px-5 py-3 font-medium ${riskStyle[String(rep.riskLevel)] ?? 'text-gray-600'}`}>
                      {String(rep.riskLevel ?? '—')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {atRiskDeals.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-gray-800 mb-4">At-risk deals</p>
            <div className="space-y-3">
              {atRiskDeals.slice(0, 8).map((deal) => (
                <div key={String(deal.id)} className="flex justify-between gap-4 text-sm border-b border-gray-50 pb-3 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">{String(deal.dealName)}</p>
                    <p className="text-xs text-gray-500">{String(deal.repName ?? 'Unassigned')} · {String(deal.stage)}</p>
                    <p className="text-xs text-red-600 mt-1">{String(deal.riskReason)}</p>
                  </div>
                  <div className="text-right whitespace-nowrap">
                    <p className="font-semibold">₹{fL(Number(deal.amount ?? 0))}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {math && (
        <MathDrawer
          isOpen={mathOpen}
          onClose={() => setMathOpen(false)}
          data={{ math, period: board.period }}
        />
      )}
    </div>
  );
}
