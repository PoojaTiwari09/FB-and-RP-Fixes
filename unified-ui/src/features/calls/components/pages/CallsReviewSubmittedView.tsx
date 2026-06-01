'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  ArrowLeft,
  Share2,
  Download,
  FileText,
} from 'lucide-react';
import CallsToast from '@calls/components/ui/CallsToast';

interface CallsReviewSubmittedViewProps {
  reviewId: string;
}

export default function CallsReviewSubmittedView({ reviewId }: CallsReviewSubmittedViewProps) {
  const router = useRouter();

  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [submittedData, setSubmittedData] = useState<any>(null);

  useEffect(() => {
    const raw = localStorage.getItem(`review_submitted_data_${reviewId}`);
    if (raw) {
      setSubmittedData(JSON.parse(raw));
    }
  }, [reviewId]);

  const getSubmissionTime = () => {
    if (!submittedData?.submittedAt) {
      return 'May 15, 2026 at 2:45 PM';
    }
    const d = new Date(submittedData.submittedAt);
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const finalScore = submittedData?.overallScore ?? 88;
  const finalPercent = submittedData?.overallPercent ?? finalScore;
  const isShared = submittedData?.coachingDraft?.shareWithRep ?? true;

  const handleShare = () => setToast({ msg: 'Share link copied to clipboard.', type: 'success' });
  const handleExport = () => {
    setToast({ msg: 'Exporting review as PDF...', type: 'info' });
    setTimeout(() => setToast({ msg: 'Review PDF downloaded.', type: 'success' }), 1200);
  };

  return (
    <div className="bg-[#f0f4f8] min-h-screen flex items-center justify-center p-6">
      {toast && (
        <CallsToast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ═══════ MAIN CARD ═══════ */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-10 w-full max-w-2xl flex flex-col items-center gap-7">

        {/* Checkmark Circle — green ring glow effect */}
        <div className="relative flex items-center justify-center">
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
            <div className="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center">
              <CheckCircle2 size={34} className="text-emerald-500" strokeWidth={2} />
            </div>
          </div>
        </div>

        {/* Title + Subtitle */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">
            Review Submitted Successfully
          </h1>
          <p className="text-sm text-gray-400 font-normal">
            Your review has been saved and shared with the appropriate team members
          </p>
        </div>

        {/* 2-Column Detail Grid */}
        <div className="w-full bg-gray-50 border border-gray-200 rounded-xl p-5">
          <div className="grid grid-cols-2 gap-x-8 gap-y-5">

            {/* Call Title */}
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Call Title</p>
              <p className="text-sm font-normal text-gray-900 leading-snug">
                Discovery Call - Acme Corp Q2 Initiative
              </p>
            </div>

            {/* Sales Rep */}
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Sales Rep</p>
              <p className="text-sm font-semibold text-gray-900">Sarah Chen</p>
            </div>

            {/* Final Score */}
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Final Score</p>
              <p className="text-sm font-semibold text-emerald-500">
                {finalScore} / 100 ({finalPercent}%)
              </p>
            </div>

            {/* Submitted By */}
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Submitted By</p>
              <p className="text-sm font-semibold text-gray-900">You</p>
            </div>

            {/* Submission Time */}
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Submission Time</p>
              <p className="text-sm font-semibold text-gray-900">{getSubmissionTime()}</p>
            </div>

            {/* Visibility */}
            <div className="space-y-1">
              <p className="text-xs text-gray-400 font-medium">Visibility</p>
              <div className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${isShared ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                <p className="text-sm font-semibold text-gray-900">
                  {isShared ? 'Shared with Rep' : 'Not Shared'}
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* View Submitted Review — full-width navy CTA */}
        <button
          onClick={() => router.push(`/calls/reviews/${reviewId}/view`)}
          className="w-full bg-[#002d80] hover:bg-[#00246a] active:scale-[0.98] text-white font-semibold py-4 rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all focus:outline-none"
        >
          <FileText size={17} strokeWidth={2} />
          View Submitted Review
        </button>

        {/* 3 Bordered Outline Action Buttons */}
        <div className="w-full grid grid-cols-3 gap-3">
          <button
            onClick={() => router.push('/calls/reviews/list')}
            className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none"
          >
            <ArrowLeft size={15} strokeWidth={2} />
            Back to Queue
          </button>

          <button
            onClick={handleShare}
            className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none"
          >
            <Share2 size={15} strokeWidth={2} />
            Share
          </button>

          <button
            onClick={handleExport}
            className="flex items-center justify-center gap-2 py-3 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors focus:outline-none"
          >
            <Download size={15} strokeWidth={2} />
            Export
          </button>
        </div>

      </div>
    </div>
  );
}
