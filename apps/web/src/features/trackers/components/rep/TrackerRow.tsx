'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import type { Tracker } from '../../types/tracker.types';

interface TrackerRowProps {
  tracker: Tracker;
  isSelected: boolean;
  onClick: () => void;
}

export default function TrackerRow({ tracker, isSelected, onClick }: TrackerRowProps) {
  const isPositive = tracker.trend >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? 'text-green-600' : 'text-red-600';
  const trendSign = isPositive ? '↑' : '↓';

  return (
    <div
      onClick={onClick}
      className={`p-4 cursor-pointer border-b border-gray-100 last:border-b-0 transition-colors ${
        isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">{tracker.name}</span>
          <div className={`flex items-center gap-1 text-sm ${trendColor}`}>
            <TrendIcon className="w-4 h-4" />
            <span>
              {trendSign}
              {Math.abs(tracker.trend)}%
            </span>
          </div>
        </div>
        <span className="text-lg font-semibold text-gray-900">{tracker.percentage}%</span>
      </div>
      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${tracker.percentage}%`,
            background: 'linear-gradient(to right, #f97316, #3b82f6)',
          }}
        />
      </div>
    </div>
  );
}
