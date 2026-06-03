import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function TopicsRepView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Topics"
        subtitle="Conversation topics flagged across your calls — track trends and prepare responses."
        badge={<RoleBadge role="sales_rep" />}
      />
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            { topic: 'Pricing', count: 8, trend: 'up' },
            { topic: 'Security & Compliance', count: 5, trend: 'stable' },
            { topic: 'Integration Complexity', count: 4, trend: 'up' },
            { topic: 'ROI Timeline', count: 3, trend: 'down' },
          ].map((item) => (
            <div key={item.topic} className="flex items-center justify-between px-5 py-4">
              <span className="text-sm font-medium text-gray-800">{item.topic}</span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500">{item.count} mentions</span>
                <span
                  className={`text-xs font-medium ${
                    item.trend === 'up'
                      ? 'text-red-500'
                      : item.trend === 'down'
                      ? 'text-green-600'
                      : 'text-gray-400'
                  }`}
                >
                  {item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
