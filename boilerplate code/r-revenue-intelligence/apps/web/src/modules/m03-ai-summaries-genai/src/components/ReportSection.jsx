import React, { useState } from 'react';

export default function ReportSection({ section, reportId }) {
  const [selectedCitation, setSelectedCitation] = useState(null);

  if (!section) return null;

  return (
    <div className="report-section-content">
      <div className="report-section-title">
        {section.title}
        {section.status === 'PARTIAL' && (
          <span style={{ fontSize: '0.7rem', color: '#F59E0B', fontWeight: 500 }}>
            (Partial data)
          </span>
        )}
      </div>

      {section.summary && (
        <div className="report-section-summary">{section.summary}</div>
      )}

      {(section.bullets || []).map((bullet, i) => (
        <div key={bullet.bullet_id || i} className="report-bullet">
          <div className="report-bullet-marker" />
          <div>
            <div className="report-bullet-text">{bullet.text}</div>
            {bullet.citations && bullet.citations.length > 0 && (
              <div 
                className="report-bullet-citation"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}
                onClick={() => setSelectedCitation(bullet.citations[0])}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                  <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
                </svg>
                {bullet.citations[0].display_label}
              </div>
            )}
          </div>
        </div>
      ))}

      {(!section.bullets || section.bullets.length === 0) && (
        <div className="empty-state">
          <div className="empty-state-text">No findings available for this section.</div>
        </div>
      )}

      {/* Citation Modal */}
      {selectedCitation && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }} onClick={() => setSelectedCitation(null)}>
          <div style={{
            backgroundColor: '#fff', borderRadius: '8px', padding: '24px',
            maxWidth: '500px', width: '90%', maxHeight: '80vh', overflowY: 'auto',
            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
          }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', color: '#111827' }}>Citation Details</h3>
              <button onClick={() => setSelectedCitation(null)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '24px', color: '#6B7280', padding: 0, lineHeight: 1 }}>&times;</button>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Source Type:</strong> <span style={{ color: '#4F46E5', fontWeight: '500', marginLeft: '8px' }}>{selectedCitation.source_type}</span>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Source Name:</strong> <span style={{ marginLeft: '8px' }}>{selectedCitation.display_label}</span>
            </div>
            <div style={{ marginBottom: '12px' }}>
              <strong>Source ID:</strong> <span style={{ fontSize: '13px', color: '#6B7280', fontFamily: 'monospace', marginLeft: '8px' }}>{selectedCitation.source_id}</span>
            </div>
            <div style={{ marginTop: '20px' }}>
              <strong style={{ display: 'block', marginBottom: '8px' }}>Context Snippet:</strong>
              <div style={{
                padding: '16px', backgroundColor: '#F3F4F6', borderLeft: '4px solid #3B82F6',
                borderRadius: '0 6px 6px 0', fontSize: '14px', lineHeight: '1.6', color: '#374151',
                whiteSpace: 'pre-wrap', fontStyle: 'italic'
              }}>
                "{selectedCitation.context_snippet || "No context snippet available."}"
              </div>
            </div>
            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedCitation(null)}
                style={{ padding: '8px 24px', backgroundColor: '#3B82F6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', transition: 'background-color 0.2s' }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#2563EB'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#3B82F6'}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
