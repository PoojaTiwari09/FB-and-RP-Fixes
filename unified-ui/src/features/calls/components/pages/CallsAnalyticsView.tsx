'use client';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LabelList,
} from 'recharts';
import {
  TrendingUp, TrendingDown, Search, ChevronDown,
  FileText, Upload,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import CallsTopNav from '@calls/components/ui/CallsTopNav';
import { useCallsAnalytics } from '@calls/hooks/useCallsAnalytics';
import { format } from '@calls/services/format';

const DATE_RANGE_OPTIONS = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'All Time'];
const REP_OPTIONS = ['All Reps', 'Sarah Chen', 'Jennifer Kim', 'Michael Rodriguez'];

// Review history tag pills — all grey as per Figma
function tagPillClass() {
  return 'bg-gray-100 text-gray-600 border border-gray-200';
}

// Focus area bar + text colors — exactly as Figma:
// Objection Handling = orange, Discovery = amber/yellow, Next Steps = green
function focusBarColor(index: number) {
  if (index === 0) return '#f97316'; // orange  — Objection Handling 68%
  if (index === 1) return '#f59e0b'; // amber   — Discovery 72%
  return '#22c55e';                  // green   — Next Steps 75%
}
function focusTextColor(index: number) {
  if (index === 0) return 'text-orange-500';
  if (index === 1) return 'text-amber-500';
  return 'text-green-500';
}

function scoreBadgeColor(score: number) {
  if (score >= 85) return 'text-emerald-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-red-500';
}

const CustomBarLabel = (props: { x?: number; y?: number; width?: number; value?: number }) => {
  const { x = 0, y = 0, width = 0, value } = props;
  return (
    <text x={x + width / 2} y={y - 5} fill="#6b7280" textAnchor="middle" fontSize={11} fontWeight={500}>
      {value}
    </text>
  );
};

function KpiCard({
  title, value, unit = '', trend, note, icon: Icon, iconColor,
}: {
  title: string; value: number; unit?: string; trend?: number;
  note?: string; icon: React.ElementType; iconColor: string;
}) {
  const positive = trend !== undefined && trend >= 0;
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5 shadow-sm">
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs text-gray-500">{title}</p>
        <Icon size={16} className={iconColor} />
      </div>
      <div className="text-3xl font-bold text-gray-900 leading-none mb-1">
        {value}{unit}
      </div>
      {trend !== undefined && (
        <span className={clsx(
          'inline-flex items-center gap-0.5 text-xs font-medium',
          positive ? 'text-emerald-600' : 'text-red-500'
        )}>
          {positive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {positive ? '+' : ''}{trend}% from last month
        </span>
      )}
      {note && <p className="text-xs text-gray-400 mt-0.5">{note}</p>}
    </div>
  );
}

export default function CallsAnalyticsView() {
  const router = useRouter();
  const {
    summary, trend, focusAreas,
    history, loading,
    historySearch, setHistorySearch,
    historyRep, setHistoryRep,
    historyRange, setHistoryRange,
  } = useCallsAnalytics();

  if (loading || !summary) {
    return (
      <div className="flex flex-col min-h-screen bg-[#faf9fc]">
        <CallsTopNav />
        <div className="px-6 py-6 animate-pulse space-y-5">
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => <div key={i} className="h-28 bg-gray-200 rounded-xl" />)}
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 h-72 bg-gray-200 rounded-xl" />
            <div className="h-72 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-56 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#faf9fc]">
      <CallsTopNav />

      <div className="px-6 py-5 space-y-5 flex-1">

        {/* Page Heading */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Review History &amp; Analytics</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track review trends and coaching patterns over time</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Rep Average Score — green trending icon */}
          <KpiCard
            title="Rep Average Score"
            value={summary.repAvgScore}
            unit="%"
            trend={summary.repScoreTrend}
            icon={TrendingUp}
            iconColor="text-emerald-400"
          />
          {/* Team Average — blue upload icon */}
          <KpiCard
            title="Team Average"
            value={summary.teamAvgScore}
            unit="%"
            note={
              summary.teamComparison === 'above' ? 'Your rep is above average'
              : summary.teamComparison === 'below' ? 'Your rep is below average'
              : 'On par with team average'
            }
            icon={Upload}
            iconColor="text-blue-500"
          />
          {/* Completion Rate — purple file icon */}
          <KpiCard
            title="Completion Rate"
            value={summary.completionRate}
            unit="%"
            note="Reviews completed on time"
            icon={FileText}
            iconColor="text-purple-500"
          />
          {/* Total Reviews — amber upload icon */}
          <KpiCard
            title="Total Reviews"
            value={summary.totalReviews}
            note="This period"
            icon={Upload}
            iconColor="text-amber-500"
          />
        </div>

        {/* Score Trend + Focus Areas */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Score Trend — fat bars, minimal gap */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Score Trend</h2>
            {trend.length === 0 ? (
              <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                Complete some reviews to see your score trend.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart
                  data={trend}
                  margin={{ top: 20, right: 4, left: -28, bottom: 0 }}
                  barCategoryGap="8%"
                  barGap={2}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                  <XAxis
                    dataKey="week"
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fontSize: 11, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    ticks={[0, 25, 50, 75, 100]}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '12px' }}
                    formatter={(value) => [`${value}`, 'Score']}
                  />
                  <Bar dataKey="score" fill="#1a3a8f" radius={[3, 3, 0, 0]}>
                    <LabelList dataKey="score" position="top" content={<CustomBarLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Focus Areas */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-1">Focus Areas</h2>
            <p className="text-xs text-gray-400 mb-5">Sections with lowest average scores</p>
            <div className="space-y-5">
              {focusAreas.map((fa, i) => (
                <div key={fa.sectionName}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-gray-800">{fa.sectionName}</span>
                    <span className={clsx('text-sm font-semibold', focusTextColor(i))}>
                      {fa.avgScore}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full transition-all duration-500"
                      style={{ width: `${fa.avgScore}%`, backgroundColor: focusBarColor(i) }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Common Tags + Review History */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Common Tags — count has grey bg pill */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Common Tags</h2>
            <div className="space-y-3">
              {[
                { tag: 'Needs Coaching', count: 12 },
                { tag: 'Strong Discovery', count: 8 },
                { tag: 'Best Practice', count: 6 },
                { tag: 'Poor Closing', count: 5 },
              ].map((t) => (
                <div key={t.tag} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{t.tag}</span>
                  <span className="text-xs font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full min-w-[28px] text-center">
                    {t.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Review History */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-900 mb-4">Review History</h2>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-4">
              <div className="relative flex-1 min-w-[180px]">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reviews..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-300 bg-white"
                />
              </div>
              <div className="relative">
                <select
                  value={historyRep}
                  onChange={(e) => setHistoryRep(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer"
                >
                  {REP_OPTIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
              <div className="relative">
                <select
                  value={historyRange}
                  onChange={(e) => setHistoryRange(e.target.value)}
                  className="appearance-none pl-3 pr-8 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-1 focus:ring-gray-300 cursor-pointer"
                >
                  {DATE_RANGE_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {history.length === 0 ? (
              <div className="text-center py-10 text-gray-400 text-sm">
                No reviews found for this period.
              </div>
            ) : (
              <div className="space-y-2">
                {history.map((item) => (
                  <div
                    key={item.reviewId}
                    onClick={() => router.push(`/calls/analytics/review/${item.reviewId}`)}
                    className="flex items-start justify-between gap-4 px-4 py-4 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors border border-gray-100"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900">{item.callTitle}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.reviewerName} · {format.date(item.reviewedAt)} {format.time(item.reviewedAt)}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {item.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={clsx('text-2xl font-bold', scoreBadgeColor(item.score))}>
                        {item.score}
                      </span>
                      <p className="text-xs text-gray-400">out of 100</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
