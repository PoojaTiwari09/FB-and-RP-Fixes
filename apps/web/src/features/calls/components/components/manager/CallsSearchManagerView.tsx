import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function CallsSearchManagerView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Search"
        subtitle="Full-text search across all team call transcripts and recordings."
        badge={<RoleBadge role="sales_manager" />}
      />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <input
            type="text"
            placeholder='Search calls… e.g. "pricing objection"'
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            readOnly
          />
          <p className="mt-4 text-sm text-gray-400">
            Connect to your search API to enable full-transcript search.
          </p>
        </div>
      </div>
    </div>
  );
}
