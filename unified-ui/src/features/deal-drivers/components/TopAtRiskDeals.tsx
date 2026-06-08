'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import type { AtRiskDeal } from '../types';

function getStageStyle(stage: string) {
  const norm = stage.toLowerCase();
  if (norm.includes('proposal') || norm.includes('quote')) {
    return { background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe' };
  }
  if (norm.includes('value') || norm.includes('negotiation') || norm.includes('contract')) {
    return { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a' };
  }
  if (norm.includes('won') || norm.includes('closed won')) {
    return { background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0' };
  }
  return { background: '#f3f4f6', color: '#374151', border: '1px solid #e5e7eb' };
}

function getRisksStyle(count: number) {
  if (count === 0) {
    return { background: '#f3f4f6', color: '#9ca3af', border: '1px solid #e5e7eb', fontWeight: 500 };
  }
  if (count >= 2) {
    return { background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', fontWeight: 600 };
  }
  return { background: '#fef3c7', color: '#d97706', border: '1px solid #fde68a', fontWeight: 600 };
}

export default function TopAtRiskDeals({ deals }: { deals: AtRiskDeal[] }) {
  const [search, setSearch] = useState('');
  const filtered = deals.filter(d => d.accountName.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ background: '#fff', borderRadius: 8, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', padding: '20px 20px 16px' }}>
      {/* Header section with search */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#111827' }}>Top At-Risk Deals</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>Deals ranked by number of active warnings</div>
        </div>
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input
            placeholder="Search accounts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              padding: '6px 12px 6px 30px',
              fontSize: 13,
              border: '1px solid #e5e7eb',
              borderRadius: 6,
              background: '#fff',
              outline: 'none',
              width: 220,
              color: '#374151',
              fontWeight: 500,
              transition: 'all 0.15s',
            }}
          />
        </div>
      </div>

      {/* Table Section */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
              <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'bottom' }}>ACCOUNT</th>
              <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'bottom' }}>AMOUNT</th>
              <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'bottom' }}>STAGE</th>
              <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'bottom' }}>REP</th>
              <th style={{ textAlign: 'center', padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'bottom', width: 90 }}>RISKS</th>
              <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'bottom', width: 90 }}>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(deal => (
              <tr key={deal.dealId} style={{ borderBottom: '1px solid #f3f4f6' }}>
                <td style={{ padding: '12px 8px', fontWeight: 600, color: '#111827' }}>
                  {deal.accountName}
                </td>
                <td style={{ padding: '12px 8px', fontWeight: 600, color: '#111827' }}>
                  ${deal.dealAmount.toLocaleString()}
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{
                    ...getStageStyle(deal.crmStage),
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 8px',
                    borderRadius: 4,
                    fontSize: 11,
                    fontWeight: 500,
                  }}>
                    {deal.crmStage}
                  </span>
                </td>
                <td style={{ padding: '12px 8px' }}>
                  <span style={{ fontWeight: 600, color: '#2563eb', fontSize: 13 }}>
                    {deal.repName}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                  <span style={{
                    ...getRisksStyle(deal.warningTypes.length),
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '3px 10px',
                    borderRadius: 12,
                    fontSize: 11,
                  }}>
                    {deal.warningTypes.length} {deal.warningTypes.length === 1 ? 'Risk' : 'Risks'}
                  </span>
                </td>
                <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                  <button
                    onClick={() => window.location.href = `/dealboard?dealId=${deal.dealId}`}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#2563eb',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: 0,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                  >
                    View deal ↗
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: '#9ca3af', fontSize: 13 }}>
                  No accounts found matching "{search}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
