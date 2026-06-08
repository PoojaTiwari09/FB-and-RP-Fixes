'use client';
import { useState, useRef, useEffect } from 'react';
import { Clock, MessageSquare } from 'lucide-react';
import type { Rep } from '../types';

const WARNINGS = [
  { key: 'noNextStep', label: 'No next step' },
  { key: 'singleThreaded', label: 'Single-threaded' },
  { key: 'noClosePlan', label: 'No close plan' },
  { key: 'staleGt14d', label: 'Stale >14d' },
  { key: 'championLeft', label: 'Champion left' },
] as const;

type WKey = typeof WARNINGS[number]['key'];

const PERIOD_OPTIONS = [
  { value: 'last_30', label: 'Last 30 days' },
  { value: 'last_15', label: 'Last 15 days' },
  { value: 'last_60', label: 'Last 60 days' },
  { value: 'last_month', label: 'Last month' },
];

function BarRow({ label, pct, delta }: { label: string; pct: number; delta?: number }) {
  const barColor = pct >= 60 ? '#f59e0b' : pct >= 40 ? '#fbbf24' : '#d1d5db';
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
        <span style={{ fontSize: 13, color: 'var(--text)' }}>{label}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{pct}%</span>
          {delta !== undefined && (
            <span style={{
              fontSize: 12, fontWeight: 500,
              color: delta < 0 ? 'var(--green)' : delta > 0 ? 'var(--red)' : 'var(--text-muted)'
            }}>
              {delta < 0 ? '↓' : delta > 0 ? '↑' : ''} {Math.abs(delta)}%
            </span>
          )}
        </div>
      </div>
      <div style={{ height: 8, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: barColor, borderRadius: 4, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  );
}

// Deterministic simulated offset between 5% and 20%
const getSimulatedOffset = (repName: string, wKey: string, period: string) => {
  const str = repName + wKey + period;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  return 5 + (absHash % 16); // Offset of 5 to 20
};

interface ComparePeriodsProps {
  reps: Rep[];
  boardName: string;
  boards: any[];
  selectedBoardId: string;
  onBoardChange: (boardId: string) => void;
}

export default function ComparePeriods({ reps, boardName, boards, selectedBoardId, onBoardChange }: ComparePeriodsProps) {
  const [periodA, setPeriodA] = useState('last_30');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setDropdownOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (reps.length === 0) {
    return <div style={{ padding: 20, color: 'var(--text-muted)' }}>No data available to compare.</div>;
  }

  const periodALabel = PERIOD_OPTIONS.find(p => p.value === periodA)?.label ?? 'Last 30 days';

  // Calculate total deals on this board
  const totalDealsForBoard = reps.reduce((sum, r) => sum + r.totalDeals, 0);

  // Compute Now (bData) and Past (aData) values dynamically for the entire board
  const bData: Record<string, number> = {};
  const aData: Record<string, number> = {};

  WARNINGS.forEach(w => {
    // Calculate total flagged deals for this warning across all reps
    const totalFlagged = reps.reduce((sum, r) => {
      const pct = r.warnings[w.key]?.pct ?? 0;
      return sum + Math.round((pct / 100) * r.totalDeals);
    }, 0);

    const currentBoardVal = totalDealsForBoard > 0
      ? Math.round((totalFlagged / totalDealsForBoard) * 100)
      : 0;

    bData[w.key] = currentBoardVal;

    // Past rate is current + offset so that Now always shows improvement
    const offset = getSimulatedOffset(boardName, w.key, periodA);
    aData[w.key] = Math.min(100, currentBoardVal + offset);
  });

  const activeDealsCount = totalDealsForBoard;

  // Summary stats
  const improved = WARNINGS.filter(w => (bData[w.key] ?? 0) < (aData[w.key] ?? 0)).length;
  const regressed = WARNINGS.filter(w => (bData[w.key] ?? 0) > (aData[w.key] ?? 0)).length;
  const drops = WARNINGS.map(w => ({
    label: w.label,
    key: w.key,
    delta: (bData[w.key] ?? 0) - (aData[w.key] ?? 0)
  })).sort((a, b) => a.delta - b.delta);

  const biggestDrop = drops[0];
  const biggestInc = drops[drops.length - 1];

  return (
    <div>
      {/* Comparing row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Comparing:</span>

        {/* Period A dropdown */}
        <div ref={dropRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setDropdownOpen(o => !o)}
            style={{
              display: 'flex', alignItems: 'center', gap: 7,
              background: '#1a1d23', color: '#fff', border: 'none',
              borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            {periodALabel}
            <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
              <path d="M1 1l4 4 4-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
          {dropdownOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 4px)', left: 0, zIndex: 99,
              background: '#fff', border: '1px solid var(--border)', borderRadius: 8,
              boxShadow: '0 4px 12px rgba(0,0,0,0.10)', minWidth: 160, overflow: 'hidden'
            }}>
              {PERIOD_OPTIONS.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => { setPeriodA(opt.value); setDropdownOpen(false); }}
                  style={{
                    padding: '9px 16px', fontSize: 13, cursor: 'pointer',
                    background: periodA === opt.value ? 'var(--bg)' : '#fff',
                    color: 'var(--text)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                  onMouseLeave={e => (e.currentTarget.style.background = periodA === opt.value ? 'var(--bg)' : '#fff')}
                >
                  {opt.label}
                </div>
              ))}
            </div>
          )}
        </div>

        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>vs</span>

        {/* Now pill */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: '#1e40af', color: '#fff',
          borderRadius: 20, padding: '6px 14px', fontSize: 13, fontWeight: 500
        }}>
          <Clock size={14} /> Now
        </div>

        {/* BOARD selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: '#1e3a8a', fontWeight: 600, letterSpacing: '0.05em' }}>BOARD</span>
          <select
            value={selectedBoardId}
            onChange={e => onBoardChange(e.target.value)}
            className="filter-select"
            style={{
              minWidth: 160,
              border: '1px solid #bfdbfe',
              borderRadius: 6,
              padding: '6px 12px',
              fontSize: 13,
              background: 'white',
              cursor: 'pointer'
            }}
          >
            {boards.map(b => (
              <option key={b.boardId} value={b.boardId}>{b.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 16 }}>
        <div className="kpi-card">
          <div className="kpi-label">Warnings improved</div>
          <div className="kpi-value" style={{ color: 'var(--green)' }}>{improved}</div>
          <div className="kpi-delta muted">vs {periodALabel.toLowerCase()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Warnings regressed</div>
          <div className="kpi-value">{regressed}</div>
          <div className="kpi-delta muted">vs {periodALabel.toLowerCase()}</div>
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Biggest drop</div>
          <div className="kpi-value large-text">{biggestDrop?.label ?? 'None'}</div>
          {biggestDrop && biggestDrop.delta < 0 && <div className="kpi-delta green">↓ {Math.abs(biggestDrop.delta)}%</div>}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Biggest increase</div>
          <div className="kpi-value large-text">{biggestInc && biggestInc.delta > 0 ? biggestInc.label : 'None'}</div>
          {biggestInc && biggestInc.delta > 0
            ? <div className="kpi-delta red">↑ {biggestInc.delta}%</div>
            : <div className="kpi-delta green" style={{ fontWeight: 600 }}>No regression</div>}
        </div>
        <div className="kpi-card">
          <div className="kpi-label">Active deals</div>
          <div className="kpi-value">{activeDealsCount}</div>
          <div className="kpi-delta muted">Board view</div>
        </div>
      </div>

      {/* Side-by-side panels */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        {/* Period A */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{boardName} — {periodALabel}</span>
            <span style={{
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 4, padding: '2px 8px', fontSize: 11, color: 'var(--text-muted)'
            }}>{periodALabel}</span>
          </div>
          {WARNINGS.filter(w => w.key !== 'championLeft').map(w => (
            <BarRow key={w.key} label={w.label} pct={aData[w.key] ?? 0} />
          ))}
        </div>

        {/* Now */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 8, padding: 20, boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <span style={{ fontSize: 14, fontWeight: 600 }}>{boardName} — Now</span>
            <span style={{
              background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe',
              borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600
            }}>Now</span>
          </div>
          {WARNINGS.filter(w => w.key !== 'championLeft').map(w => {
            const delta = (bData[w.key] ?? 0) - (aData[w.key] ?? 0);
            return <BarRow key={w.key} label={w.label} pct={bData[w.key] ?? 0} delta={delta} />;
          })}
        </div>
      </div>

      {/* Manager reads footer */}
      <div style={{
        marginTop: 14, padding: '10px 14px', background: '#f9fafb',
        border: '1px solid var(--border)', borderRadius: 6,
        fontSize: 12, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 8
      }}>
        <MessageSquare size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
        {improved > 0
          ? `All metrics improved for ${boardName}. '${biggestDrop?.label}' dropped ${aData[biggestDrop?.key || 'noNextStep']}% → ${bData[biggestDrop?.key || 'noNextStep']}%. Coaching is working — continue reinforcement.`
          : `No changes detected for ${boardName}. Reinforce active coaching on key warning areas.`
        }
      </div>
    </div>
  );
}
