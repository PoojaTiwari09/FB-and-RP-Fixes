'use client';

import { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Layers, Key, Copy, ChevronUp, ChevronDown } from 'lucide-react';
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
import SmartCallLivePanels from '@smart-call/components/SmartCallLivePanels';
import SmartCallPiPOverlay from '@smart-call/components/SmartCallPiPOverlay';
import OverlayWidget from '@smart-call/components/OverlayWidget';
import { overlayFromSession } from '@smart-call/lib/overlay-from-session';
import { useLiveAssistPiP } from '@smart-call/live-assist/hooks/useLiveAssistPiP';
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
        rep: 'You',
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
  const [floatingOverlayOpen, setFloatingOverlayOpen] = useState(false);
  const [showEndModal, setShowEndModal] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const [pipError, setPipError] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const {
    openPiP,
    closePiP,
    isOpen: overlayOpen,
    portalTarget,
    isSupported: pipSupported,
  } = useLiveAssistPiP({ width: 320, height: 640 });

  const overlayActive = floatingOverlayOpen || overlayOpen;

  const handleLaunchOverlay = useCallback(() => {
    setPipError('');
    if (overlayActive) {
      setFloatingOverlayOpen(false);
      closePiP();
      return;
    }
    setFloatingOverlayOpen(true);
  }, [overlayActive, closePiP]);

  const handlePopOutPiP = useCallback(async () => {
    setPipError('');
    try {
      await openPiP();
      setFloatingOverlayOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : '';
      if (msg.includes('gesture') || msg.includes('user activation')) {
        setPipError('Click Pop out again — the browser needs a direct click.');
      } else if (!pipSupported) {
        setPipError('Pop-out requires Chrome 116+ (Document Picture-in-Picture).');
      } else {
        setPipError(msg || 'Could not open overlay window.');
      }
    }
  }, [openPiP, pipSupported]);

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
            type="button"
            onClick={() => void handleLaunchOverlay()}
            title={
              overlayActive
                ? 'Close movable coaching overlay'
                : 'Open draggable overlay (drag header). Use Pop out for Teams/Meet tabs.'
            }
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              overlayActive
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Layers size={13} />
            {overlayActive ? 'Close Overlay' : 'Launch Overlay'}
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

      {pipError && (
        <div className="px-5 py-2 bg-amber-50 border-b border-amber-100 text-xs text-amber-800 shrink-0">
          {pipError}
        </div>
      )}

      {/* ── Main live session panels (unchanged) ───────────────────────── */}
      <SmartCallLivePanels
        data={data}
        isCapturing={isCapturing}
        layout="page"
        onCopyResponse={handleCopyResponse}
        copiedIdx={copiedIdx}
      />

      {/* Draggable dark overlay — Coach / Signals / Log (stays on screen while you work) */}
      {mounted &&
        floatingOverlayOpen &&
        createPortal(
          <OverlayWidget
            mode="floating"
            data={overlayFromSession(data)}
            logEntries={data.logEntries}
            signals={data.signals}
            talkRatio={data.talkRatio}
            metrics={data.metrics}
            contactName={session.contactName}
            contactCompany={session.contactCompany}
            onClose={() => setFloatingOverlayOpen(false)}
            popOutSupported={pipSupported}
            onPopOut={() => void handlePopOutPiP()}
          />,
          document.body,
        )}

      {/* Document PiP — same overlay, floats above Teams / Meet / other browser tabs */}
      {overlayOpen &&
        portalTarget &&
        createPortal(
          <SmartCallPiPOverlay
            data={data}
            contactName={session.contactName}
            contactCompany={session.contactCompany}
            onClose={closePiP}
          />,
          portalTarget,
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
