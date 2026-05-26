'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Activity, ArrowDown, ArrowUp, Download, Minus, Search, TrendingUp, Users } from 'lucide-react';
import { StatCard } from '@/components/cards/StatCard';
import { Button } from '@/components/ui/button';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { analyticsService } from '@/services/analytics.service';

function scoreColor(score: number | undefined | null) {
  if (score == null) return 'text-gray-400';
  if (score >= 70) return 'text-green-600';
  if (score >= 50) return 'text-amber-600';
  return 'text-red-600';
}

function scoreBg(score: number | undefined | null) {
  if (score == null) return 'bg-gray-100 text-gray-600';
  if (score >= 70) return 'bg-green-100 text-green-800';
  if (score >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

function statusChip(status: string | undefined, score: number | undefined | null) {
  const label = status || (score != null ? (score >= 70 ? 'Excellent' : score >= 50 ? 'Improving' : 'High Risk') : 'Unknown');
  const colors: Record<string, string> = {
    Excellent: 'bg-green-100 text-green-800',
    Improving: 'bg-blue-100 text-blue-800',
    'High Risk': 'bg-red-100 text-red-800',
  };
  return <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors[label] || 'bg-gray-100 text-gray-600'}`}>{label}</span>;
}

function TrendIcon({ trend }: { trend?: string }) {
  if (trend === 'up') return <ArrowUp className="inline h-3.5 w-3.5 text-green-600" />;
  if (trend === 'down') return <ArrowDown className="inline h-3.5 w-3.5 text-red-600" />;
  return <Minus className="inline h-3.5 w-3.5 text-gray-400" />;
}

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return 'Never';
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return 'Never'; }
}

export default function ReviewsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Score');
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  const dashboardQ = useQuery({
    queryKey: ['manager-reviews-dashboard'],
    queryFn: () => analyticsService.getDashboard(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const repsQ = useQuery({
    queryKey: ['manager-reviews-reps'],
    queryFn: () => analyticsService.getReps(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const interactionsQ = useQuery({
    queryKey: ['manager-reviews-interactions'],
    queryFn: () => analyticsService.getInteractionAnalytics(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const dashboard = dashboardQ.data || {};
  const interactions = interactionsQ.data || {};
  const reps: any[] = Array.isArray(repsQ.data) ? repsQ.data : [];

  const talkRatio = interactions.avgTalkRatio ?? 0;
  const talkRatioColor = talkRatio > 60 ? 'text-red-600' : talkRatio > 50 ? 'text-amber-600' : 'text-green-600';

  const scoreTrend: Array<Record<string, string | number>> = dashboard.scoreTrend ?? [];
  const teamAvgScore = dashboard.avgTeamScore ?? 0;

  const filteredReps = useMemo(() => {
    let list = [...reps];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r) => (r.name || '').toLowerCase().includes(q));
    }
    if (statusFilter !== 'All') {
      list = list.filter((r) => {
        const status = r.status || (r.overall_score != null ? (r.overall_score >= 70 ? 'Excellent' : r.overall_score >= 50 ? 'Improving' : 'High Risk') : 'Unknown');
        return status === statusFilter;
      });
    }
    list.sort((a, b) => {
      switch (sortBy) {
        case 'Name': return (a.name || '').localeCompare(b.name || '');
        case 'Sessions': return (b.session_count ?? 0) - (a.session_count ?? 0);
        case 'Last Active': return new Date(b.last_session || 0).getTime() - new Date(a.last_session || 0).getTime();
        default: return (b.overall_score ?? 0) - (a.overall_score ?? 0);
      }
    });
    return list;
  }, [reps, search, statusFilter, sortBy]);

  const isLoading = dashboardQ.isLoading || repsQ.isLoading || interactionsQ.isLoading;
  const isError = dashboardQ.isError || repsQ.isError || interactionsQ.isError;

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (isError) {
    const err = (dashboardQ.error || repsQ.error || interactionsQ.error) as Error;
    return <ErrorCard message={err?.message} onRetry={() => { dashboardQ.refetch(); repsQ.refetch(); interactionsQ.refetch(); }} />;
  }

  async function exportCSV() {
    try {
      const csv = await analyticsService.exportReport('Performance', {});
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'coaching-review.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reviews</h1>
          <p className="text-sm text-gray-500">Rep coaching performance &middot; updated twice daily</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2 rounded-xl">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Section 1: Team health summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={TrendingUp}
          label="Team Avg Score"
          value={Math.round(Number(dashboard.avgTeamScore ?? 0))}
          trend={dashboard.weeklyImprovement ? `+${dashboard.weeklyImprovement} pts` : undefined}
        />
        <StatCard
          icon={Users}
          label="Reps Needing Attention"
          value={Number(dashboard.repsNeedingAttention ?? 0)}
        />
        <StatCard
          icon={Activity}
          label="Training Completion Rate"
          value={`${Math.round(Number(dashboard.completionRate ?? 0))}%`}
        />
        <StatCard
          icon={TrendingUp}
          label="Weekly Improvement"
          value={`+${Math.round(Number(dashboard.weeklyImprovement ?? 0))} pts`}
          trend={Number(dashboard.weeklyImprovement ?? 0) >= 0 ? 'On track' : 'Needs focus'}
        />
      </div>

      {/* Section 2: Interaction benchmarks */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Talk Ratio</p>
          <p className={`mt-1 text-2xl font-bold ${talkRatioColor}`}>{Math.round(Number(talkRatio))}%</p>
          <p className="mt-1 text-xs text-gray-400">{talkRatio > 60 ? 'High — let the buyer speak more' : talkRatio > 50 ? 'Moderate' : 'Good balance'}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Questions / Session</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{Math.round(Number(interactions.avgQuestionsAsked ?? 0))}</p>
          <p className="mt-1 text-xs text-gray-400">Avg discovery questions per call</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">Closing Attempts</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{Math.round(Number(interactions.avgClosingAttempts ?? 0))}</p>
          <p className="mt-1 text-xs text-gray-400">Avg closing attempts per session</p>
        </div>
      </div>

      {/* Section 3: Rep performance table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50/50 p-4">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search reps..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="All">All Status</option>
            <option value="Excellent">Excellent</option>
            <option value="Improving">Improving</option>
            <option value="High Risk">High Risk</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="Score">Sort: Score</option>
            <option value="Name">Sort: Name</option>
            <option value="Sessions">Sort: Sessions</option>
            <option value="Last Active">Sort: Last Active</option>
          </select>
        </div>

        {filteredReps.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">No reps found. Adjust your filter or check back after the next data refresh.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rep</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trend</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sessions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Weakest Skill</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Strongest Skill</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Session</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredReps.map((rep: any) => (
                  <RepRow key={rep.id || rep.name} rep={rep} expanded={expandedRow === rep.id} onToggle={() => setExpandedRow(expandedRow === rep.id ? null : rep.id)} onViewSessions={() => router.push('/manager/analytics/reps')} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 4: Score trend chart */}
      {scoreTrend.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900">Team Score Trend</h2>
          <div className="relative mt-6 h-48">
            {/* Dashed horizontal line for team avg */}
            <div
              className="absolute left-0 right-0 border-t-2 border-dashed border-indigo-300 z-10"
              style={{ bottom: `${(Number(teamAvgScore) / 100) * 100}%` }}
            >
              <span className="absolute -top-4 left-0 text-xs text-indigo-500">Avg: {Math.round(Number(teamAvgScore))}</span>
            </div>
            <div className="flex items-end justify-around gap-2 h-full">
              {scoreTrend.map((item, index) => {
                const score = Number(item.score ?? 0);
                const date = String(item.date ?? '');
                const heightPct = Math.min(100, Math.max(2, score));
                return (
                  <div key={index} className="flex flex-1 flex-col items-center justify-end h-full">
                    <span className={`text-xs font-semibold ${scoreColor(score)}`}>{score}</span>
                    <div
                      className={`mt-1 w-full max-w-[40px] rounded-t ${score >= 70 ? 'bg-green-400' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
                      style={{ height: `${heightPct}%`, minHeight: '8px' }}
                    />
                    <span className="mt-1 text-[10px] text-gray-400 truncate max-w-full">{date}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function RepRow({ rep, expanded, onToggle, onViewSessions }: { rep: any; expanded: boolean; onToggle: () => void; onViewSessions: () => void }) {
  const score = rep.overall_score;
  const status = rep.status || (score != null ? (score >= 70 ? 'Excellent' : score >= 50 ? 'Improving' : 'High Risk') : 'Unknown');

  return (
    <>
      <tr className="hover:bg-gray-50 cursor-pointer" onClick={onToggle}>
        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{rep.name || 'Unknown'}</td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreBg(score)}`}>{score ?? '—'}</span>
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm"><TrendIcon trend={rep.trend} /></td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{rep.session_count ?? 0}</td>
        <td className="px-4 py-3 whitespace-nowrap">
          {rep.weakest_skill ? <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">{rep.weakest_skill}</span> : <span className="text-sm text-gray-400">—</span>}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          {rep.strongest_skill ? <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">{rep.strongest_skill}</span> : <span className="text-sm text-gray-400">—</span>}
        </td>
        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{formatDate(rep.last_session)}</td>
        <td className="px-4 py-3 whitespace-nowrap">{statusChip(status, score)}</td>
        <td className="px-4 py-3 whitespace-nowrap text-right">
          <Button variant="outline" size="sm" className="rounded-lg text-xs" onClick={(e) => { e.stopPropagation(); onViewSessions(); }}>
            View Sessions
          </Button>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/50">
          <td colSpan={9} className="px-4 py-3">
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-gray-600">
              <span><strong>Weakest:</strong> {rep.weakest_skill || '—'}</span>
              <span><strong>Strongest:</strong> {rep.strongest_skill || '—'}</span>
              <span><strong>Last session:</strong> {formatDate(rep.last_session)}</span>
              <span><strong>Sessions done:</strong> {rep.session_count ?? 0}</span>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
