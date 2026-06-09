'use client';

import type { ActivityDot, ActivityType } from '@revenue/types/accounts.types';

interface Props {
  dots: ActivityDot[];
  accountId: string;
}

const DOT_COLORS: Record<ActivityType, string> = {
  Meeting: 'bg-blue-500',
  Call:    'bg-green-500',
  Email:   'bg-orange-400',
  Note:    'bg-gray-400',
};

function formatDatetime(iso: string): string {
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function ActivityDots({ dots }: Props) {
  if (dots.length === 0) {
    return <span className="text-xs text-gray-300 italic">no activity</span>;
  }

  return (
    <div className="flex items-center gap-1">
      {dots.map((dot, i) => (
        <div key={i} className="group relative">
          <span
            className={`block w-2.5 h-2.5 rounded-full ${DOT_COLORS[dot.type] ?? 'bg-gray-400'} cursor-default`}
          />
          {/* Tooltip */}
          <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 w-52 rounded-lg border border-gray-200 bg-white shadow-lg p-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-xs font-semibold text-gray-800">{dot.type}</p>
            <p className="text-xs text-gray-500 mt-0.5">{formatDatetime(dot.timestamp)}</p>
            {dot.label && (
              <p className="text-xs text-gray-600 mt-0.5 truncate">{dot.label}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
