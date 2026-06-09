import React from 'react';

function formatL(val: number) {
  return val ? (val / 100000).toFixed(1) : '0.0';
}

function formatDate(dateStr: string) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

export default function SubmissionHistory({ versions }: { versions: any[] }) {
  if (!versions || versions.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 mt-6">
      <h2 className="text-sm font-bold text-gray-800 mb-4">Submission History</h2>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-gray-600">
          <thead className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 font-semibold">Version</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Commit</th>
              <th className="px-4 py-3 font-semibold">Best Case</th>
              <th className="px-4 py-3 font-semibold">Note / Justification</th>
              <th className="px-4 py-3 font-semibold">Actor</th>
              <th className="px-4 py-3 font-semibold text-right">Timestamp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {versions.map((v, i) => {
              const isCurrent = i === 0;
              const effectiveCommit = v.managerOverride ?? v.commitForecast;
              return (
                <tr key={v.id} className={isCurrent ? 'bg-blue-50/50' : 'hover:bg-gray-50'}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-medium text-gray-900">v{v.version}</span>
                    {isCurrent && <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-blue-100 text-blue-800">Current</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      v.status === 'draft' ? 'bg-gray-100 text-gray-800' :
                      v.status === 'submitted' || v.status === 'resubmitted' ? 'bg-blue-100 text-blue-800' :
                      v.status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {v.status.charAt(0).toUpperCase() + v.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-gray-900">
                    ₹{formatL(effectiveCommit)}L
                    {v.managerOverride && <span className="ml-1 text-orange-500 text-xs" title="Manager Override">⚠</span>}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {v.bestCaseForecast ? `₹${formatL(v.bestCaseForecast)}L` : '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-500 max-w-xs truncate" title={v.managerComment || v.notes || '-'}>
                    {v.managerComment ? (
                      <span className="text-orange-700 italic">Override: {v.managerComment}</span>
                    ) : (
                      v.notes || '-'
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {v.managerName ? `${v.managerName} (Manager)` : 'Rep'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-gray-500 text-xs">
                    {formatDate(v.overriddenAt || v.approvedAt || v.reopenedAt || v.submittedAt || v.createdAt)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
