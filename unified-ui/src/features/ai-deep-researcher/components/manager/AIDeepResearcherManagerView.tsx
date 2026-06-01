import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function AIDeepResearcherManagerView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="AI Deep Researcher"
        subtitle="AI-powered account and prospect research — enriched company profiles and buying signals."
        badge={<RoleBadge role="sales_manager" />}
      />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <input
            type="text"
            placeholder='Research a company or contact… e.g. "Acme Corp"'
            className="w-full px-4 py-2.5 rounded-lg border border-gray-200 text-sm text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            readOnly
          />
          <div className="space-y-3">
            {[
              { label: 'Recent Funding', value: 'Series B — $40M (Q1 2025)' },
              { label: 'Headcount Growth', value: '+22% YoY' },
              { label: 'Tech Stack', value: 'Salesforce, Slack, AWS' },
              { label: 'Buying Signals', value: 'Hiring for RevOps, CRO hired Q4 2024' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <span className="text-xs font-medium text-gray-500 w-36 shrink-0">{item.label}</span>
                <span className="text-sm text-gray-800">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
