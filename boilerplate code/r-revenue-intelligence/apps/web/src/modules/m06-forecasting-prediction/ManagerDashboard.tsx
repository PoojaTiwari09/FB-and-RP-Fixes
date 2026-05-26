'use client';
import React, { useEffect, useState } from 'react';
import MathDrawer from './MathDrawer';
import PeriodToggle from './PeriodToggle';

const API = 'http://localhost:3001/api/v1/forecasting';
const TENANT = 'demo-tenant-01';

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
    const body: any = { managerId: user.id, managerName: user.name };
    if (action === 'reopen') body.comment = comment;
    if (action === 'override') {
      body.overrideValue = adjustedValue;
      body.justification = justification;
      body.approveNow = approveNow;
    }
    await fetch(`${API}/submissions/${sub.id}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-tenant-id': TENANT },
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

  const loadBoard = async (selectedBaseline?: string, periodId: string = selectedPeriod) => {
    const url = selectedBaseline 
      ? `${API}/team/board?baseline=${selectedBaseline}&periodId=${periodId}` 
      : `${API}/team/board?periodId=${periodId}`;
    
    const [res, atRiskRes] = await Promise.all([
      fetch(url, { headers: { 'x-tenant-id': TENANT } }),
      fetch(`${API}/team/at-risk-deals?periodId=${periodId}`, { headers: { 'x-tenant-id': TENANT } })
    ]);
    
    if (!res.ok) throw new Error('Team board unavailable');
    setBoard(await res.json());
    if (atRiskRes.ok) setAtRiskDeals(await atRiskRes.json());
    setError('');
  };

  useEffect(() => {
    setLoading(true);
    loadBoard(baseline, selectedPeriod)
      .catch(() => setError('Team board unavailable. Start the backend API to view live manager data.'))
      .finally(() => setLoading(false));

    const intervalId = setInterval(() => {
      loadBoard(baseline, selectedPeriod).catch(() => {});
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
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex justify-between gap-6">
            <div>
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-2">Team AI Revenue Projection · {periodName}</p>
              <div className="flex items-baseline gap-1">
                <span className="text-[3.5rem] font-light text-gray-900 leading-none">₹{fCr(board.teamAiProjection)}</span>
                <span className="text-2xl font-light text-gray-400">Cr</span>
                <span className="ml-3 text-xs text-gray-400">Consolidated Team Total</span>
              </div>
            </div>
            <button onClick={() => setMathOpen(true)} className="self-start text-blue-600 text-xs font-semibold hover:text-blue-800">See the math</button>
          </div>
          <BreakdownBar math={math} breakdown={board.breakdown} />

          {/* Baseline Selector */}
          <div className="mt-5 bg-gray-50 border border-gray-100 rounded-xl p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-medium text-gray-600">Projection baseline:</span>
              {BASELINES.map((b) => (
                <button
                  key={b.value}
                  onClick={() => setBaseline(b.value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    baseline === b.value
                      ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-3 leading-relaxed">
              {board.baselineNote || 'Uses current period conversion rates.'}
            </p>
          </div>

          <div className="flex items-center gap-8 text-sm mt-5 pt-4 border-t border-gray-100">
            <div><p className="text-[11px] text-gray-400">Team AI Projection</p><b className="text-blue-700">₹{fCr(board.teamAiProjection)}</b></div>
            <div><p className="text-[11px] text-gray-400">Team Commit Total</p><b>₹{fCr(teamCommitTotal)}</b></div>
            <div><p className="text-[11px] text-gray-400">Approved Forecasts</p><b className="text-green-700">{team.filter((r:any) => r.status === 'approved').length}/{team.length}</b></div>
            <div><p className="text-[11px] text-gray-400">Pending Review</p><b className="text-amber-600">{team.filter((r:any) => r.status === 'submitted' || r.status === 'resubmitted').length}</b></div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-800 text-sm">Team Overview</h2>
              <p className="text-[11px] text-gray-400 mt-0.5">Click a rep or Review to open the full forecast page</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-[11px] text-gray-500 uppercase tracking-widest font-semibold">
                  <th className="px-6 py-3 text-left">Rep</th>
                  <th className="px-4 py-3 text-right">Quota</th>
                  <th className="px-4 py-3 text-right">AI Proj.</th>
                  <th className="px-4 py-3 text-right">Commit</th>
                  <th className="px-4 py-3 text-right">Variance</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Risk</th>
                  <th className="px-4 py-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {team.map((rep:any) => {
                  const variance = rep.commit - rep.aiProjection;
                  return (
                    <tr key={rep.repId ?? rep.name} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-3">
                        <button onClick={() => setSelectedRep(rep)} className="flex items-center gap-3 text-left">
                          <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">{rep.initials}</span>
                          <span><b className="text-gray-800">{rep.name}</b>{rep.submission?.managerOverride && <p className="text-[10px] text-orange-600">Override applied</p>}</span>
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">₹{fL(rep.quota)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-blue-700">₹{fL(rep.aiProjection)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-gray-900">₹{fL(rep.commit)}</td>
                      <td className={`px-4 py-3 text-right font-semibold ${variance > 0 ? 'text-red-600' : 'text-green-600'}`}>{variance > 0 ? '+' : ''}₹{fL(Math.abs(variance))}</td>
                      <td className="px-4 py-3 text-center"><span className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${statusStyle[rep.status] || statusStyle.draft}`}>{String(rep.status).replace('_',' ')}</span></td>
                      <td className={`px-4 py-3 text-center text-xs font-bold ${riskStyle[rep.riskLevel]}`}>{rep.riskLevel}</td>
                      <td className="px-4 py-3 text-center"><button onClick={() => setSelectedRep(rep)} className="px-3 py-1.5 text-xs font-semibold text-gray-700 border border-gray-200 rounded-lg hover:bg-blue-50 hover:text-blue-700">Review</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* At-Risk Deals Panel */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span>
                  At-Risk Deals
                </h2>
                <p className="text-[11px] text-gray-400 mt-0.5">Deals requiring manager intervention</p>
              </div>
              <span className="text-xs font-semibold bg-red-50 text-red-700 px-2 py-1 rounded-md">{atRiskDeals.length}</span>
            </div>
            <div className="flex-1 overflow-y-auto max-h-[500px]">
              {atRiskDeals.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">No at-risk deals found for this period.</div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {atRiskDeals.map((deal: any) => (
                    <div key={deal.id} className="p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        {deal.hubspotId ? (
                          <a href={`https://app.hubspot.com/contacts/demo/deal/${deal.hubspotId}`} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm text-blue-600 hover:underline flex items-center gap-1">
                            {deal.dealName}
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                          </a>
                        ) : (
                          <span className="font-semibold text-sm text-gray-800">{deal.dealName}</span>
                        )}
                        <span className="font-bold text-sm text-gray-900">₹{fL(deal.amount)}</span>
                      </div>
                      <div className="flex justify-between items-center text-xs mt-2">
                        <span className="text-gray-600">{deal.repName}</span>
                        <span className="text-gray-500 bg-gray-100 px-2 py-0.5 rounded text-[10px]">{deal.stage}</span>
                      </div>
                      <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-2 flex items-start gap-2">
                        <span className="text-red-500 mt-0.5">⚠</span>
                        <div>
                          <p className="text-[11px] font-semibold text-red-800">{deal.riskReason}</p>
                          <p className="text-[10px] text-red-600 mt-0.5">Expected close: {new Date(deal.closeDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedRep && <ReviewModal rep={selectedRep} user={user} onClose={() => setSelectedRep(null)} onRefresh={() => loadBoard().catch(() => null)} />}
      {math && <MathDrawer isOpen={mathOpen} onClose={() => setMathOpen(false)} data={{ math, period: board.period }} />}
    </div>
  );
}
