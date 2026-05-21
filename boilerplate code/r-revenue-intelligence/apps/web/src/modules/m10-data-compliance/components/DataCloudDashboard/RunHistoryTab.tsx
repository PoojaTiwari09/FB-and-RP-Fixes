/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React from 'react';

const STATUS_CONFIG: Record<string, { color: string; bg: string; icon: string }> = {
  success: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', icon: '✅' },
  failed:  { color: '#ef4444', bg: 'rgba(239,68,68,0.12)',  icon: '❌' },
  running: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', icon: '🔄' },
  pending: { color: '#818cf8', bg: 'rgba(129,140,248,0.12)', icon: '⏳' },
};

const DEST_ICONS: Record<string, string> = {
  postgres: '🐘', snowflake: '❄️', bigquery: '🔷', s3: '🪣', databricks: '🧱', redshift: '🔴',
};

const card: React.CSSProperties = {
  background: 'rgba(8,14,30,0.55)', backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px',
};

interface Props { runs: any[]; }

export function RunHistoryTab({ runs }: Props) {
  const totalRows = runs.reduce((s, r) => s + (r.rowsExported ?? 0), 0);
  const successCount = runs.filter(r => r.status === 'success').length;
  const failedCount  = runs.filter(r => r.status === 'failed').length;

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 16 }}>Export Run History</div>
        <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Full audit trail of all warehouse exports · Daily at 02:00 UTC</div>
      </div>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Total Runs', value: runs.length, color: '#818cf8' },
          { label: 'Successful', value: successCount, color: '#10b981' },
          { label: 'Failed', value: failedCount, color: '#ef4444' },
          { label: 'Rows Exported', value: totalRows.toLocaleString(), color: '#38bdf8' },
        ].map(s => (
          <div key={s.label} style={{ ...card, border: `1px solid ${s.color}25` }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>{s.label}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {runs.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '60px 24px', color: '#475569' }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>📋</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b' }}>No export runs yet</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Runs will appear here after the first scheduled export at 02:00 UTC or a manual replay.</div>
        </div>
      ) : (
        <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 1fr 1.5fr 1.5fr',
            padding: '14px 20px', fontSize: 10, fontWeight: 700, color: '#64748b',
            letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase' as const,
          }}>
            <span>RUN ID</span><span>DESTINATION</span><span>STATUS</span>
            <span>ROWS</span><span>STARTED</span><span>DURATION</span>
          </div>

          {runs.map(r => {
            const sc = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.pending;
            const started = new Date(r.startedAt);
            const completed = r.completedAt ? new Date(r.completedAt) : null;
            const durationMs = completed ? completed.getTime() - started.getTime() : null;
            const duration = durationMs
              ? durationMs > 60000
                ? `${Math.floor(durationMs / 60000)}m ${Math.floor((durationMs % 60000) / 1000)}s`
                : `${Math.floor(durationMs / 1000)}s`
              : '—';

            return (
              <div key={r.runId} style={{
                display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr 1fr 1.5fr 1.5fr',
                padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
                alignItems: 'center', transition: 'background .15s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                <div style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>{r.runId.slice(0, 10)}…</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{DEST_ICONS[r.destination] ?? '🔌'}</span>
                  <span style={{ color: '#cbd5e1', fontSize: 12, textTransform: 'capitalize' }}>{r.destination ?? '—'}</span>
                </div>
                <div>
                  <span style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.color}40`, padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>
                    {sc.icon} {r.status}
                  </span>
                  {r.errorMessage && (
                    <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.errorMessage}>
                      {r.errorMessage}
                    </div>
                  )}
                </div>
                <div style={{ color: '#38bdf8', fontWeight: 600, fontSize: 13 }}>{r.rowsExported?.toLocaleString() ?? 0}</div>
                <div style={{ color: '#64748b', fontSize: 11 }}>{started.toLocaleString()}</div>
                <div style={{ color: '#94a3b8', fontSize: 12 }}>{duration}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
