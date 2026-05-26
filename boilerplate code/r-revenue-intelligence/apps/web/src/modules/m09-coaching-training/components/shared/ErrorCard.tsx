'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ErrorCard({ message = 'Unable to load this data.', onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="mx-auto max-w-md rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
      <AlertCircle className="mx-auto mb-3 h-10 w-10 text-red-500" />
      <h2 className="text-lg font-bold text-gray-900">Something went wrong</h2>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      {onRetry ? <Button className="mt-5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={onRetry}>Try Again</Button> : null}
    </div>
  );
}
