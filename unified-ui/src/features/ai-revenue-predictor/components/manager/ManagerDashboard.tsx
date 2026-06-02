'use client';
import React, { useEffect, useState } from 'react';
import MathDrawer from './MathDrawer';
import PeriodToggle from './PeriodToggle';
import ForecastBoard from './components/ForecastBoard';
import { M06_LEGACY_API_BASE, fetchForecastBoard, type ForecastBoardPayload } from './api';

const API = M06_LEGACY_API_BASE;
const TENANT = 'demo-tenant-01';

const MOCK_BOARD = {
  period: { id: 'q2-fy26-demo', name: 'Q2 FY26', startDate: '2026-04-01T00:00:00Z', endDate: '2026-06-30T23:59:59Z', status: 'open' },
  teamAiProjection: 142600000,
  baselineNote: 'Demo mode — using mock data. Start the backend API for live data.',
  breakdown: { closedWon: 42000000, weightedPipeline: 85000000, expectedDeals: 15600000 },
  aiSnapshot: { explainability: { deals: [], closedWonDetails: { total: 42000000, deals: [] }, pipelineByStage: [], expectedDeals: { rate: 0.124, addressablePipeline: 126600000, contribution: 15600000 } } },
  team: [
    { repId: 'rep-01', name: 'Rahul Kumar',  initials: 'RK', quota: 50000000, aiProjection: 48500000, commit: 47000000, status: 'submitted',    riskLevel: 'On Track', submission: { id: 's1', commitForecast: 47000000, bestCaseForecast: 52000000, notes: 'Strong pipeline in enterprise segment.', status: 'submitted', createdAt: '2026-05-20T09:00:00Z', submittedAt: '2026-05-22T11:00:00Z' }, auditLogs: [{ action: 'Forecast submitted', actorRole: 'Sales Rep', createdAt: '2026-05-22T11:00:00Z' }, { action: 'Draft saved', actorRole: 'Sales Rep', createdAt: '2026-05-20T09:00:00Z' }] },
    { repId: 'rep-02', name: 'Priya Mehta',  initials: 'PM', quota: 45000000, aiProjection: 38000000, commit: 44000000, status: 'approved',    riskLevel: 'At Risk',  submission: { id: 's2', commitForecast: 44000000, bestCaseForecast: 48000000, notes: 'Optimistic — two large deals may slip.', status: 'approved', createdAt: '2026-05-18T08:00:00Z', submittedAt: '2026-05-19T10:00:00Z', approvedAt: '2026-05-21T14:00:00Z', managerOverride: 41000000 }, auditLogs: [{ action: 'Manager approved', actorRole: 'Manager', createdAt: '2026-05-21T14:00:00Z' }, { action: 'Forecast submitted', actorRole: 'Sales Rep', createdAt: '2026-05-19T10:00:00Z' }] },
    { repId: 'rep-03', name: 'Arjun Singh',  initials: 'AS', quota: 40000000, aiProjection: 31000000, commit: 28000000, status: 'draft',       riskLevel: 'Critical', submission: { id: 's3', commitForecast: 28000000, bestCaseForecast: 35000000, notes: '', status: 'draft', createdAt: '2026-05-25T07:00:00Z' }, auditLogs: [{ action: 'Draft saved', actorRole: 'Sales Rep', createdAt: '2026-05-25T07:00:00Z' }] },
    { repId: 'rep-04', name: 'Neha Kapoor',  initials: 'NK', quota: 42000000, aiProjection: 40500000, commit: 41000000, status: 'resubmitted', riskLevel: 'On Track', submission: { id: 's4', commitForecast: 41000000, bestCaseForecast: 46000000, notes: 'Revised after manager feedback.', status: 'resubmitted', createdAt: '2026-05-17T06:00:00Z', submittedAt: '2026-05-23T09:00:00Z', reopenedAt: '2026-05-22T15:00:00Z' }, auditLogs: [{ action: 'Resubmitted', actorRole: 'Sales Rep', createdAt: '2026-05-23T09:00:00Z' }, { action: 'Reopened by manager', actorRole: 'Manager', createdAt: '2026-05-22T15:00:00Z' }, { action: 'Forecast submitted', actorRole: 'Sales Rep', createdAt: '2026-05-20T08:00:00Z' }] },
  ],
};

const MOCK_AT_RISK: any[] = [
  { id: 'deal-1', dealName: 'GlobalTech Enterprise Suite', repName: 'Arjun Singh', amount: 18500000, stage: 'Proposal', riskReason: 'No activity in 21 days — deal stalling', closeDate: '2026-06-15T00:00:00Z' },
  { id: 'deal-2', dealName: 'FinServ CRM Expansion',      repName: 'Priya Mehta',  amount: 12000000, stage: 'Negotiation', riskReason: 'Close date passed without update', closeDate: '2026-05-30T00:00:00Z' },
];

const BASELINES = [
  { label: 'Current baseline', value: '' },
  { label: 'Avg of last 2 periods', value: 'avg_last_2' },
  { label: 'Last period (Q1 FY26)', value: 'last_period' },
  { label: 'Same period last year (Q2 FY25)', value: 'same_period_last_year' },
];

function fL(v = 0){ return `${(v / 100000).toFixed(0)}L`; }
function fCr(v = 0){ return `${(v / 10000000).toFixed(1)}Cr`; }
function timeLabel(date?: string){ return date ? new Date(date).toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' }) : '-'; }

const statusStyle: Record<string, string> = {
  submitted:'bg-blue-50 text-blue-700',
  approved:'bg-green-50 text-green-700',
  draft:'bg-gray-100 text-gray-600',
  reopened:'bg-orange-50 text-orange-700',
  resubmitted:'bg-blue-50 text-blue-700',
  no_submission:'bg-gray-100 text-gray-500',
};

const riskStyle: Record<string, string> = {
  'On Track':'text-green-600',
  'At Risk':'text-amber-600',
  Critical:'text-red-600',
};

function BreakdownBar({ math, breakdown }: { math: any, breakdown?: any }) {
  if (!math && !breakdown) return null;
  const closed = breakdown?.closedWon ?? math?.closedWonDetails?.total ?? 0;
  const pipeline = breakdown?.weightedPipeline ?? (math?.pipelineByStage ?? []).reduce((sum: number, item: any) => sum + item.contribution, 0);
  const expected = breakdown?.expectedDeals ?? math?.expectedDeals?.contribution ?? 0;
  const total = closed + pipeline + expected || 1;
  return (
    <div className="mt-5">
      <div className="w-full h-3 flex rounded-full overflow-hidden gap-0.5">
        <div className="bg-blue-600" style={{ width: `${closed / total * 100}%` }} />
        <div className="bg-blue-400" style={{ width: `${pipeline / total * 100}%` }} />
        <div className="bg-blue-200" style={{ width: `${expected / total * 100}%` }} />
      </div>
      <div className="flex gap-6 text-sm flex-wrap mt-3 text-gray-600">
        <span><b className="text-blue-700">Closed-won</b> ₹{fCr(closed)}</span>
        <span><b className="text-blue-700">Weighted pipeline</b> ₹{fCr(pipeline)}</span>
        <span><b className="text-blue-700">Expected deals</b> ₹{fCr(expected)}</span>
      </div>
    </div>
  );
}

function ReviewModal({ rep, user, onClose, onRefresh }:{ rep:any; user:any; onClose:()=>void; onRefresh:()=>void }) {
  const sub = rep.submission;
  const [comment, setComment] = useState('');
  const [overrideVal, setOverrideVal] = useState('');
  const [justification, setJustification] = useState('');
  const [approveNow, setApproveNow] = useState(false);
  const [busy, setBusy] = useState(false);

  const commit = sub?.commitForecast ?? 0;
  const effectiveCommit = sub?.managerOverride ?? commit;
  const variancePct = rep.aiProjection ? ((effectiveCommit - rep.aiProjection) / rep.aiProjection * 100) : 0;
  const adjustedValue = Number(overrideVal || 0);

  const postAction = async (action: 'approve' | 'reopen' | 'override') => {
    if (!sub?.id) return;
    setBusy(true);

    let boardId = '';
    let columnId = 'col-commit';
    try {
      const boardsRes = await fetch(`${API}/boards/by-period/${selectedPeriod === 'current' ? 'q2-fy26-demo' : selectedPeriod}`, { headers: { 'x-tenant-id': TENANT } });
      const boardsPayload = await boardsRes.json();
      const board = boardsPayload.board ?? boardsPayload[0];
      boardId = board?.id;
      columnId = board?.columns?.find((c:any) => c.label.toLowerCase().includes('commit'))?.id || 'col-commit';
    } catch (e) {
      // fallback
    }
    if (!boardId) { setBusy(false); return; }

    let url = `${API}/boards/${boardId}/submissions/${sub.id}/${action}`;
    const body: any = { managerId: user.id, managerName: user.name };

    if (action === 'reopen') body.comment = comment;
    if (action === 'override') {
      url = `${API}/boards/${boardId}/reps/${rep.repId || rep.id}/submission`;
      body.value = adjustedValue;
      body.note = justification;
      body.columnId = columnId;
    }

    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json', 'x-tenant-id': TENANT, 'x-user-id': user.id },
      body: JSON.stringify(body),
    }).catch(() => null);
    
    setBusy(false);
    await onRefresh();
    if (action !== 'override' || approveNow) onClose();
  };

  const lifecycle = [
    ['Draft Created', sub?.createdAt],
    ['Submitted', sub?.submittedAt],
    ['Under Review', sub?.status === 'submitted' ? new Date().toISOString() : sub?.submittedAt],
    ['Reopened', sub?.reopenedAt],
    ['Approved', sub?.approvedAt],
  ].filter((item) => item[1]);

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm">{rep.initials}</div>
              <div>
                <p className="font-bold text-gray-900 text-sm">{rep.name}</p>
                <p className="text-xs text-gray-400">Forecast Review · {rep.status.replace('_', ' ')}</p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg bg-gray-100 hover:bg-gray-200">×</button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 grid grid-cols-3 gap-5">
            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Rep Submission</p>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Commit</span><b className="text-blue-700">₹{fL(commit)}</b></div>
                <div className="flex justify-between"><span className="text-gray-500">Best Case</span><b>₹{fL(sub?.bestCaseForecast ?? 0)}</b></div>
                <div className="flex justify-between"><span className="text-gray-500">AI Projection</span><b>₹{fL(rep.aiProjection)}</b></div>
                {sub?.managerOverride && <div className="flex justify-between pt-2 border-t"><span className="text-orange-600">Manager Override</span><b className="text-orange-700">₹{fL(sub.managerOverride)}</b></div>}
              </div>
              {sub?.notes && <p className="mt-4 bg-amber-50 border border-amber-100 rounded-lg p-3 text-xs text-gray-700 italic">"{sub.notes}"</p>}
            </div>

            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">AI Comparison</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400">Quota</p><b>₹{fL(rep.quota)}</b></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400">AI Projection</p><b className="text-blue-700">₹{fL(rep.aiProjection)}</b></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400">Variance</p><b className={variancePct > 10 ? 'text-red-600' : 'text-green-600'}>{variancePct > 0 ? '+' : ''}{variancePct.toFixed(1)}%</b></div>
                <div className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400">Risk</p><b className={riskStyle[rep.riskLevel]}>{rep.riskLevel}</b></div>
              </div>
              {variancePct > 10 && <p className="mt-3 text-xs bg-orange-50 border border-orange-100 rounded-lg p-2 text-orange-700">Commit exceeds AI projection by {variancePct.toFixed(1)}%</p>}
            </div>

            <div className="border border-gray-200 rounded-xl p-4 row-span-2">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Activity Log</p>
              <div className="space-y-3">
                {(rep.auditLogs ?? []).map((log:any, i:number) => (
                  <div key={i} className="flex items-start justify-between gap-3 text-xs border-b border-gray-50 pb-2 last:border-0">
                    <div><b className="text-gray-800">{log.action}</b><p className="text-gray-400">{log.actorRole}</p></div>
                    <span className="text-gray-400 whitespace-nowrap">{timeLabel(log.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Manager Decision</p>
              <div className="flex gap-3 mb-3">
                <button disabled={busy || rep.status === 'approved'} onClick={() => postAction('approve')} className="flex-1 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg disabled:opacity-40">Approve</button>
                <button disabled={busy || !comment.trim()} onClick={() => postAction('reopen')} className="flex-1 py-2 text-sm font-semibold border border-gray-300 rounded-lg disabled:opacity-40">Reopen</button>
              </div>
              <textarea value={comment} onChange={e => setComment(e.target.value)} rows={4} placeholder="Required when reopening" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 resize-none"/>
            </div>

            <div className="border border-gray-200 rounded-xl p-4">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Override Panel</p>
              <div className="bg-gray-50 rounded-lg p-3 text-xs mb-3 flex justify-between">
                <span>Rep ₹{fL(commit)}</span><span>AI ₹{fL(rep.aiProjection)}</span>
              </div>
              <input value={overrideVal} onChange={e => setOverrideVal(e.target.value.replace(/[^0-9]/g,''))} placeholder="Adjusted forecast" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg mb-3"/>
              <textarea value={justification} onChange={e => setJustification(e.target.value)} rows={3} placeholder="Justification required" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 resize-none"/>
              {adjustedValue > 0 && (
                <div className="mt-3 text-xs bg-blue-50 border border-blue-100 rounded-lg p-3 space-y-1">
                  <div className="flex justify-between"><span>Adjusted Commit</span><b>₹{fL(adjustedValue)}</b></div>
                  <div className="flex justify-between"><span>Change</span><b className={adjustedValue < commit ? 'text-green-700' : 'text-red-600'}>{fL(adjustedValue - commit)}</b></div>
                </div>
              )}
              <label className="mt-3 flex items-center gap-2 text-xs text-gray-600">
                <input type="checkbox" checked={approveNow} onChange={e => setApproveNow(e.target.checked)} />
                Save override and approve now
              </label>
              <button disabled={busy || !adjustedValue || !justification.trim()} onClick={() => postAction('override')} className="mt-3 w-full py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg disabled:opacity-40">Save Override</button>
            </div>

            <div className="col-span-3 border border-gray-200 rounded-xl p-4">
              <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Forecast Lifecycle</p>
              <div className="grid grid-cols-5 gap-3">
                {lifecycle.map(([label, date]) => (
                  <div key={label as string} className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                    <b className="text-xs text-gray-800">{label}</b>
                    <p className="text-[10px] text-gray-400 mt-1">{timeLabel(date as string)}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function ManagerDashboard({ user, onLogout }:{ user:any; onLogout:()=>void }) {
  const [board, setBoard] = useState<any>(null);
  const [atRiskDeals, setAtRiskDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRep, setSelectedRep] = useState<any>(null);
  const [mathOpen, setMathOpen] = useState(false);
  const [baseline, setBaseline] = useState(BASELINES[0].value);
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [tddBoard, setTddBoard] = useState<ForecastBoardPayload | null>(null);

  const loadBoard = async (selectedBaseline?: string, periodId: string = selectedPeriod) => {
    const url = selectedBaseline
      ? `${API}/team/board?baseline=${selectedBaseline}&periodId=${periodId}`
      : `${API}/team/board?periodId=${periodId}`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const resolvedPeriodId = periodId === 'current' ? 'q2-fy26-demo' : periodId;
      const [res, atRiskRes, tddRes] = await Promise.all([
        fetch(url, { headers: { 'x-tenant-id': TENANT }, signal: controller.signal }),
        fetch(`${API}/team/at-risk-deals?periodId=${periodId}`, { headers: { 'x-tenant-id': TENANT }, signal: controller.signal }),
        fetchForecastBoard(TENANT, resolvedPeriodId, user.id, 'manager').catch(() => null)
      ]);
      clearTimeout(timeout);
      if (!res.ok) throw new Error('Team board unavailable');
      setBoard(await res.json());
      if (atRiskRes.ok) setAtRiskDeals(await atRiskRes.json());
      if (tddRes) setTddBoard(tddRes);
      setError('');
    } catch {
      clearTimeout(timeout);
      // Fall back to mock data silently
      setBoard(MOCK_BOARD);
      setAtRiskDeals(MOCK_AT_RISK);
      setError('');
    }
  };

  useEffect(() => {
    setLoading(true);
    loadBoard(baseline, selectedPeriod).finally(() => setLoading(false));

    const intervalId = setInterval(() => {
      loadBoard(baseline, selectedPeriod);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [baseline, selectedPeriod]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{fontFamily:'Inter, system-ui, sans-serif'}}>
        <p className="text-sm text-gray-500">Loading manager board...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{fontFamily:'Inter, system-ui, sans-serif'}}>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm max-w-md">
          <p className="text-sm font-semibold text-gray-800">Manager board data is unavailable</p>
          <p className="text-xs text-gray-500 mt-2">{error || 'No board data returned from the backend.'}</p>
          <button onClick={() => loadBoard(baseline).catch(() => setError('Team board unavailable. Start the backend API to view live manager data.'))} className="mt-4 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  const team = board.team ?? [];
  const periodName = board.period?.name ?? 'Q2 FY26';
  const math = board.aiSnapshot?.explainability;
  const teamCommitTotal = team.reduce((sum:number, rep:any) => sum + (rep.commit ?? 0), 0);

  return (
    <div className="min-h-screen bg-gray-50" style={{fontFamily:'Inter, system-ui, sans-serif'}}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center text-white text-sm">↗</div>
            <span className="text-sm font-bold text-gray-800">M6 Forecasting & Prediction</span>
            <span className="text-gray-300">|</span>
            <span className="text-xs text-gray-500 mr-2">Manager</span>
            <PeriodToggle selectedPeriod={selectedPeriod} onChange={setSelectedPeriod} />
          </div>
          <button onClick={onLogout} className="text-xs text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg">Sign out</button>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        {tddBoard ? (
          <ForecastBoard board={tddBoard} userId={user.id} onSubmit={async () => { alert('Managers review individual rep submissions below instead of submitting an aggregate forecast.'); }} />
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-center text-gray-500">
            Loading forecast board or no board found for this period.
          </div>
        )}
      </div>

      {math && <MathDrawer isOpen={mathOpen} onClose={() => setMathOpen(false)} data={{ math, period: board?.period }} />}
    </div>
  );
}
