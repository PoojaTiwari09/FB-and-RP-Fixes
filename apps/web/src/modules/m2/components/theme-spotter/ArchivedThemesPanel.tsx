'use client';
import React from 'react';
import { Theme } from './themeSpotterTypes';

interface Props {
  themes: Theme[];
  onRestore: (t: Theme) => void;
}

export const ArchivedThemesPanel: React.FC<Props> = ({ themes, onRestore }) => {
  if (themes.length === 0) {
    return (
      <div className="rev-card" style={{ padding: '40px', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '10px' }}>
        <span style={{ fontSize: '28px' }}>📦</span>
        <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textAlign: 'center' }}>No archived themes. Rejected or manually archived themes will appear here.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <p style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', margin: 0 }}>
        {themes.length} archived theme{themes.length !== 1 ? 's' : ''} — restore to bring back to main dashboard.
      </p>
      {themes.map(theme => (
        <div key={theme.id} className="rev-card" style={{ alignItems: 'center', gap: '12px', flexWrap: 'wrap', opacity: 0.85 }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-white)', margin: 0 }}>{theme.name}</h4>
            <p style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', lineHeight: 1.4 }}>{theme.summary}</p>
            <div style={{ display: 'flex', gap: '14px', marginTop: '4px', fontSize: '10px', color: '#94a3b8', fontWeight: '600' }}>
              <span>📞 {theme.callCount} calls</span>
              <span>Conf: {Math.round(theme.confidenceScore * 100)}%</span>
              <span>Archived: {new Date(theme.updatedAt).toLocaleDateString()}</span>
            </div>
          </div>
          <button
            className="rev-btn-secondary"
            style={{ fontSize: '11px', padding: '5px 12px', flexShrink: 0 }}
            onClick={() => onRestore(theme)}
          >
            Restore
          </button>
        </div>
      ))}
    </div>
  );
};
