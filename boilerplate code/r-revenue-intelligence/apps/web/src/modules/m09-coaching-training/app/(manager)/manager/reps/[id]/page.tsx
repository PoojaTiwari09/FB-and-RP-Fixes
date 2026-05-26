'use client';

import { useQuery } from '@tanstack/react-query';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { analyticsService } from '@/services/analytics.service';

export default function RepDrilldownPage({ params }: { params: { id: string } }) {
  const query = useQuery({ 
    queryKey: ['manager', 'rep', params.id], 
    queryFn: () => analyticsService.getRepComparison(params.id), 
    staleTime: 1000 * 60 * 5, 
    retry: 2 
  });

  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorCard message={(query.error as Error)?.message} onRetry={() => query.refetch()} />;
  if (!query.data || !query.data.radarData) return <EmptyState title="No comparison data" description="Comparison data will appear once the rep completes a session." />;

  const data = query.data.radarData;

  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rep vs Team Benchmark</h1>
        <p className="text-sm text-gray-500">Radar chart mapping rep scores against the organizational baseline.</p>
      </div>
      
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-gray-900">Performance Comparison</h2>
        <div className="mt-4 h-96">
          <ResponsiveContainer>
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject" />
              <PolarRadiusAxis angle={30} domain={[0, 100]} />
              <Radar name="Team Average" dataKey="Team" stroke="#c7d2fe" fill="#c7d2fe" fillOpacity={0.5} />
              <Radar name="Rep Score" dataKey="Rep" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.6} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
