'use client';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Clock,
  ExternalLink,
  AlertTriangle,
  ChevronDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import CallsToast from '@calls/components/ui/CallsToast';
import { useCallReviewDetail } from '@calls/hooks/useCallReviewDetail';

interface CallsReviewDetailViewProps {
  reviewId: string;
}

export default function CallsReviewDetailView({ reviewId }: CallsReviewDetailViewProps) {
  const router = useRouter();
  const {
    detail,
    scorecards,
    users,
    loading,
    toast,
    setToast,
    selectedScorecard,
    selectedReviewer,
    handleScorecardChange,
    handleReviewerChange,
    handleMarkNA,
  } = useCallReviewDetail(reviewId);

  if (loading) {
    return (
      <div className="bg-gray-50 flex-1 min-h-0 overflow-y-auto px-6 py-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-36 mb-6" />
        <div className="h-8 bg-gray-200 rounded w-64 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-80 mb-8" />
        <div className="grid grid-cols-3 gap-6 max-w-7xl mx-auto">
          <div className="col-span-2 space-y-5">
            <div className="h-56 bg-gray-200 rounded-xl" />
            <div className="h-96 bg-gray-200 rounded-xl" />
          </div>
          <div className="h-[520px] bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const repPct = detail.talkRatio.rep;
  const custPct = detail.talkRatio.customer;

  // Format date as "2026-05-14 10:00 AM"
  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const time = d.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    return `${yyyy}-${mm}-${dd} ${time}`;
  };

  // Format date as "2026-05-16"
  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  return (
    <div className="bg-gray-50 flex-1 min-h-0 overflow-y-auto">
      {toast && (
        <CallsToast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Back link */}
        <button
          onClick={() => router.push('/calls/reviews/list')}
          className="flex items-center gap-1 text-sm text-blue-500 hover:text-blue-700 mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          Back to Review Queue
        </button>

        {/* Page header */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Call Review Overview</h1>
        <p className="text-sm text-gray-500 mb-6">Review AI insights and call context before starting evaluation</p>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ═══════════════ LEFT (2/3) ═══════════════ */}
          <div className="lg:col-span-2 space-y-5">

            {/* ── Call Summary Card ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-base font-bold text-gray-900 mb-5">Call Summary</h2>

              <div className="grid grid-cols-2 gap-x-10 gap-y-4 text-sm">
                {/* Row 1 */}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Call Title</p>
                  <p className="font-medium text-gray-900">{detail.callTitle}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Sales Rep</p>
                  <p className="font-medium text-gray-900">{detail.salesRep}</p>
                </div>

                {/* Row 2 */}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Customer / Account</p>
                  <p className="font-medium text-gray-900">{detail.customer}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Date &amp; Time</p>
                  <p className="font-medium text-gray-900">{formatDateTime(detail.dateTime)}</p>
                </div>

                {/* Row 3 */}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Duration</p>
                  <p className="font-medium text-gray-900">{detail.duration}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Call Type</p>
                  <span className="inline-block mt-0.5 px-2.5 py-0.5 border border-gray-300 rounded text-xs text-gray-700 bg-white">
                    {detail.callType}
                  </span>
                </div>

                {/* Row 4 */}
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Deal Linked</p>
                  <p className="font-medium text-gray-900">{detail.dealLinked}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-0.5">Call Source</p>
                  <p className="font-medium text-gray-900">{detail.callSource}</p>
                </div>
              </div>

              {/* Participants */}
              <div className="mt-5">
                <p className="text-xs text-gray-400 mb-2">Participants</p>
                <div className="flex flex-wrap gap-2">
                  {detail.participants.map((p) => (
                    <span
                      key={p.name}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-700"
                    >
                      {/* person icon */}
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {p.name} ({p.role})
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* ── AI Insights Card ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
              <h2 className="text-base font-bold text-gray-900">AI Insights</h2>

              {/* AI Summary */}
              <div>
                <p className="text-xs text-gray-400 mb-1.5">AI Summary</p>
                <p className="text-sm text-gray-700 leading-relaxed">{detail.aiSummary}</p>
              </div>

              {/* Key Highlights */}
              <div>
                <p className="text-xs text-gray-400 mb-2">Key Highlights</p>
                <ul className="space-y-1.5">
                  {detail.keyHighlights.map((h, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                      <span className="mt-1.5 w-2 h-2 rounded-sm bg-green-500 flex-shrink-0" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Talk Ratio */}
              <div>
                <p className="text-xs text-gray-400 mb-3">Talk Ratio</p>
                {/* Labels + percentages row */}
                <div className="flex items-center justify-between mb-1.5 text-xs text-gray-600">
                  <span>Me</span>
                  <span>{repPct}%</span>
                  <span>Customer</span>
                  <span>{custPct}%</span>
                </div>
                {/* Bars row */}
                <div className="flex gap-2">
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${repPct}%` }} />
                  </div>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${custPct}%` }} />
                  </div>
                </div>
              </div>

              {/* Sentiment Summary */}
              <div>
                <p className="text-xs text-gray-400 mb-1.5">Sentiment Summary</p>
                <div className="flex items-center gap-2">
                  <TrendingUp size={15} className="text-green-500 flex-shrink-0" />
                  <p className="text-sm text-gray-700">{detail.sentimentSummary}</p>
                </div>
              </div>

              {/* Risks Detected */}
              {detail.risksDetected.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Risks Detected</p>
                  <div className="space-y-2">
                    {detail.risksDetected.map((risk, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2.5 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2.5"
                      >
                        <AlertTriangle size={14} className="text-yellow-500 flex-shrink-0" />
                        <span className="text-sm text-yellow-800">{risk}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Items Identified */}
              {detail.actionItemsList && detail.actionItemsList.length > 0 && (
                <div>
                  <p className="text-xs text-gray-400 mb-2">Action Items Identified</p>
                  <div className="space-y-2">
                    {detail.actionItemsList.map((item, i) => (
                      <label key={i} className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          className="w-3.5 h-3.5 rounded border-gray-300 flex-shrink-0"
                          readOnly
                        />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ═══════════════ RIGHT (1/3) ═══════════════ */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-3">

              {/* Scorecard Info Card */}
              <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
                <h3 className="font-bold text-gray-900 text-base mb-4">Scorecard</h3>

                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Assigned Scorecard</p>
                    <p className="text-sm font-semibold text-gray-900">{detail.scorecardName}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Version</p>
                    <p className="text-sm font-medium text-gray-900">{detail.scorecardVersion}</p>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Review Mode</p>
                    <span className="inline-block px-2.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-semibold">
                      {detail.reviewMode}
                    </span>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-0.5">Due Date</p>
                    <div className="flex items-center gap-1.5 text-sm text-gray-700">
                      <Clock size={13} className="text-gray-500" />
                      <span>{formatDate(detail.dueDate)}</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-400 mb-1">Status</p>
                    <span className="inline-block px-2.5 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs font-semibold border border-yellow-200">
                      {detail.status}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <button
                onClick={() => router.push(`/calls/reviews/${reviewId}/evaluate`)}
                className="w-full bg-[#1e2a4a] hover:bg-[#2a3a5e] text-white font-semibold py-3 rounded-xl transition-colors text-sm"
              >
                Start Review
              </button>

              <button className="w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 hover:bg-gray-50 font-medium py-2.5 rounded-xl transition-colors text-sm bg-white">
                <ExternalLink size={14} />
                Call Details
              </button>

              {/* Change Scorecard */}
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Change Scorecard</p>
                <div className="relative">
                  <select
                    value={selectedScorecard}
                    onChange={(e) => handleScorecardChange(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {scorecards.map((s) => (
                      <option key={s.scorecardId} value={s.scorecardId}>{s.scorecardName}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Reassign Reviewer */}
              <div>
                <div className="flex items-center gap-1 mb-1.5">
                  <Users size={12} className="text-gray-400" />
                  <p className="text-xs text-gray-500">Reassign Reviewer</p>
                </div>
                <div className="relative">
                  <select
                    value={selectedReviewer}
                    onChange={(e) => handleReviewerChange(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {users.map((u) => (
                      <option key={u.userId} value={u.userId}>{u.userName}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Mark as Not Applicable */}
              <button
                onClick={handleMarkNA}
                className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-50 border border-gray-200 font-medium py-2.5 rounded-xl transition-colors text-sm bg-white"
              >
                Mark as Not Applicable
              </button>

              {/* Quick Stats */}
              <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                <p className="text-xs font-semibold text-gray-500 mb-3">Quick Stats</p>
                <div className="space-y-2">
                  {[
                    { label: 'Duration', value: detail.duration },
                    { label: 'Participants', value: detail.participants.length },
                    { label: 'Topics', value: detail.quickStats.topics },
                    { label: 'Action Items', value: detail.quickStats.actionItems },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">{label}</span>
                      <span className="text-sm font-semibold text-gray-900">{value}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
