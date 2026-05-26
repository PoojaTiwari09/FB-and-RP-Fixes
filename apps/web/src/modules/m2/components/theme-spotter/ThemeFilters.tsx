'use client';
import React from 'react';
import { ThemeFiltersState } from './themeSpotterTypes';

interface Props {
  filters: ThemeFiltersState;
  onChange: (f: ThemeFiltersState) => void;
  activeView: 'themes' | 'pending' | 'archived' | 'alerts';
  onViewChange: (v: 'themes' | 'pending' | 'archived' | 'alerts') => void;
}

export const ThemeFilters: React.FC<Props> = ({ filters, onChange, activeView, onViewChange }) => {
  const tabs: { key: typeof activeView; label: string }[] = [
    { key: 'themes', label: 'All Themes' },
    { key: 'pending', label: 'Pending Review' },
    { key: 'archived', label: 'Archived' },
    { key: 'alerts', label: 'Alerts' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '8px', padding: '3px', border: '1px solid var(--border-slate)' }}>
        {tabs.map(t => {
          const isActive = activeView === t.key;
          return (
            <button
              key={t.key}
              onClick={() => onViewChange(t.key)}
              style={{
                flex: 1, padding: '8px 12px', fontSize: '11px', fontWeight: '700',
                border: 'none', borderRadius: '6px', cursor: 'pointer',
                transition: 'all 0.2s ease',
                background: isActive ? '#ffffff' : 'transparent',
                color: isActive ? 'var(--accent-purple)' : '#64748b',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Search + filter strip */}
      {activeView !== 'alerts' && (
        <div className="rev-chart-box" style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
          <div style={{ flex: '1', minWidth: '200px' }}>
            <input
              type="text"
              className="rev-input"
              placeholder="Search themes by name or summary..."
              value={filters.search}
              onChange={e => onChange({ ...filters, search: e.target.value })}
            />
          </div>
          <select
            className="rev-select"
            style={{ width: '150px' }}
            value={filters.trend}
            onChange={e => onChange({ ...filters, trend: e.target.value })}
          >
            <option value="">All Trends</option>
            <option value="RISING">Rising</option>
            <option value="STABLE">Stable</option>
            <option value="DECLINING">Declining</option>
          </select>
        </div>
      )}
    </div>
  );
};
