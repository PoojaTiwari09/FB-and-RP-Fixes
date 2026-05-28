import React, { useEffect, useState } from 'react';
import RevenueGraphDashboard from '../components/RevenueGraphDashboard/index';
import DataCloudDashboard from '../components/DataCloudDashboard/index';
import { getM10ApiBase, getM05WebUrl, getM07DashboardsUrl } from '../lib/api-env';

type View = 'revenue-graph' | 'data-cloud';

const navBtn = (active: boolean): React.CSSProperties => ({
  padding: '10px 18px',
  borderRadius: 8,
  border: active ? '1px solid rgba(0,240,255,0.35)' : '1px solid rgba(255,255,255,0.08)',
  background: active ? 'rgba(0,240,255,0.1)' : 'transparent',
  color: active ? '#00f0ff' : '#94a3b8',
  fontWeight: active ? 600 : 500,
  cursor: 'pointer',
  fontSize: 13,
});

const extLink: React.CSSProperties = {
  padding: '10px 14px',
  borderRadius: 8,
  border: '1px solid rgba(129,140,248,0.35)',
  background: 'rgba(129,140,248,0.08)',
  color: '#a5b4fc',
  fontWeight: 600,
  cursor: 'pointer',
  fontSize: 13,
};

export default function App() {
  const [view, setView] = useState<View>('revenue-graph');

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get('view');
    if (q === 'data-cloud') setView('data-cloud');
  }, []);

  return (
    <div style={{ minHeight: '100vh' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(6,11,24,0.92)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#f8fafc' }}>
            M10 Data &amp; Compliance
          </div>
          <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
            API: {getM10ApiBase()}
          </div>
        </div>
        <nav style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            style={extLink}
            onClick={() => { window.location.href = getM07DashboardsUrl(); }}
            title="Open M07 Revenue Dashboards (port 5180)"
          >
            Revenue Dashboards (M07)
          </button>
          <button
            type="button"
            style={extLink}
            onClick={() => { window.location.href = getM05WebUrl(); }}
            title="Open M05 Account Intelligence (port 5179)"
          >
            Account Intelligence (M05)
          </button>
          <button type="button" style={navBtn(view === 'revenue-graph')} onClick={() => setView('revenue-graph')}>
            Revenue Graph
          </button>
          <button type="button" style={navBtn(view === 'data-cloud')} onClick={() => setView('data-cloud')}>
            Data Cloud
          </button>
        </nav>
      </header>

      <main style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>
        {view === 'revenue-graph' ? <RevenueGraphDashboard /> : <DataCloudDashboard />}
      </main>
    </div>
  );
}
