'use client';
import CallsTopNav from '@calls/components/ui/CallsTopNav';
import CallsSubTabs from '@calls/components/ui/CallsSubTabs';
import CallsTable from '@calls/components/shared/CallsTable';
import { fetchAllCalls } from '@calls/services/calls-reviews.service';
import { MOCK_ALL_CALLS, MOCK_CALL_REVIEWS } from '@calls/mocks/calls.mock';

const subTabs = [
  { label: 'All Calls', href: '/calls/reviews', count: MOCK_ALL_CALLS.length, icon: 'phone' as const },
  { label: 'Call Reviews', href: '/calls/reviews/list', count: MOCK_CALL_REVIEWS.length, icon: 'file' as const },
];

export default function CallsAllCallsView() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto bg-[#faf9fc]">
      <CallsTopNav />
      <CallsSubTabs tabs={subTabs} />
      <div className="px-6 py-5">
        <CallsTable
          mode="all"
          title="All Calls"
          subtitle="View all sales calls and their details"
          fetchData={(params) => fetchAllCalls(params)}
        />
      </div>
    </div>
  );
}
