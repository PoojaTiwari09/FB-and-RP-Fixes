import React from 'react';

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color: string;
}

export function StatCard({ label, value, sub, color }: StatCardProps) {
  return (
    <div style={{
      background: 'rgba(8, 14, 30, 0.65)',
      backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.08)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.35)',
      borderRadius: 16,
      padding: '24px',
      minWidth: 160,
      flex: 1,
      transition: 'border-color 0.3s ease, box-shadow 0.3s ease',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
    }}
    >
      <div style={{ color: '#cbd5e1', fontSize: 13, fontWeight: 600, marginBottom: 12, letterSpacing: 0.5, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ color, fontSize: 36, fontWeight: 800 }}>{value}</div>
      {sub && <div style={{ color: '#94a3b8', fontSize: 13, marginTop: 8 }}>{sub}</div>}
    </div>
  );
}
