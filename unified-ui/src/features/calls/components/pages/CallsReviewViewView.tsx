'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RotateCcw,
  Copy,
  Download,
  Share2,
  Clock,
  Sparkles,
} from 'lucide-react';
import CallsToast from '@calls/components/ui/CallsToast';

interface CallsReviewViewViewProps {
  reviewId: string;
}

// Score Circle progress SVG
function ScoreCircle({ score, pct }: { score: number; pct: number }) {
  const size = 130;
  const cx = 65;
  const cy = 65;
  const r = 52;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  const color = '#10b981'; // Green ring
  const bgColor = '#f0fdf4';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background circle with soft fill and thin stroke */}
      <circle cx={cx} cy={cy} r={r} fill={bgColor} stroke="#f1f5f9" strokeWidth="6" />
      {/* Active score ring */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="6"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${cx} ${cy})`}
        className="transition-all duration-500 ease-out"
      />
      {/* Large visual score */}
      <text x={cx} y={cy + 2} textAnchor="middle" fontSize="34" fontWeight="700" fill={color} className="font-sans font-bold">
        {score}
      </text>
      {/* Muted "out of 100" label */}
      <text x={cx} y={cy + 18} textAnchor="middle" fontSize="11" fontWeight="500" fill="#64748b" className="font-sans font-medium">
        out of 100
      </text>
    </svg>
  );
}

// Section progress bar — emerald green
function SectionBar({ pct }: { pct: number }) {
  return (
    <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden border border-gray-200">
      <div
        className="h-full rounded-full"
        style={{ width: `${pct}%`, backgroundColor: '#10b981' }}
      />
    </div>
  );
}

// Audit trail timeline icon
function AuditIcon() {
  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center">
      <Clock size={13} className="text-[#003594]" />
    </div>
  );
}

export default function CallsReviewViewView({ reviewId }: CallsReviewViewViewProps) {
  const router = useRouter();

  // Toast notifications state
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Loaded Submitted Data
  const [overallScore, setOverallScore] = useState(88);
  const [sectionScores, setSectionScores] = useState([
    { sectionName: 'Opening', scored: 18, total: 20, percent: 90 },
    { sectionName: 'Discovery', scored: 35, total: 40, percent: 88 },
    { sectionName: 'Product Fit', scored: 18, total: 20, percent: 90 },
    { sectionName: 'Objection Handling', scored: 17, total: 20, percent: 85 },
  ]);
  const [coaching, setCoaching] = useState<any>({
    strengths: ['Excellent rapport building', 'Strong active listening throughout'],
    improvements: ['Missed opportunity to confirm budget authority'],
    coachingNotes: 'Overall a solid call. Focus on MEDDIC qualification in next session.',
    recommendedActions: ['Practice MEDDIC questioning in next coaching session', 'Review objection handling playbook'],
    tags: ['Needs Coaching', 'Good Rapport'],
    shareWithRep: true,
  });
  const [submitTime, setSubmitTime] = useState('May 15, 2026 at 2:45 PM');
  const [aiAnalysis, setAiAnalysis] = useState({ accepted: 12, modified: 5, rejected: 2 });

  useEffect(() => {
    // Attempt loading from Local Storage first
    const rawSubmit = localStorage.getItem(`review_submitted_data_${reviewId}`);
    if (rawSubmit) {
      try {
        const parsed = JSON.parse(rawSubmit);
        setOverallScore(parsed.overallScore || 88);
        setSectionScores(parsed.sectionScores || []);
        if (parsed.coachingDraft) {
          setCoaching(parsed.coachingDraft);
        }
        if (parsed.submittedAt) {
          const d = new Date(parsed.submittedAt);
          setSubmitTime(d.toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          }));
        }

        // Parse AI Accepted suggestions from answers
        const answersRaw = localStorage.getItem(`review_draft_${reviewId}`);
        if (answersRaw) {
          const answers = JSON.parse(answersRaw);
          let acceptedCount = 0;
          let modifiedCount = 0;
          let rejectedCount = 0;
          Object.values(answers).forEach((ans: any) => {
            if (ans.isAccepted) acceptedCount++;
            else if (ans.value !== null && ans.value !== '') modifiedCount++;
            else rejectedCount++;
          });
          if (acceptedCount > 0 || modifiedCount > 0) {
            setAiAnalysis({ accepted: acceptedCount, modified: modifiedCount, rejected: rejectedCount });
          }
        }
      } catch (e) {
        console.error('Failed to load submitted review data', e);
      }
    }
  }, [reviewId]);

  // Reopen review action
  const handleReopenReview = () => {
    localStorage.removeItem(`review_submitted_${reviewId}`);
    localStorage.removeItem(`review_submitted_data_${reviewId}`);
    setToast({ msg: 'Review reopened. Navigating to evaluate screen...', type: 'info' });
    setTimeout(() => {
      router.push(`/calls/reviews/${reviewId}/evaluate`);
    }, 1200);
  };

  // Clone review simulation
  const handleClone = () => {
    setToast({ msg: 'Cloning review draft for another session...', type: 'success' });
  };

  // Export PDF simulation
  const handleExport = () => {
    setToast({ msg: 'Downloading PDF report...', type: 'success' });
  };

  // Share review simulation
  const handleShare = () => {
    setToast({ msg: 'Copied secure share link to clipboard.', type: 'success' });
  };

  const isPassing = overallScore >= 75;

  return (
    <div className="bg-[#f8fafc] min-h-screen text-gray-800 pb-16">
      {toast && (
        <CallsToast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ═══════════════ HEADER ═══════════════ */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.push('/calls/reviews/list')}
              className="mt-1 flex items-center justify-center w-8 h-8 rounded-full border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors focus:outline-none"
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded">Submitted Review</span>
                <span className="text-xs text-gray-400 font-mono">ID: {reviewId}</span>
              </div>
              <h1 className="text-xl font-bold text-gray-900 mt-1 font-serif">Discovery Call - Acme Corp Q2 Initiative</h1>
              <p className="text-xs text-gray-500 font-medium font-sans">Sarah Chen • Discovery Call Scorecard v2.3</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 md:self-end">
            <button
              onClick={handleReopenReview}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-all shadow-sm focus:outline-none"
            >
              <RotateCcw size={13} />
              Reopen Review
            </button>
            <button
              onClick={handleClone}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-all shadow-sm focus:outline-none"
            >
              <Copy size={13} />
              Clone
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 rounded-lg text-xs font-semibold transition-all shadow-sm focus:outline-none"
            >
              <Download size={13} />
              Export
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#003594] hover:bg-[#002570] text-white rounded-lg text-xs font-bold transition-all shadow-sm focus:outline-none"
            >
              <Share2 size={13} />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════ TWO COLUMN CONTAINER ═══════════════ */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

          {/* ════════════ LEFT COLUMN (8/12 width) — Overall, Sections, Coaching ════════════ */}
          <div className="lg:col-span-8 space-y-6">

            {/* ── Overall Score Card ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#0c1f3d] font-serif mb-4">Overall Score</h2>
              
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <ScoreCircle score={overallScore} pct={overallScore} />
                </div>
                
                <div className="flex-1 w-full pt-1 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-slate-700 font-sans">
                      {overallScore}% - <span className="text-[#10b981]">{isPassing ? 'Passing' : 'Failing'}</span>
                    </span>
                    <span className="text-xs text-slate-400 font-normal font-sans">Pass threshold: 75%</span>
                  </div>
                  
                  {/* Progress Slider */}
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#10b981]"
                      style={{ width: `${overallScore}%` }}
                    />
                  </div>

                  {/* AI suggestion metrics stats boxes */}
                  <div className="grid grid-cols-3 gap-3 pt-2">
                    <div className="bg-[#f0fdf4] rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-emerald-600 leading-none">{aiAnalysis.accepted}</p>
                      <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide mt-1.5">AI Accepted</p>
                    </div>
                    <div className="bg-[#fffbeb] rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-amber-500 leading-none">{aiAnalysis.modified}</p>
                      <p className="text-[10px] font-semibold text-amber-500 uppercase tracking-wide mt-1.5">AI Modified</p>
                    </div>
                    <div className="bg-[#fef2f2] rounded-xl p-3 text-center">
                      <p className="text-xl font-bold text-red-500 leading-none">{aiAnalysis.rejected}</p>
                      <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide mt-1.5">AI Rejected</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Section Breakdown Card ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-5">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Section Breakdown</h2>
              <div className="space-y-4">
                {sectionScores.map((s) => (
                  <div key={s.sectionName} className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-gray-700">{s.sectionName}</span>
                      <span className="font-semibold text-gray-500">
                        {s.scored} / {s.total} ({s.percent}%)
                      </span>
                    </div>
                    <SectionBar pct={s.percent} />
                  </div>
                ))}
              </div>
            </div>

            {/* ── Coaching Feedback Preview Card ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm space-y-6">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Coaching Feedback</h2>

              {/* Strengths */}
              {coaching.strengths && coaching.strengths.filter((s: string) => s.trim() !== '').length > 0 && (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wide">Strengths</span>
                  <ul className="space-y-1.5 text-sm text-gray-700 font-medium">
                    {coaching.strengths.map((str: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas */}
              {coaching.improvements && coaching.improvements.filter((s: string) => s.trim() !== '').length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-50">
                  <span className="text-xs font-bold text-red-500 uppercase tracking-wide">Areas for Improvement</span>
                  <ul className="space-y-1.5 text-sm text-gray-700 font-medium">
                    {coaching.improvements.map((imp: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 flex-shrink-0" />
                        {imp}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Notes */}
              {coaching.coachingNotes && (
                <div className="space-y-2 pt-2 border-t border-gray-50">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Coaching Notes</span>
                  <div className="bg-gray-50 border border-gray-150 rounded-lg p-3.5 leading-relaxed text-sm font-medium text-gray-600">
                    {coaching.coachingNotes}
                  </div>
                </div>
              )}

              {/* Recommended Actions */}
              {coaching.recommendedActions && coaching.recommendedActions.filter((s: string) => s.trim() !== '').length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-50">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Recommended Actions</span>
                  <ul className="space-y-2 text-sm text-gray-700 font-medium">
                    {coaching.recommendedActions.map((act: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <input type="checkbox" className="mt-0.5 rounded border-gray-300 flex-shrink-0" readOnly checked={false} />
                        <span>{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Tags */}
              {coaching.tags && coaching.tags.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-50">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wide">Tags</span>
                  <div className="flex flex-wrap gap-1.5">
                    {coaching.tags.map((tag: string) => (
                      <span key={tag} className="text-xs font-semibold px-2.5 py-0.5 bg-gray-100 text-gray-600 rounded border border-gray-200">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* ════════════ RIGHT COLUMN (4/12 width) — Call Details, Info, Audit Trail ════════════ */}
          <div className="lg:col-span-4 space-y-4">

            {/* ── Call Details Card ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3.5">
              <h2 className="text-base font-bold text-gray-900">Call Details</h2>
              <div className="space-y-3 text-xs font-medium">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Customer</p>
                  <p className="text-sm font-bold text-gray-800">Acme Corporation</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Date &amp; Time</p>
                  <p className="text-sm text-gray-700">2026-05-14 10:00 AM</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Duration</p>
                  <p className="text-sm text-gray-700 font-mono">45:23</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-1">Call Type</p>
                  <span className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold">
                    Discovery
                  </span>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Deal</p>
                  <a href="#" className="text-sm text-[#003594] hover:underline font-bold">Acme Corp Q2 Sales Automation</a>
                </div>
              </div>
            </div>

            {/* ── Review Info Card ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-3.5">
              <h2 className="text-base font-bold text-gray-900">Review Info</h2>
              <div className="space-y-3 text-xs font-medium">
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Submitted By</p>
                  <p className="text-sm font-bold text-gray-800">You</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Submitted At</p>
                  <p className="text-sm text-gray-700 font-mono">{submitTime}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Visibility</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      coaching.shareWithRep ? 'bg-emerald-500' : 'bg-gray-400'
                    }`} />
                    <p className="text-sm font-bold text-gray-800">
                      {coaching.shareWithRep ? 'Shared with Rep' : 'Not Shared'}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide font-bold mb-0.5">Scorecard Version</p>
                  <p className="text-sm text-gray-700 font-mono">v2.3</p>
                </div>
              </div>
            </div>

            {/* ── Audit Trail Card ── */}
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-gray-900">Audit Trail</h2>
              
              <div className="space-y-4">
                {[
                  { event: 'Review Created', actor: 'You', time: '2026-05-14 2:00 PM' },
                  { event: 'Review Started', actor: 'You', time: '2026-05-14 2:15 PM' },
                  { event: 'Review Submitted', actor: 'You', time: submitTime },
                ].map((entry, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <AuditIcon />
                    <div>
                      <p className="text-xs font-bold text-gray-800 leading-snug">{entry.event}</p>
                      <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
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
    </div>
  );
}
