'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RadialBar, RadialBarChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { analyticsService } from '@/services/analytics.service';
import { sessionsService } from '@/services/sessions.service';
import { useAssignments } from '@/hooks/useAssignments';
import { apiClient } from '@/lib/api';

export default function ResultsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const assignments = useAssignments();

  const query = useQuery({
    queryKey: ['call-drilldown', params.id],
    queryFn: async () => {
      try {
        return await analyticsService.getCallDrilldown(params.id);
      } catch (err: unknown) {
        if ((err as Error).message === 'Session not found') return null;
        throw err;
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2,
  });

  const sessionQuery = useQuery({
    queryKey: ['session', params.id],
    queryFn: () => apiClient.get(`/sessions/${params.id}`).then((res) => res.data),
    enabled: !!params.id,
  });

  const assignmentFromList = useMemo(
    () =>
      assignments.data?.find(
        (a) => a.session_id === params.id || a.best_session_id === params.id,
      ),
    [assignments.data, params.id],
  );

  const drilldown = query.data as {
    assignment_id?: string | null;
    is_practice?: boolean;
    feedback?: unknown;
    feedback_json?: unknown;
    messages_json?: unknown[];
    transcript?: unknown[];
  } | undefined;

  const hasAssignmentLink = Boolean(
    drilldown?.assignment_id ||
      sessionQuery.data?.assignment_id ||
      assignmentFromList?.id,
  );

  const submitToManager = useMutation({
    mutationFn: () => sessionsService.submitFinalToManager(params.id),
    onSuccess: () => {
      setSubmitSuccess(true);
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      queryClient.invalidateQueries({ queryKey: ['sessions', 'my'] });
      queryClient.invalidateQueries({ queryKey: ['assignments', 'manager'] });
      setTimeout(() => {
        router.push('/rep/history?submitted=1');
      }, 1500);
    },
  });

  if (query.isLoading || sessionQuery.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorCard message={(query.error as Error)?.message} onRetry={() => query.refetch()} />;

  const feedback = (drilldown?.feedback_json || drilldown?.feedback) as {
    overall_score?: number;
    scores?: Record<string, number>;
    strengths?: string[];
    improvements?: string[];
    evaluation_summary?: string;
  } | null;

  if (!query.data || !feedback) {
    return <EmptyState title="No scorecard yet" description="The backend has not generated results for this session." />;
  }

  const overall = Number(feedback.overall_score ?? 0);
  const categories = Object.entries(feedback.scores ?? {});
  const transcript = drilldown?.messages_json || drilldown?.transcript || [];

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Session Scorecard</h1>
        <p className="text-sm text-gray-500">Session {params.id}</p>
      </div>

      {submitSuccess && (
        <div className="flex items-center gap-2 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <CheckCircle2 className="h-5 w-5 shrink-0" />
          Submitted to your manager. They can review it on their Coaching Reviews dashboard.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900">Overall Score</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: 'Score', value: overall, fill: '#4f46e5' }]} startAngle={90} endAngle={-270}>
                <RadialBar dataKey="value" background />
                <Tooltip />
              </RadialBarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-center text-4xl font-bold text-indigo-600">{overall}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {categories.map(([name, value]) => (
            <div key={name} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">{name.replace(/_/g, ' ')}</p>
              <p className="mt-2 text-3xl font-bold text-gray-900">{Number(value)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900">Strengths</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {feedback.strengths?.map((item: string) => (
              <span key={item} className="rounded-md bg-green-500/20 px-3 py-1 text-xs font-medium text-gray-800">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900">Weaknesses</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {feedback.improvements?.map((item: string) => (
              <span key={item} className="rounded-md bg-red-500/20 px-3 py-1 text-xs font-medium text-gray-800">
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900">Suggestions</h2>
          <p className="mt-2 text-sm text-gray-500">{feedback.evaluation_summary}</p>
        </div>
      </div>

      <details className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <summary className="cursor-pointer font-bold text-gray-900">Full transcript</summary>
        <div className="mt-4 space-y-3">
          {(transcript as Array<{ role: string; content: string }>).map((m, i) => (
            <p key={i} className="text-sm text-gray-600">
              <strong>{m.role}:</strong> {m.content}
            </p>
          ))}
        </div>
      </details>

      <div className="rounded-2xl border border-indigo-100 bg-indigo-50/50 p-5">
        <h2 className="font-bold text-gray-900">Submit to Manager</h2>
        <p className="mt-1 text-sm text-gray-600">
          Send this scorecard to your manager for review. It will appear on their Coaching Reviews page.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {!submitSuccess && (
            <Button
              onClick={() => submitToManager.mutate()}
              disabled={submitToManager.isPending}
              className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Send className="mr-2 h-4 w-4" />
              {submitToManager.isPending ? 'Submitting...' : 'Final Submission'}
            </Button>
          )}
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/rep/assignments">Practice Again</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/rep/history">Back to Session History</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-xl">
            <Link href="/rep/dashboard">Dashboard</Link>
          </Button>
        </div>
        {submitToManager.isError && (
          <p className="mt-3 text-sm text-red-600">{(submitToManager.error as Error).message}</p>
        )}
        {!hasAssignmentLink && !submitSuccess && (
          <p className="mt-3 text-sm text-amber-700">
            This session is not linked to an assignment yet. If submission fails, start the scenario from Assignments first.
          </p>
        )}
      </div>
    </section>
  );
}
