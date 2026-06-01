import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function CoachingInsightsManagerView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Coaching Insights"
        subtitle="AI-generated coaching recommendations based on team call patterns and deal outcomes."
        badge={<RoleBadge role="sales_manager" />}
      />
      <div className="flex-1 p-6 space-y-4">
        {[
          {
            rep: 'Jordan Kim',
            insight: 'Pricing objections handled without ROI anchoring in 4 of last 5 calls.',
            priority: 'High',
          },
          {
            rep: 'Sam Lee',
            insight: 'Discovery calls average only 18 min — consider deepening qualification.',
            priority: 'Medium',
          },
          {
            rep: 'Alex Chen',
            insight: 'Excellent next-step clarity. Recommend as peer coach for close techniques.',
            priority: 'Positive',
          },
        ].map((item) => (
          <div key={item.rep} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800">{item.rep}</p>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  item.priority === 'High'
                    ? 'bg-red-50 text-red-600'
                    : item.priority === 'Medium'
                    ? 'bg-yellow-50 text-yellow-700'
                    : 'bg-green-50 text-green-700'
                }`}
              >
                {item.priority}
              </span>
            </div>
            <p className="text-sm text-gray-600">{item.insight}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
