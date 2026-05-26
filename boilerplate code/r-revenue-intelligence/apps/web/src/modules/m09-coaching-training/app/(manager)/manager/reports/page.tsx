'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Download, Search, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { assignmentsService } from '@/services/assignments.service';
import { analyticsService } from '@/services/analytics.service';
import { apiClient } from '@/lib/api';

function scoreBg(score: number | undefined | null) {
  if (score == null) return 'bg-gray-100 text-gray-600';
  if (score >= 70) return 'bg-green-100 text-green-800';
  if (score >= 50) return 'bg-amber-100 text-amber-800';
  return 'bg-red-100 text-red-800';
}

function scoreBarColor(score: number) {
  if (score >= 70) return 'bg-green-400';
  if (score >= 50) return 'bg-amber-400';
  return 'bg-red-400';
}

function statusPill(status: string) {
  const s = status?.toLowerCase() || '';
  if (s === 'completed' || s === 'reviewed') return <span className="inline-block rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">Completed</span>;
  if (s === 'in progress' || s === 'in_progress') return <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">In Progress</span>;
  if (s === 'pending' || s === 'not_started' || s === '') return <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">Pending</span>;
  return <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">{status}</span>;
}

function priorityPill(priority: string | undefined) {
  const p = priority?.toLowerCase() || '';
  if (p === 'high') return <span className="inline-block rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">High</span>;
  if (p === 'medium') return <span className="inline-block rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800">Medium</span>;
  return <span className="inline-block rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600">Low</span>;
}

function formatDate(dateStr: string | undefined | null) {
  if (!dateStr) return '—';
  try { return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  catch { return '—'; }
}

const isOverdue = (a: any) =>
  a.deadline && new Date(a.deadline) < new Date() && a.status !== 'Completed';

const getRepName = (assignment: any): string => {
  return (
    assignment.rep_name ||
    assignment.rep?.name ||
    assignment.rep?.email?.split('@')[0] ||
    `Rep ${(assignment.rep_id || '').substring(0, 6)}`
  );
};

export default function ReportsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('Due Date');
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions'>('overview');
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [savedReviews, setSavedReviews] = useState<Record<string, boolean>>({});
  const [managerScores, setManagerScores] = useState<Record<string, number | ''>>({});
  const [submissionSearch, setSubmissionSearch] = useState('');
  const [scenarioFilter, setScenarioFilter] = useState('');
  const [submissionSort, setSubmissionSort] = useState('date');

  const trainingQ = useQuery({
    queryKey: ['manager-reports-training'],
    queryFn: () => apiClient.get('/analytics/training-report').then((r) => r.data),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const assignmentsQ = useQuery({
    queryKey: ['manager-reports-assignments'],
    queryFn: () => assignmentsService.getAssignments(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const teamQ = useQuery({
    queryKey: ['manager-reports-team'],
    queryFn: () => analyticsService.getTeam(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const training = trainingQ.data || {};
  const assignments: any[] = assignmentsQ.data || [];
  const team = teamQ.data || {};
  const scenarioData: Array<Record<string, string | number>> = team.scenarioData || [];

  const totalAssignments = training.totalAssignments ?? assignments.length;
  const completedAssignments = training.completedAssignments ?? assignments.filter((a: any) => { const s = (a.status || '').toLowerCase(); return s === 'completed' || s === 'reviewed'; }).length;
  const completionRate = training.completionRate ?? (totalAssignments > 0 ? Math.round((completedAssignments / totalAssignments) * 100) : 0);
  const averageTeamScore = training.averageTeamScore ?? 0;

  const groupedAssignments = useMemo(() => {
    const allAssignments = assignments ?? [];
    const groups: Record<string, any> = {};
    allAssignments.forEach((a: any) => {
      const key = `${a.rep_id}__${a.scenario_id}`;
      const existing = groups[key];
      if (!existing) {
        groups[key] = a;
        return;
      }
      const existingScore = existing.best_score ?? 0;
      const newScore = a.best_score ?? 0;
      if (newScore > existingScore) {
        groups[key] = a;
        return;
      }
      if (newScore === existingScore && a.completed_at && existing.completed_at) {
        if (new Date(a.completed_at) > new Date(existing.completed_at)) {
          groups[key] = a;
        }
      }
      if (!existing.completed_at && a.completed_at) {
        groups[key] = a;
      }
    });
    return Object.values(groups);
  }, [assignments]);

  const filteredRows = useMemo(() => {
    return groupedAssignments
      .filter((a: any) => {
        const repName = getRepName(a).toLowerCase();
        const matchesSearch = !search || repName.includes(search.toLowerCase());
        const normalStatus = a.status === 'Completed' ? 'Completed'
          : isOverdue(a) ? 'Overdue'
          : a.status;
        const matchesStatus = !statusFilter || statusFilter === 'All' || normalStatus === statusFilter;
        const matchesPriority = !priorityFilter || priorityFilter === 'All' || a.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a: any, b: any) => {
        if (sortBy === 'Score') return (b.best_score ?? 0) - (a.best_score ?? 0);
        if (sortBy === 'Rep Name') return getRepName(a).localeCompare(getRepName(b));
        if (sortBy === 'Attempts') return (b.attempt_count ?? 0) - (a.attempt_count ?? 0);
        return new Date(a.deadline ?? 0).getTime() - new Date(b.deadline ?? 0).getTime();
      });
  }, [groupedAssignments, search, statusFilter, priorityFilter, sortBy]);

  const isLoading = trainingQ.isLoading || assignmentsQ.isLoading || teamQ.isLoading;
  const isError = trainingQ.isError || assignmentsQ.isError || teamQ.isError;

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (isError) {
    const err = (trainingQ.error || assignmentsQ.error || teamQ.error) as Error;
    return <ErrorCard message={err?.message} onRetry={() => { trainingQ.refetch(); assignmentsQ.refetch(); teamQ.refetch(); }} />;
  }

  async function exportCSV() {
    try {
      const csv = await analyticsService.exportReport('Training', {});
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'training-report.csv';
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  }

  // Completion funnel
  const notStarted = assignments.filter((a: any) => { const s = (a.status || '').toLowerCase(); return s === 'pending' || s === 'not_started' || s === ''; }).length;
  const inProgress = assignments.filter((a: any) => { const s = (a.status || '').toLowerCase(); return s === 'in progress' || s === 'in_progress'; }).length;
  const completed = assignments.filter((a: any) => { const s = (a.status || '').toLowerCase(); return s === 'completed' || s === 'reviewed'; }).length;
  const total = assignments.length || 1;

  const submittedAssignments = (assignmentsQ.data ?? []).filter(
    (a: any) => a.status === 'Completed' && a.best_session_id
  );

  const filteredSubmissions = submittedAssignments
    .filter((a: any) => {
      const repName = (a.rep?.name || a.rep_id || '').toLowerCase();
      const scenarioName = (a.scenario?.persona_name || '').toLowerCase();
      const search = submissionSearch.toLowerCase();
      const matchesSearch = !search || repName.includes(search) || scenarioName.includes(search);
      const matchesScenario = !scenarioFilter || a.scenario?.persona_name === scenarioFilter;
      return matchesSearch && matchesScenario;
    })
    .sort((a: any, b: any) => {
      if (submissionSort === 'score') return (b.best_score ?? 0) - (a.best_score ?? 0);
      if (submissionSort === 'rep') return (a.rep?.name || '').localeCompare(b.rep?.name || '');
      return new Date(b.completed_at ?? 0).getTime() - new Date(a.completed_at ?? 0).getTime();
    });

  const uniqueScenarios = [...new Set(
    submittedAssignments.map((a: any) => a.scenario?.persona_name).filter(Boolean)
  )] as string[];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Reports</h1>
          <p className="text-sm text-gray-500">Assignment completion and performance &middot; {totalAssignments} assignments tracked</p>
        </div>
        <Button onClick={exportCSV} variant="outline" className="gap-2 rounded-xl">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 border-b border-gray-100 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'submissions'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Rep Submissions
        </button>
      </div>

      {activeTab === 'overview' ? (
        <>

      {/* Section 1: Training summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 w-fit"><CheckCircle2 className="h-5 w-5" /></div>
          <p className="mt-4 text-sm text-gray-500">Total Assignments</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{totalAssignments}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="rounded-xl bg-green-50 p-2 text-green-600 w-fit"><CheckCircle2 className="h-5 w-5" /></div>
          <p className="mt-4 text-sm text-gray-500">Completed</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{completedAssignments}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="rounded-xl bg-amber-50 p-2 text-amber-600 w-fit"><Clock className="h-5 w-5" /></div>
          <p className="mt-4 text-sm text-gray-500">Completion Rate</p>
          <p className={`mt-1 text-2xl font-bold ${completionRate >= 70 ? 'text-green-600' : completionRate >= 40 ? 'text-amber-600' : 'text-red-600'}`}>{completionRate}%</p>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 w-fit"><AlertTriangle className="h-5 w-5" /></div>
          <p className="mt-4 text-sm text-gray-500">Avg Team Score</p>
          <p className={`mt-1 text-2xl font-bold ${averageTeamScore >= 70 ? 'text-green-600' : averageTeamScore >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{Math.round(Number(averageTeamScore))}</p>
        </div>
      </div>

      {/* Section 2: Scenario performance breakdown */}
      {scenarioData.length > 0 && (
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900">Avg Score by Scenario</h2>
          <div className="mt-4 space-y-3">
            {scenarioData.map((item, index) => {
              const name = String(item.name ?? item.scenario ?? '');
              const score = Number(item.score ?? 0);
              return (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-1/3 text-sm text-gray-700 truncate">{name}</span>
                  <div className="flex-1 h-5 rounded-full bg-gray-100 overflow-hidden">
                    <div className={`h-full rounded-full ${scoreBarColor(score)}`} style={{ width: `${Math.min(100, Math.max(0, score))}%` }} />
                  </div>
                  <span className={`w-10 text-right text-sm font-semibold ${score >= 70 ? 'text-green-600' : score >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{score}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Section 3: Assignment table */}
      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-3 border-b border-gray-100 bg-gray-50/50 p-4">
          <div className="relative flex-1 min-w-[160px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by rep name..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="All">All Status</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="All">All Priority</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500"
          >
            <option value="Due Date">Sort: Due Date</option>
            <option value="Score">Sort: Score</option>
            <option value="Attempts">Sort: Attempts</option>
            <option value="Rep Name">Sort: Rep Name</option>
          </select>
        </div>

        {filteredRows.length === 0 ? (
          <div className="p-10 text-center">
            <p className="text-sm text-gray-500">No assignments found. Create training assignments from the Scenarios page.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rep</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scenario</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attempts</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Best Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRows.map((a: any) => (
                  <tr key={`${a.rep_id}__${a.scenario_id}`} className={`hover:bg-gray-50 ${isOverdue(a) ? 'border-l-2 border-red-400' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700 flex-shrink-0">
                          {getRepName(a).substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{getRepName(a)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{a.scenario?.persona_name || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{priorityPill(a.priority)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">{a.attempt_count ?? 0}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {a.best_score != null ? (
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${scoreBg(a.best_score)}`}>{a.best_score}</span>
                      ) : (
                        <span className="text-sm text-gray-400">&mdash;</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{statusPill(a.status)}</td>
                    <td className={`px-4 py-3 whitespace-nowrap text-sm ${isOverdue(a) ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>{formatDate(a.deadline)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-lg text-xs"
                        disabled={!a.best_session_id}
                        onClick={() => a.best_session_id && router.push(`/manager/sessions/${a.best_session_id}`)}
                      >
                        View Results
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 4: Completion funnel */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm text-center">
          <p className="text-sm font-semibold text-gray-500">Not Started</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{notStarted}</p>
          <p className="mt-1 text-sm text-gray-400">{total > 0 ? Math.round((notStarted / total) * 100) : 0}%</p>
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-gray-400" style={{ width: `${total > 0 ? (notStarted / total) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm text-center">
          <p className="text-sm font-semibold text-amber-600">In Progress</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{inProgress}</p>
          <p className="mt-1 text-sm text-gray-400">{total > 0 ? Math.round((inProgress / total) * 100) : 0}%</p>
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${total > 0 ? (inProgress / total) * 100 : 0}%` }} />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm text-center">
          <p className="text-sm font-semibold text-green-600">Completed</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{completed}</p>
          <p className="mt-1 text-sm text-gray-400">{total > 0 ? Math.round((completed / total) * 100) : 0}%</p>
          <div className="mt-3 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-green-400" style={{ width: `${total > 0 ? (completed / total) * 100 : 0}%` }} />
          </div>
        </div>
      </div>
        </>
      ) : (
        <div className="space-y-4">
          {/* Filter row */}
          <div className="flex gap-3">
            <input
              placeholder="Search by rep or scenario..."
              value={submissionSearch}
              onChange={e => setSubmissionSearch(e.target.value)}
              className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2 text-sm outline-none focus:border-indigo-400"
            />
            <select value={scenarioFilter} onChange={e => setScenarioFilter(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            >
              <option value="">All Scenarios</option>
              {uniqueScenarios.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select value={submissionSort} onChange={e => setSubmissionSort(e.target.value)}
              className="rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
            >
              <option value="date">Sort: Submit Date</option>
              <option value="score">Sort: Score</option>
              <option value="rep">Sort: Rep Name</option>
            </select>
          </div>

          {/* Submissions table */}
          <div className="rounded-2xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Rep</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Scenario</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Attempts</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">AI Score</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Manager Score</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Review Note</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredSubmissions.map((assignment: any) => (
                  <tr key={assignment.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">
                          {(assignment.rep?.name || 'R').substring(0, 2).toUpperCase()}
                        </div>
                        <span className="font-medium text-gray-900">{assignment.rep?.name || assignment.rep_id}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-700">{assignment.scenario?.persona_name || '—'}</td>
                    <td className="px-5 py-4 text-gray-600">{assignment.attempt_count ?? 0}</td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center justify-center h-8 w-12 rounded-lg text-sm font-bold ${
                        (assignment.best_score ?? 0) >= 70 ? 'bg-emerald-50 text-emerald-700' :
                        (assignment.best_score ?? 0) >= 50 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {assignment.best_score ?? '—'}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">
                      {assignment.completed_at
                        ? new Date(assignment.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        placeholder="0–100"
                        value={managerScores[assignment.id] ?? ''}
                        onChange={e => setManagerScores(prev => ({ ...prev, [assignment.id]: e.target.value === '' ? '' : Number(e.target.value) }))}
                        className="w-20 rounded-lg border border-gray-200 px-2 py-1.5 text-sm text-center outline-none focus:border-indigo-400"
                      />
                    </td>
                    <td className="px-5 py-4 min-w-[220px]">
                      {savedReviews[assignment.id] ? (
                        <div className="flex items-start gap-2">
                          <p className="text-xs text-gray-600 leading-relaxed flex-1">{reviewNotes[assignment.id]}</p>
                          <button
                            onClick={() => setSavedReviews(prev => ({ ...prev, [assignment.id]: false }))}
                            className="text-xs text-indigo-500 hover:underline flex-shrink-0"
                          >Edit</button>
                        </div>
                      ) : (
                        <textarea
                          rows={2}
                          placeholder="Add coaching note or suggestion..."
                          value={reviewNotes[assignment.id] ?? ''}
                          onChange={e => setReviewNotes(prev => ({ ...prev, [assignment.id]: e.target.value }))}
                          className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs outline-none focus:border-indigo-400 resize-none"
                        />
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-col gap-1.5">
                        {assignment.best_session_id && (
                          <button
                            onClick={() => router.push(`/manager/sessions/${assignment.best_session_id}`)}
                            className="text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg px-3 py-1.5 font-medium whitespace-nowrap"
                          >
                            View Submission
                          </button>
                        )}
                        <button
                          disabled={!reviewNotes[assignment.id]?.trim() && managerScores[assignment.id] === ''}
                          onClick={() => {
                            setSavedReviews(prev => ({ ...prev, [assignment.id]: true }));
                            apiClient.patch(`/training/assignments/${assignment.id}`, {
                              manager_score: managerScores[assignment.id] || undefined,
                              manager_note: reviewNotes[assignment.id] || undefined,
                            }).catch(() => {});
                          }}
                          className="text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg px-3 py-1.5 font-medium disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {savedReviews[assignment.id] ? '\u2713 Saved' : 'Save Review'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredSubmissions.length === 0 && (
              <div className="py-16 text-center text-gray-400">
                <p className="text-sm">No submissions yet.</p>
                <p className="text-xs mt-1">Submissions appear here when reps mark their session as final.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
