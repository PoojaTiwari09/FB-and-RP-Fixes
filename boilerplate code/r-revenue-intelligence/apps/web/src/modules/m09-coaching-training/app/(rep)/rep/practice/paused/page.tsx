'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ArrowLeft, Pause, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';

function PausedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId') ?? '';
  const resumePath = decodeURIComponent(searchParams.get('resume') ?? '/rep/dashboard');
  const messageCount = searchParams.get('messages') ?? '0';
  const elapsed = searchParams.get('elapsed') ?? '00:00';

  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-gray-100 bg-white p-8 shadow-xl text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100">
          <Pause className="h-8 w-8 text-amber-600" strokeWidth={2} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Training Paused</h1>
        <p className="mt-2 text-sm text-gray-500">
          Your progress has been saved. You can resume this session anytime from Session History.
        </p>

        <div className="mt-6 flex flex-col gap-3">
          <Button
            className="w-full rounded-xl bg-indigo-600 text-white hover:bg-indigo-700"
            onClick={() => router.push(resumePath)}
            disabled={!sessionId}
          >
            <Play className="mr-2 h-4 w-4" />
            Resume Now
          </Button>
          <Button asChild variant="outline" className="w-full rounded-xl">
            <Link href="/rep/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Exit to Dashboard
            </Link>
          </Button>
          <Button asChild variant="outline" className="w-full rounded-xl">
            <Link href="/rep/history">View Session History</Link>
          </Button>
        </div>

        <div className="mt-8 flex justify-between rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
          <span>Session time: <strong className="text-gray-900">{elapsed}</strong></span>
          <span>Messages: <strong className="text-gray-900">{messageCount}</strong></span>
        </div>
      </div>
    </div>
  );
}

export default function PracticePausedPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading...</div>}>
      <PausedContent />
    </Suspense>
  );
}
