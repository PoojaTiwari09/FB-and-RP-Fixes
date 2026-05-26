'use client';
import React from 'react';
import { Theme } from './themeSpotterTypes';

interface Props {
  theme: Theme;
  onClose: () => void;
}

const OUTCOME_DATA = [
  { label: 'Closed Won', pct: 28, color: '#16a34a' },
  { label: 'Closed Lost', pct: 41, color: '#dc2626' },
  { label: 'Stalled / At Risk', pct: 19, color: '#d97706' },
  { label: 'In Progress', pct: 12, color: '#64748b' },
];

export const ThemeDeepDivePanel: React.FC<Props> = ({ theme, onClose }) => {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div className="rev-dialog-sheet" style={{ maxWidth: '720px', width: '100%', maxHeight: '90vh', overflowY: 'auto', height: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--border-slate)', flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: '800', color: 'var(--text-white)', margin: 0 }}>{theme.name}</h2>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Theme Deep Dive · {theme.callCount} conversations · {Math.round(theme.confidenceScore * 100)}% confidence</p>
          </div>
          <button className="rev-btn-secondary" style={{ padding: '5px 10px', fontSize: '11px' }} onClick={onClose}>✕ Close</button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Summary */}
          <div className="rev-chart-box" style={{ padding: '14px' }}>
            <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Theme Summary</h4>
            <p style={{ fontSize: '12px', color: 'var(--text-white)', lineHeight: 1.6 }}>{theme.summary}</p>
          </div>

          {/* Deal Outcome Correlation */}
          <div className="rev-chart-box" style={{ padding: '14px' }}>
            <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Deal Outcome Correlation</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {OUTCOME_DATA.map(o => (
                <div key={o.label} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '11px', color: '#64748b', width: '110px', flexShrink: 0 }}>{o.label}</span>
                  <div style={{ flex: 1, height: '8px', background: 'var(--border-slate)', borderRadius: '99px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${o.pct}%`, background: o.color, borderRadius: '99px', transition: 'width 0.4s ease' }} />
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: '700', color: o.color, width: '36px', textAlign: 'right' }}>{o.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Representative Quotes */}
          {theme.quotes && theme.quotes.length > 0 && (
            <div className="rev-chart-box" style={{ padding: '14px' }}>
              <h4 style={{ fontSize: '11px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', marginBottom: '12px' }}>Representative Quotes</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {theme.quotes.map(q => (
                  <div key={q.id} style={{ background: '#f8fafc', border: '1px solid var(--border-slate)', borderLeft: '3px solid var(--accent-purple)', borderRadius: '8px', padding: '10px 14px' }}>
                    <p style={{ fontSize: '12px', color: 'var(--text-slate-300)', lineHeight: 1.5, margin: 0 }}>"{q.snippet}"</p>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px', fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>
                      <span>Speaker: {q.speakerSide}</span>
                      <span>Confidence: {Math.round(q.confidenceScore * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            {[
              { label: 'Calls Matched', value: theme.callCount },
              { label: 'Accounts', value: theme.accountCount },
              { label: 'Pipeline Value', value: `$${theme.associatedRevenue.toLocaleString()}` },
            ].map(s => (
              <div key={s.label} className="rev-chart-box" style={{ padding: '12px', textAlign: 'center' }}>
                <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>{s.label}</span>
                <strong style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-white)' }}>{s.value}</strong>
              </div>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
};
