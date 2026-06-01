'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Play,
  Pause,
  Search,
  ChevronDown,
  ChevronUp,
  Save,
  ArrowRight,
  Check,
  X,
  Volume2,
  Sparkles,
  SkipBack,
  SkipForward,
  Loader2,
  Mic,
} from 'lucide-react';
import CallsToast from '@calls/components/ui/CallsToast';
import { useAssemblyAI } from '@calls/hooks/useAssemblyAI';

interface CallsReviewEvaluateViewProps {
  reviewId: string;
}

interface QuestionDef {
  id: string;
  section: 'opening' | 'discovery' | 'product_fit' | 'objection_handling';
  text: string;
  type: 'boolean' | 'scale' | 'dropdown';
  aiSuggestion: {
    confidence: number;
    value: string;
    text: string;
    secs?: number;
    time?: string;
  };
  options?: string[];
}

const QUESTIONS: QuestionDef[] = [
  // Opening
  {
    id: 'op_1',
    section: 'opening',
    text: 'Did the rep properly introduce themselves and set the agenda? *',
    type: 'boolean',
    aiSuggestion: {
      confidence: 92,
      value: 'Yes',
      text: "Hi John, thanks for joining. I'm Sarah from our sales team. Today I'd like to understand your current process and see if we can help streamline your sales operations.",
      secs: 15,
      time: '0:15'
    }
  },
  {
    id: 'op_2',
    section: 'opening',
    text: 'How would you rate the rapport building? *',
    type: 'scale',
    aiSuggestion: {
      confidence: 79,
      value: '4',
      text: "I saw you recently spoke at the SaaS Summit - how was that experience?",
      secs: 90,
      time: '1:30'
    }
  },
  {
    id: 'op_3',
    section: 'opening',
    text: 'Did the rep confirm the allocated time? *',
    type: 'boolean',
    aiSuggestion: {
      confidence: 95,
      value: 'Yes',
      text: "I have us down for 45 minutes - does that still work for you?",
      secs: 45,
      time: '0:45'
    }
  },
  // Discovery
  {
    id: 'disc_1',
    section: 'discovery',
    text: 'Did the rep ask about current pain points? *',
    type: 'boolean',
    aiSuggestion: {
      confidence: 89,
      value: 'Yes',
      text: "Can you walk me through what your current process looks like and where you're seeing the biggest challenges?",
      secs: 320,
      time: '5:20'
    }
  },
  {
    id: 'disc_2',
    section: 'discovery',
    text: 'How thoroughly did the rep explore business impact? *',
    type: 'dropdown',
    options: ['Excellent', 'Good', 'Fair', 'Poor'],
    aiSuggestion: {
      confidence: 72,
      value: 'Good',
      text: "How is this affecting your quarterly goals?",
      secs: 525,
      time: '8:45'
    }
  },
  {
    id: 'disc_3',
    section: 'discovery',
    text: 'Did the rep identify the decision-making process? *',
    type: 'boolean',
    aiSuggestion: {
      confidence: 65,
      value: 'No',
      text: "No clear decision-making process established during the call."
    }
  },
  {
    id: 'disc_4',
    section: 'discovery',
    text: 'Did the rep confirm budget and authority? *',
    type: 'boolean',
    aiSuggestion: {
      confidence: 58,
      value: 'No',
      text: "We have budget allocated for Q2, so timing is good if we can find the right solution.",
      secs: 750,
      time: '12:30'
    }
  },
  // Product Fit
  {
    id: 'fit_1',
    section: 'product_fit',
    text: 'Did the rep connect features to customer pain points? *',
    type: 'boolean',
    aiSuggestion: {
      confidence: 85,
      value: 'Yes',
      text: "Based on what you mentioned about manual data entry, our workflow automation can eliminate that completely...",
      secs: 1100,
      time: '18:20'
    }
  },
  {
    id: 'fit_2',
    section: 'product_fit',
    text: 'Rate the quality of the solution presentation *',
    type: 'scale',
    aiSuggestion: {
      confidence: 80,
      value: '4',
      text: "The solution demo was well presented and matched prospects' expectations."
    }
  },
  // Objection Handling
  {
    id: 'obj_1',
    section: 'objection_handling',
    text: 'Did the rep address objections effectively? *',
    type: 'boolean',
    aiSuggestion: {
      confidence: 70,
      value: 'Yes',
      text: "Sarah addressed CRM integration concerns nicely."
    }
  },
  {
    id: 'obj_2',
    section: 'objection_handling',
    text: 'How well did the rep summarize next steps? *',
    type: 'scale',
    aiSuggestion: {
      confidence: 75,
      value: '4',
      text: "Briefly discussed next steps but did not lock in a calendar invite on the call."
    }
  }
];

// TRANSCRIPT_LINES is now sourced from AssemblyAI — see useAssemblyAI hook below

export default function CallsReviewEvaluateView({ reviewId }: CallsReviewEvaluateViewProps) {
  const router = useRouter();

  // AssemblyAI — real audio + transcript + AI insights
  const { playbackUrl, status: aiStatus, insights, error: assemblyError } = useAssemblyAI(reviewId);

  // Toast State
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Audio Player State — backed by a real <audio> element
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(120); // updated once audio metadata loads
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Tabs & Search State
  const [activeTab, setActiveTab] = useState<'transcript' | 'insights'>('transcript');
  const [searchQuery, setSearchQuery] = useState('');

  // Expandable Sections State
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    opening: true,
    discovery: false,
    product_fit: false,
    objection_handling: false,
  });

  // Scorecard Answers State
  const [answers, setAnswers] = useState<Record<string, { value: string | null; comment: string; isNa: boolean; isAccepted: boolean }>>(() => {
    const initial: Record<string, { value: string | null; comment: string; isNa: boolean; isAccepted: boolean }> = {};
    QUESTIONS.forEach((q) => {
      initial[q.id] = {
        value: null,
        comment: '',
        isNa: false,
        isAccepted: false,
      };
    });
    return initial;
  });

  // Refs for transcript auto-scrolling
  const transcriptContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Sync real audio element — play/pause, speed, seek
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) { audio.play().catch(() => {}); }
    else { audio.pause(); }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.playbackRate = playbackSpeed;
  }, [playbackSpeed]);

  // Audio format helper (e.g. 00:00)
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Build transcript lines from AssemblyAI utterances
  const SPEAKER_LABELS: Record<string, string> = { A: 'Sales Rep', B: 'Customer' };
  const transcriptLines = (insights?.utterances ?? []).map((u, i) => ({
    id: i + 1,
    time: formatTime(Math.floor(u.start / 1000)),
    secs: Math.floor(u.start / 1000),
    speaker: SPEAKER_LABELS[u.speaker] ?? `Speaker ${u.speaker}`,
    text: u.text,
  }));

  // Find active transcript index based on audio player currentTime
  const activeLineIndex = transcriptLines.reduce((acc, curr, idx) => {
    if (currentTime >= curr.secs) return idx;
    return acc;
  }, 0);

  // Scroll active transcript line into view
  useEffect(() => {
    if (activeLineRef.current && transcriptContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [activeLineIndex]);

  // Dynamic progress calculation
  const totalQuestions = QUESTIONS.length;
  const answeredQuestions = Object.values(answers).filter(
    (a) => (a.value !== null && a.value !== '') || a.isNa
  ).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;

  // Toggle scorecard accordion sections
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Update specific answer field
  const updateAnswer = (id: string, field: 'value' | 'comment' | 'isNa' | 'isAccepted', val: any) => {
    setAnswers((prev) => {
      const current = { ...prev[id] };
      
      if (field === 'value') {
        current.value = val;
        current.isNa = false; // Reset N/A if value is selected
      } else if (field === 'comment') {
        current.comment = val;
      } else if (field === 'isNa') {
        current.isNa = val;
        if (val) {
          current.value = null; // Clear value if marked N/A
          current.isAccepted = false;
        }
      } else if (field === 'isAccepted') {
        current.isAccepted = val;
      }

      return {
        ...prev,
        [id]: current,
      };
    });
  };

  // AI Suggestion Accept Trigger
  const handleAcceptSuggestion = (qId: string, suggestionVal: string, suggestionSecs?: number) => {
    updateAnswer(qId, 'value', String(suggestionVal));
    updateAnswer(qId, 'isAccepted', true);
    if (suggestionSecs !== undefined) {
      setCurrentTime(suggestionSecs);
    }
  };

  // Save Draft to Local Storage
  const handleSaveDraft = () => {
    localStorage.setItem(`review_draft_${reviewId}`, JSON.stringify(answers));
    setToast({ msg: 'Draft evaluation saved successfully.', type: 'success' });
  };

  // Continue to Coaching Validation
  const handleContinueCoaching = () => {
    localStorage.setItem(`review_draft_${reviewId}`, JSON.stringify(answers));
    router.push(`/calls/reviews/${reviewId}/coaching`);
  };

  // Filter transcript text based on search queries
  const filteredTranscript = transcriptLines.filter(
    (line) =>
      line.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      line.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to count questions answered in a single section
  const getSectionStats = (sect: string) => {
    const sectQuestions = QUESTIONS.filter((q) => q.section === sect);
    const count = sectQuestions.filter((q) => {
      const ans = answers[q.id];
      return (ans.value !== null && ans.value !== '') || ans.isNa;
    }).length;
    return `${count}/${sectQuestions.length}`;
  };

  return (
    <div className="bg-[#f8fafc] h-screen max-h-screen text-gray-800 flex flex-col font-sans overflow-hidden">
      {toast && (
        <CallsToast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />
      )}

      {/* ═══════════════ STICKY FULL-WIDTH HEADER ═══════════════ */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 px-6 py-2.5 shadow-sm flex-shrink-0">
        <div className="w-full flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <button
              onClick={() => router.push(`/calls/reviews/${reviewId}`)}
              className="flex items-center gap-1 text-[11px] font-bold text-[#003594] hover:text-[#002570] transition-colors focus:outline-none"
            >
              <ArrowLeft size={12} />
              Back
            </button>
            <h1 className="text-base font-bold text-gray-900 leading-tight">Discovery Call - Acme Corp Q2 Initiative</h1>
            <p className="text-[10px] text-gray-500 font-semibold font-sans">
              Sarah Chen <span className="text-gray-400 font-normal">· Discovery Call Scorecard v2.3</span>
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-4">
            {/* Progress Metrics */}
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500 font-sans">
                {answeredQuestions} of {totalQuestions} Questions
              </span>
              <div className="w-28 bg-gray-100 rounded-full h-1 overflow-hidden border border-gray-200">
                <div
                  className="bg-[#003594] h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={handleSaveDraft}
                className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-md text-[11px] font-bold transition-all shadow-sm focus:outline-none"
              >
                <Save size={12} />
                Save Draft
              </button>

              <button
                onClick={handleContinueCoaching}
                className="flex items-center gap-1 px-3 py-1.5 bg-[#003594] hover:bg-[#002570] text-white rounded-md text-[11px] font-bold transition-all shadow-sm focus:outline-none"
              >
                Continue to Coaching
                <ArrowRight size={12} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════ MAIN CONTAINER (NO GAP ON LEFT) ═══════════════ */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
        
        {/* LEFT COLUMN: Media Player & Transcripts (Flush against sidebar/header) */}
        <div className="w-full lg:w-[320px] xl:w-[340px] bg-white border-r border-gray-200 flex flex-col flex-shrink-0 h-full overflow-hidden">
          
          {/* Hidden real audio element — drives playback */}
          <audio
            ref={audioRef}
            src={playbackUrl ?? undefined}
            preload="metadata"
            onLoadedMetadata={(e) => setTotalDuration(Math.floor((e.target as HTMLAudioElement).duration))}
            onTimeUpdate={(e) => setCurrentTime(Math.floor((e.target as HTMLAudioElement).currentTime))}
            onEnded={() => setIsPlaying(false)}
          />

          {/* Audio Player Card (No shadow, integrated) */}
          <div className="p-4 border-b border-gray-200 space-y-3.5 bg-white">
            <div className="flex items-center justify-between text-[11px] text-gray-500 font-mono font-bold">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(totalDuration)}</span>
            </div>

            {/* Progress Slider */}
            <div className="relative flex items-center">
              <input
                type="range"
                min="0"
                max={totalDuration}
                value={currentTime}
                onChange={(e) => {
                  const t = Number(e.target.value);
                  setCurrentTime(t);
                  if (audioRef.current) audioRef.current.currentTime = t;
                }}
                className="w-full h-[2px] bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#003594] hover:accent-[#002570] focus:outline-none transition-all"
              />
            </div>

            {/* Compact Control Buttons Centered */}
            <div className="flex items-center justify-center gap-5 py-0.5">
              <button
                onClick={() => {
                  const t = Math.max(0, currentTime - 10);
                  setCurrentTime(t);
                  if (audioRef.current) audioRef.current.currentTime = t;
                }}
                title="-10 Seconds"
                className="flex items-center justify-center text-gray-400 hover:text-[#003594] transition-colors focus:outline-none"
              >
                <SkipBack size={15} />
              </button>

              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center justify-center w-10 h-10 rounded-full bg-[#003594] hover:bg-[#002570] text-white shadow active:scale-95 transition-all focus:outline-none"
              >
                {isPlaying ? <Pause size={15} fill="white" /> : <Play size={15} className="ml-0.5" fill="white" />}
              </button>

              <button
                onClick={() => {
                  const t = Math.min(totalDuration, currentTime + 10);
                  setCurrentTime(t);
                  if (audioRef.current) audioRef.current.currentTime = t;
                }}
                title="+10 Seconds"
                className="flex items-center justify-center text-gray-400 hover:text-[#003594] transition-colors focus:outline-none"
              >
                <SkipForward size={15} />
              </button>
            </div>

            {/* Speed Selector */}
            <div className="flex justify-center">
              <div className="relative w-full max-w-[110px]">
                <select
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="w-full appearance-none pl-2 pr-6 py-0.5 border border-gray-200 rounded text-[10px] bg-white font-bold text-gray-700 focus:outline-none"
                >
                  <option value="0.5">0.5x Speed</option>
                  <option value="1">1x Speed</option>
                  <option value="1.5">1.5x Speed</option>
                  <option value="2">2x Speed</option>
                </select>
                <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>

            {/* AssemblyAI processing status badge */}
            {(aiStatus === 'submitting' || aiStatus === 'processing') && (
              <div className="flex items-center gap-1.5 justify-center text-[10px] text-[#003594] font-semibold">
                <Loader2 size={11} className="animate-spin" />
                <Mic size={11} />
                {aiStatus === 'submitting' ? 'Sending audio to AssemblyAI...' : 'Transcribing call...'}
              </div>
            )}
          </div>

          {/* Tab Selector */}
          <div className="flex border-b border-gray-200 bg-gray-50/50 flex-shrink-0">
            <button
              onClick={() => setActiveTab('transcript')}
              className={`flex-1 py-2 text-center text-[11px] font-bold border-b-2 transition-all ${
                activeTab === 'transcript'
                  ? 'border-[#003594] text-[#003594]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Transcript
            </button>
            <button
              onClick={() => setActiveTab('insights')}
              className={`flex-1 py-2 text-center text-[11px] font-bold border-b-2 transition-all ${
                activeTab === 'insights'
                  ? 'border-[#003594] text-[#003594]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              AI Insights
            </button>
          </div>

          {/* Scrollable Container (Plain white bg) */}
          <div className="flex-1 overflow-y-auto flex flex-col bg-white min-h-0">
            {activeTab === 'transcript' ? (
              <>
                {/* Search bar */}
                <div className="p-2 border-b border-gray-100 bg-white sticky top-0 z-10">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search transcript..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-7 pr-3 py-1 border border-gray-200 rounded text-[11px] bg-gray-50 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>

                {/* Lines List (Plain white background, active has no blue bg) */}
                <div
                  ref={transcriptContainerRef}
                  className="flex-1 p-2 space-y-1 divide-y divide-gray-50"
                >
                  {/* Loading skeleton while AssemblyAI transcribes */}
                  {(aiStatus === 'submitting' || aiStatus === 'processing') && (
                    <div className="space-y-3 p-2 animate-pulse">
                      {[1,2,3,4,5].map((i) => (
                        <div key={i} className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 bg-blue-100 rounded w-8" />
                            <div className="h-2 bg-gray-200 rounded w-16" />
                          </div>
                          <div className="h-2 bg-gray-100 rounded w-full" />
                          <div className="h-2 bg-gray-100 rounded w-4/5" />
                        </div>
                      ))}
                      <p className="text-center text-[10px] text-gray-400 font-semibold pt-2">
                        Transcribing with speaker labels...
                      </p>
                    </div>
                  )}

                  {/* Live transcript from AssemblyAI */}
                  {aiStatus === 'completed' && filteredTranscript.map((line, idx) => {
                    const isCurrent = idx === activeLineIndex;
                    const isRep = line.speaker === 'Sales Rep';
                    return (
                      <div
                        key={line.id}
                        ref={isCurrent ? activeLineRef : null}
                        onClick={() => {
                          setCurrentTime(line.secs);
                          if (audioRef.current) audioRef.current.currentTime = line.secs;
                        }}
                        className={`pt-2 first:pt-0 cursor-pointer rounded p-1.5 transition-all hover:bg-gray-50 ${isCurrent ? 'bg-blue-50/40' : 'bg-white'}`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5 text-[10px] font-normal">
                          <span className="text-[#003594] font-mono">{line.time}</span>
                          <span className="text-gray-300 font-normal">·</span>
                          <span className={`font-semibold text-[10px] ${isRep ? 'text-[#003594]' : 'text-emerald-600'}`}>
                            {line.speaker}
                          </span>
                        </div>
                        <p className="text-[11px] leading-normal font-normal text-gray-600">
                          {line.text}
                        </p>
                      </div>
                    );
                  })}

                  {/* Empty state when no search match */}
                  {aiStatus === 'completed' && filteredTranscript.length === 0 && (
                    <div className="text-center py-6 text-[10px] text-gray-400 font-semibold">
                      No matches found.
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-3 space-y-3 bg-white">
                {/* Loading skeleton while AssemblyAI processes */}
                {(aiStatus === 'submitting' || aiStatus === 'processing') && (
                  <div className="space-y-3 animate-pulse">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-gray-100 rounded p-3 space-y-2">
                        <div className="h-2.5 bg-gray-200 rounded w-24" />
                        <div className="h-2 bg-gray-200 rounded w-full" />
                        <div className="h-2 bg-gray-200 rounded w-3/4" />
                      </div>
                    ))}
                    <p className="text-center text-[10px] text-gray-400 font-semibold pt-1">AssemblyAI analysing call...</p>
                  </div>
                )}

                {/* Live AI Insights from AssemblyAI */}
                {aiStatus === 'completed' && insights && (
                  <>
                    {/* Summary */}
                    <div className="bg-[#f0f4ff]/80 border border-[#dbeafe] rounded p-3 space-y-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#003594] flex items-center gap-1">
                        <Sparkles size={10} /> AI Summary
                      </h4>
                      <p className="text-[11px] text-gray-700 leading-normal font-normal">
                        {insights.summary}
                      </p>
                    </div>

                    {/* Highlights */}
                    {insights.highlights.length > 0 && (
                      <div className="bg-[#f0fdf4] border border-emerald-100 rounded p-3 space-y-1.5">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Key Highlights</h4>
                        <ul className="space-y-1">
                          {insights.highlights.slice(0, 4).map((h, i) => (
                            <li key={i} className="flex items-start gap-1.5 text-[11px] text-gray-700 font-normal">
                              <span className="mt-1 w-1.5 h-1.5 rounded-sm bg-emerald-500 flex-shrink-0" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Sentiment */}
                    <div className="bg-[#fff9eb] border border-[#fef3c7] rounded p-3 space-y-1">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Sentiment</h4>
                      <p className="text-[11px] text-gray-700 leading-normal font-normal">{insights.sentiment}</p>
                    </div>

                    {/* Talk Ratio */}
                    <div className="bg-white border border-gray-100 rounded p-3 space-y-2">
                      <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Talk Ratio</h4>
                      <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1">
                        <span>Rep {insights.talkRatio.rep}%</span>
                        <span>Customer {insights.talkRatio.customer}%</span>
                      </div>
                      <div className="flex gap-1.5">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-[#003594] h-1.5 rounded-full" style={{ width: `${insights.talkRatio.rep}%` }} />
                        </div>
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${insights.talkRatio.customer}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Action Items */}
                    {insights.actionItems.length > 0 && (
                      <div className="bg-white border border-gray-100 rounded p-3 space-y-1.5">
                        <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Action Items</h4>
                        {insights.actionItems.map((item, i) => (
                          <div key={i} className="flex items-start gap-1.5 text-[11px] text-gray-700 font-normal">
                            <input type="checkbox" className="mt-0.5 flex-shrink-0" readOnly />
                            {item}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Error fallback */}
                {aiStatus === 'error' && (
                  <div className="bg-red-50 border border-red-100 rounded p-3 text-[11px] text-red-600">
                    AssemblyAI transcription unavailable.
                    {assemblyError ? ` ${assemblyError}` : ''} Set ASSEMBLYAI_API_KEY in .env.local and restart the UI.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Questionnaire Area */}
        <div className="flex-1 bg-[#f8fafc] p-6 overflow-y-auto h-full">
          <div className="max-w-4xl mx-auto space-y-4">
            {[
              { id: 'opening', title: 'Opening' },
              { id: 'discovery', title: 'Discovery' },
              { id: 'product_fit', title: 'Product Fit' },
              { id: 'objection_handling', title: 'Objection Handling' },
            ].map((section) => {
              const isExpanded = expandedSections[section.id];
              const sectionQuestions = QUESTIONS.filter((q) => q.section === section.id);

              return (
                <div key={section.id} className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
                  
                  {/* Collapsible Section Header Trigger */}
                  <button
                    onClick={() => toggleSection(section.id)}
                    className="w-full flex items-center justify-between py-2.5 px-4 bg-white hover:bg-gray-50 border-b border-gray-100 text-left transition-colors focus:outline-none"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-gray-900 font-serif">{section.title}</span>
                      <span className="text-[9px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full font-mono">
                        {getSectionStats(section.id)}
                      </span>
                    </div>
                    <div>
                      {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                  </button>

                  {/* Collapsible Questions list */}
                  {isExpanded && (
                    <div className="p-5 space-y-5 bg-white">
                      {sectionQuestions.map((q, idx) => {
                        const state = answers[q.id];
                        const isNa = state.isNa;
                        const isAccepted = state.isAccepted;

                        return (
                          <div key={q.id} className={`${idx > 0 ? 'border-t border-gray-100 pt-5 mt-5' : ''} space-y-3.5`}>
                            
                            {/* Question Title (SANS-SERIF & NOT BOLD) */}
                            <div className="flex items-start justify-between">
                              <p className="text-[13px] font-normal text-gray-900 leading-snug">
                                {q.text}
                              </p>
                              {isNa && (
                                <span className="text-[9px] font-semibold px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded font-sans">
                                  Marked N/A
                                </span>
                              )}
                            </div>

                            {/* AI Suggestion Box: Very soft blue background, NO BORDER, rounded-xl */}
                            <div className="bg-[#f0f4ff] rounded-xl p-4 flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-normal text-[#003594] font-sans">
                                    AI Suggestion
                                  </span>
                                  <span className="text-[11px] font-normal text-[#003594] bg-[#eef2ff] px-2 py-0.5 rounded-full font-sans">
                                    {q.aiSuggestion.confidence}% confident
                                  </span>
                                </div>
                                <button
                                  onClick={() => handleAcceptSuggestion(q.id, q.aiSuggestion.value, q.aiSuggestion.secs)}
                                  className={`px-4 py-1 rounded-full text-[10px] font-bold transition-all flex-shrink-0 focus:outline-none ${
                                    isAccepted
                                      ? 'bg-blue-100 text-[#003594] cursor-default'
                                      : 'bg-[#003594] hover:bg-[#002570] text-white shadow-sm'
                                  }`}
                                >
                                  {isAccepted ? 'Accepted' : 'Accept'}
                                </button>
                              </div>
                              <p className="text-xs font-normal text-gray-800 leading-tight">
                                {q.aiSuggestion.value}
                              </p>
                              {q.aiSuggestion.text && (
                                <>
                                  <div className="border-t border-[#e2eafd] w-full" />
                                  <p className="text-[11px] text-gray-500 leading-normal font-normal">
                                    {q.aiSuggestion.time && (
                                      <span className="font-sans text-[#003594] font-normal mr-1.5">
                                        {q.aiSuggestion.time}
                                      </span>
                                    )}
                                    "{q.aiSuggestion.text}"
                                  </p>
                                </>
                              )}
                            </div>

                            {/* Options Selectors Layout */}
                            <div className="space-y-3">
                              {/* Option choices triggers */}
                              <div>
                                {q.type === 'boolean' && (
                                  <div className="grid grid-cols-2 gap-3">
                                    <button
                                      onClick={() => {
                                        updateAnswer(q.id, 'value', 'Yes');
                                        updateAnswer(q.id, 'isAccepted', false);
                                      }}
                                      className={`py-3 px-4 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition-all focus:outline-none ${
                                        state.value === 'Yes'
                                          ? 'bg-[#003594] border-[#003594] text-white font-semibold shadow-sm'
                                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-normal'
                                      }`}
                                    >
                                      <Check size={14} />
                                      Yes
                                    </button>
                                    <button
                                      onClick={() => {
                                        updateAnswer(q.id, 'value', 'No');
                                        updateAnswer(q.id, 'isAccepted', false);
                                      }}
                                      className={`py-3 px-4 rounded-xl border text-xs flex items-center justify-center gap-1.5 transition-all focus:outline-none ${
                                        state.value === 'No'
                                          ? 'bg-[#e53e3e] border-[#e53e3e] text-white font-semibold shadow-sm'
                                          : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-normal'
                                      }`}
                                    >
                                      <X size={14} />
                                      No
                                    </button>
                                  </div>
                                )}
 
                                {q.type === 'scale' && (
                                  <div className="grid grid-cols-5 gap-2">
                                    {['1', '2', '3', '4', '5'].map((num) => (
                                      <button
                                        key={num}
                                        onClick={() => {
                                          updateAnswer(q.id, 'value', num);
                                          updateAnswer(q.id, 'isAccepted', false);
                                        }}
                                        className={`py-2.5 text-xs rounded-xl border flex items-center justify-center transition-all focus:outline-none ${
                                          state.value === num
                                            ? 'bg-[#003594] border-[#003594] text-white font-semibold shadow-sm'
                                            : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-600 font-normal'
                                        }`}
                                      >
                                        {num}
                                      </button>
                                    ))}
                                  </div>
                                )}

                                {q.type === 'dropdown' && q.options && (
                                  <div className="relative">
                                    <select
                                      value={state.value || ''}
                                      onChange={(e) => {
                                        updateAnswer(q.id, 'value', e.target.value || null);
                                        updateAnswer(q.id, 'isAccepted', false);
                                      }}
                                      className="w-full pl-3 pr-8 py-2.5 border border-gray-200 rounded-xl text-xs bg-white font-normal text-gray-700 focus:outline-none"
                                    >
                                      <option value="">Select an option...</option>
                                      {q.options.map((opt) => (
                                        <option key={opt} value={opt}>
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                  </div>
                                )}
                              </div>

                              {/* Comment box */}
                              <div className="w-full">
                                <textarea
                                  placeholder="Add coaching comment (optional)..."
                                  rows={2}
                                  value={state.comment}
                                  onChange={(e) => updateAnswer(q.id, 'comment', e.target.value)}
                                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#003594] transition-all resize-none shadow-sm placeholder-gray-455 text-gray-700"
                                />
                              </div>
                            </div>

                            {/* Compact Footer triggers */}
                            <div className="flex items-center justify-between pt-1 text-[11px]">
                              {/* Pill N/A button */}
                              <button
                                onClick={() => updateAnswer(q.id, 'isNa', !state.isNa)}
                                className={`px-3 py-1.5 rounded-full border text-[11px] font-normal transition-all focus:outline-none ${
                                  isNa
                                    ? 'bg-blue-50 border-[#003594] text-[#003594] font-semibold'
                                    : 'bg-white border-gray-200 text-gray-500 hover:text-gray-700'
                                }`}
                              >
                                Mark as N/A
                              </button>

                              {/* Jump to link (no volume icon) */}
                              {q.aiSuggestion.time && (
                                <button
                                  onClick={() => {
                                    if (q.aiSuggestion.secs !== undefined) {
                                      setCurrentTime(q.aiSuggestion.secs);
                                    }
                                  }}
                                  className="text-[#003594] hover:text-[#002570] text-[10px] font-normal transition-colors focus:outline-none font-sans"
                                >
                                  Jump to {q.aiSuggestion.time}
                                </button>
                              )}
                            </div>

                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
