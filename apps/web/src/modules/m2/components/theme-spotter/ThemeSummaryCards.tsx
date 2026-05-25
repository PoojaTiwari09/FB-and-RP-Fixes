'use client';
import React from 'react';
import { Theme, ThemeAlert } from './themeSpotterTypes';

interface Props {
  themes: Theme[];
  alerts: ThemeAlert[];
  callsAnalyzed: number;
}

export const ThemeSummaryCards: React.FC<Props> = ({ themes, alerts, callsAnalyzed }) => {
  const totalThemes = themes.length;
  const newThemes = themes.filter(t => t.status === 'PENDING_REVIEW').length;
  const activeAlerts = alerts.filter(a => a.isActive).length;

  const cards = [
    { label: 'Total Themes', value: totalThemes, color: 'var(--accent-purple)', bg: 'rgba(99,102,241,0.1)' },
    { label: 'Calls Analyzed', value: callsAnalyzed, color: '#16a34a', bg: 'rgba(34,197,94,0.1)' },
    { label: 'New Themes', value: newThemes, color: '#d97706', bg: 'rgba(234,179,8,0.1)' },
    { label: 'Active Alerts', value: activeAlerts, color: '#dc2626', bg: 'rgba(239,68,68,0.1)' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
      {cards.map(c => (
        <div key={c.label} className="rev-chart-box" style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '16px' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '18px', fontWeight: '800', color: c.color }}>{c.value}</span>
          </div>
          <div>
            <span style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>{c.label}</span>
            <h4 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-white)', margin: 0 }}>{c.value}</h4>
          </div>
        </div>
      ))}
    </div>
  );
};
