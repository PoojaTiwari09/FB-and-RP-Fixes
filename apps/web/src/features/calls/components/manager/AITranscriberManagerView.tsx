import PageHeader from '@shared/components/PageHeader/PageHeader';
import RoleBadge from '@shared/components/RoleBadge/RoleBadge';

export default function AITranscriberManagerView() {
  return (
    <div className="flex flex-col flex-1">
      <PageHeader
        title="AI Transcriber"
        subtitle="Auto-generate and manage transcripts for all team calls."
        badge={<RoleBadge role="sales_manager" />}
      />
      <div className="flex-1 p-6">
        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {[
            { name: 'Alex — Acme Corp Discovery', status: 'Transcribed', date: 'Today' },
            { name: 'Jordan — TechCorp Demo', status: 'Processing', date: 'Today' },
            { name: 'Sam — Globex Follow-up', status: 'Transcribed', date: 'Yesterday' },
          ].map((item) => (
            <div key={item.name} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-400">{item.date}</p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  item.status === 'Transcribed'
                    ? 'bg-green-50 text-green-700'
                    : 'bg-yellow-50 text-yellow-700'
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
