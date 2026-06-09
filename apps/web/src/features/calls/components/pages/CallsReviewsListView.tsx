'use client';
import { useEffect, useState } from 'react';
import CallsTopNav from '@calls/components/ui/CallsTopNav';
import CallsSubTabs from '@calls/components/ui/CallsSubTabs';
import CallsTable from '@calls/components/shared/CallsTable';
import { fetchAllCalls, fetchCallReviews } from '@calls/services/calls-reviews.service';

export default function CallsReviewsListView() {
  const [allCallsCount, setAllCallsCount] = useState<number | null>(null);
  const [reviewsCount, setReviewsCount] = useState<number | null>(null);

  useEffect(() => {
    fetchAllCalls({}).then((r) => setAllCallsCount(r.totalCount)).catch(() => setAllCallsCount(0));
    fetchCallReviews({}).then((r) => setReviewsCount(r.totalCount)).catch(() => setReviewsCount(0));
  }, []);

  const subTabs = [
    { label: 'All Calls', href: '/calls/reviews', count: allCallsCount ?? 0, icon: 'phone' as const },
    { label: 'Call Reviews', href: '/calls/reviews/list', count: reviewsCount ?? 0, icon: 'file' as const },
  ];

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-[#faf9fc]">
      <CallsTopNav />
      <CallsSubTabs tabs={subTabs} />
      <div className="px-6 py-5">
        <CallsTable
          mode="reviews"
          title="Call Reviews"
          subtitle="Review and evaluate sales calls with AI-powered insights"
          fetchData={(params) => fetchCallReviews(params)}
        />
      </div>
    </div>
  );
}
