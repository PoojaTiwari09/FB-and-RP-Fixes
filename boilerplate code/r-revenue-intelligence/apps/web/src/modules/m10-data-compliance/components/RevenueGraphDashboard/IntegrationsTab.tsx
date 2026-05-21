/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState } from 'react';

/**
 * Integration Hub — BRD §6.6 (RG-23 / RG-24 / RG-25)
 * Admin-facing configuration surface for connected tools.
 * Supports CRM, email, calendar, telephony, video, sales engagement, intent, content, data cloud.
 */

export function IntegrationsTab({ integrations }: { integrations: any[] }) {
  const [catFilter, setCatFilter] = useState('All');
  const categories = ['All', ...Array.from(new Set(integrations.map(i => i.category)))];
  const filtered = catFilter === 'All' ? integrations : integrations.filter(i => i.category === catFilter);
  const connected = integrations.filter(i => i.status === 'connected').length;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 16 }}>Integration Hub</div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
            RG-23 · {connected}/{integrations.length} connected · Revenue stack integrations
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' as const }}>
          {categories.map(c => (
            <button key={c} onClick={() => setCatFilter(c)} style={{
              background: catFilter === c ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: catFilter === c ? '1px solid rgba(0,240,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
              color: catFilter === c ? '#00f0ff' : '#94a3b8',
              padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>{c}</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {filtered.map(int => (
          <div key={int.id} style={{
            background: 'rgba(8,14,30,0.55)', border: `1px solid ${int.status === 'connected' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)'}`,
            borderRadius: 12, padding: '18px 20px', transition: 'border-color .25s, transform .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = int.status === 'connected' ? 'rgba(16,185,129,0.35)' : 'rgba(239,68,68,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = int.status === 'connected' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.12)'; }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 24 }}>{int.icon}</span>
                <div>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 14 }}>{int.name}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{int.category}</div>
                </div>
              </div>
              <span style={{
                background: int.status === 'connected' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.1)',
                color: int.status === 'connected' ? '#10b981' : '#ef4444',
                padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700,
                border: `1px solid ${int.status === 'connected' ? 'rgba(16,185,129,0.25)' : 'rgba(239,68,68,0.2)'}`,
                textTransform: 'uppercase' as const, letterSpacing: .5,
              }}>{int.status === 'connected' ? '● Connected' : '○ Disconnected'}</span>
            </div>

            {int.status === 'connected' && (
              <div style={{ display: 'flex', gap: 16, fontSize: 11, color: '#94a3b8' }}>
                <div><span style={{ color: '#64748b' }}>Sync:</span> {int.syncFrequency}</div>
                <div><span style={{ color: '#64748b' }}>Records:</span> <span style={{ color: '#10b981', fontWeight: 600 }}>{int.recordsSynced.toLocaleString()}</span></div>
                {int.lastSync && <div><span style={{ color: '#64748b' }}>Last:</span> {new Date(int.lastSync).toLocaleTimeString()}</div>}
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: '14px 18px', background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.12)', borderRadius: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🔌</span>
          <div>
            <div style={{ color: '#a5b4fc', fontSize: 12, fontWeight: 600 }}>MCP Client & Server Support (RG-24)</div>
            <div style={{ color: '#64748b', fontSize: 11, marginTop: 2 }}>Revenue Graph operates as both MCP client and server — enabling cross-platform AI workflows with compatible systems.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
