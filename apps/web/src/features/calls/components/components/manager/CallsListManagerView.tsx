import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function CallsListManagerView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Calls List"
        subtitle="All team calls — filter by rep, date, deal stage, or score."
        badge={<RoleBadge role="sales_manager" />}
      />
      <div className="flex-1 p-6 space-y-4">
        <div className="flex gap-2">
          {['All Reps', 'This Week', 'Score: Any'].map((filter) => (
            <span
              key={filter}
              className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-200"
            >
              {filter}
            </span>
          ))}
        </div>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {['Alex — Acme Corp Discovery', 'Jordan — TechCorp Demo', 'Sam — Globex Follow-up'].map(
            (call) => (
              <div key={call} className="flex items-center justify-between px-5 py-4">
                <span className="text-sm font-medium text-gray-800">{call}</span>
                <span className="text-xs text-gray-400">View Recording</span>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
