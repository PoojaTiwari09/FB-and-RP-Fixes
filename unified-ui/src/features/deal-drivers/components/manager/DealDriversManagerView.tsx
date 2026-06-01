import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function DealDriversManagerView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Deal Drivers"
        subtitle="AI-identified factors accelerating or stalling deals across your team's pipeline."
        badge={<RoleBadge role="sales_manager" />}
      />
      <div className="flex-1 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-green-700 mb-3">Accelerators</p>
            {['Executive sponsorship present', 'Clear ROI articulated', 'Champion engaged weekly'].map(
              (d) => (
                <div key={d} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                  <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
                  <span className="text-sm text-gray-700">{d}</span>
                </div>
              )
            )}
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-semibold text-red-600 mb-3">Blockers</p>
            {['No budget approved', 'Legal review pending', 'Multi-stakeholder misalignment'].map(
              (d) => (
                <div key={d} className="flex items-center gap-2 py-2 border-b border-gray-50 last:border-0">
                  <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                  <span className="text-sm text-gray-700">{d}</span>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
