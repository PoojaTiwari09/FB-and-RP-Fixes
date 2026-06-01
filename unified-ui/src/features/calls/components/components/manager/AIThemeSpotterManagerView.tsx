import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function AIThemeSpotterManagerView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="AI Theme Spotter"
        subtitle="Cross-team theme analysis — track recurring topics and deal-blockers across all reps."
        badge={<RoleBadge role="sales_manager" />}
      />
      <div className="flex-1 p-6 space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Team-Wide Themes — Last 30 Days</p>
          <div className="flex flex-wrap gap-2">
            {['Pricing (42)', 'Security (38)', 'Integration (31)', 'ROI (28)', 'Timeline (22)', 'Competitors (19)'].map(
              (t) => (
                <span
                  key={t}
                  className="px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-full text-xs font-medium"
                >
                  {t}
                </span>
              )
            )}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Theme Trend — Week Over Week</p>
          <p className="text-sm text-gray-400">Chart placeholder — integrate with analytics provider</p>
        </div>
      </div>
    </div>
  );
}
