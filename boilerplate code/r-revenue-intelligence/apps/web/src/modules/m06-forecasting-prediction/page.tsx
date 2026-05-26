'use client';
import React, { useState, useEffect } from 'react';
import ForecastDashboard from './ForecastDashboard';
import ForecastEntry from './ForecastEntry';
import AuditLog from './AuditLog';
import MathDrawer from './MathDrawer';
import HubSpotConnect from './HubSpotConnect';
import PeriodToggle, { PERIODS } from './PeriodToggle';
import SubmissionHistory from './SubmissionHistory';

const TENANT_ID = 'demo-tenant-01';
const API = 'http://localhost:3001/api/v1/forecasting';

const MOCK_BOARD_DATA = {
  period: {
    id: 'q2-fy26-demo',
    name: 'Q2 FY26',
    startDate: '2026-04-01T00:00:00Z',
    endDate: '2026-06-30T23:59:59Z',
    status: 'open',
  },
  aiPrediction: {
    predictedAmount: 142600000,
    confidenceRangeLow: 130000000,
    confidenceRangeHigh: 155000000,
    computedAt: new Date().toISOString(),
    explainability: {
      deals: [],
      closedWonDetails: { total: 0, deals: [] },
      pipelineByStage: [],
      expectedDeals: { rate: 0.124, addressablePipeline: 126600000, contribution: 15700000 },
    },
  },
  submissions: [],
};

const MOCK_LOGS: any[] = [];

export default function M06ForecastingPage({ user, onLogout }: { user?: any; onLogout?: () => void }) {
  const [boardData, setBoardData] = useState<any>(null);
  const [submission, setSubmission] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [versions, setVersions] = useState<any[]>([]);
  const [isMathOpen, setIsMathOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('current');

  const repUserId = user?.repId || 'rep-01';
  const repName = user?.name || 'Sales Rep';

  const loadData = async (periodId: string = selectedPeriod) => {
    setLoading(true);
    try {
      const headers = { 'X-Tenant-ID': TENANT_ID, 'x-user-id': repUserId };
      const boardRes = await fetch(`${API}/periods/${periodId}/board?repUserId=${encodeURIComponent(repUserId)}`, { 
        headers,
        cache: 'no-store'
      });
      if (!boardRes.ok) throw new Error('API unavailable');
      const data = await boardRes.json();
      setBoardData(data);
      const userSub = (data.submissions || []).find((s: any) => s.repUserId === repUserId) || null;
      setSubmission(userSub);
      if (userSub?.id) {
        const auditRes = await fetch(`${API}/submissions/${userSub.id}/audit-log`, { headers });
        if (auditRes.ok) {
          const resJson = await auditRes.json();
          setLogs(resJson.auditLogs || resJson); // Fallback to raw array if backend not fully updated
          setVersions(resJson.versions || []);
        }
      }
      setApiError(false);
    } catch {
      setApiError(true);
      setBoardData(MOCK_BOARD_DATA);
      setSubmission(null);
      setLogs(MOCK_LOGS);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedPeriod, repUserId]);

  const handleSubmit = async (newData: any) => {
    try {
      const headers = { 'X-Tenant-ID': TENANT_ID, 'Content-Type': 'application/json' };
      if (newData.status === 'submitted' && submission?.id) {
        const res = await fetch(`${API}/submissions`, { method: 'POST', headers, body: JSON.stringify({ ...newData, repUserId }) });
        const saved = res.ok ? await res.json() : submission;
        await fetch(`${API}/submissions/${saved.id}/submit`, { method: 'POST', headers });
      } else {
        const res = await fetch(`${API}/submissions`, { method: 'POST', headers, body: JSON.stringify({ ...newData, repUserId }) });
        if (newData.status === 'submitted' && res.ok) {
          const saved = await res.json();
          await fetch(`${API}/submissions/${saved.id}/submit`, { method: 'POST', headers });
        }
      }
      await loadData();
    } catch {
      const updatedSub = { ...submission, ...newData };
      setSubmission(updatedSub);
      const action = newData.status === 'submitted' ? 'Forecast submitted' : 'Draft saved';
      setLogs(prev => [{ id: Date.now().toString(), action, actorRole: 'Sales Rep', actorId: repUserId, createdAt: new Date().toISOString() }, ...prev]);
    }
  };

  const handleCreateDeal = async (deal: any) => {
    const headers = { 'X-Tenant-ID': TENANT_ID, 'Content-Type': 'application/json' };
    const body = {
      dealName: deal.deal,
      stage: deal.stage,
      amount: deal.amount,
      closeDate: deal.closeDate,
      probability: deal.probability,
      region: deal.region,
      lob: deal.lob,
      repUserId,
    };
    try {
      const res = await fetch(`${API}/deals`, { method: 'POST', headers, body: JSON.stringify(body) });
      if (!res.ok && !apiError) throw new Error('Unable to save deal');
      await loadData();
    } catch (error) {
      if (!apiError) throw error;
    }
  };

  const handleBaselineChange = async (baseline: string) => {
    try {
      const headers = { 'X-Tenant-ID': TENANT_ID };
      let url = baseline
        ? `${API}/periods/${selectedPeriod}/ai-prediction?baseline=${baseline}`
        : `${API}/periods/${selectedPeriod}/ai-prediction`;
      
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}repUserId=${encodeURIComponent(repUserId)}`;
      
      const res = await fetch(url, { headers });
      if (res.ok) {
        const aiData = await res.json();
        setBoardData((prev: any) => ({ ...prev, aiPrediction: aiData.aiPrediction }));
      }
    } catch {
      // ignore on mock/error
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading forecast data...</p>
        </div>
      </div>
    );
  }

  const periodName = boardData?.period?.name || 'Q2 FY26';
  const math = boardData?.aiPrediction?.explainability;
  const hasActiveDeals = Boolean(math?.deals?.length);
  const isPeriodLocked = boardData?.period?.status === 'locked' || boardData?.period?.status === 'closed' || new Date(boardData?.period?.endDate) < new Date();
  const forecastEntryLocked = boardData?.forecastEntryLocked ?? isPeriodLocked;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="text-sm font-bold text-gray-800 tracking-tight">M6 Forecasting & Prediction</span>
            <span className="text-gray-300">|</span>
            <PeriodToggle selectedPeriod={selectedPeriod} onChange={setSelectedPeriod} />
          </div>
          <div className="flex items-center gap-3">
            {apiError && (
              <span className="text-[11px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">Demo mode</span>
            )}
            {/* Manager override notice */}
            {submission?.managerOverride && (
              <span className="text-[11px] text-orange-700 bg-orange-50 border border-orange-200 px-2 py-1 rounded-md">
                ⚠ Manager has overridden your commit
              </span>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                {repName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <span>{repName}</span>
              <span className="text-gray-400 text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">Sales Rep</span>
            </div>
            {onLogout && (
              <button onClick={onLogout} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg">
                Sign out
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Manager Override Banner — visible to rep */}
      {submission?.managerOverride && (
        <div className="bg-orange-50 border-b border-orange-200 px-6 py-3">
          <div className="max-w-screen-2xl mx-auto flex items-center gap-3 text-sm">
            <span className="text-orange-600 font-semibold">Manager Adjustment:</span>
            <span className="text-orange-800">
              Your commit of ₹{(submission.commitForecast / 100000).toFixed(0)}L has been adjusted to{' '}
              <strong>₹{(submission.managerOverride / 100000).toFixed(0)}L</strong> by your manager.
            </span>
            {submission.managerComment && (
              <span className="text-orange-600 italic">"{submission.managerComment}"</span>
            )}
          </div>
        </div>
      )}

      <div className="max-w-screen-2xl mx-auto px-6 py-6 flex gap-6">
        <div className="flex-1 min-w-0 flex flex-col gap-6">
          {/* HubSpot CRM Connect — above the pipeline so reps sync first */}
          <HubSpotConnect onDealsImported={() => loadData()} />
          <ForecastDashboard data={boardData} onSeeTheMath={() => setIsMathOpen(true)} onCreateDeal={handleCreateDeal} onBaselineChange={handleBaselineChange} isPeriodLocked={isPeriodLocked} />
          <ForecastEntry submission={submission} aiPrediction={boardData?.aiPrediction} onSubmit={handleSubmit} hasActiveDeals={hasActiveDeals} isPeriodLocked={isPeriodLocked} forecastEntryLocked={forecastEntryLocked} drafts={boardData?.repDrafts} quotaAmount={boardData?.quota} />
          <SubmissionHistory versions={versions} />
        </div>
        <div className="w-72 flex-shrink-0">
          <AuditLog logs={logs} submission={submission} />
        </div>
      </div>

      {math && <MathDrawer isOpen={isMathOpen} onClose={() => setIsMathOpen(false)} data={{ math, period: boardData?.period }} />}
    </div>
  );
}
