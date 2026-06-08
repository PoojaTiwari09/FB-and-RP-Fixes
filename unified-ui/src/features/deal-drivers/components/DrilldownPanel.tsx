'use client';
import { useState } from 'react';
import { scheduleOneOnOne } from '../services/dealDriversService';
import type { DrilldownResponse } from '../types';

type Props = {
  data: DrilldownResponse;
  repName: string;
  warningLabel: string;
  warningType: string;
  period: string;
  onClose: () => void;
  onExport?: () => void;
};

function getBoardIdForDeal(dealId: string): string {
  const idStr = String(dealId);
  if (['deal-1', 'deal-2', 'deal-3', 'deal-4', '1', '2', '3', '4'].includes(idStr)) return 'board-1';
  if (['deal-5', 'deal-6', '5', '6'].includes(idStr)) return 'board-2';
  if (['deal-7', '7'].includes(idStr)) return 'board-3';
  if (['deal-8', '8'].includes(idStr)) return 'board-4';
  return 'board-1'; // fallback
}

function getDefaultDateValue() {
  return new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function DrilldownPanel({ data, repName, warningLabel, warningType, period, onClose, onExport }: Props) {
  const [suggestedDate, setSuggestedDate] = useState(getDefaultDateValue);
  const [note, setNote] = useState('');
  const [scheduleStatus, setScheduleStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSchedule = async () => {
    setSaving(true);
    setScheduleStatus('');

    try {
      const result = await scheduleOneOnOne({
        repId: data.rep.id,
        suggestedDate,
        note: note.trim() || undefined,
      });
      setScheduleStatus(result.confirmationMessage);
      setNote('');
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSchedule();
    }
  };



  return (
    <div
      className="drilldown-backdrop"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.4)',
        zIndex: 1000,
        display: 'flex',
        justifyContent: 'flex-end',
        padding: 0,
      }}
    >
      <div
        className="drilldown-panel"
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 0,
          width: 480,
          maxWidth: '100vw',
          height: '100vh',
          maxHeight: '100vh',
          overflowY: 'auto',
          padding: 24,
          boxShadow: '-4px 0 24px rgba(0, 0, 0, 0.15)',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* Header row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>
              {repName} — {warningLabel}
            </div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>
              {warningType === 'all'
                ? `${data.repSidebar.dealsInPipeline} deals in pipeline`
                : `${data.summary.dealsFlagged} of ${data.repSidebar.dealsInPipeline} deals impacted`}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className="btn-export-sm"
              onClick={onExport}
              style={{
                padding: '5px 10px',
                background: '#f3f4f6',
                border: '1px solid #ddd',
                borderRadius: 4,
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              Export CSV
            </button>
            <button
              onClick={onClose}
              style={{
                border: 'none',
                background: '#f3f4f6',
                width: 28,
                height: 28,
                borderRadius: '50%',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                color: '#6b7280',
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#e5e7eb';
                e.currentTarget.style.color = '#111827';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = '#f3f4f6';
                e.currentTarget.style.color = '#6b7280';
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Flagged Section / Table */}
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.06em', color: '#6b7280', marginBottom: 10 }}>
            {warningType === 'all' ? 'DEALS IN PIPELINE' : 'FLAGGED DEALS'}
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e5e7eb' }}>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'bottom' }}>ACCOUNT</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'bottom' }}>AMOUNT</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'bottom' }}>STAGE</th>
                <th style={{ textAlign: 'left', padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'bottom' }}>CLOSE</th>
                <th style={{ textAlign: 'right', padding: '10px 8px', fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', verticalAlign: 'bottom', width: 90 }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {data.flaggedDeals.map((deal, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px 8px', fontWeight: 600, color: '#111827', textAlign: 'left' }}>
                    {deal.accountName}
                  </td>
                  <td style={{ padding: '12px 8px', fontWeight: 600, color: '#111827', textAlign: 'left' }}>
                    ${deal.dealAmount.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px 8px', color: '#6b7280', fontSize: 12, textAlign: 'left' }}>
                    {deal.crmStage}
                  </td>
                  <td style={{ padding: '12px 8px', fontSize: 12, textAlign: 'left' }}>
                    <span style={{
                      color: deal.closeDateStatus === 'overdue' ? '#dc2626' :
                        deal.closeDateStatus === 'soon' ? '#d97706' : '#6b7280',
                      fontWeight: deal.closeDateStatus !== 'ok' ? 600 : 400
                    }}>
                      {deal.closeDate}
                    </span>
                  </td>
                  <td style={{ padding: '12px 8px', textAlign: 'right' }}>
                    <button
                      onClick={() => {
                        const dId = deal.dealId || '';
                        window.location.href = `/deal-boards/${getBoardIdForDeal(dId)}?dealId=${dId}`;
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#2563eb',
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        padding: 0,
                      }}
                      onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                      onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                    >
                      View Deal →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Schedule 1:1 Section */}
        <div style={{ padding: 16, border: '1px solid #e5e7eb', borderRadius: 8, background: '#f9fafb', flexShrink: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#111827' }}>Schedule 1:1</div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                {repName} | {warningLabel} | {period}
              </div>
            </div>
            <button
              onClick={handleSchedule}
              disabled={saving}
              style={{
                background: 'none',
                border: 'none',
                color: '#2563eb',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                padding: 0,
              }}
              onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
            >
              {saving ? 'Scheduling...' : 'Schedule 1:1'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 12 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#6b7280' }}>
              Suggested date
              <input
                type="date"
                value={suggestedDate}
                onChange={e => setSuggestedDate(e.target.value)}
                onKeyDown={handleKeyDown}
                style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 10px', fontSize: 13, outline: 'none', background: '#fff' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#6b7280' }}>
              Note
              <textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Optional context for the 1:1"
                style={{ border: '1px solid #e5e7eb', borderRadius: 6, padding: '8px 10px', fontSize: 13, resize: 'none', outline: 'none', background: '#fff' }}
              />
            </label>
          </div>

          {scheduleStatus && (
            <div style={{ marginTop: 10, fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
              {scheduleStatus}
            </div>
          )}
          <div style={{ marginTop: 8, fontSize: 11, color: '#9ca3af' }}>
            Uses the drilldown rep context and the selected period to capture follow-up coaching.
          </div>
        </div>
      </div>
    </div>
  );
}
