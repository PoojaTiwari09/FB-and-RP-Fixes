'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export default function CallsIndexPage() {
  const [id, setId] = useState('');
  const router = useRouter();
  return (
    <section className="max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Call Drilldown</h1>
      <p className="text-sm text-gray-500">Open a backend session scorecard by session id.</p>
      <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
        <input value={id} onChange={(e) => setId(e.target.value)} className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-indigo-500" placeholder="Session ID" />
        <Button className="mt-4 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" disabled={!id.trim()} onClick={() => router.push(`/manager/calls/${id.trim()}`)}>Open Drilldown</Button>
      </div>
    </section>
  );
}
