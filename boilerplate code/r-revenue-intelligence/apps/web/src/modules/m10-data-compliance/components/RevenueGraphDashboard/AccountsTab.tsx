'use client';
import React from 'react';
import type { Account } from '../../types/revenue-graph.types';

/**
 * Accounts — BRD §6.3 (RG-11 / RG-14)
 * Domain-matched CRM accounts linked to the Revenue Graph.
 */

export function AccountsTab({ accounts }: { accounts: Account[] }) {
  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: 16 }}>Accounts</div>
        <div style={{ color: '#64748b', fontSize: 12, marginTop: 4 }}>RG-11/14 · Domain-matched CRM accounts · {accounts.length} total</div>
      </div>
      <div style={{ background: 'rgba(8,14,30,0.5)', borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
          padding: '14px 20px', fontSize: 10, fontWeight: 700, color: '#64748b',
          letterSpacing: 1, borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'rgba(255,255,255,0.02)', textTransform: 'uppercase' as const,
        }}>
          <span>ACCOUNT</span><span>DOMAIN</span><span>REGION</span><span>INDUSTRY</span><span>CRM SOURCE</span>
        </div>
        {accounts.map(a => (
          <div key={a.accountId} style={{
            display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
            padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.04)',
            alignItems: 'center', transition: 'background .15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <div>
              <div style={{ color: '#f8fafc', fontWeight: 600, fontSize: 13 }}>{a.name}</div>
              <div style={{ color: '#475569', fontSize: 10, marginTop: 3 }}>
                {a.activeDealsCount ?? 0} deals · {a.contactsCount ?? 0} contacts
              </div>
            </div>
            <div style={{ color: '#a5b4fc', fontSize: 12 }}>{a.domain ?? '—'}</div>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>{a.region ?? '—'}</div>
            <div style={{ color: '#94a3b8', fontSize: 12 }}>{a.industry ?? '—'}</div>
            <div>
              {a.crmSource ? (
                <span style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8', padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 600 }}>{a.crmSource}</span>
              ) : '—'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
