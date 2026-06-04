'use client';
import { useRouter } from 'next/navigation';
import { ArrowLeft, RotateCcw, Copy, Download, Share2 } from 'lucide-react';

const REVIEW_DATA = {
  title: 'Negotiation - Global Enterprises Contract',
  reviewer: 'Jennifer Kim',
  scorecard: 'Negotiation Scorecard v2.1',
  overallScore: 88,
  passing: true,
  aiAccepted: 12,
  aiModified: 5,
  aiRejected: 2,
  sections: [
    { name: 'Opening',            earned: 18, total: 20, pct: 90 },
    { name: 'Value Articulation', earned: 35, total: 40, pct: 88 },
    { name: 'Pricing Discussion', earned: 25, total: 30, pct: 83 },
    { name: 'Closing',            earned: 10, total: 10, pct: 100 },
  ],
  strengths: [
    'Excellent value articulation with clear ROI examples',
    'Strong negotiation on pricing terms',
    'Confident and professional demeanor throughout',
  ],
  improvements: [
    'Could have addressed security concerns earlier',
    'Missed opportunity to upsell premium features',
  ],
  coachingNotes:
    'Jennifer demonstrated strong negotiation skills overall. Focus on proactive objection handling in future calls - addressing potential concerns before they become blockers. Consider bringing in technical resources earlier when security is mentioned.',
  recommendedActions: [
    'Review security documentation and common objections',
    'Practice upselling techniques in next coaching session',
    'Shadow a senior rep on enterprise security calls',
  ],
  tags: ['Best Practice', 'Strong Closer'],
  callDetails: {
    customer: 'Global Enterprises',
    dateTime: '2026-05-13 11:15 AM',
    duration: '38:45',
    callType: 'Negotiation',
    deal: 'Global Enterprises - Enterprise License',
  },
  reviewInfo: {
    submittedBy: 'You',
    submittedAt: '2026-05-13 3:45 PM',
    visibility: 'Shared with Rep',
    scorecardVersion: 'v2.1',
  },
  auditTrail: [
    { event: 'Review Created',   actor: 'You', time: '2026-05-13 2:00 PM' },
    { event: 'Review Started',   actor: 'You', time: '2026-05-13 2:15 PM' },
    { event: 'Review Submitted', actor: 'You', time: '2026-05-13 3:45 PM' },
  ],
};

// ── Score Circle — green ring, green number, grey "out of 100"
function ScoreCircle({ score }: { score: number }) {
  const size = 120;
  const cx = 60;
  const cy = 60;
  const r = 48;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* grey track */}
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="8" />
      {/* green filled arc */}
      <circle
        cx={cx} cy={cy} r={r}
        fill="none"
        stroke="#10b981"
        strokeWidth="8"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
      />
      {/* score — green, bold */}
      <text x={cx} y={cy - 4} textAnchor="middle" fontSize="24" fontWeight="700" fill="#10b981">{score}</text>
      {/* label */}
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#9ca3af">out of 100</text>
    </svg>
  );
}

// ── Section progress bar — emerald green
function SectionBar({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2">
      <div
        className="h-2 rounded-full"
        style={{ width: `${pct}%`, backgroundColor: '#10b981' }}
      />
    </div>
  );
}

// ── Audit trail icon — clock inside a blue-tinted circle (matches Figma ⊙ style)
function AuditIcon() {
  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
      {/* SVG clock icon */}
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    </div>
  );
}

export default function AnalyticsReviewDetailView({ reviewId }: { reviewId: string }) {
  const router = useRouter();
  const d = REVIEW_DATA;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-[#f8f9fb] px-6 py-5">

      {/* ── Back link */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 mb-4 transition-colors"
      >
        <ArrowLeft size={12} />
        Back to Review History
      </button>

      {/* ── Page header */}
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-[22px] font-bold text-gray-900 leading-tight">{d.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{d.reviewer} • {d.scorecard}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors font-medium">
            <RotateCcw size={13} />
            Reopen Review
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors font-medium">
            <Copy size={13} />
            Clone
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 bg-white hover:bg-gray-50 transition-colors font-medium">
            <Download size={13} />
            Export
          </button>
          <button className="flex items-center gap-1.5 px-4 py-1.5 bg-[#1e3a8a] hover:bg-[#1e40af] text-white rounded-lg text-sm font-semibold transition-colors">
            <Share2 size={13} />
            Share
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* ════════════ LEFT COLUMN (2/3) ════════════ */}
        <div className="lg:col-span-2 space-y-4">

          {/* ── Overall Score ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Overall Score</h2>
            <div className="flex items-start gap-6">
              {/* Circle */}
              <div className="flex-shrink-0">
                <ScoreCircle score={d.overallScore} />
              </div>
              {/* Right side */}
              <div className="flex-1 pt-1">
                {/* Passing label */}
                <p className="text-base font-semibold text-gray-900 mb-2">
                  {d.overallScore}% - {d.passing ? 'Passing' : 'Failing'}
                </p>
                {/* Progress bar */}
                <div className="w-full bg-gray-100 rounded-full h-2.5 mb-4">
                  <div
                    className="h-2.5 rounded-full"
                    style={{ width: `${d.overallScore}%`, backgroundColor: '#10b981' }}
                  />
                </div>
                {/* AI stat boxes */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-green-50 rounded-lg px-3 py-3 text-center">
                    <p className="text-2xl font-bold text-green-600 leading-none">{d.aiAccepted}</p>
                    <p className="text-xs text-gray-500 mt-1.5">AI Accepted</p>
                  </div>
                  <div className="bg-amber-50 rounded-lg px-3 py-3 text-center">
                    <p className="text-2xl font-bold text-amber-500 leading-none">{d.aiModified}</p>
                    <p className="text-xs text-gray-500 mt-1.5">AI Modified</p>
                  </div>
                  <div className="bg-red-50 rounded-lg px-3 py-3 text-center">
                    <p className="text-2xl font-bold text-red-500 leading-none">{d.aiRejected}</p>
                    <p className="text-xs text-gray-500 mt-1.5">AI Rejected</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Section Breakdown ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Section Breakdown</h2>
            <div className="space-y-4">
              {d.sections.map((s) => (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-gray-700">{s.name}</span>
                    <span className="text-sm text-gray-500">
                      {s.earned} / {s.total} ({s.pct}%)
                    </span>
                  </div>
                  <SectionBar pct={s.pct} />
                </div>
              ))}
            </div>
          </div>

          {/* ── Coaching Feedback ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-5">Coaching Feedback</h2>

            {/* Strengths */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-emerald-600 mb-2">Strengths</p>
              <ul className="space-y-2">
                {d.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    {/* green filled circle bullet */}
                    <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Areas for Improvement */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-red-500 mb-2">Areas for Improvement</p>
              <ul className="space-y-2">
                {d.improvements.map((s, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    {/* red filled circle bullet */}
                    <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-red-400 inline-block" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>

            {/* Coaching Notes */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-800 mb-2">Coaching Notes</p>
              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                <p className="text-sm text-gray-600 leading-relaxed">{d.coachingNotes}</p>
              </div>
            </div>

            {/* Recommended Actions */}
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-800 mb-3">Recommended Actions</p>
              <ul className="space-y-2.5">
                {d.recommendedActions.map((a, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      className="mt-0.5 w-3.5 h-3.5 rounded border-gray-300 flex-shrink-0"
                      readOnly
                    />
                    {a}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tags */}
            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2">Tags</p>
              <div className="flex flex-wrap gap-2">
                {d.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 rounded-md border border-gray-200 bg-white text-xs text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ════════════ RIGHT COLUMN (1/3) ════════════ */}
        <div className="space-y-4">

          {/* ── Call Details ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Call Details</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Customer</p>
                <p className="text-sm font-medium text-gray-900">{d.callDetails.customer}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Date &amp; Time</p>
                <p className="text-sm font-medium text-gray-900">{d.callDetails.dateTime}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Duration</p>
                <p className="text-sm font-medium text-gray-900">{d.callDetails.duration}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Call Type</p>
                <span className="inline-block px-2.5 py-0.5 rounded-md bg-gray-100 text-xs text-gray-700 font-medium">
                  {d.callDetails.callType}
                </span>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Deal</p>
                <p className="text-sm font-medium text-gray-900">{d.callDetails.deal}</p>
              </div>
            </div>
          </div>

          {/* ── Review Info ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Review Info</h2>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Submitted By</p>
                <p className="text-sm font-medium text-gray-900">{d.reviewInfo.submittedBy}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Submitted At</p>
                <p className="text-sm font-medium text-gray-900">{d.reviewInfo.submittedAt}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Visibility</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-gray-900">{d.reviewInfo.visibility}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-0.5">Scorecard Version</p>
                <p className="text-sm font-medium text-gray-900">{d.reviewInfo.scorecardVersion}</p>
              </div>
            </div>
          </div>

          {/* ── Audit Trail ── */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Audit Trail</h2>
            <div className="space-y-4">
              {d.auditTrail.map((entry, i) => (
                <div key={i} className="flex items-start gap-3">
                  {/* Clock icon in blue-tinted circle — matches Figma */}
                  <AuditIcon />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{entry.event}</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      {/* person icon */}
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      {entry.actor} · {entry.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
