import React, { useState } from 'react';
import type { CallListItem } from '../types/calls.types';
import { formatDate, formatTime } from '../utils/formatters';
import { Calendar, Clock, CheckCircle, Loader2, XCircle, CircleSlash } from 'lucide-react';

interface CallsTableProps {
  calls: CallListItem[];
  onRowClick: (callId: string) => void;
}

const getDealTypeBadgeStyle = (dealType: string) => {
  const styles: Record<string, { bg: string; color: string }> = {
    meeting: { bg: '#DBEAFE', color: '#1E40AF' },
    inbound: { bg: '#D1FAE5', color: '#065F46' },
    outbound: { bg: '#E9D5FF', color: '#6B21A8' },
  };
  const normalized = dealType.toLowerCase();
  return styles[normalized] || { bg: '#F3F4F6', color: '#6B7280' };
};

export default function CallsTable({ calls, onRowClick }: CallsTableProps) {
  const [hoveredCallId, setHoveredCallId] = useState<string | null>(null);

  if (calls.length === 0) {
    return <div className="p-8 text-center text-gray-500">No calls found matching the criteria.</div>;
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        border: '1px solid #E5E7EB',
        backgroundColor: '#FFFFFF',
      }}
    >
      {/* Table Header */}
      <div
        className="grid gap-4 px-6 py-3"
        style={{
          gridTemplateColumns: '1.5fr 1fr 1.2fr 1fr 1.5fr 1fr 2.5fr 1fr',
          backgroundColor: '#F9FAFB',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div className="text-xs font-semibold" style={{ color: '#6B7280', fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}>
          CALL TITLE
        </div>
        <div className="text-xs font-semibold" style={{ color: '#6B7280', fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}>
          DEAL TYPE
        </div>
        <div className="text-xs font-semibold" style={{ color: '#6B7280', fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}>
          ACCOUNT
        </div>
        <div className="text-xs font-semibold" style={{ color: '#6B7280', fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}>
          OWNER
        </div>
        <div className="text-xs font-semibold" style={{ color: '#6B7280', fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}>
          DATE & TIME
        </div>
        <div className="text-xs font-semibold" style={{ color: '#6B7280', fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}>
          DURATION
        </div>
        <div className="text-xs font-semibold" style={{ color: '#6B7280', fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}>
          KEY INSIGHT
        </div>
        <div className="text-xs font-semibold" style={{ color: '#6B7280', fontFamily: 'var(--font-sans)', letterSpacing: '0.05em' }}>
          STATUS
        </div>
      </div>

      {/* Table Rows */}
      <div className="divide-y divide-gray-100">
        {calls.map((call) => {
          const isHovered = hoveredCallId === call.callId;
          const isClickable = call.status === 'completed';
          const dealStyle = getDealTypeBadgeStyle(call.dealType);
          const ownerDisplay = call.owner.ownerName === 'Alex Rodriguez' ? 'Me' : call.owner.ownerName;

          return (
            <div
              key={call.callId}
              onClick={() => handleRowClick(call)}
              onMouseEnter={() => setHoveredCallId(call.callId)}
              onMouseLeave={() => setHoveredCallId(null)}
              className="grid gap-4 px-6 py-4 transition-colors"
              style={{
                gridTemplateColumns: '1.5fr 1fr 1.2fr 1fr 1.5fr 1fr 2.5fr 1fr',
                backgroundColor: isHovered && isClickable ? '#FAFAFA' : '#FFFFFF',
                cursor: isClickable ? 'pointer' : 'default',
              }}
            >
              {/* Call Title */}
              <div>
                <p className="text-sm font-semibold mb-0.5" style={{ color: '#111827', fontFamily: 'var(--font-serif)' }}>
                  {call.callTitle}
                </p>
                <p className="text-xs" style={{ color: '#9CA3AF', fontFamily: 'var(--font-sans)' }}>
                  Recording #000{call.callId}
                </p>
              </div>

              {/* Deal Type */}
              <div className="flex items-center">
                <span
                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium"
                  style={{
                    backgroundColor: dealStyle.bg,
                    color: dealStyle.color,
                  }}
                >
                  {call.dealType}
                </span>
              </div>

              {/* Account */}
              <div className="flex items-center">
                <p className="text-sm" style={{ color: '#6B7280' }}>
                  {call.account}
                </p>
              </div>

              {/* Owner */}
              <div className="flex items-center gap-2">
                <div
                  className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-semibold flex-shrink-0"
                  style={{
                    backgroundColor: '#3B82F6',
                    color: '#FFFFFF',
                  }}
                >
                  {call.owner.avatarInitials}
                </div>
                <span className="text-sm" style={{ color: '#6B7280' }}>
                  {call.owner.ownerName === 'Sarah Chen' || call.owner.ownerName === 'Alex Rodriguez' ? 'Me' : call.owner.ownerName}
                </span>
              </div>

              {/* Date & Time */}
              <div className="flex flex-col justify-center">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <Calendar className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                  <p className="text-sm" style={{ color: '#6B7280' }}>
                    {formatDate(call.dateTime)}
                  </p>
                </div>
                <p className="text-xs pl-5" style={{ color: '#9CA3AF' }}>
                  {formatTime(call.dateTime)}
                </p>
              </div>

              {/* Duration */}
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" style={{ color: '#9CA3AF' }} />
                <span className="text-sm" style={{ color: '#6B7280' }}>
                  {call.duration}
                </span>
              </div>

              {/* Key Insight */}
              <div className="flex items-start gap-2.5 pr-2 py-0.5">
                <div
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2"
                  style={{ backgroundColor: '#3B82F6' }}
                />
                <p 
                  className="text-sm leading-relaxed line-clamp-2 text-left" 
                  style={{ 
                    color: '#4B5563',
                    lineHeight: '1.5',
                    fontFamily: 'var(--font-sans)',
                    fontWeight: 400,
                  }}
                  title={call.keyInsight}
                >
                  {call.keyInsight}
                </p>
              </div>

              {/* Status */}
              <div className="flex items-center">
                {call.status === 'completed' && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: '#D1FAE5',
                      color: '#059669',
                    }}
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Completed
                  </div>
                )}
                {call.status === 'processing' && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: '#FEF3C7',
                      color: '#D97706',
                    }}
                  >
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Processing
                  </div>
                )}
                {call.status === 'failed' && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: '#FEE2E2',
                      color: '#DC2626',
                    }}
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Failed
                  </div>
                )}
                {call.status === 'skipped' && (
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: '#F3F4F6',
                      color: '#6B7280',
                    }}
                  >
                    <CircleSlash className="w-3.5 h-3.5" />
                    Skipped
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  function handleRowClick(call: CallListItem) {
    if (call.status === 'completed') {
      onRowClick(call.callId);
    }
  }
}

