/**
 * GlobalProgressWidget — floating progress indicator that renders on ALL pages.
 *
 * It reads from ResearchJobContext (which lives at the App root),
 * so it keeps running even when the user navigates to Ask Anything
 * or Smart Summaries.
 */
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useResearchJob } from '../contexts/ResearchJobContext';

export default function GlobalProgressWidget() {
  const { jobProgress, cancelJob, dismissProgress } = useResearchJob();
  const navigate = useNavigate();
  const location = useLocation();

  if (!jobProgress) return null;

  // Don't render the floating widget on the deep research page itself —
  // that page has its own full overlay via ProgressIndicator
  const isOnResearchPage = location.pathname === '/research';
  if (isOnResearchPage) return null;

  const { pct = 0, stage = '', completed, failed, reportId, error } = jobProgress;

  // ── Completed state ──
  if (completed) {
    return (
      <div style={widgetStyle}>
        <div style={headerRow}>
          <span style={{ ...titleStyle, color: '#059669' }}>✓ Research Complete</span>
          <button onClick={dismissProgress} style={closeBtnStyle}>✕</button>
        </div>
        <div style={stageStyle}>Report ready — click to view</div>
        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
          <button
            onClick={() => {
              dismissProgress();
              navigate(reportId ? `/research/report/${reportId}` : '/research/report');
            }}
            style={{ ...actionBtnStyle, flex: 1 }}
          >
            View Report
          </button>
        </div>
      </div>
    );
  }

  // ── Failed state ──
  if (failed) {
    return (
      <div style={{ ...widgetStyle, borderColor: '#FCA5A5' }}>
        <div style={headerRow}>
          <span style={{ ...titleStyle, color: '#DC2626' }}>Research Failed</span>
          <button onClick={dismissProgress} style={closeBtnStyle}>✕</button>
        </div>
        <div style={stageStyle}>{error || 'Unknown error'}</div>
      </div>
    );
  }

  // ── In-progress state ──
  return (
    <div style={widgetStyle}>
      <div style={headerRow}>
        <span style={titleStyle}>
          <span style={pulseStyle} /> Research Running
        </span>
        <button onClick={cancelJob} style={closeBtnStyle}>✕</button>
      </div>
      <div style={stageStyle}>{stage}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={barTrackStyle}>
          <div style={{ ...barFillStyle, width: `${Math.min(pct, 100)}%` }} />
        </div>
        <span style={pctStyle}>{pct}%</span>
      </div>
      <button
        onClick={() => navigate('/research')}
        style={{ ...linkBtnStyle, marginTop: '6px' }}
      >
        Go to Deep Research →
      </button>
    </div>
  );
}

// ── Inline styles ──
const widgetStyle = {
  position: 'fixed',
  bottom: '24px',
  right: '24px',
  width: '320px',
  background: '#ffffff',
  borderRadius: '12px',
  boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
  padding: '16px',
  zIndex: 9999,
  border: '1px solid #E2E8F0',
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  fontFamily: "'Inter', sans-serif",
  animation: 'slideUpFadeIn 0.3s ease-out',
};

const headerRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

const titleStyle = {
  fontSize: '0.82rem',
  fontWeight: 700,
  color: '#0F172A',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
};

const stageStyle = {
  fontSize: '0.75rem',
  color: '#64748B',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const closeBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#94A3B8',
  fontSize: '0.8rem',
  cursor: 'pointer',
  padding: '2px 6px',
};

const barTrackStyle = {
  flex: 1,
  height: '6px',
  background: '#F1F5F9',
  borderRadius: '3px',
  overflow: 'hidden',
};

const barFillStyle = {
  height: '100%',
  background: 'linear-gradient(135deg, #6366F1, #3B82F6)',
  borderRadius: '3px',
  transition: 'width 0.5s ease',
};

const pctStyle = {
  fontSize: '0.75rem',
  fontWeight: 600,
  color: '#3B82F6',
  minWidth: '32px',
  textAlign: 'right',
};

const actionBtnStyle = {
  padding: '7px 14px',
  fontSize: '0.78rem',
  fontWeight: 600,
  color: '#ffffff',
  background: 'linear-gradient(135deg, #6366F1, #3B82F6)',
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  textAlign: 'center',
};

const linkBtnStyle = {
  background: 'none',
  border: 'none',
  color: '#3B82F6',
  fontSize: '0.72rem',
  fontWeight: 500,
  cursor: 'pointer',
  padding: 0,
  textAlign: 'left',
};

const pulseStyle = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#3B82F6',
  display: 'inline-block',
  animation: 'pulse 1.5s infinite ease-in-out',
};
