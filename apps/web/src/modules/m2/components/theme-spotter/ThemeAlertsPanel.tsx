'use client';
import React, { useState } from 'react';
import { ThemeAlert, Theme } from './themeSpotterTypes';

interface Props {
  alerts: ThemeAlert[];
  themes: Theme[];
  apiBaseUrl: string;
  tenantId: string;
  onAlertsChange: (alerts: ThemeAlert[]) => void;
}

export const ThemeAlertsPanel: React.FC<Props> = ({ alerts, themes, apiBaseUrl, tenantId, onAlertsChange }) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newAlert, setNewAlert] = useState({ themeId: '', conditionType: 'COUNT_THRESHOLD', thresholdValue: 10, timeWindowDays: 7 });

  const acceptedThemes = themes.filter(t => t.status === 'ACCEPTED');

  const handleToggle = async (alert: ThemeAlert) => {
    try {
      await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/theme-alerts/${alert.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify({ isActive: !alert.isActive, thresholdValue: alert.thresholdValue, timeWindowDays: alert.timeWindowDays }),
      });
      onAlertsChange(alerts.map(a => a.id === alert.id ? { ...a, isActive: !a.isActive } : a));
    } catch { /* silent */ }
  };

  const handleCreate = async () => {
    if (!newAlert.themeId) return;
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/m02-conversation-intelligence/theme-alerts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-tenant-id': tenantId },
        body: JSON.stringify(newAlert),
      });
      const created = await res.json();
      onAlertsChange([created, ...alerts]);
      setShowCreate(false);
      setNewAlert({ themeId: '', conditionType: 'COUNT_THRESHOLD', thresholdValue: 10, timeWindowDays: 7 });
    } catch { /* silent */ }
  };

  const themeName = (id: string) => themes.find(t => t.id === id)?.name || id;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-white)', margin: 0 }}>Alert Configurations</h3>
        <button className="rev-btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => setShowCreate(true)}>+ New Alert</button>
      </div>

      {showCreate && (
        <div className="rev-chart-box" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h4 style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-white)', margin: 0 }}>Configure Alert</h4>
          <select className="rev-select" value={newAlert.themeId} onChange={e => setNewAlert({ ...newAlert, themeId: e.target.value })}>
            <option value="">Select Theme...</option>
            {acceptedThemes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
          <select className="rev-select" value={newAlert.conditionType} onChange={e => setNewAlert({ ...newAlert, conditionType: e.target.value as any })}>
            <option value="COUNT_THRESHOLD">Mention Count Threshold</option>
            <option value="TREND_CHANGE">Trend Change</option>
          </select>
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Threshold Value</label>
              <input type="number" className="rev-input" value={newAlert.thresholdValue} onChange={e => setNewAlert({ ...newAlert, thresholdValue: Number(e.target.value) })} min={1} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '10px', fontWeight: '700', color: '#64748b', display: 'block', marginBottom: '4px' }}>Window (days)</label>
              <input type="number" className="rev-input" value={newAlert.timeWindowDays} onChange={e => setNewAlert({ ...newAlert, timeWindowDays: Number(e.target.value) })} min={1} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            <button className="rev-btn-secondary" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={() => setShowCreate(false)}>Cancel</button>
            <button className="rev-btn-primary" style={{ fontSize: '11px', padding: '6px 12px' }} onClick={handleCreate}>Save Alert</button>
          </div>
        </div>
      )}

      {alerts.length === 0 ? (
        <div className="rev-card" style={{ justifyContent: 'center', alignItems: 'center', padding: '32px' }}>
          <p style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>No alerts configured yet.</p>
        </div>
      ) : (
        alerts.map(alert => (
          <div key={alert.id} className="rev-card" style={{ alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--text-white)' }}>{themeName(alert.themeId)}</span>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: '600', marginTop: '2px' }}>
                {alert.conditionType === 'COUNT_THRESHOLD' ? `Triggers when mentions > ${alert.thresholdValue} in ${alert.timeWindowDays} days` : `Triggers on trend change within ${alert.timeWindowDays} days`}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '9px', fontWeight: '800', padding: '2px 8px', borderRadius: '99px', background: alert.isActive ? 'rgba(34,197,94,0.1)' : '#f1f5f9', color: alert.isActive ? '#16a34a' : '#94a3b8' }}>
                {alert.isActive ? 'Active' : 'Inactive'}
              </span>
              <button className="rev-btn-secondary" style={{ fontSize: '10px', padding: '4px 10px' }} onClick={() => handleToggle(alert)}>
                {alert.isActive ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
};
