'use client';

import { AlertCircle, RotateCw } from 'lucide-react';

export default function TrainingDashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="text-center max-w-md px-6">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center">
            <AlertCircle size={28} className="text-red-500" />
          </div>
        </div>
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Failed to load trainings
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {error.message || 'Something went wrong. Please try again.'}
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors shadow-sm"
        >
          <RotateCw size={14} />
          Try again
        </button>
      </div>
    </div>
  );
}
