'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ErrorCard } from '@/components/shared/ErrorCard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { apiClient } from '@/lib/api';

export default function SessionReviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { id } = params;

  const [managerScore, setManagerScore] = useState<number | ''>('');
  const [managerNote, setManagerNote] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const sessionQuery = useQuery({
    queryKey: ['manager-session', id],
    queryFn: () => apiClient.get(`/sessions/${id}`).then(r => r.data),
  });

  const assignmentQuery = useQuery({
    queryKey: ['manager-session-assignment', id],
    queryFn: () => apiClient.get('/training/assignments').then(r => {
      const list = Array.isArray(r.data) ? r.data : Object.values(r.data).find(Array.isArray) ?? [];
      return list.find((a: any) => a.best_session_id === id || a.session_id === id) ?? null;
    }),
  });

  const session = sessionQuery.data as any;
  const assignment = assignmentQuery.data as any;
  const messages = (session?.messages_json ?? []) as Array<{ role: string; content: string }>;
  const feedback = session?.feedback_json as any;
  const personaName = session?.training_scenarios?.persona_name ?? session?.scenario?.persona_name ?? 'Persona';
  const repName = assignment?.rep_name ?? assignment?.rep_id ?? 'Rep';
  const scenarioName = session?.training_scenarios?.persona_name ?? 'Scenario';

  const saveReview = useMutation({
    mutationFn: () => apiClient.patch(`/training/assignments/${assignment?.id}`, {
      manager_score: managerScore === '' ? undefined : managerScore,
      manager_note: managerNote || undefined,
    }),
    onSuccess: () => setSubmitted(true),
  });

  useEffect(() => {
    if (assignment?.manager_score) setManagerScore(assignment.manager_score);
    if (assignment?.manager_note) setManagerNote(assignment.manager_note);
  }, [assignment]);

  if (sessionQuery.isLoading || assignmentQuery.isLoading) return <LoadingSkeleton />;
  if (sessionQuery.isError) return <ErrorCard message="Could not load session" onRetry={() => sessionQuery.refetch()} />;

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 border-b border-gray-100 bg-white px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-600">
            &larr; Back
          </button>
          <div>
            <h1 className="text-lg font-bold text-gray-900">Session Review &mdash; {repName}</h1>
            <p className="text-sm text-gray-500">{scenarioName} &middot; {assignment?.attempt_count ?? 1} attempt(s) &middot; Submitted {assignment?.completed_at ? new Date(assignment.completed_at).toLocaleDateString() : '&mdash;'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
            (feedback?.overall_score ?? 0) >= 70 ? 'bg-emerald-50 text-emerald-700' :
            (feedback?.overall_score ?? 0) >= 50 ? 'bg-amber-50 text-amber-700' :
            'bg-red-50 text-red-700'
          }`}>
            AI Score: {feedback?.overall_score ?? '&mdash;'}
          </span>
        </div>
      </div>

      {/* Three-column layout */}
      <div className="flex flex-1 overflow-hidden gap-4 p-4">
        {/* LEFT: Session info + AI scorecard */}
        <aside className="w-[300px] flex-shrink-0 overflow-y-auto flex flex-col gap-4">
          {/* Session metadata */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Session Info</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Rep</span><span className="font-medium">{repName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Scenario</span><span className="font-medium text-right max-w-[160px]">{scenarioName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Difficulty</span><span className="font-medium capitalize">{session?.training_scenarios?.difficulty ?? '&mdash;'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Attempts</span><span className="font-medium">{assignment?.attempt_count ?? '&mdash;'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Messages</span><span className="font-medium">{messages.length}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Submitted</span><span className="font-medium">{assignment?.completed_at ? new Date(assignment.completed_at).toLocaleDateString() : '&mdash;'}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Deadline</span><span className={`font-medium ${assignment?.deadline && new Date(assignment.deadline) < new Date() ? 'text-red-500' : ''}`}>{assignment?.deadline ? new Date(assignment.deadline).toLocaleDateString() : '&mdash;'}</span></div>
            </div>
          </div>

          {/* AI scorecard */}
          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">AI Scorecard</h2>
            <div className="flex items-center justify-center mb-4">
              <div className={`h-20 w-20 rounded-full border-4 flex items-center justify-center ${
                (feedback?.overall_score ?? 0) >= 70 ? 'border-emerald-400' :
                (feedback?.overall_score ?? 0) >= 50 ? 'border-amber-400' : 'border-red-400'
              }`}>
                <span className="text-2xl font-bold text-gray-900">{feedback?.overall_score ?? '&mdash;'}</span>
              </div>
            </div>
            {feedback?.scores && Object.entries(feedback.scores).map(([key, value]) => (
              <div key={key} className="mb-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="capitalize text-gray-600">{key.replace(/_/g, ' ')}</span>
                  <span className="font-semibold">{value as number}/20</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${(value as number) >= 15 ? 'bg-emerald-400' : (value as number) >= 10 ? 'bg-amber-400' : 'bg-red-400'}`}
                    style={{ width: `${((value as number) / 20) * 100}%` }}
                  />
                </div>
              </div>
            ))}
            {feedback?.objective_metrics && (
              <div className="mt-3 pt-3 border-t border-gray-100 space-y-1.5 text-xs">
                <div className="flex justify-between"><span className="text-gray-500">Talk ratio</span><span>{feedback.objective_metrics.talk_ratio_pct}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Questions asked</span><span>{feedback.objective_metrics.questions_asked}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Closing attempts</span><span>{feedback.objective_metrics.closing_attempts}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total exchanges</span><span>{feedback.objective_metrics.total_exchanges}</span></div>
              </div>
            )}
          </div>

          {feedback?.evaluation_summary && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">AI Summary</h2>
              <p className="text-xs text-gray-600 leading-relaxed">{feedback.evaluation_summary}</p>
            </div>
          )}

          {(feedback?.strengths?.length > 0 || feedback?.improvements?.length > 0) && (
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
              {feedback?.strengths?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">Strengths</h3>
                  {feedback.strengths.map((s: string, i: number) => (
                    <p key={i} className="text-xs text-gray-700 flex gap-2 mb-1"><span className="text-emerald-500">&check;</span>{s}</p>
                  ))}
                </div>
              )}
              {feedback?.improvements?.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Improvements</h3>
                  {feedback.improvements.map((s: string, i: number) => (
                    <p key={i} className="text-xs text-gray-700 flex gap-2 mb-1"><span className="text-amber-500">&nearr;</span>{s}</p>
                  ))}
                </div>
              )}
            </div>
          )}
        </aside>

        {/* CENTER: Transcript */}
        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col">
          <div className="flex-shrink-0 px-5 py-3 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-gray-900">Full Conversation Transcript</h2>
            <p className="text-xs text-gray-500">{messages.filter(m => m.role === 'user').length} rep turns &middot; {messages.filter(m => m.role === 'assistant').length} persona turns</p>
          </div>
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.length === 0 && (
              <div className="flex items-center justify-center h-32 text-gray-400 text-sm">No transcript available</div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-xs font-semibold text-gray-400 mb-1">
                  {msg.role === 'user' ? repName : personaName}
                </span>
                <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                  msg.role === 'user'
                    ? 'bg-indigo-600 text-white rounded-tr-sm'
                    : 'bg-gray-100 text-gray-800 rounded-tl-sm'
                }`}>
                  <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                </div>
                <span className="text-[10px] text-gray-300 mt-1">Turn {Math.ceil((idx + 1) / 2)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: Manager review form */}
        <aside className="w-[320px] flex-shrink-0 overflow-y-auto flex flex-col gap-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Manager Review</h2>

            {submitted ? (
              <div className="text-center py-6">
                <div className="text-4xl mb-3">&check;</div>
                <p className="font-semibold text-gray-900">Review saved</p>
                <p className="text-xs text-gray-500 mt-1">Rep will see your feedback</p>
                <button onClick={() => setSubmitted(false)} className="mt-4 text-xs text-indigo-600 hover:underline">
                  Edit review
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">Your Score (0&ndash;100)</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={managerScore}
                      onChange={e => setManagerScore(e.target.value === '' ? '' : Math.min(100, Math.max(0, Number(e.target.value))))}
                      placeholder="e.g. 75"
                      className="w-24 rounded-xl border border-gray-200 px-3 py-2 text-lg font-bold text-center outline-none focus:border-indigo-400"
                    />
                    {managerScore !== '' && (
                      <span className={`text-sm font-semibold px-3 py-1 rounded-full ${
                        (managerScore as number) >= 70 ? 'bg-emerald-50 text-emerald-700' :
                        (managerScore as number) >= 50 ? 'bg-amber-50 text-amber-700' :
                        'bg-red-50 text-red-700'
                      }`}>
                        {(managerScore as number) >= 70 ? 'Good' : (managerScore as number) >= 50 ? 'Average' : 'Needs work'}
                      </span>
                    )}
                  </div>
                  {managerScore !== '' && feedback?.overall_score && (
                    <p className="text-xs text-gray-400 mt-1.5">
                      AI scored {feedback.overall_score} &middot; {(managerScore as number) > feedback.overall_score ? `You scored ${(managerScore as number) - feedback.overall_score} pts higher` : (managerScore as number) < feedback.overall_score ? `You scored ${feedback.overall_score - (managerScore as number)} pts lower` : 'Matches AI score'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">Quick Rating</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { label: 'Excellent', score: 90, color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' },
                      { label: 'Good', score: 75, color: 'bg-blue-50 text-blue-700 hover:bg-blue-100' },
                      { label: 'Average', score: 60, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100' },
                      { label: 'Needs work', score: 40, color: 'bg-red-50 text-red-700 hover:bg-red-100' },
                    ].map(opt => (
                      <button key={opt.label} onClick={() => setManagerScore(opt.score)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors ${opt.color} ${managerScore === opt.score ? 'ring-2 ring-offset-1 ring-indigo-400' : ''}`}>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-2">Coaching Note / Suggestions</label>
                  <textarea
                    rows={6}
                    value={managerNote}
                    onChange={e => setManagerNote(e.target.value)}
                    placeholder="Write specific feedback for this rep. What did they do well? What should they improve? Any suggestions for next practice?"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:bg-white resize-none leading-relaxed"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">{managerNote.length} characters</p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-500 block mb-2">Quick starters</label>
                  <div className="flex flex-col gap-1.5">
                    {[
                      'Great job on the discovery questions. Next time try to...',
                      'Your talk ratio was too high. Focus on asking more...',
                      'Strong opening but the closing lacked a clear next step.',
                      'Good handling of the pricing objection. Work on...',
                    ].map((starter, i) => (
                      <button key={i} onClick={() => setManagerNote(starter)}
                        className="text-left text-xs text-gray-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg px-2 py-1.5 transition-colors">
                        &ldquo;{starter.substring(0, 50)}...&rdquo;
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => saveReview.mutate()}
                  disabled={saveReview.isPending || (managerScore === '' && !managerNote.trim())}
                  className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {saveReview.isPending ? 'Saving...' : 'Save Review'}
                </button>

                <p className="text-[10px] text-gray-400 text-center">Review is saved to the assignment record and visible to the rep</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Navigate</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => router.push('/manager/reports')}
                className="text-sm text-gray-600 hover:text-indigo-600 text-left py-1">
                &larr; Back to Reports
              </button>
              <button onClick={() => router.push('/manager/reps')}
                className="text-sm text-gray-600 hover:text-indigo-600 text-left py-1">
                View all reps &rarr;
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
