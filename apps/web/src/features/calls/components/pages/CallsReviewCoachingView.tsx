'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  X,
  Save,
} from 'lucide-react';
import CallsToast from '@calls/components/ui/CallsToast';
import { fetchCallReviewDetail, saveCoachingFeedback } from '@calls/services/calls-reviews.service';

interface CallsReviewCoachingViewProps {
  reviewId: string;
}

const AVAILABLE_TAGS = [
  'Needs Coaching',
  'Best Practice',
  'Escalation Risk',
  'Compliance Concern',
  'Follow-up Needed',
  'Great Discovery',
  'Poor Closing',
  'Strong Closer',
  'Good Rapport',
];

export default function CallsReviewCoachingView({ reviewId }: CallsReviewCoachingViewProps) {
  const router = useRouter();

  // Toast notifications state
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Form states
  const [strengths, setStrengths] = useState<string[]>(['']);
  const [improvements, setImprovements] = useState<string[]>(['']);
  const [coachingNotes, setCoachingNotes] = useState('');
  const [recommendedActions, setRecommendedActions] = useState<string[]>(['']);
  const [internalNotes, setInternalNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [shareWithRep, setShareWithRep] = useState(true);

  // Load from local storage draft or default fallback mock
  useEffect(() => {
    async function loadCoaching() {
      try {
        const detail = await fetchCallReviewDetail(reviewId);
        if (detail && detail.feedback && Object.keys(detail.feedback).length > 0) {
          const parsed = detail.feedback;
          setStrengths(parsed.strengths && parsed.strengths.length > 0 ? parsed.strengths : ['']);
          setImprovements(parsed.improvements && parsed.improvements.length > 0 ? parsed.improvements : ['']);
          setCoachingNotes(parsed.coachingNotes || '');
          setRecommendedActions(parsed.recommendedActions && parsed.recommendedActions.length > 0 ? parsed.recommendedActions : ['']);
          setInternalNotes(parsed.internalNotes || '');
          setTags(parsed.tags || []);
          setShareWithRep(parsed.shareWithRep !== undefined ? parsed.shareWithRep : true);
          return;
        }
      } catch (e) {
        console.error('Failed to load coaching detail from server', e);
      }

      const saved = localStorage.getItem(`coaching_draft_v3_${reviewId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setStrengths(parsed.strengths && parsed.strengths.length > 0 ? parsed.strengths : ['']);
          setImprovements(parsed.improvements && parsed.improvements.length > 0 ? parsed.improvements : ['']);
          setCoachingNotes(parsed.coachingNotes || '');
          setRecommendedActions(parsed.recommendedActions && parsed.recommendedActions.length > 0 ? parsed.recommendedActions : ['']);
          setInternalNotes(parsed.internalNotes || '');
          setTags(parsed.tags || []);
          setShareWithRep(parsed.shareWithRep !== undefined ? parsed.shareWithRep : true);
        } catch (e) {
          console.error('Failed to parse coaching draft', e);
        }
      } else {
        setStrengths(['']);
        setImprovements(['']);
        setCoachingNotes('');
        setRecommendedActions(['']);
        setInternalNotes('');
        setTags([]);
        setShareWithRep(true);
      }
    }
    loadCoaching();
  }, [reviewId]);

  // Helper dynamic row mutations
  const handleAddRow = (list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    setList([...list, '']);
  };

  const handleRemoveRow = (idx: number, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    if (list.length === 1) {
      setList(['']);
      return;
    }
    const next = [...list];
    next.splice(idx, 1);
    setList(next);
  };

  const handleUpdateRow = (idx: number, val: string, list: string[], setList: React.Dispatch<React.SetStateAction<string[]>>) => {
    const next = [...list];
    next[idx] = val;
    setList(next);
  };

  // Toggle multi-select tags
  const handleToggleTag = (tag: string) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // Save Draft to Local Storage & Backend
  const handleSaveDraft = async () => {
    const cleanStrengths = strengths.filter((s) => s.trim() !== '');
    const cleanImprovements = improvements.filter((i) => i.trim() !== '');
    const cleanActions = recommendedActions.filter((a) => a.trim() !== '');

    const draft = {
      strengths: cleanStrengths.length > 0 ? cleanStrengths : [''],
      improvements: cleanImprovements.length > 0 ? cleanImprovements : [''],
      coachingNotes,
      recommendedActions: cleanActions.length > 0 ? cleanActions : [''],
      internalNotes,
      tags,
      shareWithRep,
    };

    localStorage.setItem(`coaching_draft_v3_${reviewId}`, JSON.stringify(draft));
    try {
      await saveCoachingFeedback(reviewId, draft);
      setToast({ msg: 'Coaching draft saved successfully.', type: 'success' });
    } catch (e) {
      setToast({ msg: 'Saved locally, but failed to sync to server.', type: 'info' });
    }
  };

  // Navigate to Summary Screen
  const handleContinueSummary = async () => {
    const cleanStrengths = strengths.filter((s) => s.trim() !== '');
    const cleanImprovements = improvements.filter((i) => i.trim() !== '');
    const cleanActions = recommendedActions.filter((a) => a.trim() !== '');

    const draft = {
      strengths: cleanStrengths,
      improvements: cleanImprovements,
      coachingNotes,
      recommendedActions: cleanActions,
      internalNotes,
      tags,
      shareWithRep,
    };

    localStorage.setItem(`coaching_draft_v3_${reviewId}`, JSON.stringify(draft));
    try {
      await saveCoachingFeedback(reviewId, draft);
    } catch (e) {
      console.error('Failed to sync coaching draft to server', e);
    }
    router.push(`/calls/reviews/${reviewId}/summary`);
  };

  return (
    <div className="calls-font-scope bg-[#f8fafc] flex-1 min-h-0 overflow-y-auto text-gray-800 flex flex-col">
      {toast && (
        <CallsToast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ═══════════════ HEADER AREA (WHITE BG) ═══════════════ */}
      <div className="bg-white border-b border-gray-200 py-7 px-8 text-left w-full">
        <div className="space-y-3 flex flex-col items-start text-left w-full">
          <div className="w-full text-left">
            <button
              onClick={() => router.push(`/calls/reviews/${reviewId}/evaluate`)}
              className="flex items-center gap-1.5 text-xs font-semibold text-[#003594] hover:underline focus:outline-none transition-all font-sans text-left"
            >
              <span>←</span> Back to Scorecard
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full text-left">
            <div className="text-left">
              <h1 className="text-[28px] font-bold text-[#0c1f3d] font-serif leading-tight text-left">
                Coaching Feedback
              </h1>
              <p className="text-xs text-gray-400 font-normal mt-1 font-sans text-left">
                Provide actionable feedback for the sales rep
              </p>
            </div>

            <div className="flex items-center gap-3 sm:ml-auto">
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-2 px-5 py-2.5 border border-slate-200 bg-white hover:bg-slate-50 text-[#0c1f3d] rounded-xl text-sm font-semibold transition-all shadow-sm focus:outline-none font-sans"
              >
                <Save size={16} className="text-[#0c1f3d]" />
                Save Draft
              </button>

              <button
                onClick={handleContinueSummary}
                className="flex items-center gap-2 px-6 py-2.5 bg-[#003594] hover:bg-[#002570] text-white rounded-xl text-sm font-semibold transition-all shadow-sm focus:outline-none font-sans"
              >
                Continue to Summary
                <span className="ml-1 text-sm font-normal">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ CONTENT AREA (GRAY BG, COLOR DIFF) ═══════════════ */}
      <div className="flex-1 bg-[#f8fafc] py-8 px-6">
        <div className="max-w-4xl mx-auto space-y-6">

          {/* ─── Strengths Card ─── */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0c1f3d] font-serif">Strengths</h2>
              <button
                onClick={() => handleAddRow(strengths, setStrengths)}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-full text-[11px] font-medium font-sans transition-all focus:outline-none"
              >
                <Plus size={11} />
                Add Strength
              </button>
            </div>
            <p className="text-xs text-gray-400 font-normal font-sans -mt-3">What did the rep do well?</p>
            <div className="space-y-3">
              {strengths.map((str, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Excellent rapport building and active listening"
                    value={str}
                    onChange={(e) => handleUpdateRow(idx, e.target.value, strengths, setStrengths)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#003594] focus:border-[#003594] transition-all placeholder-gray-400 font-sans font-normal"
                  />
                  {strengths.length > 1 && (
                    <button
                      onClick={() => handleRemoveRow(idx, strengths, setStrengths)}
                      className="text-gray-400 hover:text-gray-600 p-2 transition-colors focus:outline-none font-sans"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ─── Areas for Improvement Card ─── */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0c1f3d] font-serif">Areas for Improvement</h2>
              <button
                onClick={() => handleAddRow(improvements, setImprovements)}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-full text-[11px] font-medium font-sans transition-all focus:outline-none"
              >
                <Plus size={11} />
                Add Area
              </button>
            </div>
            <p className="text-xs text-gray-400 font-normal font-sans -mt-3">What needs improvement?</p>
            <div className="space-y-3">
              {improvements.map((imp, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Missed opportunity to confirm budget and authority"
                    value={imp}
                    onChange={(e) => handleUpdateRow(idx, e.target.value, improvements, setImprovements)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#003594] focus:border-[#003594] transition-all placeholder-gray-400 font-sans font-normal"
                  />
                  {improvements.length > 1 && (
                    <button
                      onClick={() => handleRemoveRow(idx, improvements, setImprovements)}
                      className="text-gray-400 hover:text-gray-600 p-2 transition-colors focus:outline-none font-sans"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ─── Coaching Notes Card ─── */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#0c1f3d] font-serif">Coaching Notes</h2>
              <p className="text-xs text-gray-400 font-normal font-sans mt-1">Detailed feedback for the rep</p>
            </div>
            <textarea
              placeholder="Provide detailed coaching feedback and context..."
              rows={5}
              value={coachingNotes}
              onChange={(e) => setCoachingNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#003594] focus:border-[#003594] transition-all placeholder-gray-400 font-sans font-normal"
            />
          </div>

          {/* ─── Recommended Actions Card ─── */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#0c1f3d] font-serif">Recommended Actions</h2>
              <button
                onClick={() => handleAddRow(recommendedActions, setRecommendedActions)}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-full text-[11px] font-medium font-sans transition-all focus:outline-none"
              >
                <Plus size={11} />
                Add Action
              </button>
            </div>
            <p className="text-xs text-gray-400 font-normal font-sans -mt-3">Specific next steps for improvement</p>
            <div className="space-y-3">
              {recommendedActions.map((act, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="e.g., Practice MEDDIC questioning in next coaching session"
                    value={act}
                    onChange={(e) => handleUpdateRow(idx, e.target.value, recommendedActions, setRecommendedActions)}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#003594] focus:border-[#003594] transition-all placeholder-gray-400 font-sans font-normal"
                  />
                  {recommendedActions.length > 1 && (
                    <button
                      onClick={() => handleRemoveRow(idx, recommendedActions, setRecommendedActions)}
                      className="text-gray-400 hover:text-gray-600 p-2 transition-colors focus:outline-none font-sans"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* ─── Internal Notes Card ─── */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#0c1f3d] font-serif">Internal Notes</h2>
              <p className="text-xs text-gray-400 font-normal font-sans mt-1">Visible only to managers and leadership (not shared with rep)</p>
            </div>
            <textarea
              placeholder="Add internal notes for leadership..."
              rows={4}
              value={internalNotes}
              onChange={(e) => setInternalNotes(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#003594] focus:border-[#003594] transition-all placeholder-gray-400 font-sans font-normal"
            />
          </div>

          {/* ─── Tags Card ─── */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#0c1f3d] font-serif">Tags</h2>
              <p className="text-xs text-gray-400 font-normal font-sans mt-1">Label this review for categorization</p>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {AVAILABLE_TAGS.map((tag) => {
                const isSelected = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => handleToggleTag(tag)}
                    className="border rounded-full text-xs font-normal font-sans transition-all focus:outline-none"
                    style={{
                      borderRadius: '100px',
                      padding: '8px 16px',
                      backgroundColor: isSelected ? '#003594' : '#ffffff',
                      color: isSelected ? '#ffffff' : '#4a5568',
                      borderColor: isSelected ? '#003594' : '#e2e8f0',
                    }}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* ─── Share Feedback Toggle Card ─── */}
          <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm flex items-center justify-between gap-6">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-[#0c1f3d] font-serif">Share Feedback with Rep</h2>
              <p className="text-xs text-gray-400 font-normal font-sans mt-1">Make this feedback visible to the sales rep</p>
            </div>

            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 font-sans">
              <input
                type="checkbox"
                checked={shareWithRep}
                onChange={(e) => setShareWithRep(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-focus:ring-2 peer-focus:ring-[#003594]/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#003594]" />
            </label>
          </div>

        </div>
      </div>
    </div>
  );
}
