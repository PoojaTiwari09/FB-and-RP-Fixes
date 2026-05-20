'use client';
import React from 'react';
import type { CrmSyncStatus } from '../../../types/revenue-graph.types';

/**
 * CRM Sync Status — BRD §6.5 (RG-20 / RG-21 / RG-22)
 * Bi-directional sync with Salesforce, HubSpot, Dynamics 365.
 */

export function CrmSyncTab({ syncStatus, onSync, syncing, syncMsg }: {
  syncStatus: CrmSyncStatus | null; onSync: () => void; syncing: boolean; syncMsg: string;
}) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 16 }}>CRM Sync Status</div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
            RG-20/21/22 · Bi-directional sync — ≤ 10 min latency SLA (NFR §7)
          </div>
        </div>
        <button onClick={onSync} disabled={syncing} style={{
          background: 'linear-gradient(135deg, #38bdf8, #818cf8)', color: '#fff', border: 'none',
          padding: '9px 20px', borderRadius: 8, fontWeight: 600, fontSize: 12,
          cursor: syncing ? 'not-allowed' : 'pointer', opacity: syncing ? .7 : 1,
        }}>{syncing ? 'Syncing…' : 'Trigger Manual Sync'}</button>
      </div>

      {syncMsg && (
        <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', borderRadius: 8, marginBottom: 18, fontSize: 12 }}>{syncMsg}</div>
      )}

      {syncStatus && (
        <div style={{ background: 'rgba(8,14,30,0.5)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr 1fr',
            padding: '14px 20px', fontSize: 10, fontWeight: 700, color: '#64748b',
            letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase' as const,
          }}>
            <span>SOURCE</span><span>ENTITY</span><span>STATUS</span><span>LAST SYNCED</span><span>RECORDS</span>
          </div>
          {syncStatus.syncStates.map((ss, i) => (
            <div key={i} style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.5fr 1fr',
              padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              alignItems: 'center', transition: 'background .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 13, textTransform: 'capitalize' as const }}>{ss.crmSource}</div>
              <div style={{ color: '#cbd5e1', fontSize: 12, textTransform: 'capitalize' as const }}>{ss.entityType}</div>
              <div>
                <span style={{
                  background: ss.status === 'completed' ? 'rgba(16,185,129,0.12)' : ss.status === 'failed' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                  color: ss.status === 'completed' ? '#10b981' : ss.status === 'failed' ? '#ef4444' : '#f59e0b',
                  padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' as const, letterSpacing: .5,
                }}>{ss.status}</span>
              </div>
              <div style={{ color: '#94a3b8', fontSize: 12 }}>
                {ss.lastSyncedAt ? new Date(ss.lastSyncedAt).toLocaleString() : '—'}
              </div>
              <div style={{ color: '#10b981', fontWeight: 700, fontSize: 13 }}>{ss.recordsSynced.toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
