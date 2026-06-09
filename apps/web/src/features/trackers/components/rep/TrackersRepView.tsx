'use client';

import useTrackers from '../../hooks/useTrackers';
import FilterBar from './FilterBar';
import TrackerMentionsCard from './TrackerMentionsCard';
import TrackerDetailPanel from './TrackerDetailPanel';
import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function TrackersRepView() {
  const {
    filters,
    updateFilter,
    trackers,
    loading,
    error,
    selectedTracker,
    detail,
    detailLoading,
    openPanel,
    closePanel,
    postQuestion,
    aiResponse,
    aiResponseLoading,
  } = useTrackers();

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden bg-gray-50">
      <PageHeader
        title="Trackers"
        subtitle="Track the most commonly discussed conversation signals and themes across customer interactions."
        badge={<RoleBadge role="sales_rep" />}
      />

      <div className="flex-1 min-h-0 overflow-y-auto p-6">
        <div className="max-w-7xl mx-auto">
          <FilterBar filters={filters} updateFilter={updateFilter} />

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}. Ensure the unified API is running on port 3001.
            </div>
          )}

          <div className={`flex gap-4 mt-6 ${selectedTracker ? 'items-start' : ''}`}>
            <div className="flex-1 transition-all duration-300 min-w-0">
              <TrackerMentionsCard
                trackers={trackers}
                loading={loading}
                selectedTrackerId={selectedTracker?.id ?? null}
                openPanel={openPanel}
              />
            </div>

            {selectedTracker && (
              <TrackerDetailPanel
                tracker={selectedTracker}
                detail={detail}
                detailLoading={detailLoading}
                closePanel={closePanel}
                postQuestion={postQuestion}
                aiResponse={aiResponse}
                aiResponseLoading={aiResponseLoading}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
