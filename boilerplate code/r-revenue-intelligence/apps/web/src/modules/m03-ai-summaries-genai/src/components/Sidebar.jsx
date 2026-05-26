import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { id: 'smart-summaries', name: 'Smart Summaries', path: '/smart-summaries' },
  { id: 'ask-anything', name: 'Ask Anything', path: '/ask-anything' },
  { id: 'research', name: 'Deep Research', path: '/research' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveId = () => {
    const path = location.pathname;
    if (path.startsWith('/ask-anything')) return 'ask-anything';
    if (path.startsWith('/smart-summaries')) return 'smart-summaries';
    return 'research';
  };

  const activeId = getActiveId();

  return (
    <aside className="sidebar" style={{ width: '240px', alignItems: 'flex-start', padding: '16px' }}>
      <button className="sidebar-toggle" title="Toggle sidebar" style={{ alignSelf: 'flex-end', marginBottom: '24px' }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>
      <nav className="sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
        {navItems.map((item) => (
          <button
            key={item.id}
            className={`sidebar-item ${activeId === item.id ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
            title={item.name}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '12px 16px',
              borderRadius: '8px',
              background: activeId === item.id ? '#EEF2FF' : 'transparent',
              color: activeId === item.id ? '#4F46E5' : '#4B5563',
              border: 'none',
              fontWeight: activeId === item.id ? '600' : '500',
              cursor: 'pointer',
              fontSize: '14px',
              display: 'flex',
              justifyContent: 'flex-start',
              transition: 'all 0.15s ease',
            }}
          >
            {item.name}
          </button>
        ))}
      </nav>
    </aside>
  );
}
