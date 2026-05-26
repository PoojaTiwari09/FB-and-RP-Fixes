'use client';
import React from 'react';

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const ACTION_STYLES: Record<string, { bg: string; dot: string }> = {
  'Draft created': { bg: 'bg-gray-100', dot: 'bg-gray-400' },
  'Draft saved': { bg: 'bg-gray-100', dot: 'bg-gray-400' },
  'Draft created/updated': { bg: 'bg-gray-100', dot: 'bg-gray-400' },
  'Forecast submitted': { bg: 'bg-blue-50', dot: 'bg-blue-500' },
  'Submitted': { bg: 'bg-blue-50', dot: 'bg-blue-500' },
  'Approved': { bg: 'bg-green-50', dot: 'bg-green-500' },
  'Reopened': { bg: 'bg-orange-50', dot: 'bg-orange-500' },
  'Resubmitted': { bg: 'bg-blue-50', dot: 'bg-blue-500' },
  'No drafts yet': { bg: 'bg-gray-50', dot: 'bg-gray-300' },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Draft', color: 'text-gray-600', bg: 'bg-gray-100' },
  submitted: { label: 'Submitted', color: 'text-blue-700', bg: 'bg-blue-50' },
  approved: { label: 'Approved', color: 'text-green-700', bg: 'bg-green-50' },
  reopened: { label: 'Reopened', color: 'text-orange-700', bg: 'bg-orange-50' },
  resubmitted: { label: 'Resubmitted', color: 'text-blue-700', bg: 'bg-blue-50' },
};

export default function AuditLog({ logs, submission }: { logs: any[]; submission: any }) {
  const status = submission?.status || 'draft';
  const sc = statusConfig[status] || statusConfig.draft;

  return (
    <div className="flex flex-col gap-4">
      {/* Status Card */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Forecast Status</p>
        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${sc.bg}`}>
          <div className="w-2 h-2 rounded-full bg-current" style={{ color: 'inherit' }} />
          <span className={`text-sm font-bold ${sc.color}`}>{sc.label}</span>
        </div>

        {submission && (
          <div className="mt-3 space-y-2 text-xs text-gray-500">
            {submission.lob && (
              <div className="flex justify-between">
                <span>LOB</span>
                <span className="font-medium text-gray-700 truncate ml-2 max-w-[120px]">{submission.lob}</span>
              </div>
            )}
            {submission.commitForecast > 0 && (
              <div className="flex justify-between">
                <span>Commit</span>
                <span className="font-medium text-gray-700">₹{(submission.commitForecast / 10000000).toFixed(1)}Cr</span>
              </div>
            )}
            {submission.bestCaseForecast > 0 && (
              <div className="flex justify-between">
                <span>Best Case</span>
                <span className="font-medium text-gray-700">₹{(submission.bestCaseForecast / 10000000).toFixed(1)}Cr</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Activity / Audit Log */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Activity Log</p>

        {logs.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-6">No activity yet</p>
        ) : (
          <div className="relative">
            {/* Vertical timeline line */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100" />

            <div className="flex flex-col gap-4 pl-8">
              {logs.map((log, i) => {
                const style = ACTION_STYLES[log.action] || ACTION_STYLES['Draft created'];
                return (
                  <div key={log.id || i} className="relative">
                    <div className={`absolute -left-5 top-1 w-2.5 h-2.5 rounded-full border-2 border-white ${style.dot}`} />
                    <div className={`rounded-lg px-3 py-2.5 ${style.bg}`}>
                      <p className="text-xs font-semibold text-gray-800">{log.action}</p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] text-gray-500">{log.actorRole}</span>
                        <span className="text-[10px] text-gray-400">{timeAgo(log.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Help Card */}
      <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
        <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-widest mb-2">💡 Tips</p>
        <ul className="text-[11px] text-blue-700 space-y-1.5 leading-relaxed">
          <li>• Save a <strong>Draft</strong> to return later without losing progress</li>
          <li>• <strong>Submit</strong> locks your forecast for manager review</li>
          <li>• Click <strong>See the Math</strong> to understand the AI projection</li>
          <li>• If reopened, revise your commit and resubmit</li>
        </ul>
      </div>
    </div>
  );
}
