'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Copy, Volume2, Minus, X, GripVertical, ExternalLink } from 'lucide-react';
import type {
  OverlayUpdateEvent,
  LogEntry,
  IntentSignal,
  TalkRatioEvent,
  ConversationMetricsEvent,
} from '@smart-call/types/smart-call.types';

interface Props {
  data: OverlayUpdateEvent | null;
  logEntries: LogEntry[];
  signals: IntentSignal[];
  talkRatio: TalkRatioEvent | null;
  metrics: ConversationMetricsEvent | null;
  contactName: string;
  contactCompany: string;
  onClose: () => void;
  /** `floating` = draggable on page; `embedded` = fills PiP window */
  mode?: 'floating' | 'embedded';
  onPopOut?: () => void;
  popOutSupported?: boolean;
}

type OverlayTab = 'Coach' | 'Signals' | 'Log';

const SIGNAL_VALUE_STYLES: Record<string, string> = {
  green: 'text-green-400',
  blue: 'text-blue-400',
  yellow: 'text-yellow-400',
  purple: 'text-purple-400',
  red: 'text-red-400',
};

export default function OverlayWidget({
  data,
  logEntries,
  signals,
  talkRatio,
  metrics,
  contactName,
  contactCompany,
  onClose,
  mode = 'floating',
  onPopOut,
  popOutSupported = false,
}: Props) {
  const [activeTab, setActiveTab] = useState<OverlayTab>('Coach');
  const [minimized, setMinimized] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ startX: number; startY: number; originX: number; originY: number } | null>(null);
  const isFloating = mode === 'floating';

  useEffect(() => {
    if (!isFloating || typeof window === 'undefined') return;
    setPos({
      x: Math.max(16, window.innerWidth - 320),
      y: 88,
    });
  }, [isFloating]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!isFloating) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        originX: pos.x,
        originY: pos.y,
      };
    },
    [isFloating, pos.x, pos.y],
  );

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current) return;
    setPos({
      x: dragRef.current.originX + (e.clientX - dragRef.current.startX),
      y: Math.max(8, dragRef.current.originY + (e.clientY - dragRef.current.startY)),
    });
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const handleCopy = () => {
    if (!data) return;
    navigator.clipboard.writeText(data.suggestedResponse).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const intentSignals = signals.filter((s) => s.severity !== 'MEDIUM' && s.severity !== 'LOW');
  const riskSignals = signals.filter((s) => s.severity === 'MEDIUM' || s.severity === 'LOW');

  const shellClass = isFloating
    ? 'fixed z-[9999] w-72 rounded-2xl overflow-hidden shadow-2xl'
    : 'flex flex-col h-full min-h-0 w-full rounded-none overflow-hidden';

  const shellStyle: React.CSSProperties = isFloating
    ? { background: '#1a1d2e', left: pos.x, top: pos.y, touchAction: 'none' }
    : { background: '#1a1d2e' };

  return (
    <div className={shellClass} style={shellStyle}>
      <div
        className="flex items-center justify-between px-4 py-3 border-b border-white/10 select-none"
        style={{ cursor: isFloating ? 'grab' : 'default' }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isFloating && <GripVertical size={14} className="text-gray-500 shrink-0" />}
          <span className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
          <span className="text-xs font-semibold text-white truncate">Live AI Co-Pilot</span>
          {data && (
            <span className="px-2 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-semibold shrink-0">
              {data.confidenceScore}%
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {popOutSupported && onPopOut && (
            <button
              type="button"
              onClick={onPopOut}
              className="p-1 text-gray-400 hover:text-white transition-colors"
              title="Pop out over other apps (Picture-in-Picture)"
            >
              <ExternalLink size={13} />
            </button>
          )}
          <button
            type="button"
            onClick={() => setMinimized((v) => !v)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Minimize"
          >
            <Minus size={13} />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {minimized ? null : !data ? (
        <div className="px-4 py-8 text-center space-y-2">
          <div className="w-6 h-6 rounded-full border-2 border-violet-500 border-t-transparent animate-spin mx-auto" />
          <p className="text-xs text-gray-400">AI is analysing the conversation…</p>
        </div>
      ) : (
        <>
          <div className="px-4 pt-3 pb-2 space-y-1">
            <div className="flex gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-medium">
                {contactName}
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-white text-xs font-medium">
                {contactCompany}
              </span>
            </div>
            <p className="text-xs text-white font-medium leading-snug pt-1">{data.contextSummary}</p>
            <p className="text-xs text-gray-400 leading-snug">{data.actionSuggestion}</p>
          </div>

          <div className="flex gap-1 px-4 pb-2">
            {(['Coach', 'Signals', 'Log'] as OverlayTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  activeTab === tab
                    ? 'bg-violet-600 text-white'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div
            className={`overflow-y-auto px-4 pb-4 space-y-3 ${
              isFloating ? 'max-h-[460px]' : 'flex-1 min-h-0'
            }`}
          >
            {activeTab === 'Coach' && (
              <>
                <div className="rounded-xl p-3 space-y-2" style={{ background: '#252840' }}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                      Suggested Response
                    </span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={handleCopy}
                        className="text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy size={12} />
                      </button>
                      <button type="button" className="text-gray-400 hover:text-white transition-colors">
                        <Volume2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-white leading-relaxed">
                    {copied ? '✓ Copied!' : data.suggestedResponse}
                  </p>
                </div>

                <div className="rounded-xl p-3 space-y-2" style={{ background: '#252840' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="text-orange-400">🎯</span>
                    <span className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
                      Strategic Tips
                    </span>
                  </div>
                  <p className="text-xs text-gray-300 leading-relaxed">{data.strategicTip}</p>
                  <p className="text-xs text-gray-400 italic leading-relaxed">
                    &ldquo;{data.strategicTipScript}&rdquo;
                  </p>
                </div>

                {data.competitors.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-semibold text-orange-400 uppercase tracking-wider">
                      Competitor Intelligence
                    </p>
                    {data.competitors.map((comp) => (
                      <div
                        key={comp.competitorName}
                        className="rounded-xl p-3 space-y-2"
                        style={{ background: '#252840' }}
                      >
                        <span className="inline-block px-2.5 py-0.5 rounded-full bg-pink-500 text-white text-[10px] font-semibold">
                          vs {comp.competitorName}
                        </span>
                        <div>
                          <p className="text-[10px] text-green-400 font-semibold">Our Edge</p>
                          <p className="text-xs text-gray-300 leading-snug mt-0.5">{comp.ourEdge}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-gray-400 font-semibold">Say</p>
                          <p className="text-xs text-gray-400 italic leading-snug mt-0.5">
                            &ldquo;{comp.sayThis}&rdquo;
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'Signals' && (
              <>
                <div className="rounded-xl p-3 border border-red-500/40" style={{ background: '#2a1a1a' }}>
                  <p className="text-xs text-red-300">
                    {riskSignals[0]?.label || 'Monitoring conversation signals…'}
                  </p>
                </div>

                {talkRatio && metrics && (
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'REP TALK', value: `${talkRatio.repPercent}%` },
                      { label: 'CLIENT TALK', value: `${talkRatio.customerPercent}%` },
                      { label: 'WPM', value: String(metrics.wordsPerMinute) },
                      {
                        label: 'PACE',
                        value: metrics.speakingPace === 'GOOD' ? 'Balanced' : metrics.speakingPace,
                      },
                      {
                        label: 'INTERRUPTS',
                        value:
                          metrics.interruptions === 0 ? 'None' : String(metrics.interruptions),
                      },
                      { label: 'QUESTIONS', value: String(metrics.questionsAsked ?? 0) },
                    ].map((m) => (
                      <div
                        key={m.label}
                        className="rounded-lg p-2 text-center"
                        style={{ background: '#252840' }}
                      >
                        <p className="text-[9px] text-gray-500 uppercase tracking-wider">{m.label}</p>
                        <p className="text-xs font-bold text-white mt-0.5">{m.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {intentSignals.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 mb-2">Intent Signals</p>
                    <div className="space-y-1.5">
                      {intentSignals.map((sig) => (
                        <div
                          key={sig.label}
                          className="flex items-center justify-between py-2 px-3 rounded-lg"
                          style={{ background: '#252840' }}
                        >
                          <span className="text-xs text-gray-300">{sig.label}</span>
                          <span
                            className={`text-xs font-semibold ${SIGNAL_VALUE_STYLES[sig.color] ?? 'text-gray-300'}`}
                          >
                            {sig.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {riskSignals.length > 0 && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 mb-2">Risk Signals</p>
                    <div className="space-y-1.5">
                      {riskSignals.map((sig) => (
                        <div
                          key={sig.label}
                          className="flex items-center justify-between py-2 px-3 rounded-lg border border-yellow-500/20"
                          style={{ background: '#2a2210' }}
                        >
                          <span className="text-xs text-gray-300">{sig.label}</span>
                          <span
                            className={`text-xs font-semibold ${SIGNAL_VALUE_STYLES[sig.color] ?? 'text-gray-300'}`}
                          >
                            {sig.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {activeTab === 'Log' && (
              <div className="space-y-0">
                {logEntries.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">
                    Events will appear as the conversation progresses.
                  </p>
                ) : (
                  logEntries.map((entry, i) => (
                    <div key={i} className="py-3 border-b border-white/5 last:border-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-orange-400">{entry.timestamp}</span>
                        <span className="text-xs font-semibold text-orange-300">{entry.title}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">{entry.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
