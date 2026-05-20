'use client';
import React, { useState, useEffect } from 'react';
import { fetchAccounts, fetchDeals, fetchCrmSyncStatus, triggerCrmSync } from '../../api/revenue-graph.api';
import type { Account, Deal, CrmSyncStatus } from '../../types/revenue-graph.types';
import { MOCK_ACTIVITIES, MOCK_CAPTURE_STATS, MOCK_INTEGRATIONS, MOCK_COMPLIANCE } from '../../mocks/revenue-graph.mocks';
import { GraphTab } from './GraphTab';
import { ActivitiesTab } from './ActivitiesTab';
import { DealsTab } from './DealsTab';
import { AccountsTab } from './AccountsTab';
import { CrmSyncTab } from './CrmSyncTab';
import { IntegrationsTab } from './IntegrationsTab';
import { ComplianceTab } from './ComplianceTab';

/* ── Shared inline style helpers ──────────────────────────────────────────── */
const card = (accent?: string): React.CSSProperties => ({
  background: 'rgba(8, 14, 30, 0.55)', backdropFilter: 'blur(16px)',
  border: `1px solid ${accent ? accent + '30' : 'rgba(255,255,255,0.08)'}`,
  borderRadius: 14, padding: '22px 26px', flex: 1, minWidth: 170,
  transition: 'border-color .25s, box-shadow .25s',
});

const tabBtn = (active: boolean): React.CSSProperties => ({
  background: active ? 'rgba(0,240,255,0.08)' : 'transparent',
  border: active ? '1px solid rgba(0,240,255,0.18)' : '1px solid transparent',
  color: active ? '#00f0ff' : '#94a3b8',
  padding: '9px 18px', borderRadius: 8, fontSize: 13, fontWeight: active ? 600 : 500,
  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
  transition: 'all .2s ease', whiteSpace: 'nowrap' as const,
});

type TabKey = 'overview' | 'graph' | 'deals' | 'accounts' | 'timeline' | 'integrations' | 'compliance';

export default function RevenueGraphDashboard() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [syncStatus, setSyncStatus] = useState<CrmSyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [a, d, s] = await Promise.all([fetchAccounts(), fetchDeals(), fetchCrmSyncStatus()]);
        setAccounts(a?.data ?? []); setDeals(d?.data ?? []); setSyncStatus(s ?? null);
      } catch (e: any) { setError(e.message ?? 'Load failed'); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleSync = async () => {
    setSyncing(true); setSyncMsg('');
    try {
      await triggerCrmSync({ crmSource: 'salesforce', entityTypes: ['deals'] });
      setSyncMsg('CRM Sync triggered — all entities queued for bi-directional sync.');
    } catch (e: any) { setSyncMsg('Sync failed: ' + e.message); }
    finally { setSyncing(false); setTimeout(() => setSyncMsg(''), 5000); }
  };

  const stats = MOCK_CAPTURE_STATS;
  const activeDeals = deals.filter(d => d.isActive);
  const pipelineValue = deals.reduce((s, d) => s + (d.amount ?? 0), 0);

  const tabs: { key: TabKey; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '📊' },
    { key: 'graph', label: 'Revenue Graph', icon: '🕸️' },
    { key: 'timeline', label: 'Activity Timeline', icon: '⚡' },
    { key: 'deals', label: 'Deals', icon: '💼' },
    { key: 'accounts', label: 'Accounts', icon: '🏢' },
    { key: 'integrations', label: 'Integrations', icon: '🔗' },
    { key: 'compliance', label: 'Compliance', icon: '🛡️' },
  ];

  return (
    <div style={{ paddingBottom: 48 }}>
      {/* ── FEATURE HEADER ────────────────────────────────────────────── */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#818cf8', background: 'rgba(129,140,248,0.12)', padding: '3px 10px', borderRadius: 6, letterSpacing: .8 }}>RIP-F-015</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.12)', padding: '3px 10px', borderRadius: 6, letterSpacing: .8 }}>P0 — MVP</span>
        </div>
        <div style={{ color: '#64748b', fontSize: 13, marginTop: 8, maxWidth: 800, lineHeight: 1.6 }}>
          Foundational data layer — automatically captures every customer interaction, maps to revenue entities, and builds the living network that powers AI features across the platform.
        </div>
      </div>

      {error && (
        <div style={{ padding: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 10, marginBottom: 20, fontSize: 13 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* ── TAB BAR ───────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 28, borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: 10, overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={tabBtn(tab === t.key)}>
            <span style={{ fontSize: 15 }}>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '80px 0', color: '#64748b' }}>
          <div style={{ fontSize: 42, marginBottom: 16 }}>⚡</div>
          <div style={{ fontSize: 15, fontWeight: 500 }}>Initialising Revenue Graph…</div>
        </div>
      ) : (
        <>
          {/* ── OVERVIEW TAB ──────────────────────────────────────────── */}
          {tab === 'overview' && (
            <div>
              {/* KPI Row */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 18, marginBottom: 28 }}>
                {[
                  { label: 'Total Interactions', value: stats.totalInteractions.toLocaleString(), sub: `${stats.last24h} in last 24 h`, color: '#818cf8' },
                  { label: 'Capture Rate', value: `${stats.captureRate}%`, sub: 'Zero-touch · RG-01', color: '#10b981' },
                  { label: 'Mapping Accuracy', value: `${stats.mappingAccuracy}%`, sub: '≥ 95% target · RG-10', color: '#38bdf8' },
                  { label: 'Active Pipeline', value: activeDeals.length.toString(), sub: `$${(pipelineValue / 1000).toFixed(0)}K total`, color: '#f59e0b' },
                  { label: 'Avg Link Time', value: stats.avgLinkingTime, sub: '≤ 15 min SLA · NFR', color: '#a78bfa' },
                ].map(s => (
                  <div key={s.label} style={card(s.color)}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = s.color + '55'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = s.color + '30'; }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', letterSpacing: .8, marginBottom: 10, textTransform: 'uppercase' }}>{s.label}</div>
                    <div style={{ fontSize: 32, fontWeight: 800, color: s.color }}>{s.value}</div>
                    {s.sub && <div style={{ fontSize: 12, color: '#64748b', marginTop: 6 }}>{s.sub}</div>}
                  </div>
                ))}
              </div>

              {/* Channel Breakdown */}
              <div style={{ ...card(), marginBottom: 28 }}>
                <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 15, marginBottom: 16 }}>Multi-Channel Data Capture <span style={{ color: '#64748b', fontWeight: 400, fontSize: 12 }}>— BRD §6.1</span></div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
                  {stats.channelBreakdown.map(ch => (
                    <div key={ch.channel} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '14px 16px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 18 }}>{ch.icon}</span>
                        <span style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600 }}>{ch.channel}</span>
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 700, color: ch.color }}>{ch.count.toLocaleString()}</div>
                      <div style={{ marginTop: 6 }}>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${ch.pct}%`, height: '100%', background: ch.color, borderRadius: 4, transition: 'width .6s ease' }} />
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 4 }}>{ch.pct}% of total</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Entity Resolution + CRM Sync side-by-side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                <div style={card('#818cf8')}>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 15, marginBottom: 14 }}>Entity Resolution <span style={{ color: '#64748b', fontWeight: 400, fontSize: 12 }}>— BRD §6.3</span></div>
                  <div style={{ display: 'flex', gap: 20, marginBottom: 14 }}>
                    <div><div style={{ fontSize: 28, fontWeight: 800, color: '#818cf8' }}>{stats.autoLinked}%</div><div style={{ fontSize: 11, color: '#64748b' }}>Rule-Based (RG-11/12)</div></div>
                    <div><div style={{ fontSize: 28, fontWeight: 800, color: '#f59e0b' }}>{stats.aiAssisted}%</div><div style={{ fontSize: 11, color: '#64748b' }}>AI-Assisted (RG-10)</div></div>
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.6 }}>
                    Domain matching, participant linking, deal ownership heuristics, and activity recency signals determine correct associations. Custom mapping rules available for RevOps (RG-13).
                  </div>
                </div>
                <div style={card('#10b981')}>
                  <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 15, marginBottom: 14 }}>Bi-directional CRM Sync <span style={{ color: '#64748b', fontWeight: 400, fontSize: 12 }}>— BRD §6.5</span></div>
                  {syncMsg && <div style={{ padding: '8px 12px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', borderRadius: 8, marginBottom: 12, fontSize: 12 }}>{syncMsg}</div>}
                  <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
                    {(syncStatus?.syncStates ?? []).slice(0, 3).map((s, i) => (
                      <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: '10px 14px', flex: 1, border: '1px solid rgba(255,255,255,0.05)' }}>
                        <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>{s.crmSource} · {s.entityType}</div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: s.status === 'completed' ? '#10b981' : '#f59e0b', marginTop: 4 }}>{s.recordsSynced.toLocaleString()}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={handleSync} disabled={syncing} style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none',
                    padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: syncing ? 'not-allowed' : 'pointer',
                    opacity: syncing ? .7 : 1, transition: 'all .2s',
                  }}>{syncing ? 'Syncing…' : 'Trigger Bi-directional Sync (RG-20)'}</button>
                </div>
              </div>
            </div>
          )}

          {tab === 'graph' && <GraphTab accounts={accounts} deals={deals} />}
          {tab === 'timeline' && <ActivitiesTab activities={MOCK_ACTIVITIES} />}
          {tab === 'deals' && <DealsTab deals={deals} />}
          {tab === 'accounts' && <AccountsTab accounts={accounts} />}
          {tab === 'integrations' && <IntegrationsTab integrations={MOCK_INTEGRATIONS} />}
          {tab === 'compliance' && <ComplianceTab compliance={MOCK_COMPLIANCE} />}
        </>
      )}

      {/* ── FOOTER ────────────────────────────────────────────────────── */}
      <div style={{ marginTop: 40, padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)', color: '#475569', fontSize: 11, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <span>📋 Feature RIP-F-015 · Revenue Graph</span>
        <span>🔑 Tenant-isolated · RLS enforced</span>
        <span>🛡️ SOC 2 · HIPAA · PCI DSS · GDPR</span>
        <span>⚡ BullMQ queue: revenue-graph-linking</span>
        <span>🤖 AI entity resolution via M10_AI_SERVICE_BASE_URL</span>
      </div>
    </div>
  );
}
