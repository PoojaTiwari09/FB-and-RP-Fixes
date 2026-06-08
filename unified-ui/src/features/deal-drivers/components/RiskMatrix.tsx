'use client';
import { useState } from 'react';
import type { Rep, AtRiskDeal } from '../types';
import { Sparkles, AlertCircle, Award, TrendingUp } from 'lucide-react';

const WARNINGS = [
  { key: 'noNextStep' as const, label: 'NO NEXT STEP' },
  { key: 'singleThreaded' as const, label: 'SINGLE-THREADED' },
  { key: 'noClosePlan' as const, label: 'NO CLOSE PLAN' },
  { key: 'staleGt14d' as const, label: 'STALE >14D' },
  { key: 'championLeft' as const, label: 'CHAMPION LEFT' },
] as const;

const BENCHMARKS = {
  noNextStep: 30,
  singleThreaded: 35,
  noClosePlan: 40,
  staleGt14d: 25,
  championLeft: 15,
};

/* ── Amber heat‑map badge colours ── */
function getHeatStyle(pct: number, rank: number) {
  if (pct === 0) return { color: '#9ca3af', background: 'transparent', cursor: 'default' };
  if (rank === 1) return { background: '#d97706', color: '#fff', fontWeight: 600, border: '1px solid #b45309' };
  if (rank === 2) return { background: '#f59e0b', color: '#fff', fontWeight: 600, border: '1px solid #d97706' };
  if (rank === 3) return { background: '#fef3c7', color: '#92400e', fontWeight: 600, border: '1px solid #fde68a' };
  return { color: '#374151', background: '#f3f4f6', cursor: 'pointer' };
}

function getRank(reps: Rep[], key: typeof WARNINGS[number]['key'], pct: number): number {
  if (pct === 0) return 999;
  const vals = [...new Set(reps.map(r => r.warnings[key]?.pct ?? 0))]
    .filter(v => v > 0)
    .sort((a, b) => b - a);
  const idx = vals.indexOf(pct);
  return idx !== -1 ? idx + 1 : 999;
}

/* ── Avatar colour palette for Top At‑Risk deals ── */
const AVATAR_COLORS = ['#6366f1', '#0ea5e9', '#8b5cf6', '#06b6d4', '#ec4899', '#f59e0b'];

function formatAmount(amount: number) {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  if (amount >= 1000) return `$${Math.round(amount / 1000)}K`;
  return `$${amount}`;
}

type Props = {
  reps: Rep[];
  teamAvg: Record<string, number>;
  insight: string;
  topDeals: AtRiskDeal[];
  onCellClick: (repId: string, repName: string, warning: string, warningLabel: string) => void;
  onExportCSV?: () => void;
  onViewAllTopDeals?: () => void;
};

export default function RiskMatrix({ reps, teamAvg, insight, topDeals, onCellClick, onExportCSV, onViewAllTopDeals }: Props) {
  const [exportStatus, setExportStatus] = useState('');

  const handleExportClick = async () => {
    if (!onExportCSV) return;
    setExportStatus('Exporting...');
    try {
      await onExportCSV();
      setExportStatus('Export prepared.');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (err) {
      setExportStatus('Export failed.');
      setTimeout(() => setExportStatus(''), 3000);
    }
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, alignItems: 'start' }}>

      {/* ═══════════ Left Column: Deal Risk Matrix ═══════════ */}
      <div className="panel" style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '20px 20px 16px' }}>
        {/* Panel header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Deal Risk Matrix</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Percentage of your active deals with each warning (active for &gt; 1 day)</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {exportStatus && <span style={{ fontSize: 11, color: '#6b7280' }}>{exportStatus}</span>}
            <button className="btn-export-sm" onClick={handleExportClick} style={{ padding: '5px 10px', background: '#f3f4f6', border: '1px solid #ddd', borderRadius: 4, fontSize: 11, cursor: 'pointer' }}>Export CSV</button>
          </div>
        </div>

        {/* Matrix Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="matrix-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', minWidth: 140, verticalAlign: 'bottom' }}>REP NAME</th>
                <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #e5e7eb', minWidth: 50, verticalAlign: 'bottom' }}>DEALS</th>
                {WARNINGS.map(w => {
                  const avg = teamAvg[w.key] ?? 0;
                  const benchmark = BENCHMARKS[w.key];
                  const needsTraining = avg > benchmark;
                  return (
                    <th key={w.key} style={{ textAlign: 'center', padding: '10px 6px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.03em', borderBottom: '1px solid #e5e7eb', minWidth: 110, verticalAlign: 'bottom' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span>{w.label}</span>
                        {needsTraining && (
                          <span style={{ color: '#d97706', fontSize: 9, fontWeight: 600, lineHeight: 1.2, textAlign: 'center' }}>
                            ⚠ Team training<br />needed
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {reps.map(rep => (
                <tr key={rep.repId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td
                    style={{ padding: '12px 8px', cursor: 'pointer' }}
                    onClick={() => onCellClick(rep.repId, rep.repName, 'all', 'All Deals')}
                  >
                    <div style={{ fontWeight: 600, color: '#2563eb', fontSize: 13, cursor: 'pointer' }}>{rep.repName}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{rep.role}</div>
                  </td>
                  <td
                    style={{ textAlign: 'center', padding: '12px 8px', fontWeight: 600, cursor: 'pointer', color: '#111827' }}
                    onClick={() => onCellClick(rep.repId, rep.repName, 'all', 'All Deals')}
                  >
                    {rep.totalDeals}
                  </td>
                  {WARNINGS.map(w => {
                    const pct = rep.warnings[w.key]?.pct ?? 0;
                    const rank = getRank(reps, w.key, pct);
                    const cellStyle = getHeatStyle(pct, rank);
                    return (
                      <td key={w.key} style={{ textAlign: 'center', padding: '12px 6px' }}>
                        <span
                          style={{
                            ...cellStyle,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px 10px',
                            borderRadius: 4,
                            fontSize: 12,
                            cursor: pct > 0 ? 'pointer' : 'default',
                            minWidth: 42,
                            transition: 'all 0.15s',
                          }}
                          onClick={() => pct > 0 && onCellClick(rep.repId, rep.repName, w.key, w.label)}
                        >
                          {pct === 0 ? '0%' : `${pct}%`}
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Heat Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14, paddingTop: 12, borderTop: '1px solid #f3f4f6', fontSize: 11, color: '#6b7280' }}>
          <span>Heat rank:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, background: '#d97706' }} />
            <span>#1 Highest</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, background: '#f59e0b' }} />
            <span>#2</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ display: 'inline-block', width: 14, height: 14, borderRadius: 3, background: '#fef3c7', border: '1px solid #fde68a' }} />
            <span>#3</span>
          </div>
          <span>·</span>
          <span>Plain text = lower rank</span>
          <span style={{ marginLeft: 'auto', color: '#9ca3af' }}>Click any cell to drill down →</span>
        </div>

        {/* Insight bar */}
        <div style={{ marginTop: 12, padding: '10px 14px', background: '#eff6ff', borderRadius: 6, fontSize: 13, color: '#1e40af', lineHeight: 1.5 }}>
          <strong>Insight:</strong> {insight}
        </div>
      </div>

      {/* ═══════════ Right Column: AI Insights + Top At‑Risk ═══════════ */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── AI Insights Card ── */}
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
            <Sparkles size={15} style={{ color: '#f59e0b' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>AI Insights</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Row 1 */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#dc2626', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', lineHeight: 1.35, margin: 0 }}>
                  No Next Step is impacting {teamAvg.noNextStep ?? 58}% of your deals.
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, margin: 0 }}>
                  This is {Math.max(0, (teamAvg.noNextStep ?? 58) - 30)}% higher than 30 days ago.
                </p>
              </div>
            </div>
            {/* Row 2 */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#2563eb', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', lineHeight: 1.35, margin: 0 }}>
                  You're 2.8x more likely to win when a champion is identified early.
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, margin: 0 }}>
                  Identify champions to improve close rate.
                </p>
              </div>
            </div>
            {/* Row 3 */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#f59e0b', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff', display: 'block' }} />
              </div>
              <div>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', lineHeight: 1.35, margin: 0 }}>
                  Pricing Pressure risk is trending up 8% this week.
                </p>
                <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 2, margin: 0 }}>
                  Review value positioning on at-risk deals.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Top At‑Risk Deals Card ── */}
        <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ color: '#dc2626', fontSize: 14 }}>↗</span>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Top At-Risk Deals</span>
            </div>
            {onViewAllTopDeals && (
              <button
                onClick={onViewAllTopDeals}
                style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0 }}
              >
                View All →
              </button>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {topDeals.slice(0, 4).map((deal, idx) => (
              <div key={deal.dealId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0', borderBottom: idx < Math.min(topDeals.length, 4) - 1 ? '1px solid #f3f4f6' : 'none' }}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: AVATAR_COLORS[idx % AVATAR_COLORS.length], color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, textTransform: 'uppercase' }}>
                  {deal.accountName[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.accountName}</p>
                  <p style={{ fontSize: 10, color: '#6b7280', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{deal.crmStage}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: 12, fontWeight: 700, color: '#111827', margin: 0 }}>{formatAmount(deal.dealAmount)}</p>
                  <p style={{ fontSize: 10, color: deal.warningTypes.length >= 2 ? '#dc2626' : '#d97706', fontWeight: 600, margin: 0 }}>
                    {deal.warningTypes.length} Risk{deal.warningTypes.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
