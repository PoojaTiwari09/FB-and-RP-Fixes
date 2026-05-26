import React from 'react';

export function Header() {
  return (
    <header style={{
      height: 72,
      background: 'rgba(4, 8, 20, 0.65)',
      backdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
      position: 'sticky',
      top: 0,
      zIndex: 40,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: '#f8fafc', margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 24 }}>🕸️</span> 
          Revenue Graph
          <span style={{ background: 'rgba(0, 240, 255, 0.1)', color: '#00f0ff', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: '1px solid rgba(0, 240, 255, 0.2)' }}>M10</span>
        </h1>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative' }}>
          <input 
            type="text" 
            placeholder="Search accounts, deals..." 
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              padding: '8px 16px 8px 36px',
              borderRadius: 20,
              color: '#f8fafc',
              fontSize: 13,
              width: 240,
              outline: 'none',
            }}
          />
          <span style={{ position: 'absolute', left: 12, top: 8, fontSize: 14 }}>🔍</span>
        </div>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          🔔
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: 20 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0' }}>Admin User</div>
            <div style={{ fontSize: 11, color: '#94a3b8' }}>admin@acme.com</div>
          </div>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #38bdf8, #818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700 }}>
            AU
          </div>
        </div>
      </div>
    </header>
  );
}
