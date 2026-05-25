'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, Clock, TimerReset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/cards/StatCard';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ProgressBar } from '@/components/shared/ProgressBar';
import { StatusBadge, normalizeStatus } from '@/components/shared/StatusBadge';
import { useAssignments } from '@/hooks/useAssignments';

const tabs = ['All', 'In Progress', 'Completed', 'Overdue'];

export default function AssignmentsPage() {
  const [filter, setFilter] = useState('All');
  const { data, isLoading, isError, error, refetch } = useAssignments();

  const assignments = data ?? [];
  const filtered = useMemo(() => assignments.filter((item) => filter === 'All' || normalizeStatus(item.status, item.is_overdue) === filter.toLowerCase().replace(/\s+/g, '_')), [assignments, filter]);
  const completed = assignments.filter((item) => normalizeStatus(item.status) === 'completed').length;
  const inProgress = assignments.filter((item) => normalizeStatus(item.status) === 'in_progress').length;
  const overdue = assignments.filter((item) => normalizeStatus(item.status, item.is_overdue) === 'overdue').length;

  if (isLoading) return <LoadingSkeleton />;
  if (isError) return <ErrorCard message={(error as Error)?.message} onRetry={() => refetch()} />;
  if (!assignments.length) return <EmptyState title="No assignments yet" description="Your manager has not assigned training yet." icon={BookOpen} />;

  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">My Training Assignments</h1><p className="text-sm text-gray-500">Practice assigned scenarios and track completion.</p></div>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard icon={BookOpen} label="Total" value={assignments.length} />
        <StatCard icon={CheckCircle2} label="Completed" value={completed} />
        <StatCard icon={Clock} label="In Progress" value={inProgress} />
        <StatCard icon={TimerReset} label="Overdue" value={overdue} />
      </div>
      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => <button key={tab} onClick={() => setFilter(tab)} className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${filter === tab ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 hover:bg-gray-100'}`}>{tab}</button>)}
      </div>
      {!filtered.length ? <EmptyState title="Nothing in this filter" description="Try another assignment status." /> : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filtered.map((item) => {
            const progress = item.progress ?? (normalizeStatus(item.status) === 'completed' ? 100 : item.best_score ?? 0);
            const scenario = item.scenario;
            const practiceId = item.id;
            return (
              <article key={item.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div><h2 className="font-bold text-gray-900">{scenario?.persona_name || 'Training assignment'}</h2><p className="mt-1 text-sm text-gray-500">{scenario?.context_text || 'Assigned sales coaching scenario'}</p></div>
                  <StatusBadge status={item.status} overdue={item.is_overdue} />
                </div>
                <div className="mt-5"><ProgressBar value={progress} /></div>
                <div className="mt-5 flex items-center justify-between">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">Due {item.deadline ? new Date(item.deadline).toLocaleDateString() : 'unscheduled'}</span>
                  {item.attempt_count >= (item.max_attempts || 3) ? (
                    <Button disabled className="rounded-xl bg-gray-300 text-gray-600 cursor-not-allowed">Max Attempts Reached</Button>
                  ) : (
                    <Button asChild className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">
                      <Link href={`/rep/practice/${practiceId}`}>
                        {normalizeStatus(item.status) === 'completed' ? 'Retry' : 'Practice Now'} ({item.attempt_count || 0}/{item.max_attempts || 3})
                      </Link>
                    </Button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
