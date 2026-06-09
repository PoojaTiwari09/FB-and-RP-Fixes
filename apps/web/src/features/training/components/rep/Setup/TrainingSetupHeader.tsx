import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

interface TrainingSetupHeaderProps {
  trainingTitle: string;
}

export default function TrainingSetupHeader({ trainingTitle }: TrainingSetupHeaderProps) {
  return (
    <div className="mb-8">
      <Link
        href="/training"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
      >
        <ChevronLeft size={16} />
        Back to Dashboard
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">{trainingTitle}</h1>
      <p className="text-sm text-gray-500 mt-1">
        Review the training setup and start when ready
      </p>
    </div>
  );
}
