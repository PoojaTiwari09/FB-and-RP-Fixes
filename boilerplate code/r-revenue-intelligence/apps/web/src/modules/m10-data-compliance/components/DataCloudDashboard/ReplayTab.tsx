/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import React, { useState } from 'react';
import { triggerReplay } from '../../api/data-cloud.api';

const card: React.CSSProperties = {
  background: 'rgba(8,14,30,0.55)', backdropFilter: 'blur(16px)',
  border: '1px solid rgba(255,255,255,0.08)', borderRadius: 14, padding: '24px 28px',
};

interface Props { connections: { connectionId: string; destination: string; isActive: boolean }[]; }

export function ReplayTab({ connections }: Props) {
  const [form, setForm] = useState({
    connectionId: connections[0]?.connectionId ?? '',
    datasetName: 'accounts',
    windowStart: '2026-05-19T00:00:00Z',
    windowEnd: '2026-05-20T00:00:00Z',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ status: string; runId: string; message: string } | null>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.connectionId) { setError('Please select a connection.'); return; }
    setLoading(true); setResult(null); setError('');
    try {
      const res = await triggerReplay(form);
      setResult(res);
    } catch (err: any) {
      setError(err.message ?? 'Replay failed');
    } finally { setLoading(false); }
  };

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 16 }}>Manual Replay Trigger</div>
        <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>Backfill any missed or failed export window manually</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
        {/* Form */}
        <div style={card}>
          <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: 14, marginBottom: 20 }}>Configure Replay Job</div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Connection</label>
              <select value={form.connectionId} onChange={e => setForm(f => ({ ...f, connectionId: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                {connections.length === 0 && <option value="">No connections — add one first</option>}
                {connections.map(c => (
                  <option key={c.connectionId} value={c.connectionId}>{c.destination} — {c.connectionId.slice(0, 12)}…</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Dataset</label>
              <select value={form.datasetName} onChange={e => setForm(f => ({ ...f, datasetName: e.target.value }))}
                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc', padding: '10px 14px', borderRadius: 8, fontSize: 13 }}>
                {['accounts', 'contacts', 'deals', 'activities', 'ai_scores', 'briefs'].map(d => (
                  <option key={d} value={d}>{d === 'ai_scores' ? 'AI Scores' : d === 'briefs' ? 'Briefs' : d.charAt(0).toUpperCase() + d.slice(1)}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Window Start</label>
                <input type="text" value={form.windowStart} onChange={e => setForm(f => ({ ...f, windowStart: e.target.value }))}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8 }}>Window End</label>
                <input type="text" value={form.windowEnd} onChange={e => setForm(f => ({ ...f, windowEnd: e.target.value }))}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', color: '#f8fafc', padding: '10px 14px', borderRadius: 8, fontSize: 12, fontFamily: 'monospace' }} />
              </div>
            </div>

            {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 8, fontSize: 13 }}>{error}</div>}

            <button type="submit" disabled={loading || !form.connectionId} style={{
              background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8,
              fontWeight: 700, fontSize: 14, cursor: loading || !form.connectionId ? 'not-allowed' : 'pointer',
              opacity: loading || !form.connectionId ? 0.7 : 1, transition: 'all .2s',
            }}>
              {loading ? '⏳ Queuing Replay…' : '▶ Trigger Replay'}
            </button>
          </form>
        </div>

        {/* Info + result panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {result ? (
            <div style={{ ...card, border: '1px solid rgba(16,185,129,0.25)' }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontWeight: 700, color: '#10b981', fontSize: 15, marginBottom: 8 }}>Replay Queued!</div>
              <div style={{ color: '#94a3b8', fontSize: 13, lineHeight: 1.7 }}>{result.message}</div>
              <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.15)', borderRadius: 8 }}>
                <div style={{ fontSize: 10, color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Run ID</div>
                <div style={{ fontFamily: 'monospace', fontSize: 12, color: '#10b981' }}>{result.runId}</div>
              </div>
              <div style={{ fontSize: 12, color: '#64748b', marginTop: 12 }}>Check the <strong style={{ color: '#94a3b8' }}>Run History</strong> tab to track progress.</div>
            </div>
          ) : (
            <div style={{ ...card }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>⚡</div>
              <div style={{ fontWeight: 600, color: '#f8fafc', fontSize: 14, marginBottom: 10 }}>How Replay Works</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { step: '1', text: 'Select the connection and dataset to replay', color: '#818cf8' },
                  { step: '2', text: 'Set the date window (windowStart → windowEnd)', color: '#38bdf8' },
                  { step: '3', text: 'A BullMQ job is queued with idempotency key', color: '#10b981' },
                  { step: '4', text: 'Worker extracts rows for that window and exports', color: '#f59e0b' },
                  { step: '5', text: 'Checkpoint watermark updates on success', color: '#a78bfa' },
                ].map(s => (
                  <div key={s.step} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ background: s.color + '20', color: s.color, border: `1px solid ${s.color}40`, width: 22, height: 22, borderRadius: 99, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{s.step}</span>
                    <span style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.6 }}>{s.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ ...card, border: '1px solid rgba(245,158,11,0.15)' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>⚠️ Idempotency Note</div>
            <div style={{ color: '#94a3b8', fontSize: 12, lineHeight: 1.7 }}>
              Re-running the same date window is completely safe — the system detects duplicates automatically and skips them. Your warehouse data will never be corrupted by a retry.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
