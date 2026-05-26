'use client';
import React from 'react';
import { Theme } from './themeSpotterTypes';
import { ThemeCard } from './ThemeCard';

interface Props {
  themes: Theme[];
  onAccept: (t: Theme) => void;
  onReject: (t: Theme) => void;
  onDeepDive: (t: Theme) => void;
}

export const ThemeReviewPanel: React.FC<Props> = ({ themes, onAccept, onReject, onDeepDive }) => {
  if (themes.length === 0) {
    return (
      <div className="rev-card" style={{ padding: '40px', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '28px' }}>✅</span>
        <h4 style={{ fontSize: '13px', fontWeight: '700', color: 'var(--text-white)', margin: 0 }}>Review queue is empty</h4>
        <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textAlign: 'center' }}>
          All themes have been reviewed. New themes detected by AI will appear here for Accept / Reject decisions.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.2)', borderRadius: '8px' }}>
        <span style={{ fontSize: '14px' }}>⚠️</span>
        <p style={{ fontSize: '11px', fontWeight: '600', color: '#d97706', margin: 0 }}>
          <strong>{themes.length}</strong> new theme{themes.length !== 1 ? 's' : ''} detected by AI — review and Accept or Reject each one before they appear on the main dashboard.
        </p>
      </div>
      {themes.map(theme => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          onDeepDive={onDeepDive}
          onAccept={onAccept}
          onReject={onReject}
          showActions={true}
        />
      ))}
    </div>
  );
};
