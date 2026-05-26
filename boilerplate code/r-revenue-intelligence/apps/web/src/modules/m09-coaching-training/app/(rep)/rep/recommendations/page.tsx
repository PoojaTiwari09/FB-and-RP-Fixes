'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Lightbulb, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { coachingService } from '@/services/coaching.service';

const filters = ['All', 'High', 'Medium', 'Low'];

export default function RecommendationsPage() {
  const [filter, setFilter] = useState('All');
  const query = useQuery({
    queryKey: ['coaching', 'recommendations'],
    queryFn: () => coachingService.getRecommendations(),
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const data = query.data ?? [];
  const filtered = useMemo(() =>
    data.filter((item: any) => filter === 'All' || (item.priority || '').toLowerCase() === filter.toLowerCase()),
    [data, filter]
  );

  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorCard message={(query.error as Error)?.message} onRetry={() => query.refetch()} />;
  if (!data.length) return <EmptyState title="No recommendations yet" description="Recommendations appear after coaching analysis runs on your completed sessions." icon={Lightbulb} />;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Coaching Recommendations</h1>
        <p className="text-sm text-gray-500">AI-generated priority actions and Manager Insights based on your session performance.</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${filter === f ? 'bg-indigo-600 text-white' : 'bg-white text-gray-500 ring-1 ring-gray-200 hover:bg-gray-50'}`}
          >
            {f === 'All' ? 'All Priorities' : `${f} Priority`}
          </button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {filtered.map((item: any, index: number) => {
          // Map both the new DB fields and any legacy shape
          const title = item.focus_area || item.title || item.type || 'Coaching Focus';
          const description = item.recommendation_text || item.description || item.content || '';
          const action = item.suggested_action || item.coaching_tip || item.coachingTip || '';
          const skill = item.weakest_skill || item.weakestSkill || '';
          const priority: string = item.priority || 'Medium';

          const priorityColor =
            priority === 'High' ? 'bg-red-100 text-red-700 border-red-200' :
            priority === 'Low' ? 'bg-green-100 text-green-700 border-green-200' :
            'bg-yellow-100 text-yellow-700 border-yellow-200';

          const PriorityIcon =
            priority === 'High' ? AlertCircle :
            priority === 'Low' ? CheckCircle2 :
            TrendingUp;

          return (
            <article key={item.id || index} className="flex flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50">
                    <Lightbulb className="h-5 w-5 text-indigo-600" />
                  </span>
                  <h2 className="font-bold text-gray-900">{title}</h2>
                </div>
                <span className={`flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${priorityColor}`}>
                  <PriorityIcon className="h-3 w-3" />
                  {priority}
                </span>
              </div>

              {skill && skill !== 'Manager Push' ? (
                <p className="inline-flex w-fit rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-600">
                  Skill gap: {skill}
                </p>
              ) : null}
              {skill === 'Manager Push' ? (
                <p className="inline-flex w-fit rounded-lg bg-purple-50 px-3 py-1 text-xs font-bold text-purple-700 ring-1 ring-inset ring-purple-600/20">
                  👤 Manager Insight
                </p>
              ) : null}

              <p className="text-sm leading-relaxed text-gray-600">{description}</p>

              {action ? (
                <div className="mt-auto rounded-xl bg-indigo-50 p-3">
                  <p className="text-sm font-medium text-indigo-700">💡 Suggested action</p>
                  <p className="mt-1 text-sm text-indigo-600">{action}</p>
                </div>
              ) : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
