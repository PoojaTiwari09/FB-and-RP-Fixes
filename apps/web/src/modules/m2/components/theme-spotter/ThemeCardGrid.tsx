'use client';
import React from 'react';
import { Theme } from './themeSpotterTypes';
import { ThemeCard } from './ThemeCard';

interface Props {
  themes: Theme[];
  onDeepDive: (t: Theme) => void;
  onAccept?: (t: Theme) => void;
  onReject?: (t: Theme) => void;
  onArchive?: (t: Theme) => void;
  showActions?: boolean;
  emptyMessage?: string;
}

export const ThemeCardGrid: React.FC<Props> = ({ themes, onDeepDive, onAccept, onReject, onArchive, showActions, emptyMessage }) => {
  if (themes.length === 0) {
    return (
      <div className="rev-card" style={{ padding: '40px', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: '12px' }}>
        <span style={{ fontSize: '32px' }}>🔍</span>
        <p style={{ fontSize: '13px', color: '#64748b', fontWeight: '600', textAlign: 'center' }}>
          {emptyMessage || 'No themes found. Create a theme analysis to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {themes.map(theme => (
        <ThemeCard
          key={theme.id}
          theme={theme}
          onDeepDive={onDeepDive}
          onAccept={onAccept}
          onReject={onReject}
          onArchive={onArchive}
          showActions={showActions}
        />
      ))}
    </div>
  );
};
