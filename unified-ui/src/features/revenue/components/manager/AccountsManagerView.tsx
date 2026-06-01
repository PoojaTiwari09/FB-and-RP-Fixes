import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function AccountsManagerView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="Accounts"
        subtitle="Account health, engagement signals, and renewal risk across your team's book."
        badge={<RoleBadge role="sales_manager" />}
      />
      <div className="flex-1 p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard label="Total Accounts" value="48" />
          <StatCard label="At Risk" value="6" highlight />
          <StatCard label="Expansion Opportunities" value="11" />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            { name: 'Acme Corp', rep: 'Alex Chen', health: 'Healthy', arr: '$42K' },
            { name: 'TechCorp', rep: 'Jordan Kim', health: 'At Risk', arr: '$28K' },
            { name: 'Globex', rep: 'Sam Lee', health: 'Healthy', arr: '$35K' },
          ].map((a) => (
            <div key={a.name} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-gray-800">{a.name}</p>
                <p className="text-xs text-gray-400">{a.rep} · {a.arr} ARR</p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  a.health === 'At Risk' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-700'
                }`}
              >
                {a.health}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-1 ${highlight ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
      <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">{label}</span>
      <span className={`text-2xl font-bold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</span>
    </div>
  );
}
