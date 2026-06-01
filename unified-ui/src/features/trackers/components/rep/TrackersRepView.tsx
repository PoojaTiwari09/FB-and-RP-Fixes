import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function TrackersRepView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Trackers"
        subtitle="Smart keyword and phrase trackers — get notified when key topics appear in your calls."
        badge={<RoleBadge role="sales_rep" />}
      />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            { name: 'Competitor Mentions', keywords: 'Salesforce, HubSpot', hits: 12 },
            { name: 'Budget Signals', keywords: 'budget, cost, price, spend', hits: 7 },
            { name: 'Decision Maker', keywords: 'CTO, VP, Director', hits: 4 },
          ].map((tracker) => (
            <div key={tracker.name} className="px-5 py-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-800">{tracker.name}</p>
                <span className="text-xs text-gray-500">{tracker.hits} hits</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{tracker.keywords}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
