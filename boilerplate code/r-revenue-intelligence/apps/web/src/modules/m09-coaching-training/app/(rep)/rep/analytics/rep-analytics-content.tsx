'use client';

import { Bar, BarChart, CartesianGrid, Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function asArray(data: unknown): Record<string, any>[] {
  if (Array.isArray(data)) return data as Record<string, any>[];
  if (data && typeof data === 'object') return [data as Record<string, any>];
  return [];
}

function score(item: Record<string, any>) {
  return Number(item.overall_score ?? item.score ?? item.feedback_json?.overall_score ?? 0);
}

export function RepAnalyticsContent({ data, compact = false }: { data: unknown; compact?: boolean }) {
  const rows = asArray(data);
  const latest = rows[rows.length - 1] ?? {};
  const scores = latest.feedback_json?.scores ?? latest.scores ?? {};
  const trend = rows.map((item, index) => ({ date: item.created_at ? new Date(item.created_at).toLocaleDateString() : `Session ${index + 1}`, score: score(item) }));
  const category = Object.entries(scores).map(([name, value]) => ({ name: name.replace(/_/g, ' '), value: Number(value) }));
  const talkRatio = Number(latest.feedback_json?.objective_metrics?.talk_ratio_pct ?? latest.objective_metrics?.talk_ratio_pct ?? 0);
  const pie = [{ name: 'Rep', value: talkRatio }, { name: 'AI', value: Math.max(0, 100 - talkRatio) }];
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-gray-900">Score Trend</h2>
        <div className="mt-4 h-72"><ResponsiveContainer><LineChart data={trend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" /><YAxis domain={[0, 100]} /><Tooltip /><Line type="monotone" dataKey="score" stroke="#4f46e5" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
      </div>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <h2 className="font-bold text-gray-900">Talk Ratio</h2>
        <div className="mt-4 h-72"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={70}>{pie.map((_, index) => <Cell key={index} fill={index === 0 ? '#4f46e5' : '#94a3b8'} />)}</Pie><Tooltip /></PieChart></ResponsiveContainer></div>
      </div>
      {!compact ? <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm xl:col-span-2">
        <h2 className="font-bold text-gray-900">Category Performance</h2>
        <div className="mt-4 h-80"><ResponsiveContainer><BarChart data={category}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis domain={[0, 100]} /><Tooltip /><Bar dataKey="value" fill="#4f46e5" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>
      </div> : null}
    </div>
  );
}
