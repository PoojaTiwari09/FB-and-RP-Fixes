import React from 'react';

const navItems = [
  { name: 'Dashboard', icon: '📊', path: '#' },
  { name: 'Deals Intelligence', icon: '💼', path: '#' },
  { name: 'Conversation Intel', icon: '🎙️', path: '#' },
  { name: 'Revenue Graph', icon: '🕸️', path: '/modules/m10-data-compliance/revenue-graph', active: true },
  { name: 'Compliance & Gov', icon: '🛡️', path: '#' },
  { name: 'Settings', icon: '⚙️', path: '#' },
];

export function Sidebar() {
  return (
    <aside style={{
      width: 260,
      background: 'rgba(4, 8, 20, 0.75)',
      backdropFilter: 'blur(20px)',
      borderRight: '1px solid rgba(255,255,255,0.08)',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      zIndex: 50,
    }}>
      <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width: 32, height: 32, background: 'linear-gradient(135deg, #00f0ff, #9d4edd)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800 }}>R</div>
        <div style={{ fontWeight: 700, fontSize: 16, color: '#f8fafc', letterSpacing: 0.5 }}>Relanto.ai</div>
      </div>
      
      <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1.2, paddingLeft: 12, marginBottom: 8 }}>Platform Modules</div>
        {navItems.map(item => (
          <a key={item.name} href={item.path} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
            borderRadius: 8, textDecoration: 'none',
            background: item.active ? 'rgba(0, 240, 255, 0.08)' : 'transparent',
            color: item.active ? '#00f0ff' : '#94a3b8',
            fontWeight: item.active ? 600 : 500,
            transition: 'all 0.2s ease',
            border: item.active ? '1px solid rgba(0, 240, 255, 0.15)' : '1px solid transparent',
          }}>
            <span style={{ fontSize: 18 }}>{item.icon}</span>
            <span style={{ fontSize: 14 }}>{item.name}</span>
          </a>
        ))}
      </nav>

      <div style={{ padding: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', padding: 16, borderRadius: 8, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 4 }}>Current Tenant</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>Acme Enterprise</div>
          <div style={{ fontSize: 10, color: '#10b981', marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            System Online
          </div>
        </div>
      </div>
    </aside>
  );
}
