'use client';
import React, { useEffect, useState } from 'react';
import PeriodToggle from './PeriodToggle';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart } from 'recharts';

const API = 'http://localhost:3001/api/v1/forecasting';
const TENANT = 'demo-tenant-01';

const BASELINES = [
  { label: 'Current baseline', value: 'current' },
  { label: 'Avg of last 2 periods', value: 'avg_last_2' },
  { label: 'Last period', value: 'last_period' },
  { label: 'Same period last year', value: 'same_period_last_year' },
];

const REGIONS = ['Company', 'Americas', 'EMEA', 'APAC'];

function fL(v = 0) { return `₹${(v / 100000).toFixed(0)}L`; }
function fCr(v = 0) { return `₹${(v / 10000000).toFixed(2)}Cr`; }

const riskStyle: Record<string, string> = {
  'On Track': 'text-green-600',
  'At Risk': 'text-amber-600',
  Critical: 'text-red-600',
};

const statusStyle: Record<string, string> = {
  submitted: 'bg-blue-50 text-blue-700',
  approved: 'bg-green-50 text-green-700',
  draft: 'bg-gray-100 text-gray-600',
  reopened: 'bg-orange-50 text-orange-700',
  resubmitted: 'bg-blue-50 text-blue-700',
  no_submission: 'bg-gray-100 text-gray-500',
};

export default function CroDashboard({ user, onLogout }: { user: any; onLogout: () => void }) {
  const [board, setBoard] = useState<any>(null);
  const [trends, setTrends] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [baseline, setBaseline] = useState(BASELINES[0].value);
  const [region, setRegion] = useState('Company');
  const [selectedPeriod, setSelectedPeriod] = useState('current');
  const [expandedPipelineRegions, setExpandedPipelineRegions] = useState<Set<string>>(new Set());
  const [expandedClosedWonRegions, setExpandedClosedWonRegions] = useState<Set<string>>(new Set());

  const togglePipelineRegion = (reg: string) => {
    setExpandedPipelineRegions(prev => {
      const next = new Set(prev);
      if (next.has(reg)) next.delete(reg);
      else next.add(reg);
      return next;
    });
  };

  const toggleClosedWonRegion = (reg: string) => {
    setExpandedClosedWonRegions(prev => {
      const next = new Set(prev);
      if (next.has(reg)) next.delete(reg);
      else next.add(reg);
      return next;
    });
  };

  const loadBoard = async (selectedBaseline: string, selectedRegion: string, periodId: string) => {
    try {
      const url = new URL(`${API}/executive/board`);
      if (selectedBaseline && selectedBaseline !== 'current') url.searchParams.append('baseline', selectedBaseline);
      if (selectedRegion && selectedRegion !== 'Company') url.searchParams.append('region', selectedRegion);
      url.searchParams.append('periodId', periodId);

      const [res, trendsRes] = await Promise.all([
        fetch(url.toString(), { headers: { 'x-tenant-id': TENANT } }),
        fetch(`${API}/executive/trends?periodId=${periodId}`, { headers: { 'x-tenant-id': TENANT } })
      ]);
      
      if (!res.ok) throw new Error('Executive board unavailable');
      setBoard(await res.json());
      if (trendsRes.ok) setTrends(await trendsRes.json());
      setError('');
    } catch (e: any) {
      setError(e.message);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadBoard(baseline, region, selectedPeriod).finally(() => setLoading(false));
  }, [baseline, region, selectedPeriod]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <p className="text-sm text-gray-500">Loading CRO dashboard...</p>
      </div>
    );
  }

  if (error || !board) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm max-w-md">
          <p className="text-sm font-semibold text-gray-800">CRO dashboard data is unavailable</p>
          <p className="text-xs text-gray-500 mt-2">{error}</p>
          <button onClick={() => loadBoard(baseline, region, selectedPeriod).catch(() => setError('Still unavailable.'))} className="mt-4 px-3 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg">Retry</button>
        </div>
      </div>
    );
  }

  const { period, aiProjection, reconciliation, closedWonByRegion, pipelineByRegion, teamOverview, aggregateTotals } = board;

  return (
    <div className="min-h-screen bg-gray-50" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-md bg-blue-900 flex items-center justify-center text-white text-sm">✦</div>
            <span className="text-sm font-bold text-gray-800 tracking-tight">M6 Forecasting & Prediction</span>
            <span className="text-gray-300">|</span>
            <span className="text-xs font-semibold text-gray-600">Executive View</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <PeriodToggle selectedPeriod={selectedPeriod} onChange={setSelectedPeriod} />
            <div className="flex bg-gray-100 p-1 rounded-lg">
              {REGIONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRegion(r)}
                  className={`px-3 py-1 rounded-md transition-colors ${region === r ? 'bg-white shadow-sm font-semibold text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {r}
                </button>
              ))}
            </div>
            <select
              value={baseline}
              onChange={(e) => setBaseline(e.target.value)}
              className="bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:ring-2 outline-none"
            >
              {BASELINES.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">{user.name.charAt(0)}</div>
              <span className="font-semibold text-gray-700">{user.name}</span>
              <span className="text-gray-400 text-[10px] bg-gray-100 px-2 py-0.5 rounded-full">CRO</span>
            </div>
            <button onClick={onLogout} className="text-gray-500 hover:text-gray-700 px-3 py-1.5 border border-gray-200 rounded-lg">Sign out</button>
          </div>
        </div>
      </header>

      <main className="max-w-screen-2xl mx-auto px-6 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">Revenue Projection ({region})</h1>
          <div className="text-right">
            <p className="text-sm text-gray-500">Target for {period.name}</p>
            <p className="text-xl font-bold text-gray-800">{fCr(period.revenueTarget)}</p>
          </div>
        </div>

        {/* AI Projection Breakdown */}
        <div className="grid grid-cols-4 gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm col-span-4 flex flex-col items-center justify-center py-8">
            <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest mb-2">Total AI Projected Revenue</p>
            <p className="text-5xl font-extrabold text-blue-900 mb-4">{fCr(aiProjection.total)}</p>
            <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-sm font-mono font-medium border border-blue-100">
              {reconciliation}
            </div>
            {baseline !== 'current' && (
              <p className="text-xs text-orange-600 mt-3 font-medium bg-orange-50 px-3 py-1 rounded-full border border-orange-100">
                Baseline applied: {BASELINES.find(b => b.value === baseline)?.label}
              </p>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-blue-600">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Closed Won</p>
            <p className="text-2xl font-bold text-gray-900">{fCr(aiProjection.breakdown.closedWon)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-blue-400">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Weighted Pipeline</p>
            <p className="text-2xl font-bold text-gray-900">{fCr(aiProjection.breakdown.weightedPipeline)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm border-l-4 border-l-blue-200">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Expected Deals</p>
            <p className="text-2xl font-bold text-gray-900">{fCr(aiProjection.breakdown.expectedDeals)}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-1">Team Commit vs Target</p>
            <p className="text-2xl font-bold text-gray-900">{fCr(aggregateTotals.commit)}</p>
            <p className="text-xs text-gray-500 mt-1">Variance: <span className={aggregateTotals.variance >= 0 ? 'text-green-600 font-medium' : 'text-red-600 font-medium'}>{aggregateTotals.variance >= 0 ? '+' : ''}{aggregateTotals.variance.toFixed(1)}%</span></p>
          </div>
        </div>

        {/* Region-wise details (only shown if viewing Company) */}
        {region === 'Company' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 text-sm">Region-wise Pipeline Breakdown</h3>
              </div>
              <div className="p-5 space-y-4">
                {Object.entries(pipelineByRegion).map(([reg, data]: [string, any]) => (
                  <div key={reg} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                    <button 
                      onClick={() => togglePipelineRegion(reg)}
                      className="w-full flex justify-between items-center outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedPipelineRegions.has(reg) ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-bold text-sm text-gray-800">{reg}</span>
                      </div>
                      <span className="font-bold text-blue-700">{fCr(data.total)}</span>
                    </button>
                    {expandedPipelineRegions.has(reg) && (
                      <div className="space-y-1 mt-3 pl-6 border-l-2 border-gray-200 ml-2">
                        {data.stages.map((stage: any) => (
                          <div key={stage.stage} className="flex justify-between text-xs">
                            <span className="text-gray-500">{stage.stage}</span>
                            <span className="text-gray-900 font-medium">{fL(stage.contribution)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-semibold text-gray-900 text-sm">Region-wise Closed Won</h3>
              </div>
              <div className="p-5 space-y-4">
                {Object.entries(closedWonByRegion).map(([reg, data]: [string, any]) => (
                  <div key={reg} className="border border-gray-100 rounded-lg p-3 bg-gray-50">
                    <button 
                      onClick={() => toggleClosedWonRegion(reg)}
                      className="w-full flex justify-between items-center outline-none"
                    >
                      <div className="flex items-center gap-2">
                        <svg className={`w-4 h-4 text-gray-500 transition-transform ${expandedClosedWonRegions.has(reg) ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="font-bold text-sm text-gray-800">{reg}</span>
                      </div>
                      <span className="font-bold text-blue-700">{fCr(data.total)}</span>
                    </button>
                    {expandedClosedWonRegions.has(reg) && (
                      <div className="space-y-1 mt-3 pl-6 border-l-2 border-gray-200 ml-2">
                        {data.deals.slice(0, 3).map((deal: any, i: number) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="text-gray-500 truncate max-w-[200px]">{deal.name}</span>
                            <span className="text-gray-900 font-medium">{fL(deal.amount)}</span>
                          </div>
                        ))}
                        {data.deals.length > 3 && (
                          <p className="text-xs text-gray-400 italic mt-1 pl-1">+{data.deals.length - 3} more deals</p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Team Overview */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/50">
            <h3 className="font-semibold text-gray-900 text-sm">Team Forecast Overview</h3>
          </div>
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3 font-medium">Rep / Manager</th>
                <th className="px-5 py-3 font-medium text-right">Quota</th>
                <th className="px-5 py-3 font-medium text-right">AI Projection</th>
                <th className="px-5 py-3 font-medium text-right">Commit</th>
                <th className="px-5 py-3 font-medium text-right">Variance</th>
                <th className="px-5 py-3 font-medium text-center">Status</th>
                <th className="px-5 py-3 font-medium text-right">Risk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {teamOverview.map((rep: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{rep.name}</td>
                  <td className="px-5 py-4 text-right text-gray-600">{fCr(rep.quota)}</td>
                  <td className="px-5 py-4 text-right text-blue-700 font-semibold">{fCr(rep.aiProjection)}</td>
                  <td className="px-5 py-4 text-right font-medium text-gray-900">{fCr(rep.commit)}</td>
                  <td className="px-5 py-4 text-right">
                    <span className={rep.variance >= 0 ? 'text-green-600 bg-green-50 px-2 py-1 rounded text-xs font-medium' : 'text-red-600 bg-red-50 px-2 py-1 rounded text-xs font-medium'}>
                      {rep.variance >= 0 ? '+' : ''}{rep.variance.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${statusStyle[rep.status] || statusStyle.no_submission}`}>
                      {rep.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-right font-semibold">
                    <span className={riskStyle[rep.risk] || 'text-gray-500'}>{rep.risk}</span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
              <tr>
                <td className="px-5 py-4 text-gray-900">Total</td>
                <td className="px-5 py-4 text-right text-gray-900">{fCr(aggregateTotals.quota)}</td>
                <td className="px-5 py-4 text-right text-blue-700">{fCr(aggregateTotals.aiProjection)}</td>
                <td className="px-5 py-4 text-right text-gray-900">{fCr(aggregateTotals.commit)}</td>
                <td className="px-5 py-4 text-right">
                  <span className={aggregateTotals.variance >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {aggregateTotals.variance >= 0 ? '+' : ''}{aggregateTotals.variance.toFixed(1)}%
                  </span>
                </td>
                <td className="px-5 py-4"></td>
                <td className="px-5 py-4"></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* CRO Trend Charts */}
        {trends.length > 0 && (
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Historical Bookings Trend</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="periodName" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tickFormatter={(val) => `₹${(val / 10000000).toFixed(0)}Cr`} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip cursor={{ fill: '#f3f4f6' }} formatter={(val: any) => `₹${(val / 10000000).toFixed(2)}Cr`} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="target" name="Revenue Target" fill="#e5e7eb" radius={[4, 4, 0, 0]} barSize={40} />
                    <Bar dataKey="bookings" name="Bookings" fill="#2563eb" radius={[4, 4, 0, 0]} barSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-5">
              <h3 className="font-semibold text-gray-900 text-sm mb-4">Win Rate Trend</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trends} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="periodName" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <YAxis tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} domain={[0, 1]} />
                    <Tooltip formatter={(val: any) => `${(val * 100).toFixed(1)}%`} />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                    <Line type="monotone" dataKey="winRate" name="Win Rate" stroke="#10b981" strokeWidth={3} dot={{ r: 5, fill: '#10b981', strokeWidth: 2 }} activeDot={{ r: 7 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
