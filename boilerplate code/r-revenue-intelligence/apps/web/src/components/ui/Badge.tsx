import React from 'react';

const STAGE_COLORS: Record<string, string> = {
  Prospect: '#6366f1', Qualified: '#3b82f6', Proposal: '#f59e0b',
  Negotiation: '#f97316', 'Closed Won': '#10b981', 'Closed Lost': '#ef4444',
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#10b981', medium: '#f59e0b', low: '#ef4444',
};

export function StagePill({ stage }: { stage?: string }) {
  const color = stage ? STAGE_COLORS[stage] ?? '#6366f1' : '#6b7280';
  return (
    <span style={{
      background: `${color}1A`, color, border: `1px solid ${color}40`,
      padding: '4px 12px', borderRadius: 9999, fontSize: 12, fontWeight: 600,
    }}>{stage ?? 'Unknown'}</span>
  );
}

export function ConfidenceBadge({ level }: { level?: string }) {
  if (!level) return null;
  return (
    <span style={{
      background: `${CONFIDENCE_COLORS[level] ?? '#6b7280'}1A`,
      color: CONFIDENCE_COLORS[level] ?? '#6b7280',
      border: `1px solid ${CONFIDENCE_COLORS[level] ?? '#6b7280'}40`,
      padding: '4px 10px', borderRadius: 9999, fontSize: 11, fontWeight: 700, letterSpacing: 0.5,
    }}>{level.toUpperCase()}</span>
  );
}
