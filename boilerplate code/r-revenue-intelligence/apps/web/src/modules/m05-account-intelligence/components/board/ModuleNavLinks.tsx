'use client';

import type { CSSProperties } from 'react';
import { getM07DashboardsUrl, getM10DataCloudUrl, getM10RevenueGraphUrl } from '../../lib/api-env';

const linkStyle: CSSProperties = {
  background: 'transparent',
  border: 'none',
  fontSize: 11,
  fontWeight: 700,
  color: '#5B21B6',
  cursor: 'pointer',
  padding: '6px 0',
  whiteSpace: 'nowrap',
  fontFamily: 'inherit',
};

const sepStyle: CSSProperties = { color: '#D1D5DB', fontSize: 11 };

/**
 * Cross-module links — Account Intelligence (M05) → M07 / M10.
 */
export default function ModuleNavLinks() {
  return (
    <nav
      style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 8 }}
      aria-label="Module navigation"
    >
      <button
        type="button"
        style={linkStyle}
        onClick={() => { window.location.href = getM07DashboardsUrl(); }}
        title="Open M07 Revenue Dashboards (port 5180)"
      >
        Revenue Dashboards (M07)
      </button>
      <span style={sepStyle}>|</span>
      <button
        type="button"
        style={linkStyle}
        onClick={() => { window.location.href = getM10DataCloudUrl(); }}
        title="Open M10 Data & Compliance (port 5178)"
      >
        Data &amp; Compliance (M10)
      </button>
      <span style={sepStyle}>|</span>
      <button
        type="button"
        style={linkStyle}
        onClick={() => { window.location.href = getM10RevenueGraphUrl(); }}
        title="Open M10 Revenue Graph (port 5178)"
      >
        Revenue Graph
      </button>
    </nav>
  );
}
