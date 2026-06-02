'use client';

import { X, AlertTriangle } from 'lucide-react';
import type { AlertBannerData } from '@revenue/types/accounts.types';

interface Props {
  data: AlertBannerData;
  onViewAtRisk: () => void;
  onFilterNoActivity: () => void;
  onDismiss: () => void;
}

function formatARR(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value}`;
}

export default function AlertBanner({
  data,
  onViewAtRisk,
  onFilterNoActivity,
  onDismiss,
}: Props) {
  return (
    <div className="mx-6 mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <AlertTriangle className="mt-0.5 shrink-0 text-red-500" size={16} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-red-800">
              At Risk Revenue Alert
            </p>
            <p className="mt-0.5 text-sm text-red-700">
              <span className="font-medium">{formatARR(data.totalARR)} ARR</span>{' '}
              across{' '}
              <span className="font-medium">{data.accountCount} accounts</span>{' '}
              has had no activity in the last{' '}
              <span className="font-medium">{data.inactiveDays} days</span>
            </p>
            <div className="mt-2.5 flex flex-wrap gap-2">
              <button
                onClick={onViewAtRisk}
                className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-700 transition-colors"
              >
                View At-Risk Accounts
              </button>
              <button
                onClick={onFilterNoActivity}
                className="rounded-md border border-red-300 bg-white px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors"
              >
                Filter by No Activity
              </button>
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="shrink-0 rounded p-0.5 text-red-400 hover:text-red-600 transition-colors"
          aria-label="Dismiss alert"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
