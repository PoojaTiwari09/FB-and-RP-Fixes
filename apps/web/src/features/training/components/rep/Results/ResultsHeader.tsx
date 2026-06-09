import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface ResultsHeaderProps {
  trainingTitle: string;
}

export default function ResultsHeader({ trainingTitle }: ResultsHeaderProps) {
  return (
    <div className="flex items-start justify-between mb-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Training Complete — {trainingTitle}
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Review your performance and areas for improvement
        </p>
      </div>
      <Link
        href="/training"
        className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shrink-0"
      >
        <ChevronLeft size={16} />
        Back to Dashboard
      </Link>
    </div>
  );
}
