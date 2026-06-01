import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function AIThemeSpotterRepView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="AI Theme Spotter"
        subtitle="Topics and themes surfaced from your recent calls."
        badge={<RoleBadge role="sales_rep" />}
      />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-medium text-gray-700 mb-3">Top Themes — Last 30 Days</p>
          <div className="flex flex-wrap gap-2">
            {['Pricing', 'Security', 'Integration', 'ROI', 'Timeline', 'Competitors'].map((t) => (
              <span
                key={t}
                className="px-3 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-medium"
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
