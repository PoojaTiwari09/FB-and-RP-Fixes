/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';
import React, { useState } from 'react';
import { registerConnection, testConnection } from '../../api/data-cloud.api';

const DEST_ICONS: Record<string, string> = {
  postgres: '🐘', snowflake: '❄️', bigquery: '🔷', s3: '🪣', databricks: '🧱', redshift: '🔴',
};
const DEST_COLORS: Record<string, string> = {
  postgres: '#38bdf8', snowflake: '#818cf8', bigquery: '#f59e0b', s3: '#f97316', databricks: '#e11d48', redshift: '#ef4444',
};

const card: React.CSSProperties = {
  background: 'rgba(8,14,30,0.55)', backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '20px 24px',
};

interface Props { connections: any[]; onRefresh: () => void; }

export function ConnectionsTab({ connections, onRefresh }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<Record<string, { success: boolean; message: string }>>({});
  const [form, setForm] = useState({ destination: 'postgres', destinationName: '' });
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState('');

  const handleTest = async (id: string) => {
    setTesting(id);
    try {
      const result = await testConnection(id);
      setTestResult(prev => ({ ...prev, [id]: result }));
    } catch {
      setTestResult(prev => ({ ...prev, [id]: { success: false, message: 'Test failed — could not reach connection' } }));
    } finally { setTesting(null); }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.destinationName.trim()) return;
    setAdding(true);
    try {
      await registerConnection({ destination: form.destination, destinationName: form.destinationName });
      setAddMsg('✅ Connection registered successfully!');
      setShowForm(false);
      setForm({ destination: 'postgres', destinationName: '' });
      onRefresh();
    } catch {
      setAddMsg('❌ Failed to register connection');
    } finally {
      setAdding(false);
      setTimeout(() => setAddMsg(''), 4000);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 16 }}>Warehouse Connections</div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Manage your warehouse destinations · {connections.length} configured</div>
        </div>
        <button onClick={() => setShowForm(!showForm)} style={{
          background: showForm ? 'rgba(239,68,68,0.1)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: showForm ? '#ef4444' : '#fff', border: showForm ? '1px solid rgba(239,68,68,0.3)' : 'none',
          padding: '9px 18px', borderRadius: 8, fontWeight: 600, fontSize: 12, cursor: 'pointer',
        }}>
          {showForm ? '✕ Cancel' : '+ Add Connection'}
        </button>
      </div>

      {addMsg && (
        <div style={{ padding: '10px 16px', background: addMsg.startsWith('✅') ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${addMsg.startsWith('✅') ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, color: addMsg.startsWith('✅') ? '#10b981' : '#ef4444', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>{addMsg}</div>
      )}

      {/* Add form */}
      {showForm && (
        <div style={{ ...card, marginBottom: 20, border: '1px solid rgba(99,102,241,0.25)' }}>
          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: 14, marginBottom: 16 }}>Register New Connection</div>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 180 }}>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Destination Type</label>
              <select value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '9px 12px', borderRadius: 8, fontSize: 13 }}>
                {['postgres', 'snowflake', 'bigquery', 's3', 'databricks', 'redshift'].map(d => (
                  <option key={d} value={d}>{DEST_ICONS[d]} {d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 2, minWidth: 220 }}>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.8 }}>Connection Name</label>
              <input value={form.destinationName} onChange={e => setForm(f => ({ ...f, destinationName: e.target.value }))}
                placeholder="e.g. Enterprise Data Lake"
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f8fafc', padding: '9px 12px', borderRadius: 8, fontSize: 13 }} />
            </div>
            <button type="submit" disabled={adding} style={{
              background: 'linear-gradient(135deg, #10b981, #059669)', color: '#fff', border: 'none',
              padding: '9px 20px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: adding ? 'not-allowed' : 'pointer', opacity: adding ? 0.7 : 1,
            }}>{adding ? 'Registering…' : 'Register'}</button>
          </form>
        </div>
      )}

      {/* Connections list */}
      {connections.length === 0 ? (
        <div style={{ ...card, textAlign: 'center', padding: '60px 24px', color: '#475569' }}>
          <div style={{ fontSize: 42, marginBottom: 12 }}>🔌</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#64748b', marginBottom: 6 }}>No connections configured</div>
          <div style={{ fontSize: 13 }}>Add your first warehouse destination to start exporting data.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {connections.map(conn => {
            const color = DEST_COLORS[conn.destination] ?? '#94a3b8';
            const tr = testResult[conn.connectionId];
            return (
              <div key={conn.connectionId} style={{ ...card, border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', gap: 20 }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color + '44'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = color + '22'; }}>
                <div style={{ fontSize: 32 }}>{DEST_ICONS[conn.destination] ?? '🔌'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: 14, textTransform: 'capitalize' }}>{conn.destination}</span>
                    <span style={{ background: conn.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(100,116,139,0.12)', color: conn.isActive ? '#10b981' : '#64748b', border: `1px solid ${conn.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(100,116,139,0.3)'}`, padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>
                      {conn.isActive ? '● Active' : '○ Inactive'}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>ID: {conn.connectionId} · Added {new Date(conn.createdAt).toLocaleDateString()}</div>
                  {tr && (
                    <div style={{ marginTop: 6, fontSize: 12, color: tr.success ? '#10b981' : '#ef4444' }}>
                      {tr.success ? '✅' : '❌'} {tr.message}
                    </div>
                  )}
                </div>
                <button onClick={() => handleTest(conn.connectionId)} disabled={testing === conn.connectionId}
                  style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8', padding: '7px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', opacity: testing === conn.connectionId ? 0.6 : 1 }}>
                  {testing === conn.connectionId ? 'Testing…' : '🔍 Test'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
