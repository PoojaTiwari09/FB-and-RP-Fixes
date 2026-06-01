'use client';

import Link from 'next/link';
import { AlertCircle } from 'lucide-react';

export default function TrainingResultsError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-500" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Could not load results
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {error.message || 'Something went wrong. Please try again.'}
        </p>
        <Link
          href="/training"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
        >
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
