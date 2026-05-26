'use client';

import { useQuery, useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { scenariosService } from '@/services/scenarios.service';
import { sessionsService } from '@/services/sessions.service';
import { Button } from '@/components/ui/button';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { PlayCircle } from 'lucide-react';

export default function PracticeSelectionPage() {
  const router = useRouter();
  
  const scenariosQuery = useQuery({
    queryKey: ['scenarios'],
    queryFn: () => scenariosService.findAll(),
  });

  const startSessionMutation = useMutation({
    mutationFn: (scenarioId: string) => sessionsService.startSession({ scenarioId }),
    onSuccess: (data) => {
      router.push(`/rep/practice/${data.id || data.sessionId}`);
    },
  });

  if (scenariosQuery.isLoading) return <LoadingSkeleton />;
  if (scenariosQuery.isError) return <ErrorCard message={(scenariosQuery.error as Error).message} onRetry={() => scenariosQuery.refetch()} />;

  const scenarios = scenariosQuery.data || [];

  return (
    <section className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Practice Hub</h1>
        <p className="text-sm text-gray-500">Select an AI persona to start an ad-hoc practice session.</p>
      </div>

      {scenarios.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-8 text-center text-gray-500">
          No training scenarios available yet. Your manager needs to create some first.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="flex flex-col justify-between rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:shadow-md">
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${
                    scenario.difficulty === 'beginner' ? 'bg-green-50 text-green-700 ring-green-600/20' :
                    scenario.difficulty === 'intermediate' ? 'bg-yellow-50 text-yellow-800 ring-yellow-600/20' :
                    'bg-red-50 text-red-700 ring-red-600/10'
                  }`}>
                    {scenario.difficulty === 'beginner' ? 'Level 1' : scenario.difficulty === 'advanced' ? 'Level 3' : 'Level 2'}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{scenario.persona_name}</h3>
                <p className="text-sm font-medium text-gray-500">{scenario.persona_type}</p>
                <p className="mt-4 text-sm text-gray-600 line-clamp-3">
                  {scenario.context_text?.replace(/\[SCENARIO_METADATA:.*?\]/s, '').trim() || 'No context provided.'}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-gray-100">
                <Button 
                  className="w-full gap-2 rounded-xl"
                  disabled={startSessionMutation.isPending}
                  onClick={() => startSessionMutation.mutate(scenario.id)}
                >
                  <PlayCircle className="h-4 w-4" />
                  {startSessionMutation.isPending && startSessionMutation.variables === scenario.id ? 'Starting...' : 'Start Practice'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
