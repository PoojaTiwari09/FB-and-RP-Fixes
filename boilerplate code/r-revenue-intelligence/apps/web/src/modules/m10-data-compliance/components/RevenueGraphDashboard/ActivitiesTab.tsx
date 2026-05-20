'use client';
import React, { useState } from 'react';

/**
 * Activity Timeline — BRD §6.4 (RG-17)
 * Complete, chronological timeline of all interactions across all channels.
 * Shows: source type, platform, linked entities, confidence, resolution method.
 */

const SOURCE_ICONS: Record<string, string> = {
  call: '📞', email: '✉️', meeting: '📅', sms: '💬',
  linkedin: '💼', calendar: '🗓️', crm_note: '📝',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#10b981', medium: '#f59e0b', low: '#ef4444',
};

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  linked: { bg: 'rgba(16,185,129,0.1)', color: '#10b981' },
  linked_low_confidence: { bg: 'rgba(245,158,11,0.1)', color: '#f59e0b' },
  unresolved: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444' },
};

export function ActivitiesTab({ activities }: { activities: any[] }) {
  const [filter, setFilter] = useState('all');

  const channelTypes = ['all', ...new Set(activities.map(a => a.sourceType))];
  const filtered = filter === 'all' ? activities : activities.filter(a => a.sourceType === filter);

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 16 }}>Activity Timeline</div>
          <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>
            RG-17 · Complete chronological timeline across all captured channels
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {channelTypes.map(ch => (
            <button key={ch} onClick={() => setFilter(ch)} style={{
              background: filter === ch ? 'rgba(0,240,255,0.08)' : 'rgba(255,255,255,0.03)',
              border: filter === ch ? '1px solid rgba(0,240,255,0.2)' : '1px solid rgba(255,255,255,0.06)',
              color: filter === ch ? '#00f0ff' : '#94a3b8',
              padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
              textTransform: 'capitalize' as const,
            }}>
              {ch === 'all' ? 'All Channels' : `${SOURCE_ICONS[ch] ?? '📄'} ${ch}`}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={{ background: 'rgba(8,14,30,0.5)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '50px 90px 100px 160px 180px 80px 60px 1fr',
          padding: '14px 20px', fontSize: 10, fontWeight: 700, color: '#64748b',
          letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase' as const,
        }}>
          <span></span><span>TYPE</span><span>PLATFORM</span><span>ACCOUNT</span><span>DEAL</span><span>CONF.</span><span>AI</span><span>RESOLUTION</span>
        </div>
        {filtered.map(act => {
          const ss = STATUS_STYLES[act.status] ?? STATUS_STYLES.unresolved;
          return (
            <div key={act.activityId} style={{
              display: 'grid', gridTemplateColumns: '50px 90px 100px 160px 180px 80px 60px 1fr',
              padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              alignItems: 'center', transition: 'background .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              {/* Status dot */}
              <div>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: ss.color, display: 'inline-block', boxShadow: `0 0 6px ${ss.color}` }} />
              </div>
              {/* Type */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 16 }}>{SOURCE_ICONS[act.sourceType] ?? '📄'}</span>
                <span style={{ color: '#e2e8f0', fontSize: 12, fontWeight: 600, textTransform: 'capitalize' as const }}>{act.sourceType}</span>
              </div>
              {/* Platform */}
              <div style={{ color: '#94a3b8', fontSize: 12 }}>{act.sourcePlatform}</div>
              {/* Account */}
              <div>
                <div style={{ color: act.accountName ? '#38bdf8' : '#475569', fontSize: 12, fontWeight: 500 }}>{act.accountName ?? '— unmapped'}</div>
                {act.contactName && <div style={{ color: '#64748b', fontSize: 10, marginTop: 2 }}>{act.contactName}</div>}
              </div>
              {/* Deal */}
              <div style={{ color: act.dealName ? '#f8fafc' : '#475569', fontSize: 12, fontWeight: act.dealName ? 500 : 400 }}>
                {act.dealName ?? '— unresolved'}
              </div>
              {/* Confidence */}
              <div>
                {act.confidence ? (
                  <span style={{
                    background: (CONFIDENCE_COLORS[act.confidence] ?? '#6b7280') + '18',
                    color: CONFIDENCE_COLORS[act.confidence] ?? '#6b7280',
                    border: `1px solid ${(CONFIDENCE_COLORS[act.confidence] ?? '#6b7280')}40`,
                    padding: '2px 8px', borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: .5,
                  }}>{act.confidence.toUpperCase()}</span>
                ) : <span style={{ color: '#475569', fontSize: 10 }}>N/A</span>}
              </div>
              {/* AI badge */}
              <div>
                {act.aiAssisted
                  ? <span style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b', padding: '2px 7px', borderRadius: 5, fontSize: 9, fontWeight: 700 }}>AI</span>
                  : <span style={{ background: 'rgba(129,140,248,0.12)', color: '#818cf8', padding: '2px 7px', borderRadius: 5, fontSize: 9, fontWeight: 700 }}>RULE</span>
                }
              </div>
              {/* Explanation */}
              <div style={{ color: '#94a3b8', fontSize: 11, lineHeight: 1.5 }}>
                {act.explanation}
                {act.hasTranscript && <span style={{ marginLeft: 8, color: '#818cf8', fontSize: 10 }}>📄 Transcript</span>}
                {act.duration && <span style={{ marginLeft: 8, color: '#64748b', fontSize: 10 }}>⏱ {act.duration}</span>}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: 12, fontSize: 11, color: '#475569' }}>
        Showing {filtered.length} of {activities.length} interactions · SLA: ≤ 15 min capture-to-available (NFR §7)
      </div>
    </div>
  );
}
