'use client';

import React, { useCallback, useEffect, useState } from 'react';
import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';
import { BACKEND_REP_USER_ID } from '@shared/lib/backend-api.shared';
import ForecastBoard from '../ForecastBoard';
import ForecastDashboard from '../../ForecastDashboard';
import ForecastEntry from '../../ForecastEntry';
import AuditLog from '../../AuditLog';
import MathDrawer from '../../MathDrawer';
import HubSpotConnect from '../../HubSpotConnect';
import PeriodToggle from '../../PeriodToggle';
import SubmissionHistory from '../../SubmissionHistory';
import {
  DEMO_TENANT_ID,
  M06_API_BASE,
  fetchForecastBoard,
  fetchPeriods,
  fetchRepPeriodBoard,
  submitForecast,
  getRepM06Headers,
  type ForecastBoardPayload,
  type ForecastPeriod,
} from '../../api';

const REP_USER_ID = BACKEND_REP_USER_ID;

export default function RepForecastView() {
  const [boardData, setBoardData] = useState<Record<string, unknown> | null>(null);
  const [tddBoard, setTddBoard] = useState<ForecastBoardPayload | null>(null);
  const [periods, setPeriods] = useState<ForecastPeriod[]>([]);
  const [submission, setSubmission] = useState<Record<string, unknown> | null>(null);
  const [logs, setLogs] = useState<Record<string, unknown>[]>([]);
  const [versions, setVersions] = useState<Record<string, unknown>[]>([]);
  const [isMathOpen, setIsMathOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  const resolvePeriodId = useCallback(
    (periodId: string, periodList: ForecastPeriod[]) => {
      if (periodId !== 'current') return periodId;
      return periodList.find((p) => !p.isLocked)?.periodId ?? periodList[0]?.periodId ?? '';
    },
    [],
  );

  const loadData = useCallback(
    async (periodId: string = selectedPeriod) => {
      setLoading(true);
      setError(null);
      try {
        const periodList = await fetchPeriods(DEMO_TENANT_ID, getRepM06Headers()).catch(
          () => [] as ForecastPeriod[],
        );
        setPeriods(periodList);
        let resolvedPeriodId = resolvePeriodId(periodId, periodList);
        if (!resolvedPeriodId) {
          resolvedPeriodId = periodId || 'current';
        }

        const legacy = await fetchRepPeriodBoard(resolvedPeriodId, REP_USER_ID);
        const actualPeriodId =
          (legacy as { period?: { id?: string } })?.period?.id ??
          (resolvedPeriodId !== 'current' ? resolvedPeriodId : '');
        if (!actualPeriodId) {
          throw new Error(
            'No forecast periods in database. From monorepo root run: .\\seed-m06.ps1',
          );
        }

        if (!periodList.length) {
          const p = (legacy as { period?: ForecastPeriod & { id?: string } }).period;
          if (p?.id) {
            setPeriods([
              {
                periodId: p.id,
                tenantId: DEMO_TENANT_ID,
                name: p.name ?? p.id,
                startDate: String(p.startDate ?? '').slice(0, 10),
                endDate: String(p.endDate ?? '').slice(0, 10),
                revenueTarget: p.revenueTarget ?? 0,
                isLocked: Boolean(p.isLocked),
              },
            ]);
          }
        }

        const tdd = await fetchForecastBoard(DEMO_TENANT_ID, actualPeriodId, REP_USER_ID);

        setTddBoard(tdd);
        setBoardData(legacy);

        const userSub =
          (legacy.submissions as Array<{ repUserId?: string; id?: string }> | undefined)?.find(
            (s) => s.repUserId === REP_USER_ID || s.repUserId === 'rep-01',
          ) ?? null;
        setSubmission(userSub as Record<string, unknown> | null);

        if (userSub?.id) {
          const auditRes = await fetch(`${M06_API_BASE}/submissions/${userSub.id}/audit-log`, {
            headers: getRepM06Headers(),
            cache: 'no-store',
          });
          if (auditRes.ok) {
            const resJson = await auditRes.json();
            setLogs((resJson.auditLogs || resJson) as Record<string, unknown>[]);
            setVersions((resJson.versions || []) as Record<string, unknown>[]);
          }
        } else {
          setLogs([]);
          setVersions([]);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load forecast data');
        setBoardData(null);
        setTddBoard(null);
      } finally {
        setLoading(false);
      }
    },
    [resolvePeriodId, selectedPeriod],
  );

  useEffect(() => {
    loadData(selectedPeriod);
  }, [selectedPeriod, loadData]);

  const handleSubmit = async (newData: Record<string, unknown>) => {
    const headers = { ...getRepM06Headers(), 'Content-Type': 'application/json' };
    const repUserId = REP_USER_ID;
    if (newData.status === 'submitted' && submission?.id) {
      const res = await fetch(`${M06_API_BASE}/submissions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...newData, repUserId }),
      });
      const saved = res.ok ? await res.json() : submission;
      await fetch(`${M06_API_BASE}/submissions/${saved.id}/submit`, { method: 'POST', headers });
    } else {
      const res = await fetch(`${M06_API_BASE}/submissions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ...newData, repUserId }),
      });
      if (newData.status === 'submitted' && res.ok) {
        const saved = await res.json();
        await fetch(`${M06_API_BASE}/submissions/${saved.id}/submit`, { method: 'POST', headers });
      }
    }
    await loadData(selectedPeriod);
  };

  const handleCreateDeal = async (deal: Record<string, unknown>) => {
    const headers = { ...getRepM06Headers(), 'Content-Type': 'application/json' };
    const res = await fetch(`${M06_API_BASE}/deals`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        dealName: deal.deal,
        stage: deal.stage,
        amount: deal.amount,
        closeDate: deal.closeDate,
        probability: deal.probability,
        region: deal.region,
        lob: deal.lob,
        repUserId: REP_USER_ID,
      }),
    });
    if (!res.ok) throw new Error('Unable to save deal');
    await loadData(selectedPeriod);
  };

  const handleBaselineChange = async (baseline: string) => {
    const resolved = resolvePeriodId(selectedPeriod, periods);
    const params = new URLSearchParams({ repUserId: REP_USER_ID });
    if (baseline) params.set('baseline', baseline);
    const res = await fetch(`${M06_API_BASE}/periods/${resolved}/ai-prediction?${params}`, {
      headers: getRepM06Headers(),
      cache: 'no-store',
    });
    if (res.ok) {
      const aiData = await res.json();
      setBoardData((prev) => ({ ...(prev ?? {}), aiPrediction: aiData.aiPrediction }));
    }
  };

  const handleTddSubmit = async (
    amount: number,
    dealIds: string[],
    bestCaseAmount?: number,
    notes?: string,
  ) => {
    const periodId = resolvePeriodId(selectedPeriod, periods);
    await submitForecast(DEMO_TENANT_ID, periodId, REP_USER_ID, {
      submittedAmount: amount,
      bestCaseAmount,
      notes,
      committedDealIds: dealIds,
    });
    await loadData(selectedPeriod);
  };

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500 mt-3">Loading forecast boards...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col flex-1">
        <PageHeader
          title="Forecast Boards"
          subtitle="Your personal pipeline forecast — track deals by stage and close probability."
          badge={<RoleBadge role="sales_rep" />}
        />
        <div className="flex-1 p-6">
          <div className="bg-white border border-red-200 rounded-xl p-6 max-w-lg">
            <p className="text-sm font-semibold text-gray-900">Unable to load forecast data</p>
            <p className="text-xs text-gray-500 mt-2">{error}</p>
            <button
              type="button"
              onClick={() => loadData(selectedPeriod)}
              className="mt-4 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const math = (boardData?.aiPrediction as { explainability?: unknown } | undefined)?.explainability;
  const isPeriodLocked =
    tddBoard?.isLocked ??
    Boolean(
      (boardData?.period as { isLocked?: boolean; status?: string; endDate?: string } | undefined)
        ?.isLocked ||
        (boardData?.period as { status?: string } | undefined)?.status === 'locked' ||
        (boardData?.period as { status?: string } | undefined)?.status === 'closed',
    );
  const hasActiveDeals = Boolean(
    (math as { deals?: unknown[] } | undefined)?.deals?.length,
  );

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <PageHeader
        title="Forecast Boards"
        subtitle="Your personal pipeline forecast — track deals by stage and close probability."
        badge={<RoleBadge role="sales_rep" />}
        actions={
          <PeriodToggle selectedPeriod={selectedPeriod} onChange={setSelectedPeriod} periods={periods} />
        }
      />

      <div className="flex-1 overflow-y-auto p-6 flex gap-6">
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          <HubSpotConnect onDealsImported={() => loadData(selectedPeriod)} />
          {tddBoard && (
            <ForecastBoard board={tddBoard} userId={REP_USER_ID} onSubmit={handleTddSubmit} />
          )}
          <ForecastDashboard
            data={boardData}
            onSeeTheMath={() => setIsMathOpen(true)}
            onCreateDeal={handleCreateDeal}
            onBaselineChange={handleBaselineChange}
            isPeriodLocked={isPeriodLocked}
          />
          <ForecastEntry
            submission={submission}
            aiPrediction={(boardData?.aiPrediction as Record<string, unknown>) ?? null}
            onSubmit={handleSubmit}
            hasActiveDeals={hasActiveDeals}
            isPeriodLocked={isPeriodLocked}
            forecastEntryLocked={isPeriodLocked}
            drafts={(boardData?.repDrafts as Record<string, unknown>[]) ?? undefined}
            quotaAmount={boardData?.quota as number | undefined}
          />
          <SubmissionHistory versions={versions} />
        </div>
        <div className="w-72 flex-shrink-0 hidden lg:block">
          <AuditLog logs={logs} submission={submission} />
        </div>
      </div>

      {math && (
        <MathDrawer
          isOpen={isMathOpen}
          onClose={() => setIsMathOpen(false)}
          data={{ math, period: boardData?.period }}
        />
      )}
    </div>
  );
}
