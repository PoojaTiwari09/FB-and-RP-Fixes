'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Star,
  BookOpen,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
} from 'lucide-react';
import { fetchCoachingInsights } from '@calls/services/callsApi';
import type { CoachingInsights } from '@calls/data/mockData';

// ─── KPI Card ─────────────────────────────────────────────────────────────────

interface KPICardProps {
  label: string;
  value: string | number;
  sub?: string;
  delta?: number;
  icon: React.ReactNode;
  iconBg: string;
}

function KPICard({ label, value, sub, delta, icon, iconBg }: KPICardProps) {
  const deltaPositive = delta !== undefined && delta > 0;
  const deltaNegative = delta !== undefined && delta < 0;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
        <span className={`p-2 rounded-lg ${iconBg}`}>{icon}</span>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-3xl font-bold text-gray-900">{value}</span>
        {delta !== undefined && (
          <span
            className={`flex items-center gap-0.5 text-xs font-semibold mb-0.5 ${
              deltaPositive ? 'text-green-600' : deltaNegative ? 'text-red-500' : 'text-gray-400'
            }`}
          >
            {deltaPositive ? <TrendingUp size={12} /> : deltaNegative ? <TrendingDown size={12} /> : null}
            {deltaPositive ? '+' : ''}{delta}
          </span>
        )}
      </div>
      {sub && <span className="text-xs text-gray-400">{sub}</span>}
    </div>
  );
}

// ─── Score Trend Line Chart (SVG) ─────────────────────────────────────────────

function ScoreTrendChart({ data }: { data: { month: string; score: number }[] }) {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; month: string; score: number } | null>(null);

  const W = 500;
  const H = 160;
  const PAD = { top: 16, right: 20, bottom: 32, left: 40 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const minScore = 55;
  const maxScore = 85;
  const range = maxScore - minScore;

  const xOf = (i: number) => PAD.left + (i / (data.length - 1)) * chartW;
  const yOf = (score: number) => PAD.top + chartH - ((score - minScore) / range) * chartH;

  const points = data.map((d, i) => `${xOf(i)},${yOf(d.score)}`).join(' ');
  const fillPoints = `${xOf(0)},${PAD.top + chartH} ${points} ${xOf(data.length - 1)},${PAD.top + chartH}`;

  const yGridLines = [60, 65, 70, 75, 80];

  return (
    <div className="relative w-full">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full h-auto"
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Y grid lines */}
        {yGridLines.map((score) => (
          <g key={score}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={yOf(score)}
              y2={yOf(score)}
              stroke="#f3f4f6"
              strokeWidth={1}
            />
            <text x={PAD.left - 6} y={yOf(score) + 4} textAnchor="end" fontSize={9} fill="#9ca3af">
              {score}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <polygon points={fillPoints} fill="url(#scoreGrad)" opacity={0.25} />

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke="#3b82f6"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Gradient */}
        <defs>
          <linearGradient id="scoreGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
          </linearGradient>
        </defs>

        {/* Data points */}
        {data.map((d, i) => (
          <g key={d.month}>
            <circle
              cx={xOf(i)}
              cy={yOf(d.score)}
              r={4}
              fill="white"
              stroke="#3b82f6"
              strokeWidth={2}
              className="cursor-pointer"
              onMouseEnter={() => setTooltip({ x: xOf(i), y: yOf(d.score), month: d.month, score: d.score })}
            />
            {/* X axis label */}
            <text x={xOf(i)} y={H - 6} textAnchor="middle" fontSize={9} fill="#9ca3af">
              {d.month}
            </text>
          </g>
        ))}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <rect
              x={tooltip.x - 26}
              y={tooltip.y - 32}
              width={52}
              height={24}
              rx={4}
              fill="#1e40af"
            />
            <text x={tooltip.x} y={tooltip.y - 15} textAnchor="middle" fontSize={9} fill="white" fontWeight="600">
              {tooltip.month}: {tooltip.score}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

// ─── Horizontal Bar Chart ─────────────────────────────────────────────────────

function HBarChart({
  data,
  maxValue,
  getBarColor,
}: {
  data: { label: string; value: number }[];
  maxValue: number;
  getBarColor?: (value: number, label: string) => string;
}) {
  return (
    <div className="space-y-3">
      {data.map(({ label, value }) => {
        const pct = (value / maxValue) * 100;
        const barColor = getBarColor ? getBarColor(value, label) : 'bg-blue-500';
        return (
          <div key={label}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>{label}</span>
              <span className="font-medium">{value}</span>
            </div>
            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CoachingInsightsView() {
  const [data, setData] = useState<CoachingInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCoachingInsights()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-96">
        <Loader2 size={28} className="text-blue-400 animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 min-h-96">
        <p className="text-sm">Not enough calls to display insights yet.</p>
      </div>
    );
  }

  const maxTagCount = Math.max(...data.tagFrequency.map((t) => t.count));
  const tagBarColor = (tag: string) => {
    const map: Record<string, string> = {
      'Best Practice': 'bg-blue-500',
      'Needs Coaching': 'bg-orange-400',
      'High Value': 'bg-purple-500',
      Risk: 'bg-red-500',
      'Compliance Issue': 'bg-red-700',
    };
    return map[tag] ?? 'bg-gray-400';
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Page Header */}
      <div className="px-6 py-5 bg-white border-b border-gray-200">
        <Link
          href="/calls/ai-reviewer"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors mb-3"
        >
          <ArrowLeft size={14} />
          Back to Calls List
        </Link>
        <h1 className="text-xl font-semibold text-gray-900">Coaching &amp; Insights</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Track your performance and improvement over time
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard
            label="Average Score"
            value={data.averageScore}
            delta={data.averageScoreDelta}
            sub="vs last month"
            icon={<Star size={16} className="text-blue-600" />}
            iconBg="bg-blue-50"
          />
          <KPICard
            label="Best Practice Calls"
            value={data.bestPracticeCalls.count}
            sub={`out of ${data.bestPracticeCalls.total} total`}
            icon={<CheckCircle2 size={16} className="text-green-600" />}
            iconBg="bg-green-50"
          />
          <KPICard
            label="Coaching Completion"
            value={`${data.coachingCompletion.percentage}%`}
            sub={`${data.coachingCompletion.actionsCompleted}/${data.coachingCompletion.totalActions} actions`}
            icon={<BookOpen size={16} className="text-purple-600" />}
            iconBg="bg-purple-50"
          />
          <KPICard
            label="Needs Coaching"
            value={data.needsCoachingCount}
            sub="calls flagged"
            icon={<AlertTriangle size={16} className="text-orange-500" />}
            iconBg="bg-orange-50"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Score Trend */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Score Trend</h3>
            <ScoreTrendChart data={data.scoreTrend} />
          </div>

          {/* Section Performance */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Section Performance</h3>
            <HBarChart
              data={data.sectionPerformance.map((s) => ({ label: s.section, value: s.score }))}
              maxValue={100}
              getBarColor={(v) =>
                v >= 80 ? 'bg-green-500' : v >= 65 ? 'bg-yellow-400' : 'bg-red-400'
              }
            />
          </div>
        </div>

        {/* Tag Frequency */}
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-800 mb-4">Tag Frequency</h3>
          <HBarChart
            data={data.tagFrequency.map((t) => ({ label: t.tag, value: t.count }))}
            maxValue={maxTagCount}
            getBarColor={(_v, label) => tagBarColor(label)}
          />
        </div>

        {/* Strengths + Common Mistakes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Strength Areas */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Strength Areas</h3>
            <ul className="space-y-2">
              {data.strengthAreas.map((s) => (
                <li key={s} className="flex items-start gap-2">
                  <CheckCircle2 size={15} className="text-green-500 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{s}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Common Mistakes */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Common Mistakes</h3>
            <ul className="space-y-2">
              {data.commonMistakes.map((m) => (
                <li key={m} className="flex items-start gap-2">
                  <XCircle size={15} className="text-red-400 shrink-0 mt-0.5" />
                  <span className="text-sm text-gray-700">{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
