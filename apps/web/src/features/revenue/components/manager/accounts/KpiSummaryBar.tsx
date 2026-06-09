'use client';

import type { KpiCard } from '@revenue/types/accounts.types';

interface Props {
  cards: KpiCard[];
  isLoading: boolean;
}

const CARD_COLORS: Record<string, { dot: string; value: string; bg: string; border: string }> = {
  Accounts: { dot: 'bg-blue-500',  value: 'text-gray-900', bg: 'bg-white',       border: 'border-gray-200'  },
  Renewal:  { dot: 'bg-green-500', value: 'text-gray-900', bg: 'bg-white',       border: 'border-gray-200'  },
  Upsell:   { dot: 'bg-violet-500',value: 'text-gray-900', bg: 'bg-white',       border: 'border-gray-200'  },
  Churn:    { dot: 'bg-red-500',   value: 'text-gray-900', bg: 'bg-white',       border: 'border-gray-200'  },
};

function formatValue(value: number): string {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `$${(value / 1_000).toFixed(0)},000`;
  return `$${value}`;
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="skeleton h-3 w-20 mb-3 rounded" />
      <div className="skeleton h-7 w-28 mb-1 rounded" />
      <div className="skeleton h-3 w-10 rounded" />
    </div>
  );
}

export default function KpiSummaryBar({ cards, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="mx-6 mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  return (
    <div className="mx-6 mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((card) => {
        const colors = CARD_COLORS[card.label] ?? CARD_COLORS['Accounts'];
        return (
          <div
            key={card.label}
            className={`rounded-xl border ${colors.border} ${colors.bg} p-4 flex flex-col gap-1`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                {card.label}
              </span>
              <span className={`w-2 h-2 rounded-full ${colors.dot}`} />
            </div>
            <span className={`text-2xl font-bold ${colors.value}`}>
              {formatValue(card.value)}
            </span>
            <span className="text-xs text-gray-400">({card.count})</span>
          </div>
        );
      })}
    </div>
  );
}
