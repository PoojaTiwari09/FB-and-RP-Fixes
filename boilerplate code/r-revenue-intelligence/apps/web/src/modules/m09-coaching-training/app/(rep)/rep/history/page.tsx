'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { useSessions } from '@/hooks/useSessions';

function HistoryContent() {
  const searchParams = useSearchParams();
  const submitted = searchParams.get('submitted') === '1';
  const [page, setPage] = useState(1);
  const query = useSessions();
  const sessions = useMemo(() => [...(query.data ?? [])].sort((a, b) => `${b.created_at}`.localeCompare(`${a.created_at}`)), [query.data]);
  const pageSize = 10;
  const visible = sessions.slice((page - 1) * pageSize, page * pageSize);

  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorCard message={(query.error as Error)?.message} onRetry={() => query.refetch()} />;
  if (!sessions.length) return <EmptyState title="No session history" description="Your practice sessions will appear here." />;

  return (
    <section className="space-y-6">
      {submitted && (
        <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Session submitted to your manager. They can review it under Coaching Reviews.
        </div>
      )}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Session History</h1>
        <p className="text-sm text-gray-500">View your past and active practice sessions.</p>
      </div>
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-500">
            <tr>
              <th className="p-4">Date</th>
              <th>Type</th>
              <th>Scenario</th>
              <th>Score</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((session) => { 
              const isCompleted = !!session.completed_at;
              const score = Number(session.overall_score || session.feedback_json?.overall_score || 0); 
              
              return (
                <tr key={session.id} className="border-t border-gray-100">
                  <td className="p-4">{session.created_at ? new Date(session.created_at).toLocaleDateString() : '-'}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-md text-xs font-medium border ${session.is_practice ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>
                      {session.is_practice ? 'Practice' : 'Assignment'}
                    </span>
                  </td>
                  <td className="font-medium text-gray-900">{session.persona_name || session.scenario_id}</td>
                  <td className={!isCompleted ? 'text-gray-400' : score >= 80 ? 'font-semibold text-green-600' : score >= 60 ? 'font-semibold text-yellow-600' : 'font-semibold text-red-600'}>
                    {isCompleted ? score : '-'}
                  </td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${isCompleted ? 'border-green-400 text-green-700 bg-white' : 'border-amber-400 text-amber-700 bg-white'}`}>
                      {isCompleted ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                  <td className="text-right pr-4 space-x-2">
                    <Button asChild variant="outline" className="rounded-xl">
                      <Link href={isCompleted ? `/rep/results/${session.id}` : `/rep/practice/${session.id}`}>
                        {isCompleted ? 'View Results' : 'Resume'}
                      </Link>
                    </Button>
                  </td>
                </tr>
              ); 
            })}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
        <Button variant="outline" disabled={page * pageSize >= sessions.length} onClick={() => setPage((p) => p + 1)}>Next</Button>
      </div>
    </section>
  );
}

export default function HistoryPage() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <HistoryContent />
    </Suspense>
  );
}
