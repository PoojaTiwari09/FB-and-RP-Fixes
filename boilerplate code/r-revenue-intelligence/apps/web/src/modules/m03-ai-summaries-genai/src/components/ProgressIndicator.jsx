import React, { useState } from 'react';

export default function ProgressIndicator({ progress = 0, stage = 'Processing...', onCancel }) {
  const [isMinimized, setIsMinimized] = useState(false);

  if (isMinimized) {
    return (
      <div 
        className="progress-minimized-card"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '84px', // avoid overlapping the FAB at 24px
          width: '320px',
          background: '#ffffff',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          padding: '16px',
          zIndex: 9999, // Render on top when minimized
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          fontFamily: "'Inter', sans-serif"
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#0F172A' }}>Research in Progress</span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setIsMinimized(false)}
              style={{ background: 'rgba(59, 130, 246, 0.08)', border: 'none', borderRadius: '4px', padding: '3px 8px', color: '#3B82F6', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600 }}
            >
              Expand
            </button>
            {onCancel && (
              <button 
                onClick={onCancel}
                style={{ background: 'none', border: 'none', color: '#64748B', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
        <div style={{ fontSize: '0.75rem', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {stage}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ flex: 1, height: '6px', background: '#F1F5F9', borderRadius: '3px', overflow: 'hidden' }}>
            <div style={{ width: `${Math.min(progress, 100)}%`, height: '100%', background: 'var(--gradient-cta)' }} />
          </div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#3B82F6' }}>{progress}%</span>
        </div>
      </div>
    );
  }

  return (
    <div className="progress-overlay">
      <div className="progress-card">
        <div className="progress-title">Research in Progress</div>
        <div className="progress-stage">{stage}</div>
        <div className="progress-bar-container">
          <div className="progress-bar-fill" style={{ width: `${Math.min(progress, 100)}%` }} />
        </div>
        <div className="progress-pct">{progress}%</div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginTop: '20px' }}>
          <button
            onClick={() => setIsMinimized(true)}
            style={{
              padding: '8px 18px',
              fontSize: '0.8rem',
              color: '#3B82F6',
              background: 'rgba(59, 130, 246, 0.08)',
              border: '1.5px solid #3B82F6',
              borderRadius: '6px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            Run in Background
          </button>
          {onCancel && (
            <button
              onClick={onCancel}
              style={{
                padding: '8px 18px',
                fontSize: '0.8rem',
                color: '#64748B',
                background: 'none',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
