/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState, useEffect } from 'react';
import { fetchConnections, fetchExportRuns } from '../../api/data-cloud.api';
import { ConnectionsTab } from './ConnectionsTab';
import { RunHistoryTab } from './RunHistoryTab';
import { ReplayTab } from './ReplayTab';

const tabBtn = (active: boolean): React.CSSProperties => ({
  background: active ? 'rgba(99,102,241,0.1)' : 'transparent',
  border: active ? '1px solid rgba(99,102,241,0.25)' : '1px solid transparent',
  color: active ? '#818cf8' : '#94a3b8',
  padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 500,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
  transition: 'all .2s ease', whiteSpace: 'nowrap' as const,
});

type TabKey = 'overview' | 'connections' | 'runs' | 'replay';

export default function DataCloudDashboard() {
  const [tab, setTab]                = useState<TabKey>('overview');
  const [connections, setConnections] = useState<any[]>([]);
  const [runs, setRuns]              = useState<any[]>([]);
  const [loading, setLoading]        = useState(true);
  const [error, setError]            = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const [c, r] = await Promise.all([fetchConnections(), fetchExportRuns()]);
      setConnections(c ?? []); setRuns(r ?? []);
    } catch (e: any) { setError(e.message ?? 'Load failed'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const successRuns = runs.filter(r => r.status === 'success').length;
  const failedRuns  = runs.filter(r => r.status === 'failed').length;
  const totalRows   = runs.reduce((s, r) => s + (r.rowsExported ?? 0), 0);
  const activeConns = connections.filter(c => c.isActive).length;
  const lastRun     = runs[0];

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview',    label: 'Overview',       icon: '☁️' },
    { key: 'connections', label: 'Connections',    icon: '🔌' },
    { key: 'runs',        label: 'Export History', icon: '📋' },
    { key: 'replay',      label: 'Replay',         icon: '▶️' },
  ];

  const card = (accent?: string): React.CSSProperties => ({
    background: 'rgba(8,14,30,0.55)', backdropFilter: 'blur(16px)',
    border: `1px solid ${accent ? accent + '30' : 'rgba(255,255,255,0.08)'}`,
    borderRadius: 14, padding: '22px 26px',
    transition: 'border-color .25s, box-shadow .25s',
  });

  return (
    <div style={{ paddingBottom: 48 }}>

      {/* ── HEADER ──────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <span style={{ fontSize: 28 }}>☁️</span>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: '#f8fafc', margin: 0 }}>Data Cloud</h2>
            <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Your data, in your warehouse — automatically</div>
          </div>
          <span style={{ marginLeft: 'auto', background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.25)', padding: '4px 12px', borderRadius: 99, fontSize: 11, fontWeight: 700 }}>
            ● Active
          </span>
        </div>
        <div style={{ color: '#64748b', fontSize: 13, maxWidth: 800, lineHeight: 1.7, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 16px' }}>
          Data Cloud automatically exports all your platform records — accounts, contacts, deals, activities, and AI scores — directly into your own data warehouse every day. Your team gets full access to raw data for BI, reporting, and compliance without manual intervention.
        </div>
      </div>

      {error && (
        <div style={{ padding: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ── TAB BAR ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={tabBtn(tab === t.key)}>
            <span style={{ fontSize: 15 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
          <div style={{ fontSize: 42, marginBottom: 16 }}>☁️</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Loading Data Cloud…</div>
        </div>
      ) : (
        <>
          {/* ── OVERVIEW ──────────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div>

              {/* KPI row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 16, marginBottom: 28 }}>
                {[
                  { label: 'Active Connections', value: activeConns, sub: `${connections.length} warehouse${connections.length !== 1 ? 's' : ''} configured`, color: '#818cf8' },
                  { label: 'Successful Exports', value: successRuns, sub: `${failedRuns} failed · ${runs.length} total`, color: '#10b981' },
                  { label: 'Total Rows Exported', value: totalRows.toLocaleString(), sub: 'across all datasets', color: '#38bdf8' },
                  { label: 'Last Export', value: lastRun ? new Date(lastRun.startedAt).toLocaleDateString() : '—', sub: lastRun ? (lastRun.status === 'success' ? '✅ Completed' : '❌ Failed') : 'No exports yet', color: '#f59e0b' },
                ].map(s => (
                  <div key={s.label} style={card(s.color)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + '55'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = s.color + '30'; }}>
                    <div style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', letterSpacing: .8, marginBottom: 10, textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: s.color }}>{s.value}</div>
                    {s.sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{s.sub}</div>}
                  </div>
                ))}
              </div>

              {/* What gets exported */}
              <div style={{ ...card(), marginBottom: 18 }}>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 15, marginBottom: 16 }}>What Gets Exported</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
                  {[
                    { name: 'Accounts', icon: '🏢', desc: 'Company profiles & domains' },
                    { name: 'Contacts', icon: '👤', desc: 'People & roles' },
                    { name: 'Deals', icon: '💼', desc: 'Pipeline & stages' },
                    { name: 'Activities', icon: '⚡', desc: 'Calls, emails & meetings' },
                    { name: 'AI Scores', icon: '🤖', desc: 'Deal health & risk scores' },
                    { name: 'Briefs', icon: '📄', desc: 'AI-generated summaries' },
                  ].map(d => (
                    <div key={d.name} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div style={{ fontSize: 20, marginBottom: 6 }}>{d.icon}</div>
                      <div style={{ color: '#f8fafc', fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{d.name}</div>
                      <div style={{ color: '#64748b', fontSize: 11 }}>{d.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* How it works + Privacy side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginBottom: 18 }}>
                <div style={card('#6366f1')}>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 15, marginBottom: 14 }}>How Automated Exports Work</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { icon: '⏰', title: 'Runs Every Day at 02:00 AM UTC', desc: 'Scheduled automatically — no manual action needed' },
                      { icon: '🔒', title: 'One Export at a Time', desc: 'Prevents duplicate runs even if something retries' },
                      { icon: '♻️', title: 'Safe to Re-run Anytime', desc: 'Retrying never creates duplicate data in your warehouse' },
                      { icon: '📍', title: 'Picks Up Where It Left Off', desc: 'Watermark tracking ensures no data is missed or duplicated' },
                    ].map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 16, marginTop: 1 }}>{s.icon}</span>
                        <div>
                          <div style={{ color: '#f8fafc', fontSize: 12, fontWeight: 600 }}>{s.title}</div>
                          <div style={{ color: '#64748b', fontSize: 11, marginTop: 2, lineHeight: 1.5 }}>{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div style={card('#10b981')}>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 15, marginBottom: 14 }}>Privacy & Compliance</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                      { icon: '🛡️', title: 'GDPR Data Portability', desc: 'Supports your right-to-data-portability obligations automatically' },
                      { icon: '🚫', title: 'Deletion Propagation', desc: 'Deleted or restricted records are excluded from every export' },
                      { icon: '🏢', title: 'Strict Tenant Isolation', desc: 'Your data never touches another customer\'s warehouse' },
                      { icon: '🔐', title: 'Credentials Stay Secret', desc: 'Warehouse credentials are never stored in plain text' },
                    ].map((s, i) => (
                      <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                        <span style={{ fontSize: 16, marginTop: 1 }}>{s.icon}</span>
                        <div>
                          <div style={{ color: '#f8fafc', fontSize: 12, fontWeight: 600 }}>{s.title}</div>
                          <div style={{ color: '#64748b', fontSize: 11, marginTop: 2, lineHeight: 1.5 }}>{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Supported destinations */}
              <div style={card()}>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 15, marginBottom: 6 }}>Supported Warehouses</div>
                <div style={{ color: '#64748b', fontSize: 12, marginBottom: 16 }}>Connect your preferred data destination. More warehouses are added continuously.</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  {[
                    { dest: 'PostgreSQL', icon: '🐘', color: '#38bdf8', tag: 'Available' },
                    { dest: 'Snowflake',  icon: '❄️', color: '#818cf8', tag: 'Coming Soon' },
                    { dest: 'BigQuery',   icon: '🔷', color: '#f59e0b', tag: 'Coming Soon' },
                    { dest: 'Amazon S3',  icon: '🪣', color: '#f97316', tag: 'Coming Soon' },
                    { dest: 'Databricks', icon: '🧱', color: '#e11d48', tag: 'Coming Soon' },
                    { dest: 'Redshift',   icon: '🔴', color: '#ef4444', tag: 'Coming Soon' },
                  ].map(d => (
                    <div key={d.dest} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', border: `1px solid ${d.color}20`, textAlign: 'center' as const }}>
                      <div style={{ fontSize: 22, marginBottom: 6 }}>{d.icon}</div>
                      <div style={{ color: '#cbd5e1', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>{d.dest}</div>
                      <span style={{
                        background: d.tag === 'Available' ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.1)',
                        color: d.tag === 'Available' ? '#10b981' : '#64748b',
                        border: `1px solid ${d.tag === 'Available' ? 'rgba(16,185,129,0.25)' : 'rgba(100,116,139,0.15)'}`,
                        fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 99
                      }}>{d.tag}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {tab === 'connections' && <ConnectionsTab connections={connections} onRefresh={loadData} />}
          {tab === 'runs'        && <RunHistoryTab runs={runs} />}
          {tab === 'replay'      && <ReplayTab connections={connections} />}
        </>
      )}

      {/* ── FOOTER ──────────────────────────────────────────────────── */}
      <div style={{ marginTop: 40, padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#475569', fontSize: 11, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <span>☁️ Data Cloud — Automated Warehouse Export</span>
        <span>🛡️ GDPR · Data Portability · Tenant Isolated</span>
        <span>♻️ Idempotent · Safe to replay</span>
        <span>🕐 Daily at 02:00 UTC</span>
        <span>🔒 Credentials encrypted at rest</span>
      </div>
    </div>
  );
}
