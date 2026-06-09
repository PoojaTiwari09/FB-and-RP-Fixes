'use client';

import type { Tracker } from '../../types/tracker.types';
import TrackerRow from './TrackerRow';

interface TrackerMentionsCardProps {
  trackers: Tracker[];
  loading: boolean;
  selectedTrackerId: string | null;
  openPanel: (tracker: Tracker) => void;
}

export default function TrackerMentionsCard({
  trackers,
  loading,
  selectedTrackerId,
  openPanel,
}: TrackerMentionsCardProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-xl font-semibold mb-2">Tracker mentions</h2>
        <p className="text-gray-600 mb-4">Percentage of interactions where tracker concepts were detected.</p>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (trackers.length === 0) {
    return (
      <div className="bg-white rounded-2xl border p-6">
        <h2 className="text-xl font-semibold mb-2">Tracker mentions</h2>
        <p className="text-gray-600 mb-4">Percentage of interactions where tracker concepts were detected.</p>
        <div className="text-center py-8 text-gray-500">No trackers found.</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border p-6">
      <h2 className="text-xl font-semibold mb-2">Tracker mentions</h2>
      <p className="text-gray-600 mb-4">Percentage of interactions where tracker concepts were detected.</p>
      <div className="space-y-0">
        {trackers.map((tracker) => (
          <TrackerRow
            key={tracker.id}
            tracker={tracker}
            isSelected={selectedTrackerId === tracker.id}
            onClick={() => openPanel(tracker)}
          />
        ))}
      </div>
    </div>
  );
}
