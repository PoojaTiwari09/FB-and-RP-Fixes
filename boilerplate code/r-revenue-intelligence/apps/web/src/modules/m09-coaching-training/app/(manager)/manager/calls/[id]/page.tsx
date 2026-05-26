'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/shared/EmptyState';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { analyticsService } from '@/services/analytics.service';

export default function CallDrilldownPage({ params }: { params: { id: string } }) {
  const [note, setNote] = useState('');
  const query = useQuery({ 
    queryKey: ['manager', 'call', params.id], 
    queryFn: async () => {
      try {
        return await analyticsService.getCallDrilldown(params.id);
      } catch (err: any) {
        if (err.message === 'Session not found') return null;
        throw err;
      }
    }, 
    staleTime: 1000 * 60 * 5, 
    retry: 2 
  });
  if (query.isLoading) return <LoadingSkeleton />;
  if (query.isError) return <ErrorCard message={(query.error as Error)?.message} onRetry={() => query.refetch()} />;
  if (!query.data) return <EmptyState title="No call data" description="No backend drilldown was returned for this session." />;
  const transcript = query.data.messages_json || query.data.transcript || [];
  const segmentScores = query.data.segmentScores ?? Object.entries(query.data.feedback_json?.scores ?? {}).map(([name, score]) => ({ name, score: Number(score) }));
  return (
    <section className="space-y-6">
      <div><h1 className="text-2xl font-bold text-gray-900">Call Drilldown</h1><p className="text-sm text-gray-500">Session {params.id}</p></div>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <h2 className="font-bold text-gray-900">Transcript</h2>
          <div className="mt-4 space-y-4">
            {transcript.map((m: any, i: number) => {
              const turnNum = Math.floor(i / 2) + 1;
              const isRep = m.role === 'user';
              const roleLabel = isRep ? 'Rep' : 'Prospect';
              return (
                <div key={i} className="rounded-xl bg-gray-50 p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                      {roleLabel} • Turn {turnNum}
                    </span>
                    <span className="text-xs text-gray-400">
                      {m.timestamp ? new Date(m.timestamp).toLocaleTimeString() : '--:--'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 leading-relaxed">{m.content}</p>
                  {m.live_coaching?.highlighted_segments && m.live_coaching.highlighted_segments.length > 0 && (
                    <div className="mt-3 rounded-lg bg-indigo-50 p-3 text-xs text-indigo-800">
                      <strong>AI Flag:</strong> {m.live_coaching.highlighted_segments[0].reason}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-gray-900">Talk Ratio</h2>
            <p className="mt-2 text-3xl font-bold text-indigo-600">{query.data.feedback_json?.objective_metrics?.talk_ratio_pct ?? 0}%</p>
          </div>
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="font-bold text-gray-900">Manager Notes</h2>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} className="mt-3 min-h-28 w-full rounded-xl border border-gray-200 p-3 text-sm outline-none focus:border-indigo-500" />
            <Button className="mt-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700">Save Note</Button>
          </div>
        </div>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"><h2 className="font-bold text-gray-900">Score Breakdown</h2><div className="mt-4 h-80"><ResponsiveContainer><BarChart data={segmentScores}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="score" fill="#4f46e5" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></div>
    </section>
  );
}
