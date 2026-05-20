'use client';
import React from 'react';
import type { Deal } from '../../../types/revenue-graph.types';

/**
 * Deals Pipeline — BRD §6.3 (RG-10 / RG-12)
 * Shows all deals with stage, amount, linked account, contacts.
 */

const STAGE_COLORS: Record<string, string> = {
  Prospect: '#6366f1', Qualified: '#3b82f6', Proposal: '#f59e0b',
  Negotiation: '#f97316', 'Closed Won': '#10b981', 'Closed Lost': '#ef4444',
};

export function DealsTab({ deals }: { deals: Deal[] }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 16 }}>Deals Pipeline</div>
        <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>RG-10/12 · Mapped via entity resolution · {deals.length} total deals</div>
      </div>
      <div style={{ background: 'rgba(8,14,30,0.5)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1.5fr',
          padding: '14px 20px', fontSize: 10, fontWeight: 700, color: '#64748b',
          letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase' as const,
        }}>
          <span>DEAL NAME</span><span>STAGE</span><span>AMOUNT</span><span>ACCOUNT</span><span>CONTACTS</span>
        </div>
        {deals.map(d => {
          const sc = d.stage ? STAGE_COLORS[d.stage] ?? '#6366f1' : '#64748b';
          return (
            <div key={d.dealId} style={{
              display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1.2fr 1.5fr',
              padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
              alignItems: 'center', transition: 'background .15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
            >
              <div>
                <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                <div style={{ color: '#475569', fontSize: 10, marginTop: 3 }}>{d.isActive ? '● Active' : '○ Closed'}</div>
              </div>
              <div>
                <span style={{ background: sc + '18', color: sc, border: `1px solid ${sc}40`, padding: '3px 10px', borderRadius: 99, fontSize: 10, fontWeight: 700 }}>{d.stage ?? '—'}</span>
              </div>
              <div style={{ color: '#38bdf8', fontWeight: 600, fontSize: 13 }}>
                {d.amount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: d.currency ?? 'USD', maximumFractionDigits: 0 }).format(d.amount) : '—'}
              </div>
              <div style={{ color: '#cbd5e1', fontSize: 12 }}>{d.account?.name ?? '—'}</div>
              <div>
                {d.contacts?.length ? d.contacts.map(c => (
                  <div key={c.contactId} style={{ color: '#94a3b8', fontSize: 11 }}>{c.name ?? c.email}</div>
                )) : <span style={{ color: '#475569', fontSize: 11 }}>—</span>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
