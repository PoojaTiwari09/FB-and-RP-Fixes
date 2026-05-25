'use client';
import React from 'react';
import { Theme } from './themeSpotterTypes';

interface Props {
  theme: Theme;
  onDeepDive: (t: Theme) => void;
  onAccept?: (t: Theme) => void;
  onReject?: (t: Theme) => void;
  onArchive?: (t: Theme) => void;
  showActions?: boolean;
}

const TREND_STYLE: Record<string, { label: string; color: string; bg: string }> = {
  RISING:   { label: '↑ Rising',   color: '#16a34a', bg: 'rgba(34,197,94,0.1)' },
  STABLE:   { label: '→ Stable',   color: '#d97706', bg: 'rgba(234,179,8,0.1)' },
  DECLINING:{ label: '↓ Declining',color: '#dc2626', bg: 'rgba(239,68,68,0.1)' },
};

export const ThemeCard: React.FC<Props> = ({ theme, onDeepDive, onAccept, onReject, onArchive, showActions }) => {
  const trend = TREND_STYLE[theme.trend] || TREND_STYLE.STABLE;
  const confHigh = theme.confidenceScore >= 0.70;

  return (
    <div className="rev-card" style={{ flexDirection: 'column', gap: '12px' }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-white)', margin: 0 }}>{theme.name}</h3>
          <p style={{ fontSize: '11px', color: '#64748b', marginTop: '4px', lineHeight: 1.5 }}>{theme.summary}</p>
        </div>
        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
          <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 8px', borderRadius: '99px', background: trend.bg, color: trend.color }}>{trend.label}</span>
          <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 8px', borderRadius: '99px', background: confHigh ? 'rgba(34,197,94,0.1)' : 'rgba(234,179,8,0.1)', color: confHigh ? '#16a34a' : '#d97706' }}>
            {Math.round(theme.confidenceScore * 100)}% Conf
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'flex', gap: '20px', fontSize: '11px', color: '#64748b', fontWeight: '600' }}>
        <span>📞 <strong style={{ color: 'var(--text-white)' }}>{theme.callCount}</strong> calls</span>
        <span>🏢 <strong style={{ color: 'var(--text-white)' }}>{theme.accountCount}</strong> accounts</span>
        <span>💰 <strong style={{ color: 'var(--text-white)' }}>${theme.associatedRevenue.toLocaleString()}</strong> pipeline</span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', paddingTop: '8px', borderTop: '1px solid var(--border-slate)' }}>
        <button className="rev-btn-primary" style={{ fontSize: '11px', padding: '5px 12px' }} onClick={() => onDeepDive(theme)}>
          Deep Dive →
        </button>
        {showActions && onAccept && (
          <button className="rev-btn-secondary" style={{ fontSize: '11px', padding: '5px 10px', borderColor: 'rgba(34,197,94,0.4)', color: '#16a34a' }} onClick={() => onAccept(theme)}>
            Accept
          </button>
        )}
        {showActions && onReject && (
          <button className="rev-btn-secondary" style={{ fontSize: '11px', padding: '5px 10px', borderColor: 'rgba(239,68,68,0.3)', color: '#dc2626' }} onClick={() => onReject(theme)}>
            Reject
          </button>
        )}
        {onArchive && !showActions && (
          <button className="rev-btn-secondary" style={{ fontSize: '11px', padding: '5px 10px' }} onClick={() => onArchive(theme)}>
            Archive
          </button>
        )}
      </div>
    </div>
  );
};
