import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function AICallReviewerManagerView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="AI Call Reviewer"
        subtitle="Team call quality scores — identify coaching gaps and top performers."
        badge={<RoleBadge role="sales_manager" />}
      />
      <div className="flex-1 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ScoreCard label="Avg Team Talk Ratio" value="46%" hint="Healthy range" />
          <ScoreCard label="Avg Patience Score" value="71" hint="Coaching opportunity" />
          <ScoreCard label="Calls Reviewed" value="34" hint="This week" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Rep Performance</p>
          {['Alex Chen — 82', 'Jordan Kim — 74', 'Sam Lee — 61'].map((entry) => (
            <div key={entry} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <span className="text-sm text-gray-700">{entry}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ScoreCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
      <span className="text-xs text-gray-400">{hint}</span>
    </div>
  );
}
