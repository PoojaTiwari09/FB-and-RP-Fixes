'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronDown, ChevronRight, CheckCircle, XCircle, Loader2, FileX } from 'lucide-react';
import { fetchReview } from '@calls/services/callsApi';
import type { ReviewData, ScorecardSection, ScorecardQuestion } from '@calls/data/mockData';

// ─── Question Block ────────────────────────────────────────────────────────────

function QuestionBlock({ q, callId }: { q: ScorecardQuestion; callId: string }) {
  const router = useRouter();
  const scorePercent = q.maxScore > 0 ? (q.score / q.maxScore) * 10 : q.score;

  const scoreColor =
    scorePercent >= 8
      ? 'text-green-600'
      : scorePercent >= 5
      ? 'text-yellow-600'
      : 'text-red-600';

  const answerColor =
    q.managerAnswer === 'Yes'
      ? 'text-green-700'
      : q.managerAnswer === 'No'
      ? 'text-red-700'
      : q.managerAnswer === 'Partial'
      ? 'text-yellow-700'
      : 'text-yellow-700';

  return (
    <div className="px-6 py-4 border-b last:border-b-0" style={{ borderColor: '#E5E7EB' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <p className="font-medium mb-2" style={{ color: '#111827' }}>{q.questionText}</p>
          <div className="flex items-center gap-4 text-sm">
            <span style={{ color: '#6B7280' }}>Manager Answer:</span>
            <span className={`font-medium ${answerColor}`}>{q.managerAnswer}</span>
          </div>
        </div>
        <div className="ml-4 text-right shrink-0">
          <div className={`text-2xl font-semibold ${scoreColor}`}>
            {q.score}/{q.maxScore}
          </div>
        </div>
      </div>

      {q.managerComments && (
        <div className="bg-white rounded-lg p-3 mb-3">
          <div className="text-sm font-medium mb-1" style={{ color: '#374151' }}>Manager Comments:</div>
          <p className="text-sm" style={{ color: '#6B7280' }}>{q.managerComments}</p>
          {q.transcriptTimestamp && (
            <button
              className="text-sm mt-2 transition-colors"
              style={{ color: '#3B82F6' }}
              onClick={() => router.push(`/calls/ai-reviewer/${callId}/overview`)}
            >
              Jump to {q.transcriptTimestamp} in transcript →
            </button>
          )}
        </div>
      )}

      {q.aiSuggestion && (
        <div className="rounded-lg p-3 border" style={{ backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }}>
          <div className="text-sm font-medium mb-1" style={{ color: '#1E40AF' }}>
            AI Suggestion (Read-only):
          </div>
          <p className="text-sm" style={{ color: '#1E3A8A' }}>{q.aiSuggestion}</p>
        </div>
      )}
    </div>
  );
}

// ─── Section Accordion ────────────────────────────────────────────────────────

function SectionAccordion({ section, callId, defaultOpen }: { section: ScorecardSection; callId: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen ?? false);

  return (
    <div className="bg-white rounded-xl shadow-sm border overflow-hidden" style={{ borderColor: '#E5E7EB' }}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {open ? (
            <ChevronDown size={20} style={{ color: '#9CA3AF' }} />
          ) : (
            <ChevronRight size={20} style={{ color: '#9CA3AF' }} />
          )}
          <h3 className="font-medium" style={{ color: '#111827' }}>{section.sectionName}</h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm" style={{ color: '#6B7280' }}>Score:</span>
          <span className="font-semibold" style={{ color: '#111827' }}>{section.sectionScore}</span>
        </div>
      </button>

      {open && (
        <div className="border-t" style={{ borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' }}>
          {section.questions.length > 0 ? (
            section.questions.map((q, i) => (
              <QuestionBlock key={i} q={q} callId={callId} />
            ))
          ) : (
            <div className="px-6 py-4 text-sm italic" style={{ color: '#9CA3AF' }}>
              No detailed questions for this section.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function CallDetailReview({ callId }: { callId: string }) {
  const [review, setReview] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReview(callId)
      .then(setReview)
      .finally(() => setLoading(false));
  }, [callId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 size={24} className="animate-spin" style={{ color: '#93C5FD' }} />
      </div>
    );
  }

  if (!review) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2" style={{ color: '#9CA3AF' }}>
        <FileX size={32} style={{ color: '#D1D5DB' }} />
        <p className="text-sm">This call has not been reviewed yet.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto" style={{ backgroundColor: '#F9FAFB' }}>
      <div className="max-w-5xl mx-auto p-8">
        {/* Scorecard Header Card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6" style={{ borderColor: '#E5E7EB' }}>
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2" style={{ color: '#111827' }}>{review.scorecardName}</h2>
              <div className="flex items-center gap-4 text-sm" style={{ color: '#6B7280' }}>
                <span>Version {review.scorecardVersion}</span>
                <span>•</span>
                <span>Reviewed by {review.reviewedBy?.role || 'Manager'} - {review.reviewedBy?.name || 'Unknown'}</span>
                <span>•</span>
                <span>{review.reviewDate}</span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="text-sm mb-1" style={{ color: '#6B7280' }}>Overall Score</div>
              <div className="flex items-center gap-3">
                <div
                  className={`text-4xl font-semibold ${
                    review.overallScore >= 80
                      ? 'text-green-600'
                      : review.overallScore >= 60
                      ? 'text-yellow-600'
                      : 'text-red-600'
                  }`}
                >
                  {review.overallScore}
                </div>
                {review.overallScore >= 60 ? (
                  <CheckCircle size={32} className="text-green-600" />
                ) : (
                  <XCircle size={32} className="text-red-600" />
                )}
              </div>
              <div
                className={`mt-2 px-3 py-1 rounded-full text-sm font-medium inline-block ${
                  review.overallScore >= 60
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {review.status}
              </div>
            </div>
          </div>

          {/* Section score summary grid */}
          <div
            className="grid gap-4 text-center pt-6 border-t"
            style={{
              gridTemplateColumns: `repeat(${(review.sections || []).length || 1}, 1fr)`,
              borderColor: '#E5E7EB',
            }}
          >
            {(review.sections || []).map((s) => (
              <div key={s.sectionName}>
                <div className="text-2xl font-semibold mb-1" style={{ color: '#111827' }}>{s.sectionScore}</div>
                <div className="text-sm" style={{ color: '#6B7280' }}>{s.sectionName}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section Accordions */}
        <div className="space-y-4">
          {(review.sections || []).map((section, i) => (
            <SectionAccordion
              key={section.sectionName}
              section={section}
              callId={callId}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
