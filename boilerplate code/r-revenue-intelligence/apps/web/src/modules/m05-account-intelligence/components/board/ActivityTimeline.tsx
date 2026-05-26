'use client';

import { useState, useMemo } from 'react';
import type { ActivityDot } from '@/modules/m05-account-intelligence/types';
import { formatDateTime, formatDuration } from '@/modules/m05-account-intelligence/lib/utils';

interface ActivityTimelineProps {
  activities: ActivityDot[];
  width?: number;
  height?: number;
  showLegend?: boolean;
}

const COLORS = {
  rep: '#7C3AED',
  client: '#EC4899',
  meeting: '#9CA3AF',
};

const BASE_RADIUS = 5;
const CALL_MAX_DIAMETER = 22;

function getCallBubbleRadius(talkPct: number): number {
  return (Math.sqrt(talkPct / 100) * CALL_MAX_DIAMETER) / 2;
}

function getOutcomeLabel(activity: ActivityDot): string {
  if (activity.type === 'CALL') {
    if (activity.outcome === 'Left Voicemail') return 'Left Voicemail';
    if (activity.outcome === 'No Answer') return 'No Answer';
    if (activity.outcome === 'Connected' || (activity.rep_talk_pct && activity.client_talk_pct)) return 'Connected';
    return activity.outcome || 'Call';
  }
  if (activity.type === 'EMAIL') {
    return activity.direction === 'INBOUND' ? 'Inbound Email' : 'Outbound Email';
  }
  if (activity.type === 'MEETING') return 'Meeting';
  return activity.type;
}

export default function ActivityTimeline({ activities, width = 300, height = 40, showLegend = false }: ActivityTimelineProps) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; activity: ActivityDot } | null>(null);

  // Group activities by day, handle collisions
  const dots = useMemo(() => {
    const dayGroups: Record<number, ActivityDot[]> = {};
    activities.forEach((a) => {
      const day = a.days_ago;
      if (!dayGroups[day]) dayGroups[day] = [];
      dayGroups[day].push(a);
    });

    const result: Array<{
      activity: ActivityDot;
      cx: number;
      cy: number;
      elements: Array<{ cx: number; cy: number; r: number; fill: string; stroke?: string; strokeWidth?: number }>;
    }> = [];

    Object.entries(dayGroups).forEach(([dayStr, acts]) => {
      const day = parseInt(dayStr);
      const x = ((21 - day) / 21) * (width - 20) + 10;
      const yOffsets = [height / 2, height / 2 - 10, height / 2 + 10];

      acts.slice(0, 3).forEach((activity, idx) => {
        const cy = yOffsets[idx] || height / 2;
        const elements: Array<{ cx: number; cy: number; r: number; fill: string; stroke?: string; strokeWidth?: number }> = [];

        if (activity.type === 'CALL') {
          const repPct = activity.rep_talk_pct;
          const clientPct = activity.client_talk_pct;

          if (repPct && clientPct && activity.outcome !== 'Left Voicemail' && activity.outcome !== 'No Answer') {
            // Dual bubbles
            const repR = getCallBubbleRadius(repPct);
            const clientR = getCallBubbleRadius(clientPct);
            const gap = 2;

            if (activity.is_future) {
              // Hollow for future
              elements.push({ cx: x - repR - gap / 2, cy, r: repR, fill: 'transparent', stroke: COLORS.rep, strokeWidth: 1.5 });
              elements.push({ cx: x + clientR + gap / 2, cy, r: clientR, fill: 'transparent', stroke: COLORS.client, strokeWidth: 1.5 });
            } else {
              elements.push({ cx: x - repR - gap / 2, cy, r: repR, fill: COLORS.rep });
              elements.push({ cx: x + clientR + gap / 2, cy, r: clientR, fill: COLORS.client });
            }
          } else {
            // Single call dot
            elements.push({ cx: x, cy, r: BASE_RADIUS, fill: COLORS.rep });
          }
        } else if (activity.type === 'EMAIL') {
          if (activity.direction === 'INBOUND') {
            elements.push({ cx: x, cy, r: BASE_RADIUS, fill: 'transparent', stroke: COLORS.client, strokeWidth: 1.5 });
          } else {
            elements.push({ cx: x, cy, r: BASE_RADIUS, fill: COLORS.rep });
          }
        } else if (activity.type === 'MEETING') {
          elements.push({ cx: x, cy, r: 7, fill: COLORS.meeting });
        }

        result.push({ activity, cx: x, cy, elements });
      });
    });

    return result;
  }, [activities, width, height]);

  if (activities.length === 0) {
    return (
      <div className="activity-timeline" style={{ width, height }}>
        <svg width={width} height={height}>
          <line x1={10} y1={height / 2} x2={width - 10} y2={height / 2} stroke="var(--surface-border)" strokeWidth={1} strokeDasharray="4 4" />
          <text x={width / 2} y={height / 2 + 4} textAnchor="middle" fontSize={9} fill="var(--text-muted)">No activity</text>
        </svg>
      </div>
    );
  }

  return (
    <div className="activity-timeline" style={{ width, position: 'relative' }}>
      <svg width={width} height={height}>
        {/* Timeline baseline */}
        <line x1={10} y1={height / 2} x2={width - 10} y2={height / 2} stroke="var(--surface-border)" strokeWidth={1} />

        {/* Dots */}
        {dots.map((dot, di) =>
          dot.elements.map((el, ei) => (
            <circle
              key={`${di}-${ei}`}
              cx={el.cx}
              cy={el.cy}
              r={el.r}
              fill={el.fill}
              stroke={el.stroke}
              strokeWidth={el.strokeWidth}
              style={{ cursor: 'pointer', transition: 'r 150ms ease' }}
              onMouseEnter={(e) => {
                const rect = (e.target as SVGElement).closest('.activity-timeline')!.getBoundingClientRect();
                setTooltip({
                  x: el.cx,
                  y: -60,
                  activity: dot.activity,
                });
              }}
              onMouseLeave={() => setTooltip(null)}
            />
          )),
        )}
      </svg>

      {/* Tooltip */}
      {tooltip && (
        <div
          className="activity-dot-tooltip"
          style={{ left: Math.min(tooltip.x - 90, width - 200), top: tooltip.y }}
        >
          <div className="tooltip-date">{formatDateTime(tooltip.activity.timestamp)}</div>
          <div className="tooltip-detail" style={{ fontWeight: 600 }}>
            {getOutcomeLabel(tooltip.activity)}
          </div>
          {tooltip.activity.type === 'CALL' && tooltip.activity.rep_talk_pct && (
            <div className="tooltip-detail">
              Rep: {tooltip.activity.rep_talk_pct}% | Client: {tooltip.activity.client_talk_pct}%
              {tooltip.activity.duration_seconds && ` · ${formatDuration(tooltip.activity.duration_seconds)}`}
            </div>
          )}
          {tooltip.activity.type === 'EMAIL' && tooltip.activity.subject && (
            <div className="tooltip-detail">{tooltip.activity.subject}</div>
          )}
        </div>
      )}

      {/* Legend */}
      {showLegend && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginTop: 4,
          fontSize: 9,
          color: 'var(--text-muted)',
          userSelect: 'none',
        }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width={10} height={10}><circle cx={5} cy={5} r={4} fill={COLORS.rep} /></svg>
            Rep
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width={10} height={10}><circle cx={5} cy={5} r={4} fill="transparent" stroke={COLORS.client} strokeWidth={1.5} /></svg>
            Client
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width={10} height={10}><circle cx={5} cy={5} r={4} fill={COLORS.meeting} /></svg>
            Mtg
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <svg width={14} height={10}><line x1={0} y1={5} x2={14} y2={5} stroke={COLORS.rep} strokeWidth={1.5} /></svg>
            Email
          </span>
        </div>
      )}
    </div>
  );
}
