import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { fetchTrainingResults } from '@training/services/trainingResults.service';
import OverallScoreCard from '@training/components/rep/Results/OverallScoreCard';
import ResultsTabSwitcher from '@training/components/rep/Results/ResultsTabSwitcher';
import { getServerBackendHeaders } from '@shared/lib/backend-api.server';

interface ManagerResultsPageProps {
  params: Promise<{ trainingId: string; sessionId: string }>;
}

export default async function ManagerResultsPage({ params }: ManagerResultsPageProps) {
  const { trainingId, sessionId } = await params;
  const headers = await getServerBackendHeaders();
  const data = await fetchTrainingResults(trainingId, sessionId, undefined, undefined, undefined, headers);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto px-8 py-8">
        {/* Header — manager-specific back link */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Training Complete — {data.trainingTitle}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Review your rep&apos;s performance and areas for improvement
            </p>
          </div>
          <Link
            href="/training/manage"
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-gray-200 text-gray-600 text-sm font-medium rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-colors shrink-0"
          >
            <ChevronLeft size={16} />
            Back to Team Review
          </Link>
        </div>

        {/* Reuse rep result components */}
        <OverallScoreCard data={data} />
        <ResultsTabSwitcher
          scoredSections={data.scoredSections}
          performanceBreakdown={data.performanceBreakdown}
          trainingTitle={data.trainingTitle}
          transcript={data.transcript}
        />
      </div>
    </div>
  );
}
