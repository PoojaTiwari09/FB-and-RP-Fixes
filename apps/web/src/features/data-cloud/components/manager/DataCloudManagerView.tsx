import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function DataCloudManagerView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Data Cloud"
        subtitle="Unified data layer — sync CRM, call, and engagement signals into one revenue data store."
        badge={<RoleBadge role="sales_manager" />}
      />
      <div className="flex-1 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Records Synced" value="12,840" />
          <StatCard label="Data Sources Connected" value="5" />
          <StatCard label="Last Sync" value="2 min ago" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            { source: 'Salesforce CRM', status: 'Connected', records: '8,200' },
            { source: 'Call Recordings', status: 'Connected', records: '3,100' },
            { source: 'Email Engagement', status: 'Connected', records: '1,540' },
            { source: 'LinkedIn Sales Nav', status: 'Pending', records: '—' },
          ].map((ds) => (
            <div key={ds.source} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-gray-800">{ds.source}</p>
                <p className="text-xs text-gray-400">{ds.records} records</p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  ds.status === 'Connected'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}
              >
                {ds.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-1">
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className="text-2xl font-bold text-gray-900">{value}</span>
    </div>
  );
}
