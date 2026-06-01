'use client';

import { useState, useEffect, useCallback } from 'react';
import { Zap, Copy, ChevronDown, ChevronUp, X, Layers, Focus, Key } from 'lucide-react';
import type {
  SessionStartResponse,
  PreCallBrief,
  Competitor,
  IntentSignal,
  ConversationSegment,
  HighlightedKeyword,
} from '@smart-call/types/smart-call.types';
import { useSmartCallSession } from '@smart-call/hooks/useSmartCallSession';
import { loadSmartCallApiKeys, type SmartCallApiKeys } from '@smart-call/lib/api-keys';
import OverlayWidget from '@smart-call/components/OverlayWidget';
import EndSessionModal from '@smart-call/components/EndSessionModal';
import ApiKeysModal from '@smart-call/components/ApiKeysModal';
import AudioCaptureModal from '@smart-call/components/AudioCaptureModal';

interface Props {
  session: SessionStartResponse;
  preCallBrief?: PreCallBrief;
  onEnd: (transcript: string, duration: string, finalSummaryText?: string) => Promise<void>;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

const BADGE_COLOR: Record<string, string> = {
  orange: 'bg-orange-500 text-white',
  pink:   'bg-pink-400 text-white',
  green:  'bg-green-500 text-white',
  blue:   'bg-blue-500 text-white',
  red:    'bg-red-500 text-white',
};

const SIGNAL_ROW_STYLE: Record<string, string> = {
  green:  'bg-green-50  text-green-800  border-green-100',
  blue:   'bg-blue-50   text-blue-800   border-blue-100',
  yellow: 'bg-yellow-50 text-yellow-800 border-yellow-100',
  purple: 'bg-purple-50 text-purple-800 border-purple-100',
  red:    'bg-red-50    text-red-800    border-red-100',
};

const SIGNAL_BADGE_STYLE: Record<string, string> = {
  green:  'bg-green-100  text-green-700',
  blue:   'bg-blue-100   text-blue-700',
  yellow: 'bg-yellow-100 text-yellow-700',
  purple: 'bg-purple-100 text-purple-700',
  red:    'bg-red-100    text-red-700',
};

function HighlightedText({ text, keywords }: { text: string; keywords: HighlightedKeyword[] }) {
  if (!keywords.length) return <span>{text}</span>;
  const pattern = keywords
    .map((k) => k.word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|');
  const parts = text.split(new RegExp(`(${pattern})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => {
        const kw = keywords.find((k) => k.word.toLowerCase() === part.toLowerCase());
        if (kw) {
          const cls =
            kw.color === 'orange'
              ? 'text-orange-500 font-medium'
              : kw.color === 'blue'
              ? 'text-blue-500 font-medium'
              : 'font-medium';
          return <span key={i} className={cls}>{part}</span>;
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

// ─── Sub-sections ──────────────────────────────────────────────────────────

function SignalRow({ signal }: { signal: IntentSignal }) {
  const rowStyle  = SIGNAL_ROW_STYLE[signal.color]  ?? SIGNAL_ROW_STYLE.blue;
  const badgeStyle = SIGNAL_BADGE_STYLE[signal.color] ?? SIGNAL_BADGE_STYLE.blue;
  return (
    <div className={`flex items-center justify-between px-4 py-2.5 rounded-lg border ${rowStyle}`}>
      <span className="text-sm font-medium">{signal.label}</span>
      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${badgeStyle}`}>
        {signal.value}
      </span>
    </div>
  );
}

function CompetitorBlock({ comp }: { comp: Competitor }) {
  const badge = BADGE_COLOR[comp.badgeColor] ?? 'bg-gray-500 text-white';
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(comp.sayThis).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="space-y-2">
      <span className={`inline-block px-3 py-0.5 rounded-full text-xs font-semibold ${badge}`}>
        {comp.competitorName}
      </span>
      <p className="text-xs text-gray-500">
        <span className="font-semibold text-gray-600">Insight </span>
        {comp.insight}
      </p>
      {/* Our Edge */}
      <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-3 flex items-start gap-2">
        <span className="text-green-500 text-xs shrink-0">⭐</span>
        <div>
          <p className="text-xs font-semibold text-green-700">Our Edge</p>
          <p className="text-xs text-green-600 mt-0.5 leading-relaxed">{comp.ourEdge}</p>
        </div>
      </div>
      {/* Say This */}
      <div className="bg-yellow-50 border border-yellow-100 rounded-lg px-4 py-3 flex items-start gap-2">
        <span className="text-yellow-600 text-xs shrink-0">💬</span>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-yellow-700">Say This</p>
            <button onClick={handleCopy} className="text-gray-400 hover:text-gray-600">
              <Copy size={11} />
            </button>
          </div>
          <p className="text-xs text-yellow-700 mt-0.5 leading-relaxed">
            {copied ? '✓ Copied!' : comp.sayThis}
          </p>
        </div>
      </div>
    </div>
  );
}

function SummarySegment({ seg }: { seg: ConversationSegment }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border border-gray-100 rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <span className="text-xs text-gray-500 font-medium">
          {seg.startTime} → {seg.endTime}
        </span>
        <div className="flex items-center gap-2">
          {seg.tags.map((t) => (
            <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 font-medium">
              {t}
            </span>
          ))}
          {open ? <ChevronUp size={12} className="text-gray-400" /> : <ChevronDown size={12} className="text-gray-400" />}
        </div>
      </button>
      {open && (
        <p className="px-3 py-2 text-xs text-gray-600 leading-relaxed">
          <HighlightedText text={seg.summary} keywords={seg.highlightedKeywords} />
        </p>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────

export default function LiveSessionScreen({ session, preCallBrief, onEnd }: Props) {
  const [apiKeys, setApiKeys] = useState<SmartCallApiKeys>(() => loadSmartCallApiKeys());
  const [showKeysModal, setShowKeysModal] = useState(false);
  const [showAudioModal, setShowAudioModal] = useState(false);

  const dealContext = preCallBrief
    ? {
        company: preCallBrief.contactCompany,
        stage: preCallBrief.dealStage,
        contact: preCallBrief.contactName,
      }
    : undefined;

  const {
    data,
    liveTranscript,
    isCapturing,
    captureError,
    startCaptureWithPrefs,
    stopCapture,
    getTranscript,
  } = useSmartCallSession({
      apiKeys,
      sessionId: session.sessionId,
      dealContext,
    });

  const [elapsedSec, setElapsedSec] = useState(0);
  const [overlayActive, setOverlayActive] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [competitorOpen, setCompetitorOpen] = useState(true);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

  // Session timer
  useEffect(() => {
    const id = setInterval(() => setElapsedSec((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const handleCopyResponse = useCallback((text: string, idx: number) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedIdx(idx);
    setTimeout(() => setCopiedIdx(null), 1500);
  }, []);

  const handleConfirmEnd = useCallback(async () => {
    setShowEndModal(false);
    stopCapture();
    await onEnd(getTranscript(), formatTimer(elapsedSec));
  }, [onEnd, stopCapture, getTranscript, elapsedSec]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">

      {/* ── Session Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-5 py-3 bg-white border-b border-gray-200 shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">{session.taskTitle}</p>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            <span className="flex items-center gap-1.5 text-xs text-gray-500">
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 animate-pulse" />
              Live – Listening and transcribing
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-500">
              {session.contactName} · {session.contactCompany}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 ml-4">
          <button
            type="button"
            onClick={() => setShowKeysModal(true)}
            title="API keys (Groq / OpenRouter)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-xs font-medium"
          >
            <Key size={13} />
            API Keys
          </button>

          {/* AI Assist — audio prefs modal, then browser screen/tab picker */}
          <button
            onClick={() => setShowAudioModal(true)}
            disabled={isCapturing}
            title={isCapturing ? 'AI is actively transcribing' : 'Choose audio sources, then share a tab or window'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              isCapturing
                ? 'bg-purple-500 border-purple-500 text-white cursor-default'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isCapturing ? 'bg-white animate-pulse' : 'bg-gray-400'}`} />
            {isCapturing ? 'AI Active' : 'Start AI Assist'}
          </button>

          <button
            onClick={() => setOverlayActive((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              overlayActive
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Layers size={13} />
            {overlayActive ? 'Overlay Active' : 'Enable Overlay'}
          </button>

          <button
            onClick={() => setFocusMode((v) => !v)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              focusMode
                ? 'bg-blue-500 border-blue-500 text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Focus size={13} />
            Focus Mode
          </button>

          <span className="text-sm font-mono font-semibold text-gray-700 tabular-nums min-w-[42px] text-center">
            {formatTimer(elapsedSec)}
          </span>

          <button
            onClick={() => setShowEndModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 hover:bg-red-600 text-white text-xs font-semibold transition-colors"
          >
            <X size={13} />
            End Session
          </button>
        </div>
      </div>

      {/* ── Live transcript (refreshed every ~5s) ─────────────────────── */}
      {isCapturing && liveTranscript && (
        <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 shrink-0 max-h-20 overflow-y-auto">
          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">
            Live transcript
          </p>
          <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
            {liveTranscript.slice(-1200)}
          </p>
        </div>
      )}

      {/* ── No-audio warning ───────────────────────────────────────────── */}
      {captureError && (
        <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 flex items-center gap-2 shrink-0">
          <span className="text-amber-500 text-xs">⚠</span>
          <p className="text-xs text-amber-700">{captureError}</p>
        </div>
      )}

      {/* ── Main panels ────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* LEFT PANEL — Live Guidance + Responses + Competitor Intel */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Live Guidance */}
          {data.guidance && (
            <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-blue-500 shrink-0" />
                <span className="text-sm font-semibold text-gray-800">Live Guidance</span>
              </div>
              <span className="inline-block px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 text-xs font-medium">
                {data.guidance.currentStage}
              </span>
              <p className="text-sm text-gray-600 flex items-center gap-1.5">
                <span className="text-gray-400">↗</span>
                <span>
                  <span className="font-medium">Next: </span>
                  {data.guidance.nextSuggestion}
                </span>
              </p>
            </div>
          )}

          {/* Suggested Responses */}
          {data.responses.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest px-1">
                Suggested Responses
              </p>
              {data.responses.map((resp, i) => (
                <button
                  key={i}
                  onClick={() => handleCopyResponse(resp, i)}
                  className="w-full flex items-start gap-3 bg-white rounded-xl border border-gray-200 px-4 py-3 hover:border-blue-200 hover:bg-blue-50/30 transition-colors text-left group"
                >
                  <span className="mt-0.5 shrink-0 text-gray-300 group-hover:text-blue-400 transition-colors">
                    💬
                  </span>
                  <span className="text-sm text-gray-700 flex-1 leading-relaxed">{resp}</span>
                  <Copy
                    size={13}
                    className={`shrink-0 mt-0.5 transition-colors ${
                      copiedIdx === i ? 'text-green-500' : 'text-gray-300 group-hover:text-gray-400'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}

          {/* Competitor Intelligence */}
          {data.competitors.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <button
                onClick={() => setCompetitorOpen((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">🎯</span>
                  <span className="text-xs font-semibold text-orange-500 uppercase tracking-widest">
                    Competitor Intelligence
                  </span>
                </div>
                {competitorOpen
                  ? <ChevronUp size={14} className="text-gray-400" />
                  : <ChevronDown size={14} className="text-gray-400" />}
              </button>
              {competitorOpen && (
                <div className="px-4 pb-4 space-y-5 border-t border-gray-100 pt-3">
                  {data.competitors.map((comp) => (
                    <CompetitorBlock key={comp.competitorName} comp={comp} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Empty state while events load */}
          {!data.guidance && data.responses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <Zap size={18} className="text-gray-300" />
              </div>
              <p className="text-sm text-gray-400">AI is listening...</p>
              <p className="text-xs text-gray-300 mt-1">Guidance will appear shortly</p>
            </div>
          )}
        </div>

        {/* RIGHT PANEL — Analytics (hidden in Focus Mode) */}
        {!focusMode && (
          <div className="w-80 shrink-0 border-l border-gray-200 overflow-y-auto p-4 space-y-5 bg-white">

            {/* Intent & Risk Signals */}
            <div>
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Intent &amp; Risk Signals
              </p>
              {data.signals.length === 0 ? (
                <p className="text-xs text-gray-300">Signals will appear as the call progresses.</p>
              ) : (
                <div className="space-y-1.5">
                  {data.signals.map((sig) => <SignalRow key={sig.label} signal={sig} />)}
                </div>
              )}
            </div>

            {/* Talk Ratio */}
            {data.talkRatio && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Talk Ratio
                </p>
                <div className="space-y-2">
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>You</span>
                      <span className="font-semibold">{data.talkRatio.repPercent}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${data.talkRatio.repPercent}%` }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-600 mb-1">
                      <span>Customer</span>
                      <span className="font-semibold">{data.talkRatio.customerPercent}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-500"
                        style={{ width: `${data.talkRatio.customerPercent}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Conversation Metrics */}
            {data.metrics && (
              <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Conversation Metrics
                </p>
                <div className="space-y-1.5">
                  {[
                    { label: 'Interruptions',   value: String(data.metrics.interruptions), badge: false },
                    {
                      label: 'Speaking Pace',
                      value: data.metrics.speakingPace === 'GOOD' ? 'Good' : data.metrics.speakingPace,
                      badge: true,
                      badgeClass: 'bg-green-100 text-green-700',
                    },
                    { label: 'Words per Minute', value: String(data.metrics.wordsPerMinute), badge: false },
                    { label: 'Questions Asked',  value: String(data.metrics.questionsAsked),  badge: false },
                  ].map((m) => (
                    <div key={m.label} className="flex items-center justify-between py-1">
                      <span className="text-xs text-gray-500">{m.label}</span>
                      {m.badge ? (
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${m.badgeClass}`}>
                          {m.value}
                        </span>
                      ) : (
                        <span className="text-sm font-semibold text-gray-800">{m.value}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Conversation Summaries */}
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-pink-400 shrink-0" />
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">
                  Conversation Summaries
                </p>
              </div>
              {data.summarySegments.length === 0 ? (
                <p className="text-xs text-gray-300 text-center py-3">
                  Summaries will appear as the conversation progresses
                </p>
              ) : (
                <div className="space-y-2">
                  {data.summarySegments.map((seg, i) => (
                    <SummarySegment key={i} seg={seg} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Overlay Widget ─────────────────────────────────────────────── */}
      {overlayActive && (
        <OverlayWidget
          data={data.overlay}
          logEntries={data.logEntries}
          signals={data.signals}
          talkRatio={data.talkRatio}
          metrics={data.metrics}
          contactName={session.contactName}
          contactCompany={session.contactCompany}
          onClose={() => setOverlayActive(false)}
        />
      )}

      {/* ── End Session Modal ──────────────────────────────────────────── */}
      {showEndModal && (
        <EndSessionModal
          onCancel={() => setShowEndModal(false)}
          onConfirm={handleConfirmEnd}
        />
      )}

      <ApiKeysModal
        open={showKeysModal}
        onClose={() => setShowKeysModal(false)}
        onSaved={setApiKeys}
      />

      <AudioCaptureModal
        open={showAudioModal}
        onClose={() => setShowAudioModal(false)}
        onConfirm={(prefs) => {
          setShowAudioModal(false);
          void startCaptureWithPrefs(prefs);
        }}
      />
    </div>
  );
}
